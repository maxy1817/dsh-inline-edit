import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planEdit,apply,handleReuseRequest} from '../src/index.js';
import {nativeAdapter,createEditCoordinator} from '../src/core.js';
const events=[{seq:0,type:'session/start'},{seq:1,type:'turn/start'},{seq:2,type:'step/start'},{seq:3,type:'user/message',data:{source:{kind:'user'},content:[{type:'text',text:'old'}]}}];
function host(){let disposed=0;return {ctx:{sessionQuery:{observeSession:async()=>({events,[Symbol.dispose](){disposed++;}})}},get disposed(){return disposed;}};}
test('planEdit returns boundary before turn preamble and always disposes observation',async()=>{
 const h=host();assert.deepEqual(await planEdit(h.ctx,{sourceId:'s',seq:3}),{atSeq:0});assert.equal(h.disposed,1);
 await assert.rejects(planEdit(h.ctx,{sourceId:'s',seq:2}));assert.equal(h.disposed,2);
});
test('both authenticated routes register with lifetime disposal',()=>{
 const routes=[],disposers=[];apply({inject:()=>{},sessionProjections:{register:()=>()=>{}},on:()=>{},effect:f=>disposers.push(f()),connection:{fetch:{register:r=>{routes.push(r);return ()=>{};}}}});
 assert.deepEqual(routes.map(r=>r.path),['/api/dsh-inline-edit/current','/api/dsh-inline-edit/plan','/api/dsh-inline-edit/reuse-file']);assert.ok(disposers.every(f=>typeof f==='function'));
});
test('native adapter to host plan to coordinator uses planned boundary, not seq minus one',async()=>{
 const h=host(),calls=[],signal=new AbortController().signal;
 const adapter=nativeAdapter({fileUpload:{post:async r=>{
  assert.equal(r.path,'api/dsh-inline-edit/plan');
  const response=await handleReuseRequest(h.ctx,new Request('http://localhost/'+r.path,{method:'POST',headers:r.headers,body:r.body,signal:r.signal}),planEdit);
  return {status:response.status,body:await response.text()};
 }}});
 assert.equal(await adapter.resolveBoundary('s',3,signal),0);
 const api={resolveBoundary:adapter.resolveBoundary,using:async(id,fn)=>fn({getSnapshot:()=>({openState:'open',running:false,pendingSubmissions:[]})}),fork:async(id,seq)=>{calls.push(['fork',id,seq]);return 'child';},prompt:async()=>calls.push(['prompt'])};
 await createEditCoordinator(api).save({sessionId:'s',node:{kind:'user',data:events[3].data?{...events[3].data,seq:3}:null},text:'new',attachments:[]});
 assert.deepEqual(calls,[['fork','s',0],['prompt']]);assert.equal(h.disposed,2);
});
