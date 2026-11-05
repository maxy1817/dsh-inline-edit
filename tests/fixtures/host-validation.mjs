/** Explicit isolated-Host fixture. Never distributed or loaded by the plugin. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {currentBoundary, editCurrent, planCurrent} from '../../src/current.js';
import {isEditMarker, messageEligibility} from '../../src/history.js';

export const name = 'dsh-inline-edit-host-validation';
export const inject = ['agents', 'llm', 'sessions', 'sessionQuery', 'sessionController', 'sessionPersistence', 'attachments', 'fileUploads', 'connection'];
const provider = 'inline-edit-test', model = 'offline';
const txt = text => ({type:'text', text});
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const clone = value => JSON.parse(JSON.stringify(value));
const errorView = error => ({name:error?.name, message:error?.message ?? String(error), editCode:error?.editCode, stack:error?.stack});

export function apply(ctx) {
  if (process.env.DSH_IE_HOST_TEST !== '1') throw Error('host-validation requires DSH_IE_HOST_TEST=1 and an isolated DSH_HOME');
  const cwd = process.env.DSH_IE_HOST_WORKDIR;
  if (!cwd) throw Error('host-validation requires DSH_IE_HOST_WORKDIR');
  if (process.env.DSH_IE_HOST_AUTORUN === '1' && !process.env.DSH_IE_HOST_REPORT) throw Error('automatic Host validation requires DSH_IE_HOST_REPORT');
  const signal = new AbortController(), owned = new Map(), captures = new Map(), holds = new Map();
  let job;
  const report = {fixture:name, state:'ready', provider, model, cwd, startedAt:null, completedAt:null, checks:[], sessions:[], previewSessionId:null, recoverySessionId:null};
  const persist = async () => {
    if (process.env.DSH_IE_HOST_REPORT) await writeFile(process.env.DSH_IE_HOST_REPORT, JSON.stringify(report, null, 2));
  };
  const check = async (name, operation) => {
    const started = Date.now();
    try {const details = await operation(); report.checks.push({name, ok:true, elapsedMs:Date.now() - started, ...(details ?? {})});}
    catch (error) {report.checks.push({name, ok:false, elapsedMs:Date.now() - started, error:errorView(error)}); throw error;}
    finally {await persist();}
  };
  const waitFor = async (predicate, description, timeout = 20000) => {
    const until = Date.now() + timeout;
    while (!predicate()) {
      signal.signal.throwIfAborted();
      if (Date.now() > until) throw Error('Timed out: ' + description);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };
  const readyModel = async () => {
    const until = Date.now() + 30000;
    report.waitingFor = 'offline model registration'; await persist();
    while (true) {
      signal.signal.throwIfAborted();
      try {if (await ctx.llm.resolveModelInfo(provider, model)) break;} catch (error) {
        if (Date.now() > until) throw error;
      }
      if (Date.now() > until) throw Error('offline model registration did not become ready');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    delete report.waitingFor;
  };
  const withFactory = async operation => {
    const until = Date.now() + 30000;
    while (true) {
      signal.signal.throwIfAborted();
      try {const value = await operation(); delete report.waitingFor; return value;} catch (error) {
        // The registry documents this exact pre-registration failure; retrying
        // it creates no session and never retries a partially created Agent.
        if (error?.message !== 'no agent factory registered (load an agent-loop plugin)' || Date.now() > until) throw error;
        report.waitingFor = 'Agent factory registration'; await persist();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };
  const idle = async agent => {
    let timer;
    try {await Promise.race([agent.whenIdle(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('Agent did not reach idle: ' + agent.id)), 25000);
    })]);} finally {clearTimeout(timer);}
    assert.equal(agent.status, 'idle');
    assert.equal(agent.inbox.nextTurn.length + agent.inbox.nextStep.length, 0);
  };
  ctx.on('llm/stream', (options, next) => (async function* () {
    if (options.provider === provider && options.sessionId && !options.purpose) {
      const records = captures.get(options.sessionId) ?? [];
      records.push({sessionId:options.sessionId, messages:clone(options.messages)});
      captures.set(options.sessionId, records);
      const hold = holds.get(options.sessionId);
      if (hold && options.messages.some(message => message.role === 'user' && message.content?.some(part => part.type === 'text' && part.text.includes(hold.marker)))) {
        hold.entered = true;
        await Promise.race([hold.promise, new Promise((_, reject) => {
          if (signal.signal.aborted) reject(signal.signal.reason);
          else signal.signal.addEventListener('abort', () => reject(signal.signal.reason), {once:true});
        })]);
      }
    }
    yield* next();
  })());
  const latest = agent => agent.session.snapshotEvents().findLast(event => event.type === 'user/message' && event.data.source?.kind === 'user');
  const modelCall = agent => {
    const call = captures.get(agent.id)?.at(-1);
    assert.ok(call, 'real llm/stream request was captured'); return call;
  };
  const assertContext = (agent, present, absent) => {
    const serialized = JSON.stringify(modelCall(agent).messages);
    for (const value of present) assert.ok(serialized.includes(JSON.stringify(value).slice(1, -1)), 'missing model context: ' + value);
    for (const value of absent) assert.ok(!serialized.includes(JSON.stringify(value).slice(1, -1)), 'superseded model context survived: ' + value);
  };
  async function create(label) {
    const id = 'ie-host-' + label + '-' + randomUUID();
    const handle = await withFactory(() => ctx.agents.create({sessionId:id, meta:{cwd}, agentOptions:{provider, model}}));
    owned.set(id, handle); report.sessions.push({id, label}); await persist(); return handle.agent;
  }
  async function send(agent, content) {
    const message = createUserMessage({content, source:{kind:'user'}});
    agent.followup(message); await idle(agent);
    const event = agent.session.snapshotEvents().find(event => event.type === 'user/message' && event.data.id === message.id);
    assert.ok(event, 'followup became a durable user/message');
    return event;
  }
  async function edit(agent, content) {
    const sameSession = agent.session;
    const target = latest(agent), plan = await planCurrent(ctx, {sourceId:agent.id, seq:target.seq});
    const input = {sourceId:agent.id, seq:target.seq, tail:plan.tail, requestId:randomUUID(), content};
    const prefix = clone(agent.session.snapshotEvents());
    const result = await editCurrent(ctx, input, signal.signal); await idle(agent);
    assert.equal(result.sessionId, agent.id); assert.equal(agent.session.id, agent.id); assert.equal(agent.session, sameSession);
    assert.deepEqual(agent.session.snapshotEvents().slice(0, prefix.length), prefix, 'source event prefix is immutable');
    return {input, result, event:latest(agent)};
  }
  const originals = agent => latest(agent).data.content.flatMap((part, index) => part.attachment ? [{type:'original', index}] : []);
  async function all() {
    const info = await ctx.llm.resolveModelInfo(provider, model); assert.ok(info, 'offline provider is registered');
    const reference = '@"' + join(cwd, '引用 文件.txt') + '"';
    const agent = await create('web-preview'); report.previewSessionId = agent.id;
    await send(agent, [txt('HOST_KEEP_HISTORY')]);
    const file = await ctx.attachments.saveFile({data:Buffer.from('old isolated host file'), name:'旧附件.txt'});
    const image = await ctx.attachments.saveImage({data:Buffer.from(png, 'base64'), mediaType:'image/png', name:'旧图片.png'});
    await send(agent, [txt('HOST_OLD_REQUEST ' + reference), {type:'file', attachment:file}, {type:'image', attachment:image}]);
    await check('text and @ reference edit reaches real model with retained file and image', async () => {
      const changed = 'HOST_EDITED_REQUEST ' + reference + '，保留路径😀';
      await edit(agent, [txt(changed), ...originals(agent)]);
      assertContext(agent, ['HOST_KEEP_HISTORY', changed], ['HOST_OLD_REQUEST']);
      assert.deepEqual(latest(agent).data.content.filter(part => part.attachment).map(part => part.attachment.attachmentId), [file.attachmentId, image.attachmentId]);
    });
    await check('unchanged content regenerates once and same request ID is idempotent', async () => {
      const count = captures.get(agent.id).length;
      const previous = latest(agent), unchanged = previous.data.content[0].text;
      const {input} = await edit(agent, [txt(unchanged), ...originals(agent)]);
      const countAfter = captures.get(agent.id).length;
      assert.equal(countAfter, count + 1);
      await editCurrent(ctx, input, signal.signal); await idle(agent);
      assert.equal(captures.get(agent.id).length, countAfter);
      assertContext(agent, [unchanged], ['HOST_OLD_REQUEST']);
    });
    await check('file removal keeps exact text and original image without stale file context', async () => {
      const event = latest(agent), imageIndex = event.data.content.findIndex(part => part.type === 'image');
      const unchanged = event.data.content[0].text;
      await edit(agent, [txt(unchanged), {type:'original', index:imageIndex}]);
      assert.equal(latest(agent).data.content.filter(part => part.type === 'file').length, 0);
      assert.equal(latest(agent).data.content[0].text, unchanged);
      assertContext(agent, [unchanged], [file.attachmentId, '旧附件.txt']);
    });
    let addedFile;
    await check('file addition uses real upload receipt and keeps original image', async () => {
      const receipt = await ctx.fileUploads.uploadStream({sessionId:agent.id, name:'新附件.txt', data:(async function* () {yield Buffer.from('new isolated host file');})(), signal:signal.signal});
      const unchanged = latest(agent).data.content[0].text;
      await edit(agent, [txt(unchanged), ...originals(agent), {type:'file', receiptId:receipt.receiptId}]);
      addedFile = latest(agent).data.content.find(part => part.type === 'file').attachment;
      assert.equal(addedFile.name, '新附件.txt');
      assert.equal(latest(agent).data.content.find(part => part.type === 'image').attachment.attachmentId, image.attachmentId);
      assertContext(agent, ['新附件.txt'], [file.attachmentId, '旧附件.txt']);
    });
    await check('image removal and addition preserve the independently retained file', async () => {
      const event = latest(agent), fileIndex = event.data.content.findIndex(part => part.type === 'file');
      const unchanged = event.data.content[0].text;
      await edit(agent, [txt(unchanged), {type:'original', index:fileIndex}]);
      assert.equal(latest(agent).data.content.some(part => part.type === 'image'), false);
      assertContext(agent, ['新附件.txt'], [image.attachmentId]);
      await edit(agent, [txt(unchanged), ...originals(agent), {type:'image', data:png, mediaType:'image/png', name:'新图片.png'}]);
      assert.equal(latest(agent).data.content.find(part => part.type === 'file').attachment.attachmentId, addedFile.attachmentId);
      assert.equal(latest(agent).data.content.find(part => part.type === 'image').attachment.name, '新图片.png');
    });
    await check('later user followup excludes original prompt and removed attachment from real model context', async () => {
      await send(agent, [txt('HOST_LATER_FOLLOWUP ' + reference)]);
      assertContext(agent, ['HOST_KEEP_HISTORY', 'HOST_EDITED_REQUEST', 'HOST_LATER_FOLLOWUP'], ['HOST_OLD_REQUEST', file.attachmentId]);
      await ctx.sessions.flush(agent.session);
    });
    for (const target of ['next-turn', 'next-step']) await check('running ' + target + ' input stays ineligible after consumption', async () => {
      const busy = await create(target); await send(busy, [txt('HOST_BUSY_KEEP_' + target)]);
      let release; const marker = 'HOST_BUSY_MAIN_' + target;
      const hold = {marker, entered:false, promise:new Promise(resolve => {release = resolve;})}; holds.set(busy.id, hold);
      const main = createUserMessage({content:[txt(marker)], source:{kind:'user'}}); busy.followup(main);
      await waitFor(() => hold.entered, 'real model busy barrier');
      assert.equal(busy.status, 'running');
      await assert.rejects(planCurrent(ctx, {sourceId:busy.id, seq:latest(busy).seq}), error => error.editCode === 'running');
      const supplement = createUserMessage({content:[txt('HOST_SUPPLEMENT_' + target)], source:{kind:'user'}});
      busy.send(supplement, target, true); holds.delete(busy.id); release(); await idle(busy);
      const events = busy.session.snapshotEvents(), mainEvent = events.find(event => event.type === 'user/message' && event.data.id === main.id);
      const supplementalEvent = events.find(event => event.type === 'user/message' && event.data.id === supplement.id);
      assert.ok(supplementalEvent, 'running input was consumed');
      const eligibility = messageEligibility(events);
      assert.equal(eligibility.latestSeq, mainEvent.seq); assert.ok(eligibility.excluded.includes(supplementalEvent.seq));
      assert.throws(() => currentBoundary(busy.session, supplementalEvent.seq), error => error.editCode === 'supplemental');
      const plan = await planCurrent(ctx, {sourceId:busy.id, seq:mainEvent.seq});
      await editCurrent(ctx, {sourceId:busy.id, seq:mainEvent.seq, tail:plan.tail, requestId:randomUUID(), content:[txt('HOST_BUSY_REPLACEMENT_' + target)]}, signal.signal);
      await idle(busy); assertContext(busy, ['HOST_BUSY_REPLACEMENT_' + target], [marker, 'HOST_SUPPLEMENT_' + target]);
    });
    await check('durable interrupted edit is prepared for actual Host restart recovery', async () => {
      const recovery = await create('restart-recovery'); report.recoverySessionId = recovery.id;
      await send(recovery, [txt('HOST_RECOVERY_KEEP')]); await send(recovery, [txt('HOST_RECOVERY_OLD')]);
      const event = latest(recovery), plan = await planCurrent(ctx, {sourceId:recovery.id, seq:event.seq});
      const followup = recovery.followup;
      // Deliberate fault on this fixture-owned Agent simulates a crash between
      // the committed recovery marker and queue publication, using editCurrent.
      recovery.followup = () => {throw Error('intentional Host recovery fault');};
      try {
        await assert.rejects(editCurrent(ctx, {sourceId:recovery.id, seq:event.seq, tail:plan.tail, requestId:randomUUID(), content:[txt('HOST_RECOVERY_REPLACEMENT')]}, signal.signal), error => error.editCode === 'currentUncertain');
      } finally {recovery.followup = followup;}
      await idle(recovery); await ctx.sessions.flush(recovery.session);
      assert.equal(recovery.session.snapshotEvents().filter(isEditMarker).length, 1);
      assert.equal(recovery.inbox.nextTurn.length, 0);
      return {sessionId:recovery.id, nextAction:'restart Host, POST /api/dsh-inline-edit-test/run with {"phase":"resume","sessionId":"' + recovery.id + '"}'};
    });
    report.state = 'awaiting-restart';
  }
  async function resume(sessionId) {
    assert.equal(typeof sessionId, 'string'); assert.ok(sessionId.startsWith('ie-host-restart-recovery-'));
    report.recoverySessionId = sessionId;
    await check('persisted recovery resumes once and later model context excludes superseded task', async () => {
      if (owned.has(sessionId)) {await owned.get(sessionId).dispose(); owned.delete(sessionId);}
      assert.equal(ctx.agents.get(sessionId), undefined, 'restart recovery target must not already be loaded');
      const handle = await withFactory(() => ctx.agents.resume({resumeSessionId:sessionId, agentOptions:{provider, model}}));
      owned.set(sessionId, handle); const agent = handle.agent; await idle(agent);
      const replacements = agent.session.snapshotEvents().filter(event => event.type === 'user/message' && event.data.source?.kind === 'user' && event.data.content.some(part => part.type === 'text' && part.text === 'HOST_RECOVERY_REPLACEMENT'));
      assert.equal(replacements.length, 1, 'pending recovery was queued exactly once by plugin agent/created listener');
      assertContext(agent, ['HOST_RECOVERY_KEEP', 'HOST_RECOVERY_REPLACEMENT'], ['HOST_RECOVERY_OLD']);
      await send(agent, [txt('HOST_RECOVERY_FOLLOWUP')]);
      assertContext(agent, ['HOST_RECOVERY_REPLACEMENT', 'HOST_RECOVERY_FOLLOWUP'], ['HOST_RECOVERY_OLD']);
      await ctx.sessions.flush(agent.session);
      return {sessionId, modelCalls:captures.get(sessionId).length};
    });
    report.state = 'passed';
  }
  const run = input => {
    if (job) return false;
    report.state = 'running'; report.startedAt = new Date().toISOString(); report.completedAt = null; delete report.error;
    job = (async () => {
      try {await persist(); await readyModel(); if (input.phase === 'resume') await resume(input.sessionId); else await all();}
      catch (error) {report.state = 'failed'; report.error = errorView(error);}
      finally {
        report.completedAt = new Date().toISOString();
        report.captures = Object.fromEntries(captures); await persist(); job = undefined;
      }
    })();
    return true;
  };
  const reply = (status, value) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json', 'cache-control':'no-store'}});
  ctx.effect(() => ctx.connection.fetch.register({path:'/api/dsh-inline-edit-test/run', methods:['POST'], requestBody:'streaming', fetch:async request => {
    try {
      const body = await request.text(); if (body.length > 4096) return reply(413, {ok:false});
      const input = body ? JSON.parse(body) : {};
      if (input.phase && !['all', 'resume'].includes(input.phase)) return reply(400, {ok:false, error:'invalid-phase'});
      return run(input) ? reply(202, {ok:true, status:'/api/dsh-inline-edit-test/status'}) : reply(409, {ok:false, error:'already-running'});
    } catch (error) {return reply(400, {ok:false, error:errorView(error)});}
  }}));
  ctx.effect(() => ctx.connection.fetch.register({path:'/api/dsh-inline-edit-test/status', methods:['GET'], fetch:() => reply(200, report)}));
  if (process.env.DSH_IE_HOST_AUTORUN === '1') ctx.effect(() => {
    const timer = setTimeout(() => run({phase:process.env.DSH_IE_HOST_PHASE ?? 'all', sessionId:process.env.DSH_IE_HOST_RESUME_SESSION}), 0);
    return () => clearTimeout(timer);
  });
  ctx.effect(() => () => {signal.abort(Error('Host validation fixture unloaded')); for (const hold of holds.values()) hold.release?.();});
}
