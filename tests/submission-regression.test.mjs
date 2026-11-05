import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Session} from '@deepseek-ai/dsh-session';
import {buildForkSeed} from '@deepseek-ai/dsh-session/fork';
import {sessionFormatCatalog as codec} from '@deepseek-ai/dsh-session-format-catalog';
import {createAssistantMessage, createUserMessage} from '@deepseek-ai/dsh-llm';
import {createEditCoordinator, nativeAdapter, newAttachment, originalAttachments} from '../src/core.js';
import {editCurrent} from '../src/current.js';
import {handleReuseRequest, planEdit, reuseOriginalFile} from '../src/index.js';
import {collectFileReferences} from '../src/file-references.js';

const text = value => ({type:'text', text:value});
const firstFile = {type:'file', attachment:{attachmentId:'original-a', name:'报告😀.txt', bytes:3}};
const secondFile = {type:'file', attachment:{attachmentId:'original-b', name:'报告😀.txt', bytes:3}};
const oldImage = {type:'image', attachment:{attachmentId:'original-image', name:'图片.png', bytes:3, mediaType:'image/png', width:1, height:1}};
const ready = () => ({openState:'open', running:false, pendingSubmissions:[]});

// All storage stays in memory, but submission crosses the real authenticated
// adapter, route handlers, event boundaries and released Session implementation.
function fixture() {
  const source = Session.create('reference-source'), sessions = new Map([[source.id, source]]);
  const calls = {forks:[], prompts:[], uploads:[], reuses:[], imageReads:[], plans:0, observations:0, disposals:0};
  const receipts = new Map(); let serial = 0;
  function addTurn(session, content, answer, queued) {
    const turn = session.snapshotEvents().filter(event => event.type === 'turn/start').length + 1;
    const message = queued ?? createUserMessage({content, source:{kind:'user'}});
    session.append('agent/inbox/spliced', {target:'next-turn', start:0, inserted:[message]});
    session.append('turn/start', {turn});
    session.append('agent/inbox/spliced', {target:'next-turn', start:0, removedCount:1, inserted:[]});
    session.append('step/start', {turn, step:1});
    const target = session.append('user/message', message, {surfaceOp:'append'});
    session.append('assistant/message', {turn, step:1, message:createAssistantMessage({content:[text(answer)], source:{provider:'offline', model:'offline'}}), stream:[]}, {surfaceOp:'append'});
    session.append('step/end', {turn, step:1});
    session.append('turn/end', {turn, reason:{kind:'completed'}});
    return target;
  }
  addTurn(source, [text('KEEP_HISTORY')], 'KEEP_ANSWER');
  const target = addTurn(source, [text('SUPERSEDED_REQUEST'), firstFile, oldImage, secondFile], 'SUPERSEDED_ANSWER');
  const before = structuredClone(source.snapshotEvents());
  const agent = {id:source.id, session:source, status:'idle', inbox:{nextTurn:[], nextStep:[]}, options:{provider:'offline', model:'offline'},
    runMaintenance:fn => fn(new AbortController().signal),
    followup:message => agent.inbox.nextTurn.push(message),
  };
  function receipt(sessionId, attachment) {
    const receiptId = 'receipt-' + ++serial;
    receipts.set(receiptId, {sessionId, attachment});
    return {receiptId};
  }
  const ctx = {
    agents:{get:id => id === source.id ? agent : sessions.has(id) ? {session:sessions.get(id)} : undefined},
    sessionController:{resolveAgent:async id => ({agent:id === source.id ? agent : undefined})},
    sessionQuery:{observeSession:async id => {
      calls.observations++;
      return {events:sessions.get(id).snapshotEvents(), [Symbol.dispose]() {calls.disposals++;}};
    }},
    llm:{resolveModelInfo:async () => ({inputModalities:['text', 'image']})},
    attachments:{
      readFileStream:async function* () {yield new Uint8Array([1, 2, 3]);},
      readImage:async attachment => {calls.imageReads.push(attachment.attachmentId); return {attachment, data:new Uint8Array([1, 2, 3])};},
      admitPromptContent:async parts => parts.map(part => ({type:'image', attachment:{attachmentId:'admitted-image-' + ++serial, name:part.name, bytes:Buffer.from(part.data, 'base64').length, mediaType:part.mediaType, width:1, height:1}})),
    },
    fileUploads:{
      resolve:(owner, id) => receipts.get(id)?.sessionId === owner.id ? receipts.get(id).attachment : undefined,
      uploadStream:async input => {
        const bytes = []; for await (const chunk of input.data) bytes.push(...chunk);
        calls.reuses.push({sessionId:input.sessionId, name:input.name, bytes});
        return receipt(input.sessionId, {attachmentId:'reused-file-' + ++serial, name:input.name, bytes:bytes.length});
      },
      bindPrompt:() => ({commit() {}, [Symbol.dispose]() {}}),
    },
  };
  const adapter = nativeAdapter({
    sessions:{
      using:async (id, _options, operation) => operation({ready:Promise.resolve({session:{
        id, getSnapshot:ready,
        readAttachment:async attachmentId => ({ok:true, value:await ctx.attachments.readImage(source.snapshotEvents()[target.seq].data.content.find(block => block.attachment?.attachmentId === attachmentId).attachment)}),
        prompt:async content => {
          calls.prompts.push({sessionId:id, content:structuredClone(content)});
          const admitted = [];
          for (const part of content) {
            if (part.type === 'file') admitted.push({type:'file', attachment:ctx.fileUploads.resolve({id}, part.receiptId)});
            else if (part.type === 'image') admitted.push(...await ctx.attachments.admitPromptContent([part]));
            else admitted.push(part);
          }
          addTurn(sessions.get(id), admitted, 'REGENERATED_ANSWER');
          return {ok:true};
        },
      }})}),
      fork:async ({sessionId, atSeq}) => {
        calls.forks.push({sessionId, atSeq});
        const child = Session.create('reference-child', buildForkSeed(source.snapshotEvents(), atSeq), {...source.header, id:'reference-child', isSeeded:true, parentSession:sessionId}, atSeq + 1);
        sessions.set(child.id, child); return child.id;
      },
    },
    fileUpload:{
      upload:async (sessionId, file) => {
        calls.uploads.push({sessionId, name:file.name, bytes:Array.from(new Uint8Array(await file.arrayBuffer()))});
        return {ok:true, value:receipt(sessionId, {attachmentId:'uploaded-file-' + ++serial, name:file.name, bytes:file.size})};
      },
      post:async input => {
        const operation = input.path.endsWith('/plan') ? planEdit : input.path.endsWith('/current') ? editCurrent : reuseOriginalFile;
        if (operation === planEdit) calls.plans++;
        const response = await handleReuseRequest(ctx, new Request('http://localhost/' + input.path, {method:'POST', headers:input.headers, body:input.body, signal:input.signal}), operation);
        return {status:response.status, body:await response.text()};
      },
    },
  });
  return {source, target, before, sessions, agent, calls, adapter, addTurn,
    node:{kind:'user', data:{...target.data, seq:target.seq}},
  };
}

function diskRoundtrip(session) {
  const restore = codec.createRestore(JSON.parse(JSON.stringify(codec.encodeCurrentHeader({...session.header, delegationDepth:0}, session.inheritedEventCount))), {recovery:'strict', validation:'current'});
  for (const event of session.snapshotEvents()) restore.decodeRow(JSON.parse(JSON.stringify(codec.encodeCurrentEvent(event))));
  const restored = restore.finish();
  return Session.fromRestore(session.id, restored.events, restored.header, restored.inheritedEventCount, 'detached');
}

for (const mode of ['branch', 'current']) {
  test(`${mode} submission preserves duplicate file reference spelling and selected attachment identity through host and replay`, async () => {
    const f = fixture();
    const raw = String.raw`@"C:\工作 文件\报告😀.txt"`;
    const draft = `😀 请检查 ${raw}，再比较 @other/报告😀.txt 与 ${raw}。\n保留这一行。`;
    const starts = [draft.indexOf(raw), draft.indexOf('@other/'), draft.lastIndexOf(raw)];
    const references = collectFileReferences(draft, () => starts.map((start, index) => ({id:'file', start, end:start + (index === 1 ? '@other/报告😀.txt'.length : raw.length), data:{path:index === 1 ? 'other/报告😀.txt' : String.raw`C:\工作 文件\报告😀.txt`, label:'报告😀.txt'}})));
    assert.equal(references.length, 3, 'duplicate labels remain distinct reference occurrences');
    const originals = originalAttachments(f.node.data);
    const attachments = [originals[2], newAttachment(new File(['new'], '报告😀.txt'), 'new:duplicate-label'), originals[1]];
    await createEditCoordinator(f.adapter).save({sessionId:f.source.id, node:f.node, text:draft, attachments, mode, requestId:randomUUID()});
    assert.equal(f.calls.uploads.length, 1);
    assert.equal(f.calls.uploads[0].sessionId, mode === 'branch' ? 'reference-child' : f.source.id);
    assert.equal(f.calls.reuses.length, mode === 'branch' ? 1 : 0);
    assert.equal(f.calls.forks.length, mode === 'branch' ? 1 : 0);
    assert.equal(f.calls.observations, f.calls.disposals, 'every host observation is disposed');
    assert.deepEqual(f.source.snapshotEvents().slice(0, f.before.length), f.before, 'source log remains auditable');
    let result;
    if (mode === 'current') {
      assert.equal(f.agent.inbox.nextTurn.length, 1);
      const queued = f.agent.inbox.nextTurn.shift();
      assert.equal(queued.content[1].attachment.attachmentId, secondFile.attachment.attachmentId, 'same filename does not select the first original');
      assert.equal(queued.content[3].attachment.attachmentId, oldImage.attachment.attachmentId);
      f.addTurn(f.source, queued.content, 'REGENERATED_ANSWER', queued);
      result = f.source;
    } else {
      assert.equal(f.calls.prompts.length, 1);
      assert.equal(f.calls.prompts[0].content[0].text, draft);
      assert.deepEqual(f.calls.reuses[0], {sessionId:'reference-child', name:secondFile.attachment.name, bytes:[1, 2, 3]});
      assert.deepEqual(f.source.snapshotEvents(), f.before, 'branch leaves all source events unchanged');
      result = f.sessions.get('reference-child');
    }
    for (const session of [result, diskRoundtrip(result)]) {
      const messages = session.deriveMessages();
      const replacement = messages.find(message => message.content.some(part => part.type === 'text' && part.text === draft));
      assert.ok(replacement, 'raw UTF-16 reference text survives model context and disk replay');
      assert.deepEqual(replacement.content.map(part => part.type), ['text', 'file', 'file', 'image']);
      assert.deepEqual(replacement.content.filter(part => part.attachment).map(part => part.attachment.name), ['报告😀.txt', '报告😀.txt', '图片.png']);
      const serialized = JSON.stringify(messages);
      for (const retained of ['KEEP_HISTORY', 'KEEP_ANSWER', 'REGENERATED_ANSWER']) assert.ok(serialized.includes(retained));
      for (const stale of ['SUPERSEDED_REQUEST', 'SUPERSEDED_ANSWER', 'original-a']) assert.ok(!serialized.includes(stale), stale);
    }
  });

  for (const metadata of [{referenceLabels:['another-session']}, {skillNames:['office']}]) {
    test(`${mode} submission refuses decorated session or skill references before any host call ${Object.keys(metadata)[0]}`, async () => {
      const f = fixture(); f.node.data = {...f.node.data, ...metadata};
      await assert.rejects(createEditCoordinator(f.adapter).save({sessionId:f.source.id, node:f.node, text:'keep metadata', mode, requestId:randomUUID()}), {code:'references'});
      assert.equal(f.calls.plans, 0); assert.equal(f.calls.forks.length, 0); assert.equal(f.calls.uploads.length, 0);
      assert.deepEqual(f.source.snapshotEvents(), f.before);
    });
  }

  test(`${mode} duplicate click during planning makes one submission and releases the busy guard`, async () => {
    const calls = [], node = {kind:'user', data:{seq:3, content:[text('original')]}};
    let release, entered;
    const planning = new Promise(resolve => {entered = resolve;});
    const holdPlan = async () => {entered(); return await new Promise(resolve => {release = resolve;});};
    const api = {using:async (id, operation) => operation({id, getSnapshot:ready}),
      planCurrent:holdPlan, resolveBoundary:holdPlan,
      fork:async () => {calls.push('fork'); return 'child';},
      prompt:async () => {calls.push('prompt');},
      editCurrent:async () => {calls.push('current'); return {sessionId:'source'};},
    };
    const coordinator = createEditCoordinator(api);
    const request = {sessionId:'source', node, text:'first', mode, requestId:randomUUID()};
    const first = coordinator.save(request); await planning;
    await assert.rejects(coordinator.save({...request, text:'second'}), {code:'duplicate'});
    release(mode === 'current' ? {tail:4} : 2); await first;
    assert.deepEqual(calls, mode === 'current' ? ['current'] : ['fork', 'prompt']);
    api.planCurrent = async () => ({tail:4}); api.resolveBoundary = async () => 2;
    await coordinator.save({...request, requestId:randomUUID()});
    assert.equal(calls.filter(call => call === (mode === 'current' ? 'current' : 'prompt')).length, 2);
  });
}
