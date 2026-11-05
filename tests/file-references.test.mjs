import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectFileReferences} from '../src/file-references.js';

// These fixtures are the public evaluator's JSON boundary, not a replacement
// parser. Grammar recognition remains owned by the running DSH registry.
function fileNode(text, raw, path, label, from = 0) {
  const start = text.indexOf(raw, from);
  assert.ok(start >= 0);
  return {id:'file', start, end:start + raw.length, data:{path, label}};
}

test('file reference adapter preserves quoted Windows paths, spaces and UTF-16 offsets', () => {
  const raw = String.raw`@"C:\Users\示例\工作 文件\报告😀.docx"`;
  const text = `😀 ${raw}，请继续。`;
  const path = String.raw`C:\Users\示例\工作 文件\报告😀.docx`;
  const node = fileNode(text, raw, path, '报告😀.docx');
  const facts = Object.freeze({sessionLabels:['保留会话信息']});
  let received;
  const result = collectFileReferences(text, input => {received = input; return [node];}, facts);
  assert.equal(received.text, text);
  assert.equal(received.facts, facts);
  assert.deepEqual(result, [{start:3, end:3 + raw.length, path, label:'报告😀.docx'}]);
  assert.equal(text.slice(result[0].start, result[0].end), raw);
  assert.equal(text.slice(result[0].end), '，请继续。');
});

test('file reference adapter retains unquoted paths and every occurrence with duplicate labels', () => {
  const first = String.raw`@C:\first\report.docx`;
  const second = '@second/report.docx';
  const text = `${first}, ${second} ${first}`;
  const a = fileNode(text, first, String.raw`C:\first\report.docx`, 'report.docx');
  const b = fileNode(text, second, 'second/report.docx', 'report.docx');
  const c = fileNode(text, first, String.raw`C:\first\report.docx`, 'report.docx', b.end);
  const native = Object.freeze([a, b, c].map(value => Object.freeze({...value, data:Object.freeze(value.data)})));
  const result = collectFileReferences(text, () => native);
  assert.equal(result.length, 3);
  assert.deepEqual(result.map(({start, end}) => text.slice(start, end)), [first, second, first]);
  assert.deepEqual(result.map(ref => ref.label), ['report.docx', 'report.docx', 'report.docx']);
  result[0].path = 'caller-owned';
  assert.equal(native[0].data.path, String.raw`C:\first\report.docx`);
});

test('file reference adapter ignores session, folder and display-transformed text nodes', () => {
  const text = '@chat @folder/ @report.docx secret';
  const file = fileNode(text, '@report.docx', 'report.docx', 'report.docx');
  const nodes = [
    {id:'session', start:0, end:5, data:{label:'会话'}},
    {id:'text', start:5, end:6, data:{text:' '}},
    {id:'folder', start:6, end:14, data:{path:'folder/', label:'folder'}},
    file,
    {id:'text', start:file.end, end:text.length, data:{text:text.slice(file.end), display:' ******'}},
  ];
  const before = structuredClone(nodes);
  assert.deepEqual(collectFileReferences(text, () => nodes), [{start:file.start, end:file.end, path:'report.docx', label:'report.docx'}]);
  assert.deepEqual(nodes, before);
});

test('file reference adapter leaves plain text alone without available or matching native rules', () => {
  const text = String.raw`@"C:\work\report.docx"`;
  for (const evaluator of [undefined, null, {}, () => [], () => [{id:'text', start:0, end:text.length, data:{text}}]]) {
    assert.deepEqual(collectFileReferences(text, evaluator), []);
  }
  let called = false;
  assert.deepEqual(collectFileReferences(null, () => {called = true; return [];}), []);
  assert.equal(called, false);
  assert.deepEqual(collectFileReferences('', input => {assert.deepEqual(input, {text:'', facts:{}}); return [];}), []);
});

test('file reference adapter safely rejects failures and malformed evaluator results', () => {
  const text = '@file';
  const throwingNode = {get id() {throw Error('invalid node');}};
  for (const evaluator of [
    () => {throw Error('native rule failed');},
    () => undefined, () => null, () => ({}), () => 'file', () => Promise.resolve([]),
    () => [null], () => [throwingNode], () => [{start:0, end:5}],
  ]) assert.deepEqual(collectFileReferences(text, evaluator), []);
});

test('file reference adapter rejects the entire result for invalid, reversed or overlapping ranges', () => {
  const text = '@first @second';
  const first = fileNode(text, '@first', 'first', 'first');
  const second = fileNode(text, '@second', 'second', 'second');
  for (const patch of [
    {start:-1}, {start:0.5}, {start:NaN}, {start:'7'}, {start:Number.MAX_SAFE_INTEGER + 1},
    {end:second.start}, {end:text.length + 1}, {end:Infinity}, {end:second.end - 0.5},
    {start:first.end - 1},
  ]) assert.deepEqual(collectFileReferences(text, () => [first, {...second, ...patch}]), [], JSON.stringify(patch));
  assert.deepEqual(collectFileReferences(text, () => [second, first]), []);
  assert.deepEqual(collectFileReferences(text, () => [first, {id:'text', start:2, end:8, data:{text:text.slice(2, 8)}}]), []);
});

test('file reference adapter rejects malformed file metadata without returning earlier partial chips', () => {
  const text = '@first @second';
  const first = fileNode(text, '@first', 'first', 'first');
  const second = fileNode(text, '@second', 'second', 'second');
  for (const data of [undefined, null, {}, {path:'', label:'second'}, {path:' \t', label:'second'},
    {path:23, label:'second'}, {path:'second', label:''}, {path:'second', label:' \n'}, {path:'second', label:7}]) {
    assert.deepEqual(collectFileReferences(text, () => [first, {...second, data}]), []);
  }
});

test('file reference adapter cannot split an emoji surrogate pair at either boundary', () => {
  const text = '@😀 @next';
  const first = fileNode(text, '@😀', '😀', '😀');
  assert.deepEqual(collectFileReferences(text, () => [first]), [{start:0, end:3, path:'😀', label:'😀'}]);
  for (const patch of [{end:2}, {start:2}]) {
    assert.deepEqual(collectFileReferences(text, () => [{...first, ...patch}]), []);
  }
});

test('file reference adapter never normalizes native path or label spelling', () => {
  const raw = String.raw`@" C:\work\report.docx "`;
  const path = String.raw` C:\work\report.docx `;
  const label = 'report.docx ';
  const result = collectFileReferences(raw, () => [fileNode(raw, raw, path, label)]);
  assert.deepEqual(result, [{start:0, end:raw.length, path, label}]);
  assert.equal(raw.slice(result[0].start, result[0].end), raw);
});
