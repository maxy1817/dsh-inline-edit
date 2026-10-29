import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Session} from '@deepseek-ai/dsh-session';
import {buildForkSeed} from '@deepseek-ai/dsh-session/fork';
import {AttachmentStore} from '@deepseek-ai/dsh-attachment';
import {sessionFormatCatalog as codec} from '@deepseek-ai/dsh-session-format-catalog';
import {createSystemMessage,createUserMessage,createAssistantMessage,createDeveloperMessage,createToolResultMessage} from '@deepseek-ai/dsh-llm';
import {editBoundary} from '../src/index.js';
import {currentBoundary,editCurrent,recoverCurrent} from '../src/current.js';
import {EDIT_NOTICE,editRanges,isHidden,filterEntries,messageEligibility,isEditMarker} from '../src/history.js';
import {createEditCoordinator,originalAttachments,newAttachment} from '../src/core.js';
const signal=new AbortController().signal;
const txt=text=>({type:'text',text});
function diskRoundtrip(session) {
  const restore=codec.createRestore(JSON.parse(JSON.stringify(codec.encodeCurrentHeader({...session.header,delegationDepth:0},session.inheritedEventCount))),{recovery:'strict',validation:'current'});
  for(const event of session.snapshotEvents()) restore.decodeRow(JSON.parse(JSON.stringify(codec.encodeCurrentEvent(event))));
  const restored=restore.finish();
  return Session.fromRestore(session.id,restored.events,restored.header,restored.inheritedEventCount,'detached');
}
function fixture(targetContent,beforeAnswer) {
  const session=Session.create('same-session'), inbox={nextTurn:[],nextStep:[]};
  const add=(turn,content,answer,queued)=>{
    const message=queued ?? createUserMessage({content,source:{kind:'user'}});
    session.append('agent/inbox/spliced',{target:'next-turn',start:0,inserted:[message]});
    session.append('turn/start',{turn});
    session.append('agent/inbox/spliced',{target:'next-turn',start:0,removedCount:1,inserted:[]});
    session.append('step/start',{turn,step:1});
    if(turn===1) session.append('system/message',{turn,step:1,message:createSystemMessage('SYSTEM')},{surfaceOp:'append'});
    const target=session.append('user/message',message,{surfaceOp:'append'});
    if(turn===2) beforeAnswer?.(session);
    session.append('assistant/message',{turn,step:1,message:createAssistantMessage({content:[txt(answer)],source:{provider:'test',model:'offline'}}),stream:[]},{surfaceOp:'append'});
    session.append('step/end',{turn,step:1});session.append('turn/end',{turn,reason:{kind:'completed'}}); return target;
  };
  const keep=add(1,[txt('KEEP')],'KEEP-ANSWER');
  const target=add(2,targetContent ?? [txt('OLD'),{type:'file',attachment:{attachmentId:'old-file',name:'old.txt',bytes:3}}],'OLD-ANSWER');

  let held=false;
  const agent={id:session.id,session,inbox,status:'idle',options:{provider:'test',model:'offline'},
    runMaintenance(fn){if(held)throw Error('busy');held=true;return Promise.resolve().then(()=>fn(signal)).finally(()=>{held=false;});},
    followup(m){inbox.nextTurn.push(m);},
  };
  const ctx={agents:{get:()=>agent},sessionController:{resolveAgent:async()=>({agent})},llm:{resolveModelInfo:async()=>({inputModalities:['text','image']})},
    attachments:{readFileStream:async function*(){yield new Uint8Array([1,2,3]);},readImage:async()=>({}),admitPromptContent:async parts=>parts},
    fileUploads:{resolve:(_,id)=>id==='upload'?{attachmentId:'new-file',name:'new.txt',bytes:4}:undefined,bindPrompt:()=>({commit(){},[Symbol.dispose](){}})},
  };
  const input={sourceId:agent.id,seq:target.seq,tail:session.snapshotEvents().length-1,requestId:randomUUID(),content:[txt('NEW')]};
  return {session,agent,ctx,input,target,keep,add};
}
function consumeReplacement(f,turn,answer) {
  const message=f.agent.inbox.nextTurn.shift();
  assert.ok(message,'replacement must be queued');
  return f.add(turn,message.content,answer,message);
}
function assertContext(session,present,absent) {
  // Check the entire adapter-facing message object, including source metadata.
  const messages=JSON.stringify(session.deriveMessages());
  for(const word of present) assert.ok(messages.includes(word),'missing '+word);
  for(const word of absent) assert.ok(!messages.includes(word),'stale '+word);
}

test('cached context and later followups exclude replaced text, answers, file and image references',async()=>{
  const f=fixture([txt('OLD'),oldImage,{type:'file',attachment:{attachmentId:'old-file',name:'old.txt',bytes:3}}]);
  assertContext(f.session,['OLD','old-file','old-image'],[]); // Prime native cache.
  await editCurrent(f.ctx,f.input,signal);
  consumeReplacement(f,3,'NEW-ANSWER');
  f.add(4,[txt('FOLLOWUP')],'FOLLOWUP-ANSWER');
  for(const session of [f.session,diskRoundtrip(f.session)]) {
    assertContext(session,['KEEP','KEEP-ANSWER','NEW','FOLLOWUP'],['OLD','OLD-ANSWER','old-file','old-image']);
  }
});

test('repeated edits remove superseded recovery payloads before a later model call and disk replay',async()=>{
  const f=fixture();
  await editCurrent(f.ctx,f.input,signal);
  const edited=consumeReplacement(f,3,'NEW-ANSWER');
  assertContext(f.session,['NEW'],['OLD']); // Prime post-edit cache as well.
  await editCurrent(f.ctx,{...f.input,seq:edited.seq,tail:f.session.seq-1,requestId:randomUUID(),content:[txt('FINAL_VERSION')]},signal);
  consumeReplacement(f,4,'FINAL_ANSWER');
  f.add(5,[txt('LATER_FOLLOWUP')],'LATER_ANSWER');
  for(const session of [f.session,diskRoundtrip(f.session)]) {
    assertContext(session,['KEEP','KEEP-ANSWER','FINAL_VERSION','LATER_FOLLOWUP'],['OLD','NEW','old-file']);
    assert.equal(session.surface.nodes.filter(seq=>isEditMarker(session.eventAt(seq))).length,1);
    assert.equal(editRanges(session.snapshotEvents()).length,1);
  }
  f.agent.session=diskRoundtrip(f.session);
  recoverCurrent(f.agent);
  assert.equal(f.agent.inbox.nextTurn.length,0,'restart must not replay an old revision');
});

test('tool results and running supplements exit later context with the edited main message',async()=>{
  const f=fixture(undefined,s=>{
    const call={type:'tool-call',id:'old-call',name:'read',arguments:'{"path":"OLD_TOOL_PATH"}'};
    s.append('assistant/message',{turn:2,step:1,message:createAssistantMessage({content:[call],source:{provider:'test',model:'offline'}}),stream:[]},{surfaceOp:'append'});
    s.append('tool/call',{turn:2,step:1,callId:call.id,name:call.name,arguments:call.arguments});
    s.append('tool/result',{turn:2,step:1,message:createToolResultMessage({callId:call.id,content:[txt('OLD_TOOL_RESULT')],isError:false})},{surfaceOp:'append'});
    const supplement=createUserMessage({content:[txt('OLD_SUPPLEMENT')],source:{kind:'user'}});
    s.append('agent/inbox/spliced',{target:'next-step',start:0,inserted:[supplement]});
    s.append('agent/inbox/spliced',{target:'next-step',start:0,removedCount:1,inserted:[]});
    s.append('user/message',supplement,{surfaceOp:'append'});
  });
  diskRoundtrip(f.session); // Validate a genuinely balanced native tool lifecycle.
  assertContext(f.session,['OLD_TOOL_RESULT','OLD_SUPPLEMENT'],[]);
  await editCurrent(f.ctx,f.input,signal);
  consumeReplacement(f,3,'NEW-ANSWER');
  f.add(4,[txt('FOLLOWUP')],'FOLLOWUP-ANSWER');
  for(const s of [f.session,diskRoundtrip(f.session)]) assertContext(s,['KEEP','NEW','FOLLOWUP'],['OLD','old-call','old-file']);
});

test('branching from a replacement excludes its revision chain and original queued admission',async()=>{
  const f=fixture();await editCurrent(f.ctx,f.input,signal);
  const edited=consumeReplacement(f,3,'NEW-ANSWER');
  const events=f.session.snapshotEvents(),cut=editBoundary(events,edited.seq);
  const branch=Session.create('branch-session',buildForkSeed(events,cut),
    {...f.session.header,id:'branch-session',isSeeded:true,parentSession:f.session.id},cut+1);
  assertContext(branch,['KEEP','KEEP-ANSWER'],['OLD','NEW','old-file']);
  assert.equal(events[cut].type,'turn/end');
  diskRoundtrip(branch);
  assertContext(f.session,['NEW'],['OLD']); // Source is not changed by a fork.
});

test('editing a later independent task preserves the earlier accepted revision',async()=>{
  const f=fixture();await editCurrent(f.ctx,f.input,signal);
  consumeReplacement(f,3,'NEW-ANSWER');
  const later=f.add(4,[txt('LATER_OLD')],'LATER_OLD_ANSWER');
  await editCurrent(f.ctx,{...f.input,seq:later.seq,tail:f.session.seq-1,requestId:randomUUID(),content:[txt('LATER_NEW')]},signal);
  consumeReplacement(f,5,'LATER_NEW_ANSWER');
  assertContext(diskRoundtrip(f.session),['KEEP','NEW','NEW-ANSWER','LATER_NEW'],['OLD','old-file']);
});

test('editing a compacted target is refused rather than leaving its summary active',async()=>{
  const f=fixture(),nodes=currentBoundary(f.session,f.target.seq).nodes;
  f.session.append('user/message',createUserMessage({content:[txt('SUMMARY_OF_OLD')],source:{kind:'compaction'}}),
    {surfaceOp:{op:'replace',startSeq:nodes[0],endSeq:nodes.at(-1)},sourceEventSeqs:nodes});
  f.input.tail=f.session.seq-1;
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='compacted');
  assert.equal(f.agent.inbox.nextTurn.length,0);
});

test('legacy accumulated markers are collapsed by exact revision IDs after upgrade',async()=>{
  const f=fixture();await editCurrent(f.ctx,f.input,signal);
  const edited=consumeReplacement(f,3,'NEW-ANSWER');
  const nodes=f.session.surface.nodes.slice(f.session.surface.nodes.indexOf(edited.seq));
  const replacement=createUserMessage({content:[txt('LEGACY_REVISION')],source:{kind:'user'}});
  const prior=f.session.snapshotEvents().findLast(isEditMarker);
  const start=f.session.snapshotEvents().findLast(e=>e.type==='turn/start').seq;
  f.session.append('user/message',createUserMessage({content:[txt(EDIT_NOTICE)],source:{...prior.data.source,
    requestId:randomUUID(),targetSeq:edited.seq,cutoff:start-1,replacement}}),
    {surfaceOp:{op:'replace',startSeq:nodes[0],endSeq:nodes.at(-1)},sourceEventSeqs:nodes});
  f.agent.followup(replacement);
  const legacy=consumeReplacement(f,4,'LEGACY_ANSWER');
  assertContext(diskRoundtrip(f.session),['NEW','LEGACY_REVISION'],['OLD']);
  await editCurrent(f.ctx,{...f.input,seq:legacy.seq,tail:f.session.seq-1,requestId:randomUUID(),content:[txt('FINAL_ONLY')]},signal);
  consumeReplacement(f,5,'FINAL_ANSWER');
  assertContext(diskRoundtrip(f.session),['KEEP','FINAL_ONLY'],['OLD','NEW','LEGACY']);
  assert.equal(editRanges(f.session.snapshotEvents()).length,1);
});
const image=data=>({type:'image',mediaType:'image/png',data:Buffer.from(data).toString('base64')});
const oldImage={type:'image',attachment:{attachmentId:'old-image',mediaType:'image/png',bytes:3,width:1,height:1}};
function hostAttachments(f,overrides={}) {
  const calls={batches:[],writes:0,reads:0};
  // Exercise the released host batch decoder/admission implementation, with
  // tiny in-memory bytes in place of a raster codec or filesystem backend.
  const store=Object.create(AttachmentStore.prototype);
  store.imageLimits={maxImagesPerMessage:8,maxMessageImageBytes:100,maxImageBytes:50,maxImagePixels:100,maxImageDimension:10,mediaTypes:['image/png'],...overrides};
  store.validateImage=async input=>{if(input.data[0]===0)throw Error('bad raster');};
  store.saveImage=async input=>{calls.writes++;return {attachmentId:'new-'+calls.writes,bytes:input.data.length,mediaType:input.mediaType,width:1,height:1};};
  store.readImage=async()=>{calls.reads++;return {ref:oldImage.attachment,data:Buffer.from('old')};};
  store.readFileStream=f.ctx.attachments.readFileStream;
  store.admitPromptContent=async parts=>{calls.batches.push(parts);return AttachmentStore.prototype.admitPromptContent.call(store,parts);};
  f.ctx.attachments=store;return calls;
}
function assertUntouched(f,n) {
  assert.equal(f.session.snapshotEvents().length,n);
  assert.equal(f.agent.inbox.nextTurn.length,0);
}
test('all new images use one ordered host batch and retain interleaved content',async()=>{
  const f=fixture(),calls=hostAttachments(f);
  f.input.content=[image('one'),txt('between'),{type:'file',receiptId:'upload'},image('two')];
  await editCurrent(f.ctx,f.input,signal);
  assert.equal(calls.batches.length,1);assert.equal(calls.batches[0].length,2);assert.equal(calls.writes,2);
  assert.deepEqual(f.agent.inbox.nextTurn[0].content.map(b=>b.type==='text'?b.text:b.attachment.attachmentId),['new-1','between','new-file','new-2']);
});
for (const limits of [{maxImagesPerMessage:1},{maxMessageImageBytes:5}]) {
  test('new image batch obeys host limits '+JSON.stringify(limits),async()=>{
    const f=fixture(),calls=hostAttachments(f,limits),n=f.session.snapshotEvents().length;
    f.input.content=[image('one'),image('two')];
    await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='totalSize');
    assert.equal(calls.writes,0);assertUntouched(f,n);
  });
  test('retained images count towards host limits '+JSON.stringify(limits),async()=>{
    const f=fixture([txt('OLD'),oldImage]),calls=hostAttachments(f,limits),n=f.session.snapshotEvents().length;
    f.input.content=[{type:'original',index:1},image('two')];
    await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='totalSize');
    assert.equal(calls.writes,0);assertUntouched(f,n);
  });
}
for (const limits of [{maxImagesPerMessage:0},{maxImageBytes:2},{maxImagePixels:0},{maxImageDimension:0},{mediaTypes:['image/jpeg']}]) test('retained-only images obey current deployment limits '+JSON.stringify(limits),async()=>{
  const f=fixture([txt('OLD'),oldImage]),calls=hostAttachments(f,limits),n=f.session.snapshotEvents().length;
  f.input.content=[txt('NEW'),{type:'original',index:1}];
  await assert.rejects(editCurrent(f.ctx,f.input,signal));assert.equal(calls.writes,0);assertUntouched(f,n);
});
test('retained images are verified and reused, never admitted or saved again',async()=>{
  const f=fixture([txt('OLD'),oldImage]),calls=hostAttachments(f);
  f.input.content=[image('new'),{type:'original',index:1}];
  await editCurrent(f.ctx,f.input,signal);
  assert.equal(calls.reads,1);assert.equal(calls.writes,1);assert.equal(calls.batches[0].length,1);
  assert.deepEqual(f.agent.inbox.nextTurn[0].content[1],oldImage);
});
for (const [name,last] of [['invalid part',null],['bad receipt',{type:'file',receiptId:'missing'}],['overlong text',txt('x'.repeat(200001))],['noncanonical base64',{...image('a'),data:'YQ'}],['invalid raster',image([0])]]) test(name+' following a valid image does not publish any image',async()=>{
  const f=fixture(),calls=hostAttachments(f),n=f.session.snapshotEvents().length;
  f.input.content=[image('one'),last];
  await assert.rejects(editCurrent(f.ctx,f.input,signal));assert.equal(calls.writes,0);assertUntouched(f,n);
});
test('missing retained attachment is detected before publishing new images',async()=>{
  const f=fixture([txt('OLD'),oldImage]),calls=hostAttachments(f),n=f.session.snapshotEvents().length;
  f.ctx.attachments.readImage=async()=>{throw Error('missing');};f.input.content=[image('one'),{type:'original',index:1}];
  await assert.rejects(editCurrent(f.ctx,f.input,signal));assert.equal(calls.batches.length,0);assertUntouched(f,n);
});
test('normalized image growth cannot exceed final aggregate budget',async()=>{
  const f=fixture(),calls=hostAttachments(f,{maxMessageImageBytes:5}),n=f.session.snapshotEvents().length;
  f.ctx.attachments.saveImage=async()=>({attachmentId:'expanded',bytes:6,mediaType:'image/png',width:1,height:1});f.input.content=[image('one')];
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='totalSize');assert.equal(calls.batches.length,1);assertUntouched(f,n);
});
test('text-only model refuses images before admission',async()=>{
  const f=fixture(),calls=hostAttachments(f),n=f.session.snapshotEvents().length;
  f.ctx.llm.resolveModelInfo=async()=>({inputModalities:['text']});f.input.content=[image('one')];
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='imageModel');assert.equal(calls.batches.length,0);assertUntouched(f,n);
});

// Insert real sourced context events before the answer, rebuilding the event log
// through Session.append rather than trusting frontend decoration properties.
function withContext(f,sources,{gap=false,afterAnswer=false,developer=false}={}) {
  const events=f.session.snapshotEvents(),cut=f.target.seq+1+(afterAnswer?1:0);
  const s=Session.create(f.session.id);
  for(const e of events.slice(0,cut)) s.append(e.type,e.data,e.surfaceOp ? {surfaceOp:e.surfaceOp} : undefined);
  if(gap)s.append('agent/inbox/spliced',{target:'next-turn',start:0,inserted:[]});
  for(const source of sources) {
    if(developer)s.append('developer/message',{turn:2,step:1,message:createDeveloperMessage({content:[txt('context')],source})},{surfaceOp:'append'});
    else s.append('user/message',createUserMessage({content:[txt('context')],source}),{surfaceOp:'append'});
  }
  for(const e of events.slice(cut))s.append(e.type,e.data,e.type==='assistant/message'?{surfaceOp:'append'}:undefined);
  f.session=s;f.agent.session=s;f.input.tail=s.snapshotEvents().length-1;
}
for (const developer of [false,true]) for (const kind of ['skill-invocation','session-reference']) test('server rejects durable '+kind+' association in '+(developer?'developer':'user')+' context',async()=>{
  const f=fixture();withContext(f,[{kind,name:'office',references:[{label:'other-session'}]}],{developer});
  const n=f.session.snapshotEvents().length;
  assert.throws(()=>currentBoundary(f.session,f.input.seq),e=>e.editCode==='unsupported');
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='unsupported');assertUntouched(f,n);
});
test('skill association crosses unrelated context and non-node bookkeeping',()=>{
  const f=fixture();withContext(f,[{kind:'workspace-rules'},{kind:'skill-invocation',name:'office'}],{gap:true});
  assert.throws(()=>currentBoundary(f.session,f.input.seq),e=>e.editCode==='unsupported');
});
test('recall association requires immediate event adjacency',()=>{
  const f=fixture();withContext(f,[{kind:'session-reference',references:[{label:'other'}]}],{gap:true});
  assert.equal(currentBoundary(f.session,f.input.seq).nodes[0],f.input.seq);
});
test('skill injection after assistant boundary does not associate with earlier input',()=>{
  const f=fixture();withContext(f,[{kind:'skill-invocation',name:'office'}],{afterAnswer:true});
  assert.equal(currentBoundary(f.session,f.input.seq).nodes[0],f.input.seq);
});
test('same Session ID, replacement excludes old prompt, old answer and later turns from core deriveMessages',async()=>{
  const f=fixture(), before=structuredClone(f.session.snapshotEvents());
  const result=await editCurrent(f.ctx,f.input,signal);
  assert.equal(result.sessionId,'same-session');assert.equal(result.accepted,true);
  const texts=f.session.deriveMessages().flatMap(m=>m.content.filter(b=>b.type==='text').map(b=>b.text));
  assert.deepEqual(texts,['SYSTEM','KEEP','KEEP-ANSWER',EDIT_NOTICE]);
  assert.equal(f.agent.inbox.nextTurn[0].content[0].text,'NEW');
  assert.deepEqual(f.session.snapshotEvents().slice(0,before.length),before);
  const restored=diskRoundtrip(f.session);
  assert.deepEqual(restored.deriveMessages(),f.session.deriveMessages());
  assert.ok(isHidden(f.target.seq,editRanges(restored.snapshotEvents())));
});
test('attachment-only removal and addition retain unchanged text and validate receipts in same session',async()=>{
  const f=fixture();f.input.content=[txt('OLD'),{type:'file',receiptId:'upload'}];
  await editCurrent(f.ctx,f.input,signal);
  assert.deepEqual(f.agent.inbox.nextTurn[0].content.map(b=>b.type==='text'?b.text:b.attachment.name),['OLD','new.txt']);
});
test('text-only change reuses the authorized old attachment without copying or deleting its file',async()=>{
  const f=fixture();f.input.content.push({type:'original',index:1});
  await editCurrent(f.ctx,f.input,signal);assert.equal(f.agent.inbox.nextTurn[0].content[1].attachment.attachmentId,'old-file');
});
for(const [name,setup,code] of [
  ['busy',f=>{f.agent.status='running';},'running'],
  ['queued',f=>{f.agent.inbox.nextTurn.push({id:'queued'});},'running'],
  ['stale history',f=>{f.input.tail--;},'stale'],
  ['forged attachment',f=>{f.input.content=[{type:'original',index:999}];},'unsupported'],
  ['bad receipt',f=>{f.input.content=[{type:'file',receiptId:'another-session'}];},'fileUpload'],
  ['empty',f=>{f.input.content=[txt(' ')];},'empty'],
]) test(name+' rejects without changing history',async()=>{const f=fixture();setup(f);const n=f.session.snapshotEvents().length;await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode===code);assert.equal(f.session.snapshotEvents().length,n);});
test('attachment validation failure leaves original history model-visible',async()=>{
  const f=fixture();f.input.content.push({type:'original',index:1});f.ctx.attachments.readFileStream=async function*(){throw Error('missing');};
  await assert.rejects(editCurrent(f.ctx,f.input,signal));assert.equal(editRanges(f.session.snapshotEvents()).length,0);assert.equal(f.agent.inbox.nextTurn.length,0);
});
test('same request ID is idempotent even if response was lost',async()=>{
  const f=fixture();await editCurrent(f.ctx,f.input,signal);await editCurrent(f.ctx,f.input,signal);
  assert.equal(editRanges(f.session.snapshotEvents()).length,1);assert.equal(f.agent.inbox.nextTurn.length,1);
});
for (const stage of ['followup','commit','dispose']) test('durable edit reports uncertainty after tagged '+stage+' failure',async()=>{
  const f=fixture(), error=Object.assign(new Error('listener failed'),{editCode:'running'});
  if(stage==='followup') f.agent.followup=()=>{throw error;};
  else f.ctx.fileUploads.bindPrompt=()=>({commit(){if(stage==='commit')throw error;},[Symbol.dispose](){if(stage==='dispose')throw error;}});
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  assert.equal(editRanges(f.session.snapshotEvents()).length,1);
  assert.ok(!f.session.deriveMessages().some(m=>m.content.some(b=>b.text==='OLD')));
});
test('pending committed edit is recovered once when agent is resumed',async()=>{
  const f=fixture();const follow=f.agent.followup;f.agent.followup=()=>{throw Error('interrupted');};
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  f.agent.session=diskRoundtrip(f.session);
  f.agent.followup=follow;recoverCurrent(f.agent);recoverCurrent(f.agent);assert.equal(f.agent.inbox.nextTurn.length,1);
});

for(const newer of ['consumed','queued']) test('interrupted edit is not resurrected after a newer '+newer+' input',async()=>{
  const f=fixture(),follow=f.agent.followup;
  f.agent.followup=()=>{throw Error('interrupted');};
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  f.agent.followup=follow;
  if(newer==='consumed') f.add(3,[txt('NEWER_MANUAL_TASK')],'NEWER_MANUAL_ANSWER');
  else f.session.append('agent/inbox/spliced',{target:'next-turn',start:0,inserted:[createUserMessage({content:[txt('NEWER_QUEUED_TASK')],source:{kind:'user'}})]});
  f.agent.session=diskRoundtrip(f.session);
  recoverCurrent(f.agent);
  assert.equal(f.agent.inbox.nextTurn.length,0);
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='stale');
  assert.equal(f.agent.inbox.nextTurn.length,0);
});

test('retry of committed replacement reports uncertainty if recovery enqueue fails',async()=>{
  const f=fixture();f.agent.followup=()=>{throw Object.assign(new Error('enqueue failed'),{editCode:'running'});};
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  assert.equal(editRanges(f.session.snapshotEvents()).length,1);
});
test('recovery retry rechecks registry identity inside maintenance',async()=>{
  const f=fixture(),follow=f.agent.followup;
  f.agent.followup=()=>{throw Error('enqueue failed');};
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  f.agent.followup=follow; f.ctx.agents.get=()=>undefined;
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='currentUncertain');
  assert.equal(f.agent.inbox.nextTurn.length,0);
});
test('released disk codec rejects a developer replacement outside an open step (regression guard)',()=>{
 const f=fixture(),nodes=f.session.surface.nodes.slice(f.session.surface.nodes.indexOf(f.target.seq));
 f.session.append('developer/message',{turn:2,step:1,message:createDeveloperMessage({content:[],source:{kind:'dsh-inline-edit'}})},
  {surfaceOp:{op:'replace',startSeq:nodes[0],endSeq:nodes.at(-1)},sourceEventSeqs:nodes});
 assert.throws(()=>diskRoundtrip(f.session),/does not match an open turn and step/);
});
test('input arriving during admission is not silently removed',async()=>{
  const f=fixture();f.ctx.llm.resolveModelInfo=async()=>{f.agent.inbox.nextTurn.push({id:'other-client'});return {};};
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='running');assert.equal(editRanges(f.session.snapshotEvents()).length,0);
});
test('concurrent edit cannot claim the same maintenance slot twice',async()=>{
  const f=fixture();const results=await Promise.allSettled([editCurrent(f.ctx,f.input,signal),editCurrent(f.ctx,{...f.input,requestId:randomUUID()},signal)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.agent.inbox.nextTurn.length,1);
});
test('only the latest user message can be edited; repeated edits of its replacement keep the same session',async()=>{
  const f=fixture();
  assert.throws(()=>currentBoundary(f.session,f.keep.seq),e=>e.editCode==='latestOnly');
  await editCurrent(f.ctx,f.input,signal);
  assert.throws(()=>currentBoundary(f.session,f.target.seq),e=>e.editCode==='stale');
  f.agent.inbox.nextTurn=[];const target=f.add(3,[txt('NEW')],'NEW-ANSWER');
  await editCurrent(f.ctx,{...f.input,seq:target.seq,tail:f.session.snapshotEvents().length-1,requestId:randomUUID(),content:[txt('NEWER')]},signal);
  assert.equal(editRanges(f.session.snapshotEvents()).length,2);
  assert.equal(f.session.id,'same-session');
  assert.deepEqual(diskRoundtrip(f.session).deriveMessages(),f.session.deriveMessages());
});
test('server rejects editing an earlier message even when client sends a fresh tail',async()=>{
  const f=fixture();f.add(3,[txt('LATER')],'LATER-ANSWER');f.input.tail=f.session.snapshotEvents().length-1;
  await assert.rejects(editCurrent(f.ctx,f.input,signal),e=>e.editCode==='latestOnly');
  assert.equal(editRanges(f.session.snapshotEvents()).length,0);
});
test('chat view filters complete and mixed groups without modifying native snapshots',()=>{
  const nodes=new Map([['keep',{anchorSeq:2}],['old',{anchorSeq:12.25}],['new',{anchorSeq:30}]]);
  const groups={groupSource:key=>({getSnapshot:()=>({members:[{kind:'node',key:key==='mixed'?'keep':'old'},{kind:'node',key:'old'}]})})};
  const entries=[{kind:'group',key:'old-group'},{kind:'group',key:'mixed'},{kind:'node',key:'new'}];
  assert.deepEqual(filterEntries(entries,nodes,groups,[{start:10,end:20}]),[{kind:'node',key:'keep'},{kind:'node',key:'new'}]);assert.equal(entries.length,3);
});
test('current coordinator submits into original session and never calls fork',async()=>{
  const f=fixture(), calls=[], api={using:async(_,fn)=>fn({getSnapshot:()=>({openState:'open'})}),
    planCurrent:async()=>({tail:12}),uploadFile:async(id)=>{calls.push(id);return{receiptId:'upload'};},
    editCurrent:async input=>{calls.push(input);return{sessionId:input.sourceId};},fork:()=>assert.fail('must not fork')};
  const node={kind:'user',data:{seq:f.target.seq,...f.target.data}};
  await createEditCoordinator(api).save({mode:'current',requestId:randomUUID(),sessionId:'same-session',node,text:'OLD',attachments:[newAttachment(new File(['new'],'new.txt'),'new')]});
  assert.equal(calls[0],'same-session');assert.equal(calls[1].sourceId,'same-session');assert.equal(calls[1].content[0].text,'OLD');
});

test('forks never automatically replay an inherited edit recovery record',async()=>{
 const f=fixture();await editCurrent(f.ctx,f.input,signal);f.agent.inbox.nextTurn=[];
 f.agent.id='another-session';recoverCurrent(f.agent);assert.equal(f.agent.inbox.nextTurn.length,0);
});
for (const target of ['next-turn','next-step']) test(target+' input submitted while running stays excluded after replay; original main input remains eligible',()=>{
 const f=fixture(),s=f.session;
 // Rebuild a real prefix with the last main turn still open.
 const events=s.snapshotEvents().slice(0,-2);
 const open=Session.create('running-session',events);
 const supplement=createUserMessage({content:[txt('SUPPLEMENT')],source:{kind:'user'}});
 open.append('agent/inbox/spliced',{target,start:0,inserted:[supplement]});
 if(target==='next-turn') {open.append('step/end',{turn:2,step:1});open.append('turn/end',{turn:2,reason:{kind:'completed'}});open.append('turn/start',{turn:3});open.append('step/start',{turn:3,step:1});}
 const e=open.append('user/message',supplement,{surfaceOp:'append'});
 const state=messageEligibility(open.snapshotEvents());assert.equal(state.latestSeq,f.target.seq);assert.ok(state.excluded.includes(e.seq));
 assert.throws(()=>currentBoundary(open,e.seq),e=>e.editCode==='supplemental');
 assert.equal(currentBoundary(open,f.target.seq).nodes[0],f.target.seq);
 const replay=diskRoundtrip(open);assert.deepEqual(messageEligibility(replay.snapshotEvents()),state);
});
