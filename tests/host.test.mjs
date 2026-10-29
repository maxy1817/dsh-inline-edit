import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reuseOriginalFile,handleReuseRequest,apply,editBoundary} from '../src/index.js';
function fixture() {
 let disposed=0;const calls=[];
 const ref={attachmentId:'hash',name:'old.txt',bytes:3};
 const ctx={agents:{get:()=>({session:{header:{parentSession:'source'},inheritedEventCount:3}})},
 sessionQuery:{observeSession:async()=>({events:[{type:'permission/preset'},{type:'user/message'},{type:'turn/end'},{seq:3,type:'user/message',data:{source:{kind:'user'},content:[{type:'file',attachment:ref}]}}],[Symbol.dispose](){disposed++;}})},
 attachments:{async *readFileStream(r){assert.equal(r,ref);calls.push('read');yield new Uint8Array([1,2,3]);}},
 fileUploads:{uploadStream:async r=>{calls.push(['upload',r.sessionId,r.name]);const data=[];for await(const c of r.data)data.push(...c);assert.deepEqual(data,[1,2,3]);return {receiptId:'child-receipt',file:ref};}}};
 return {ctx,calls,get disposed(){return disposed;}};
}
const input={sourceId:'source',childId:'child',seq:3,index:0};
test('retained file is authorized from source event and streamed to exact child',async()=>{
 const f=fixture();assert.equal((await reuseOriginalFile(f.ctx,input,new AbortController().signal)).receiptId,'child-receipt');assert.equal(f.disposed,1);
});
test('unrelated destination session is refused before reading bytes',async()=>{
 const f=fixture();f.ctx.agents.get=()=>({session:{header:{parentSession:'other'},inheritedEventCount:3}});
 await assert.rejects(reuseOriginalFile(f.ctx,input,new AbortController().signal));assert.deepEqual(f.calls,[]);
});
test('wrong cutoff cannot reuse files outside selected message',async()=>{
 const f=fixture();await assert.rejects(reuseOriginalFile(f.ctx,{...input,seq:4},new AbortController().signal));assert.equal(f.calls.length,0);
});
test('forged attachment index is refused and observation disposed',async()=>{
 const f=fixture();await assert.rejects(reuseOriginalFile(f.ctx,{...input,index:12},new AbortController().signal));assert.equal(f.disposed,1);assert.equal(f.calls.length,0);
});
test('storage integrity failure produces sanitized route error',async()=>{
 const f=fixture();f.ctx.attachments.readFileStream=async function*(){throw Error('C:/private/key');};
 const res=await handleReuseRequest(f.ctx,new Request('http://local/api/dsh-inline-edit/reuse-file',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)}));
 assert.equal(res.status,400);assert.equal((await res.text()).includes('private'),false);assert.equal(f.disposed,1);
});
test('route refuses non-JSON, oversized, invalid JSON and non-POST',async()=>{
 for(const [options,status] of [[{},405],[{method:'POST',body:'x'},415],[{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(4097)},413],[{method:'POST',headers:{'content-type':'application/json'},body:'{'},400]]) {
 const res=await handleReuseRequest(fixture().ctx,new Request('http://local/api/dsh-inline-edit/reuse-file',options));assert.equal(res.status,status);
 }
});
test('host registers only on authenticated native Connection, under plugin lifetime',()=>{
 let route;apply({inject:()=>{},sessionProjections:{register:()=>()=>{}},on:()=>{},effect:fn=>fn(),connection:{fetch:{register:r=>{route=r;return()=>{};}}}});
 assert.equal(route.path,'/api/dsh-inline-edit/reuse-file');assert.deepEqual(route.methods,['POST']);assert.equal(route.requestBody,'streaming');
});
test('first human message cuts before turn and inbox preamble, avoiding empty rounds',()=>{
 const events=['model/selection','agent/inbox/spliced','turn/start','agent/inbox/spliced','step/start','system/message','user/message'].map((type,seq)=>({type,seq,data:{source:{kind:'user'}}}));
 assert.equal(editBoundary(events,6),0);
});
test('editing a later steering message preserves earlier work in same turn',()=>{
 const events=['model/selection','turn/start','user/message','assistant/message','user/message'].map((type,seq)=>({type,seq,data:{source:{kind:'user'}}}));
 assert.equal(editBoundary(events,4),3);
});
