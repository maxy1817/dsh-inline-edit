/** Host half: DSH's authenticated Connection, never a separate listener. */
import z from '@deepseek-ai/schemastery';
import { z as schema } from 'zod';
import { planCurrent, editCurrent, recoverCurrent } from './current.js';
import { EDIT_PROJECTION, LATEST_PROJECTION, foldEdits,foldEligibility,initialEligibility,replacementChain } from './history.js';
export const name = 'dsh-inline-edit';
export const inject = ['connection','sessionQuery','agents','attachments','fileUploads','sessionController','sessionProjections','llm'];
export const Config = z.object({mode:z.union(['branch','current']).default('branch').volatile()});
const MAX_FILE_BYTES = 64 * 1024 * 1024;
export function editBoundary(events, seq) {
  const target = events[seq];
  if (target?.seq !== seq || target.type !== 'user/message' || target.data.source?.kind !== 'user') throw new Error('invalid-message');
  const chain=replacementChain(events,seq);
  if (chain.length) {
    let cut=Math.min(...chain.map(e=>e.data.source.cutoff));
    // Fork before the original admission; otherwise the fork can inherit its
    // pending queue or recovery metadata even though its body is excluded.
    while (cut>=0 && events[cut].type==='agent/inbox/spliced') cut--;
    if (cut>=0) return cut;
  }
  // The first human message follows turn/start, step/start and generated context.
  // Cutting at seq-1 would leave an empty completed turn on every edit.
  for (let i = seq - 1; i >= 0; i--) {
    if (['user/message', 'assistant/message', 'tool/result', 'turn/end'].includes(events[i].type)) break;
    if (events[i].type === 'turn/start') {
      let cut = i - 1;
      while (cut >= 0 && events[cut].type === 'agent/inbox/spliced') cut--;
      if (cut >= 0) return cut;
      break;
    }
  }
  return seq - 1;
}
export async function planEdit(ctx, input) {
  if (!input || typeof input.sourceId !== 'string' || !Number.isSafeInteger(input.seq) || input.seq < 1) throw new Error('invalid-request');
  if (input.mode === 'current') return planCurrent(ctx,input);
  const observed = await ctx.sessionQuery.observeSession(input.sourceId);
  try { return { atSeq: editBoundary(observed.events, input.seq) }; }
  finally { observed[Symbol.dispose](); }
}
export async function reuseOriginalFile(ctx,input,signal) {
  if (!input || typeof input.sourceId!=='string' || typeof input.childId!=='string'
    || !Number.isSafeInteger(input.seq) || input.seq<1 || !Number.isSafeInteger(input.index) || input.index<0) throw new Error('invalid-request');
  const child=ctx.agents.get(input.childId);
  if (!child || child.session.header.parentSession!==input.sourceId
    || child.session.header.origin==='subagent') throw new Error('invalid-branch');
  const observed=await ctx.sessionQuery.observeSession(input.sourceId);
  try {
    const event=observed.events[input.seq], block=event?.data?.content?.[input.index];
    if (child.session.inheritedEventCount !== editBoundary(observed.events, input.seq) + 1) throw new Error('invalid-branch');
    if (event?.seq!==input.seq || event.type!=='user/message' || event.data.source?.kind!=='user'
      || block?.type!=='file' || !block.attachment || block.attachment.bytes>MAX_FILE_BYTES) throw new Error('invalid-attachment');
    signal.throwIfAborted();
    return await ctx.fileUploads.uploadStream({sessionId:input.childId,
      data:ctx.attachments.readFileStream(block.attachment,signal),name:block.attachment.name,signal});
  } finally { observed[Symbol.dispose](); }
}
export async function handleReuseRequest(ctx,request,operation=reuseOriginalFile,limit=4096) {
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
  if (request.method!=='POST') return reply(405,{ok:false});
  if (request.headers.get('content-type')?.split(';')[0].trim()!=='application/json') return reply(415,{ok:false});
  try {
    const reader=request.body?.getReader(); if (!reader) return reply(400,{ok:false});
    let size=0; const chunks=[];
    try {
      while (true) {
        const {done,value}=await reader.read(); if (done) break;
        size+=value.byteLength;
        if (size>limit) { await reader.cancel(); return reply(413,{ok:false}); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return reply(200,{ok:true,value:await operation(ctx,input,request.signal)});
  } catch(error) { return reply(400,{ok:false,error:error.editCode ?? 'file-reuse-failed'}); }
}
export function apply(ctx) {
  ctx.on('agent/created',({agent})=>recoverCurrent(agent));
  ctx.inject(['settings'],child=>child.effect(()=>child.settings.configure({auto:false},ctx.fiber)));
  const ranges=schema.array(schema.object({start:schema.number().int().nonnegative(),end:schema.number().int().nonnegative()}));
  ctx.effect(()=>ctx.sessionProjections.register({key:EDIT_PROJECTION,stateVersion:1,stateSchema:ranges,
    init:()=>[],apply:foldEdits,wire:{viewSchema:ranges,view:state=>state}}));
  const seq=schema.number().int().nonnegative();
  const latest=schema.object({latestSeq:seq.nullable(),excluded:schema.array(seq)});
  const eligibility=schema.object({openTurn:seq.nullable(),seenUser:schema.boolean(),admissions:schema.record(schema.string(),schema.boolean()),view:latest});
  ctx.effect(()=>ctx.sessionProjections.register({key:LATEST_PROJECTION,stateVersion:2,stateSchema:eligibility,init:initialEligibility,
    apply:foldEligibility,wire:{viewSchema:latest,view:state=>state.view}}));
  ctx.effect(()=>ctx.connection.fetch.register({path:'/api/dsh-inline-edit/current',methods:['POST'],
    requestBody:'streaming',fetch:request=>handleReuseRequest(ctx,request,editCurrent,30*1024*1024)}));
  ctx.effect(()=>ctx.connection.fetch.register({path:'/api/dsh-inline-edit/plan',methods:['POST'],
    requestBody:'streaming',fetch:request=>handleReuseRequest(ctx,request,planEdit)}));
  ctx.effect(()=>ctx.connection.fetch.register({path:'/api/dsh-inline-edit/reuse-file',methods:['POST'],
    requestBody:'streaming',fetch:request=>handleReuseRequest(ctx,request)}));
}
