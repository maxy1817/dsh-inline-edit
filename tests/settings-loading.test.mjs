import {test, after, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import z from '@deepseek-ai/schemastery';
import {loadNativeTooltip} from './helpers/native-primitives.mjs';
import {loadNativeSettings} from './helpers/native-settings.mjs';

const dom = new JSDOM('<!doctype html><html lang="zh-CN"><head></head><body><div id="root"></div></body></html>', {url:'http://localhost', pretendToBeVisual:true});
for (const key of ['window','document','navigator','Node','HTMLElement','HTMLTextAreaElement','Event','KeyboardEvent']) {
  Object.defineProperty(globalThis, key, {value:dom.window[key], configurable:true});
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = fn => setTimeout(fn, 0);
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
const React = await import('react');
const {act} = React;
const {createRoot} = await import('react-dom/client');
const require = createRequire(import.meta.url);
const nativePrimitives = await loadNativeTooltip(require);
const nativeSettings = await loadNativeSettings();
let client;
window.__ModuleLoader__ = {load: definition => {
  client = definition.factory(id => id === '@deepseek-ai/dsh-client-ui-primitives' ? nativePrimitives : require(id));
}};
vm.runInThisContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'));

// This is the plain wire schema emitted from the host's volatile Config field.
const schema = z.object({mode:z.union(['branch','current']).default('branch')}).toJSON();
const row = (value = {mode:'current'}) => ({ns:'dsh-inline-edit', schema, revision:0, value, base:{mode:'branch'}, user:value});
const describeResult = (rows = [row()]) => ({ok:true, value:{writable:true, namespaces:rows}});
const message = {kind:'user', data:{seq:3, time:0, content:[{type:'text', text:'原消息'}]}};
let root;
const cleanups = [];

function context(describe) {
  const disposers = [], registrations = [], events = new Map();
  const listen = (name, callback) => {
    const callbacks = events.get(name) ?? new Set();
    events.set(name, callbacks); callbacks.add(callback);
    return () => callbacks.delete(callback);
  };
  const projection = {latestSeq:3, excluded:[]};
  const ctx = {
    effect: effect => { const dispose = effect(); if (dispose) disposers.push(dispose); },
    on: listen,
    remote: {settings:{describe}, $on:listen},
    sessions: {binding: () => ({session:{projections:{faceOf:() => ({getSnapshot:() => projection, subscribe:() => () => {}})}}})},
    uiWorkspace: {openSession:() => assert.fail('must not navigate while checking settings')},
    slots: {
      inject(name, register) {
        // Register the actual two consumer components. The unrelated native
        // flow bridge requires a host tree and is not mounted in this fixture.
        if (name === 'conversation.chat.node' || name === 'settings.section') return register();
        return () => {};
      },
      register(options, component) { registrations.push({options, component}); return () => {}; },
    },
  };
  nativeSettings.apply(ctx);
  cleanups.push(async () => { for (const dispose of disposers.reverse()) await dispose(); });
  return {ctx, registrations};
}

async function mount(describe) {
  const host = context(describe);
  // This is the real public entry point, including ConfigForms.get(), the
  // Message wrapper, useSettings and the registered settings page.
  client.apply(host.ctx);
  const Message = host.registrations.find(entry => entry.options.name === 'conversation.chat.node' && entry.options.key === 'user').component;
  const Settings = host.registrations.find(entry => entry.options.name === 'settings.section').component;
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(React.Fragment, {},
    React.createElement(Message, {node:message, sessionId:'settings-fixture', useSession:() => ({openState:'open', running:false}), renderFactorySlot:(_, props) => React.createElement('p', {}, props.content.text)}),
    React.createElement(Settings),
  )));
  return host;
}

function editButton() { return document.querySelector('button[aria-label="编辑消息"]'); }
function retryButton() { return [...document.querySelectorAll('button')].find(button => button.textContent === '重试'); }

test('native cached form does not retry an initial describe failure by itself', async () => {
  let calls = 0, available = false;
  const {ctx} = context(async () => {
    calls++;
    return available ? describeResult() : {ok:false, error:{message:'temporary settings failure'}};
  });
  const form = ctx.configForms.get('dsh-inline-edit');
  const mirror = ctx.configForms.describe();
  await mirror.ensure();
  assert.equal(calls, 1);
  assert.equal(mirror.getSnapshot().status, 'idle');
  assert.equal(mirror.getSnapshot().error, 'temporary settings failure');
  assert.equal(form.getSnapshot().status, 'loading');
  available = true;
  for (let i = 0; i < 3; i++) assert.equal(ctx.configForms.get('dsh-inline-edit'), form);
  await Promise.resolve();
  assert.equal(calls, 1, 'looking up the cached form does not make another request');
  assert.equal(form.getSnapshot().status, 'loading');
  await mirror.ensure();
  assert.equal(calls, 2);
  assert.equal(form.getSnapshot().status, 'ready');
  assert.equal(form.getSnapshot().value.mode, 'current');
});

for (const failure of ['response', 'rejection']) test(`real message and settings page recover from describe ${failure} via retry`, async () => {
  let calls = 0, available = false;
  await mount(async () => {
    calls++;
    if (available) return describeResult();
    if (failure === 'rejection') throw new Error('temporary settings failure');
    return {ok:false, error:{message:'temporary settings failure'}};
  });
  assert.equal(editButton().getAttribute('aria-disabled'), 'true');
  assert.equal(document.querySelector('.dsh-ie-settings fieldset').disabled, true);
  assert.equal(document.querySelector('.dsh-ie-settings input:checked'), null);
  assert.doesNotMatch(editButton().getAttribute('aria-description') ?? '', /会话尚未加载/,
    'a settings failure must not be described as an unfinished session');
  assert.match(editButton().getAttribute('aria-description') ?? '', /设置/);
  assert.ok(retryButton(), 'failed settings must expose a retry action');
  const before = calls;
  available = true;
  await act(async () => retryButton().click());
  assert.equal(calls, before + 1);
  assert.equal(document.querySelector('input[value="current"]').checked, true);
  assert.equal(document.querySelector('.dsh-ie-settings fieldset').disabled, false);
  assert.equal(editButton().getAttribute('aria-disabled'), 'false');
  await act(async () => editButton().click());
  assert.equal(document.querySelector('textarea').value, '原消息');
});

test('a pending retry stays disabled and another failure keeps an explicit retry action', async () => {
  let calls = 0, defer = false, available = false, release;
  await mount(async () => {
    calls++;
    if (available) return describeResult();
    if (defer) return new Promise(resolve => { release = resolve; });
    return {ok:false, error:{message:'temporary settings failure'}};
  });
  const before = calls;
  const retry = retryButton();
  defer = true;
  await act(async () => retry.click());
  assert.equal(calls, before + 1);
  assert.equal(retry.disabled, true);
  assert.equal(editButton().getAttribute('aria-disabled'), 'true');
  await act(async () => retry.click());
  assert.equal(calls, before + 1, 'the pending action cannot start another read');
  await act(async () => release({ok:false, error:{message:'still unavailable'}}));
  assert.ok(retryButton());
  assert.equal(retryButton().disabled, false);
  assert.equal(calls, before + 1, 'a failed retry must not cause an automatic retry loop');
  available = true;
  await act(async () => retryButton().click());
  assert.equal(calls, before + 2);
  assert.equal(document.querySelector('input[value="current"]').checked, true);
  assert.equal(editButton().getAttribute('aria-disabled'), 'false');
});

for (const [name, rows] of [
  ['missing namespace', []],
  ['invalid mode rejected by the native decoder', [row({mode:'invalid'})]],
  ['missing mode accepted through a schema default', [row({})]],
]) test(`message remains blocked for ${name}`, async () => {
  await mount(async () => describeResult(rows));
  assert.equal(editButton().getAttribute('aria-disabled'), 'true');
  assert.equal(document.querySelector('.dsh-ie-settings fieldset').disabled, true);
  assert.equal(document.querySelector('.dsh-ie-settings input:checked'), null);
  await act(async () => editButton().click());
  assert.equal(document.querySelector('textarea'), null);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  for (const cleanup of cleanups.splice(0)) await cleanup();
});
after(() => dom.window.close());
