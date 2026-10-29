/** Native message editing. Source logs are never mutated. */
export const MAX_TEXT_LENGTH = 200_000;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 128 * 1024 * 1024;
export const MAX_ATTACHMENTS = 32;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
export class EditError extends Error {
  constructor(code, details = {}) { super(code); this.name = 'EditError'; this.code = code; Object.assign(this, details); }
}
export function contentView(data) {
  const text = [], attachments = [], extraBlocks = [];
  for (const block of Array.isArray(data.content) ? data.content : []) {
    if (block?.type === 'text' && typeof block.text === 'string') text.push(block.text);
    else if (block?.type === 'image' && block.attachment) attachments.push({ type: 'image', image: { attachment: block.attachment } });
    else if (block?.type === 'file' && block.attachment) attachments.push({ type: 'file', file: block.attachment });
    else extraBlocks.push(block);
  }
  return { text: text.join(''), attachments, extraBlocks, ...(data.referenceLabels ? { referenceLabels: data.referenceLabels } : {}) };
}
export function originalAttachments(data) {
  return (Array.isArray(data.content) ? data.content : []).flatMap((block, index) => ['file','image'].includes(block?.type) && block.attachment && typeof block.attachment.attachmentId === 'string' && Number.isSafeInteger(block.attachment.bytes) && block.attachment.bytes >= 0 ? [{
    key: 'original:' + index, origin: 'original', type: block.type, index,
    ref: block.attachment, name: block.attachment.name || 'image', size: block.attachment.bytes,
  }] : []);
}
export function newAttachment(file, key) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mediaType = file.type || ({ png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', gif:'image/gif' }[extension]);
  return { key, origin:'new', type: IMAGE_TYPES.has(mediaType) ? 'image' : 'file', file, mediaType, name:file.name || 'attachment', size:file.size };
}
export function draftChanged(data, text, attachments) {
  const original = originalAttachments(data);
  return text !== contentView(data).text || original.length !== attachments.length || attachments.some((a,i) => a.origin !== 'original' || a.index !== original[i]?.index);
}
export function editRestriction(node) {
  if (!['user','steering'].includes(node?.kind) || !Number.isSafeInteger(node.data?.seq) || node.data.seq < 1) return 'unsupported';
  if (!Array.isArray(node.data.content) || !node.data.content.length) return 'unsupported';
  if (node.data.referenceLabels?.length || node.data.skillNames?.length) return 'references';
  for (const block of node.data.content) {
    if (block?.type === 'text' && typeof block.text === 'string') continue;
    if (['image','file'].includes(block?.type) && typeof block.attachment?.attachmentId === 'string'
      && Number.isSafeInteger(block.attachment.bytes) && block.attachment.bytes >= 0) continue;
    return 'unsupported';
  }
  return null;
}
export function sessionRestriction(snapshot) {
  if (!snapshot || snapshot.openState !== 'open' || snapshot.removed) return 'notReady';
  if (snapshot.subagent) return 'subagent';
  if (snapshot.running || snapshot.awaitingFirstTurn || snapshot.pendingSubmissions?.length) return 'running';
  return null;
}
export function validateAttachments(attachments, data) {
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) throw new EditError('attachmentCount');
  let total = 0, images = 0; const keys = new Set();
  for (const item of attachments) {
    if (keys.has(item.key)) throw new EditError('unsupported'); keys.add(item.key);
    if (!['image','file'].includes(item.type) || !Number.isSafeInteger(item.size) || item.size < 0) throw new EditError('unsupported');
    if (item.origin === 'original') {
      const block = data.content[item.index];
      if (block?.type !== item.type || block.attachment?.attachmentId !== item.ref?.attachmentId || block.attachment?.name !== item.ref?.name || block.attachment?.bytes !== item.size) throw new EditError('unsupported');
    } else if (item.origin !== 'new' || item.file?.size !== item.size || typeof item.file.arrayBuffer !== 'function') throw new EditError('unsupported');
    if (item.size > MAX_FILE_BYTES) throw new EditError('fileSize');
    total += item.size; if (item.type === 'image') images += item.size;
  }
  if (total > MAX_TOTAL_BYTES) throw new EditError('totalSize');
  if (images > MAX_IMAGE_BYTES) throw new EditError('imageSize');
}
export function toBase64(bytes) {
  let binary = '';
  for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
async function prepareAttachments(items, source, api, check) {
  const prepared = [];
  for (const item of items) {
    check();
    if (item.type === 'file') { prepared.push(item); continue; }
    const image = item.origin === 'original' ? await api.readImage(source,item.ref.attachmentId) : {
      attachment:{ mediaType:item.mediaType,name:item.name }, data:new Uint8Array(await item.file.arrayBuffer()),
    };
    check();
    if (!(image.data instanceof Uint8Array) || image.data.byteLength !== item.size) throw new EditError('imageRead');
    if (!IMAGE_TYPES.has(image.attachment?.mediaType)) throw new EditError('imageType');
    prepared.push({ type:'image',mediaType:image.attachment.mediaType,data:toBase64(image.data),...(image.attachment.name ? {name:image.attachment.name}:{}) });
  }
  return prepared;
}
/** One click creates one branch and makes at most one prompt attempt. */
export function createEditCoordinator(api) {
  const busy = new Set(), lifetime = new AbortController();
  function check() { if (lifetime.signal.aborted) throw new EditError('disposed'); }
  return {
    dispose() { lifetime.abort(); },
    async save({sessionId,node,text,attachments=originalAttachments(node.data),mode='branch',requestId}) {
      check();
      const restriction = editRestriction(node); if (restriction) throw new EditError(restriction);
      if (typeof text !== 'string' || (!text.trim() && !attachments.length)) throw new EditError('empty');
      if (text.length > MAX_TEXT_LENGTH) throw new EditError('tooLong');
      validateAttachments(attachments,node.data);
      if (!draftChanged(node.data,text,attachments)) throw new EditError('unchanged');
      if (busy.has(sessionId)) throw new EditError('duplicate');
      busy.add(sessionId); let childId, stage='prepare';
      try {
        return await api.using(sessionId,async source => {
          check(); const reason=sessionRestriction(source.getSnapshot()); if (reason) throw new EditError(reason);
          if (mode === 'current') {
            if (node.kind !== 'user') throw new EditError('steeringCurrent');
            const plan=await api.planCurrent(sessionId,node.data.seq,lifetime.signal);
            const content=text ? [{type:'text',text}] : [];
            for (const item of attachments) {
              check();
              if (item.origin==='original') content.push({type:'original',index:item.index});
              else if (item.type==='file') {
                const receipt=await api.uploadFile(sessionId,item.file,lifetime.signal);
                content.push({type:'file',receiptId:receipt.receiptId});
              } else {
                const [image]=await prepareAttachments([item],source,api,check); content.push(image);
              }
            }
            check(); stage='current';
            return await api.editCurrent({sourceId:sessionId,seq:node.data.seq,tail:plan.tail,requestId,content},lifetime.signal);
          }
          const atSeq = api.resolveBoundary ? await api.resolveBoundary(sessionId, node.data.seq, lifetime.signal) : node.data.seq - 1;
          if (!Number.isSafeInteger(atSeq) || atSeq < 0 || atSeq >= node.data.seq) throw new EditError('unsupported');
          const prepared=await prepareAttachments(attachments,source,api,check);
          check(); const latestReason=sessionRestriction(source.getSnapshot()); if (latestReason) throw new EditError(latestReason);
          stage='fork';
          // atSeq is inclusive; seq itself would retain the old prompt.
          childId=await api.fork(sessionId,atSeq);
          check(); stage='open';
          return await api.using(childId,async child => {
            check(); if (sessionRestriction(child.getSnapshot())) throw new EditError('notReady');
            stage='attachments'; const content=text ? [{type:'text',text}] : [];
            for (const item of prepared) {
              check();
              if (item.type==='image') { content.push(item); continue; }
              const receipt=item.origin==='original'
                ? await api.reuseFile({sourceId:sessionId,childId,seq:node.data.seq,index:item.index},lifetime.signal)
                : await api.uploadFile(childId,item.file,lifetime.signal);
              check(); content.push({type:'file',receiptId:receipt.receiptId});
            }
            check(); stage='prompt'; await api.prompt(child,content,lifetime.signal);
            return {childId,sourceId:sessionId,atSeq};
          });
        });
      } catch (error) {
        if (error instanceof EditError) { if (childId) error.childId=childId; error.stage=stage; throw error; }
        throw new EditError(mode==='current' ? (stage==='current'?'currentUncertain':'currentFailed') : childId ? 'branchFailed':'failed',{childId,stage});
      } finally { busy.delete(sessionId); }
    },
  };
}
export function nativeAdapter(ctx) {
  async function post(path, request, signal) {
    const response = await ctx.fileUpload.post({ path, body:new Blob([JSON.stringify(request)],{type:'application/json'}), headers:{'content-type':'application/json'}, signal });
    const result = JSON.parse(response.body);
    if (response.status !== 200 || !result.ok) throw new EditError(result.error ?? 'fileRead');
    return result.value;
  }
  return {
    planCurrent(sourceId,seq,signal) { return post('api/dsh-inline-edit/plan',{sourceId,seq,mode:'current'},signal); },
    editCurrent(request,signal) { return post('api/dsh-inline-edit/current',request,signal); },
    async resolveBoundary(sourceId, seq, signal) {
      try { return (await post('api/dsh-inline-edit/plan', {sourceId,seq}, signal)).atSeq; }
      catch { throw new EditError('failed'); }
    },
    using(id,operation) { return ctx.sessions.using(id,{source:'controllerOperation'},async reference => operation((await reference.ready).session)); },
    fork(sessionId,atSeq) { return ctx.sessions.fork({sessionId,atSeq,increaseTitle:false,allowMigration:false}); },
    async readImage(session,id) { const result=await session.readAttachment(id); if (!result.ok) throw new EditError('imageRead'); return result.value; },
    async uploadFile(childId,file,signal) {
      const result=await ctx.fileUpload.upload(childId,file,file.name || undefined,signal);
      if (!result.ok || !result.value?.receiptId) throw new EditError('fileUpload'); return result.value;
    },
    async reuseFile(request,signal) {
      // DSH rc.3's public FileUploadRuntime.post uses the authenticated desktop/browser carrier.
      const value = await post('api/dsh-inline-edit/reuse-file',request,signal);
      if (!value?.receiptId) throw new EditError('fileRead');
      return value;
    },
    async prompt(session,content,signal) {
      const result=await session.prompt(content,'queue',signal); if (!result.ok) throw new EditError('promptRejected');
    },
  };
}
