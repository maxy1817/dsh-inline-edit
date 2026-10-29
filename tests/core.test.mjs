import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildForkSeed } from '@deepseek-ai/dsh-session/fork';
import { createEditCoordinator, originalAttachments, newAttachment, nativeAdapter, editRestriction } from '../src/core.js';
const ready=()=>({openState:'open',running:false,pendingSubmissions:[]});
const text={type:'text',text:'原始问题'};
const file={type:'file',attachment:{attachmentId:'abc',name:'old.txt',bytes:3}};
const image={type:'image',attachment:{attachmentId:'img',name:'old.png',mediaType:'image/png',bytes:3}};
function fixture(content=[text]) {
 const node={kind:'user',data:{seq:3,time:1,content}};
 const events=[{seq:0,time:1,type:'session/start',data:{}},{seq:1,time:1,type:'user/message',data:{content:[{type:'text',text:'earlier'}]}},{seq:2,time:1,type:'turn/end',data:{}},{seq:3,time:1,type:'user/message',data:{content}},{seq:4,time:1,type:'assistant/message',data:{content:'old answer'}}];
 const before=structuredClone(events), calls=[]; let seeded;
 const api={
  using:async(id,fn)=>fn({id,getSnapshot:ready}),
  fork:async(id,seq)=>{calls.push(['fork',id,seq]); seeded=buildForkSeed(events,seq);return 'child';},
  readImage:async(s,id)=>{calls.push(['image',id]);return {attachment:image.attachment,data:new Uint8Array([1,2,3])};},
  uploadFile:async(id,f)=>{calls.push(['upload',id,f.name]);return {receiptId:'new-receipt'};},
  reuseFile:async r=>{calls.push(['reuse',r]);return {receiptId:'old-receipt'};},
  prompt:async(s,c)=>{calls.push(['prompt',s.id,c]);},
 };
 return {node,events,before,api,calls,get seeded(){return seeded;},save(args){return createEditCoordinator(api).save({sessionId:'source',node,text:'新问题',...args});}};
}
test('text edit forks at seq-1 with real DSH fork builder, retains history, source immutable',async()=>{
 const f=fixture();await f.save();
 assert.deepEqual(f.calls[0],['fork','source',2]);
 assert.deepEqual(f.seeded.slice(0,3),f.events.slice(0,3));
 assert.equal(f.seeded.some(e=>e.type==='user/message'&&e.seq===3),false);
 assert.deepEqual(f.events,f.before);assert.equal(f.calls.filter(x=>x[0]==='prompt').length,1);
});
test('text-only edit preserves original file and image',async()=>{
 const f=fixture([file,text,image]);await f.save();
 const parts=f.calls.find(x=>x[0]==='prompt')[2];
 assert.deepEqual(parts,[{type:'text',text:'新问题'},{type:'file',receiptId:'old-receipt'},{type:'image',name:'old.png',mediaType:'image/png',data:'AQID'}]);
});
test('attachment-only remove sends unchanged text and never reads removed bytes',async()=>{
 const f=fixture([text,file,image]);await f.save({text:text.text,attachments:[]});
 assert.deepEqual(f.calls.map(x=>x[0]),['fork','prompt']);
 assert.deepEqual(f.calls[1][2],[text]);
});
test('attachment-only replacement uploads to child, retained attachment reauthorized',async()=>{
 const f=fixture([text,file,image]);
 const attachments=[originalAttachments(f.node.data)[1],newAttachment(new File(['new'],'new.txt'),'new:1')];
 await f.save({text:text.text,attachments});
 const parts=f.calls.find(x=>x[0]==='prompt')[2];
 assert.equal(parts[0].text,text.text);assert.equal(parts.at(-1).receiptId,'new-receipt');
 assert.deepEqual(f.calls.find(x=>x[0]==='upload'),['upload','child','new.txt']);
 assert.equal(f.calls.some(x=>x[0]==='reuse'),false);
});
test('new files and images can be added without modifying text',async()=>{
 const f=fixture();await f.save({text:text.text,attachments:[
 newAttachment(new File(['abc'],'new.txt'),'new:1'),newAttachment(new File([new Uint8Array([1,2,3])],'new.png',{type:'image/png'}),'new:2')]});
 const parts=f.calls.find(x=>x[0]==='prompt')[2];assert.equal(parts.length,3);assert.equal(parts[2].data,'AQID');
});
test('attachment-only message with empty text is accepted',async()=>{
 const f=fixture([file]);await f.save({text:'',attachments:[newAttachment(new File(['x'],'x.txt'),'new:1')]});
 assert.deepEqual(f.calls.find(x=>x[0]==='prompt')[2],[{type:'file',receiptId:'new-receipt'}]);
});
for (const [label,args,code] of [['unchanged',{text:text.text},'unchanged'],['empty',{text:' ',attachments:[]},'empty'],['oversize text',{text:'x'.repeat(200001)},'tooLong']]) {
 test(label+' is rejected before mutating host',async()=>{const f=fixture();await assert.rejects(f.save(args),{code});assert.equal(f.calls.length,0);});
}
test('running source is rejected before fork',async()=>{
 const f=fixture();f.api.using=async(_,fn)=>fn({getSnapshot:()=>({...ready(),running:true})});
 await assert.rejects(f.save(),{code:'running'});assert.equal(f.calls.length,0);
});
test('double send makes at most one fork/prompt',async()=>{
 const f=fixture(), coordinator=createEditCoordinator(f.api);let release;
 f.api.fork=()=>new Promise(r=>{release=r;});
 const first=coordinator.save({sessionId:'source',node:f.node,text:'a'});
 await Promise.resolve();await Promise.resolve();
 await assert.rejects(coordinator.save({sessionId:'source',node:f.node,text:'b'}),{code:'duplicate'});
 release('child');await first;assert.equal(f.calls.filter(x=>x[0]==='prompt').length,1);
});
test('image read failure does not create branch',async()=>{
 const f=fixture([text,image]);f.api.readImage=async()=>{throw Error('secret/path');};
 await assert.rejects(f.save(),e=>e.code==='failed'&&!e.message.includes('secret'));assert.equal(f.calls.length,0);
});
test('file upload failure retains child recovery identity without sending prompt',async()=>{
 const f=fixture();f.api.uploadFile=async()=>{throw Error('transport');};
 await assert.rejects(f.save({attachments:[newAttachment(new File(['x'],'x.txt'),'new:1')]}),e=>e.childId==='child'&&e.stage==='attachments');
 assert.equal(f.calls.some(x=>x[0]==='prompt'),false);
});
test('ambiguous prompt error is attempted once, with child recovery',async()=>{
 const f=fixture();let count=0;f.api.prompt=async()=>{count++;throw Error('connection');};
 await assert.rejects(f.save(),e=>e.childId==='child'&&e.stage==='prompt');assert.equal(count,1);
});
test('plugin disposal between fork and prompt prevents prompt',async()=>{
 const f=fixture(),c=createEditCoordinator(f.api);f.api.fork=async()=>{c.dispose();return 'child';};
 await assert.rejects(c.save({sessionId:'source',node:f.node,text:'a'}),{code:'disposed',childId:'child'});
 assert.equal(f.calls.some(x=>x[0]==='prompt'),false);
});
test('skills and references are explicitly refused, never silently omitted',()=>{
 const f=fixture();assert.equal(editRestriction({...f.node,data:{...f.node.data,skillNames:['test']}}),'references');
});
test('native adapter uses authenticated carriers and forwards signal',async()=>{
 const calls=[],session={prompt:async(...a)=>{calls.push(a);return {ok:true,value:{accepted:true}};}};
 const ctx={sessions:{using:async(id,opts,fn)=>fn({ready:Promise.resolve({session})}),fork:async request=>{calls.push(request);return 'c';}},
 fileUpload:{upload:async(...a)=>{calls.push(a);return {ok:true,value:{receiptId:'r'}};},
 post:async r=>{calls.push([r.path,JSON.parse(await r.body.text())]);return {status:200,body:'{"ok":true,"value":{"receiptId":"old"}}'};} }};
 const api=nativeAdapter(ctx),signal=new AbortController().signal;
 await api.fork('s',2);assert.equal(calls[0].atSeq,2);
 await api.using('c',s=>api.prompt(s,[text],signal));assert.equal(calls[1][1],'queue');assert.equal(calls[1][2],signal);
 await api.reuseFile({sourceId:'s',childId:'c',seq:3,index:0},signal);
 assert.equal(calls[2][0],'api/dsh-inline-edit/reuse-file');
});
