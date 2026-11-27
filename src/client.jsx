import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ImageLightbox } from '@deepseek-ai/dsh-client-ui-primitives';
import { Tooltip } from './vendor/dsh-tooltip.js';
import tooltipCss from './vendor/dsh-tooltip.css';
import { contentView, originalAttachments, newAttachment, validateAttachments, editRestriction, sessionRestriction, createEditCoordinator, nativeAdapter, MAX_TEXT_LENGTH } from './core.js';
import { labels } from './messages.js';
import {formatMessageClock,formatMessageTimestamp,nextLocalMidnight} from './message-time.js';
import {captureEditScrollAnchor} from './edit-scroll-anchor.js';
import {collectFileReferences} from './file-references.js';
import {ReferenceEditor} from './reference-editor.jsx';
import {EditSettings,useSettings} from './settings.jsx';
import {installHistoryView,installNativeNodeBridge} from './chat-history.jsx';
import {LATEST_PROJECTION} from './history.js';
export {EditSettings,installHistoryView,installNativeNodeBridge};
import css from './style.css';
import { IconCheckOutlineArtwork, IconCloseOutlineArtwork, IconCopyOutlineArtwork, IconEditOutlineArtwork, IconPaperclipOutlineArtwork, IconInfoOutlineArtwork, FileGlyph } from './vendor/dsh-icons.js';

export const name = 'dsh-inline-edit';
export const inject = ['slots', 'sessions', 'uiWorkspace', 'fileUpload','configForms','uiConversation'];

const icons = { check: IconCheckOutlineArtwork, close: IconCloseOutlineArtwork, copy: IconCopyOutlineArtwork, edit: IconEditOutlineArtwork, attach: IconPaperclipOutlineArtwork, info: IconInfoOutlineArtwork };
function Icon({ kind }) {
  const Artwork = icons[kind];
  return <Artwork size={16} strokeWidth={1}/>;
}

function Attachment({ item, loadImage, onRemove, disabled, t }) {
  const [preview, setPreview] = useState(null);
  const [expandedPreview, setExpandedPreview] = useState(null);
  const closePreview = useCallback(() => setExpandedPreview(null), []);
  useEffect(() => {
    let active = true, ownedUrl;
    setPreview(null);
    async function load() {
      if (item.type !== 'image') return;
      try {
        // Original URLs belong to the host's session cache. Only new File URLs
        // are owned (and released) by this attachment card.
        const url = item.origin === 'new'
          ? (ownedUrl = URL.createObjectURL(item.file))
          : await loadImage?.(item.ref);
        if (active && typeof url === 'string' && url) setPreview({ item, loadImage, url });
      } catch { /* Keep the attachment usable when its preview is unavailable. */ }
    }
    void load();
    return () => { active = false; if (ownedUrl) URL.revokeObjectURL(ownedUrl); };
  }, [item, loadImage]);
  const url = preview?.item === item && preview.loadImage === loadImage ? preview.url : null;
  const size = item.size < 1024 ? `${item.size} B` : item.size < 1048576 ? `${(item.size/1024).toFixed(1)} KB` : `${(item.size/1048576).toFixed(1)} MB`;
  const remove = <Tooltip label={t.removeHint} side="bottom" portal maxWidth={280} delayMs={220} disabled={disabled}>
    <button type="button" className="dsh-ie-icon" aria-label={`${t.remove} ${item.name}`} disabled={disabled} onClick={onRemove}><Icon kind="close"/></button>
  </Tooltip>;
  return <li className="dsh-ie-file">
    {url ? <button type="button" className="dsh-ie-image-preview" aria-haspopup="dialog" aria-label={`${t.previewImage}：${item.name}`} onClick={() => setExpandedPreview(preview)}>
      <img src={url} alt={item.name} onError={() => setPreview(current => current === preview ? null : current)}/>
    </button> : <span className="dsh-ie-file-icon"><FileGlyph size={28} muted/></span>}
    <span className="dsh-ie-file-label"><Tooltip label={item.name} side="bottom" portal maxWidth={280} delayMs={220}><span tabIndex={0}>{item.name}</span></Tooltip><small>{size}</small></span>
    {remove}
    {url && expandedPreview === preview && <ImageLightbox src={url} alt={item.name} labels={{dialog:t.imagePreview,close:t.closePreview}} onClose={closePreview}/>}
  </li>;
}

// Store identifiers only, never draft text or attachment data. Unknown outcomes
// remain blocked across component remounts and reloads in this browser tab.
const pendingEdits = new Map();
// Drafts belong to this window, including any newly picked File objects.
const drafts = new Map();
const editListeners = new Map();
let nextAttachmentKey = 0;
function subscribeEdit(key,listener) {
  let listeners=editListeners.get(key);
  if (!listeners) editListeners.set(key,listeners=new Set());
  listeners.add(listener);
  return ()=>{ listeners.delete(listener);if (!listeners.size) editListeners.delete(key); };
}
function pendingKey(sessionId,seq) { return `dsh-inline-edit:pending:${sessionId}:${seq}`; }
function readPending(key) { try { return window.sessionStorage.getItem(key) || pendingEdits.get(key); } catch { return pendingEdits.get(key); } }
function notifyEdit(key) { for (const listener of editListeners.get(key) ?? []) listener(); }
function writePending(key,id) {
  if (id) pendingEdits.set(key,id); else pendingEdits.delete(key);
  try { if (id) window.sessionStorage.setItem(key,id); else window.sessionStorage.removeItem(key); } catch { /* Memory guard remains available. */ }
  notifyEdit(key);
}
function writeDraft(key,draft) {
  if (draft) drafts.set(key,draft); else drafts.delete(key);
  notifyEdit(key);
}
function initialDraft(data,text,mode,references) {
  const attachments = originalAttachments(data);
  const attachmentsByIndex = new Map(attachments.map(item => [item.index,item]));
  const parts = [];
  for (const [index,block] of data.content.entries()) {
    if (block.type === 'text' && block.text) {
      const previous = parts.at(-1);
      if (previous?.type === 'text') previous.text += block.text;
      else parts.push({type:'text',text:block.text});
    }
    const item = attachmentsByIndex.get(index);
    if (item) parts.push({type:'attachment',key:item.key});
  }
  return {text,attachments,parts,mode,rich:attachments.length > 0 || references.length > 0};
}
// The native content slot groups all attachments apart from the text. Give it
// consecutive groups of one kind to keep the stored order visible.
function orderedContentViews(data,view) {
  if (!view.text || !view.attachments.length || view.extraBlocks.length || view.referenceLabels?.length || data.skillNames?.length) return [view];
  const groups = [];
  let group = [];
  for (const block of data.content) {
    const isText=block.type==='text';
    if (isText && !block.text) continue;
    if (group.length && isText !== (group[0].type==='text')) {
      groups.push(group);
      group = [];
    }
    group.push(block);
  }
  return [...groups,group].map(content => contentView({...data,content}));
}
function useCalendarDay() {
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{
    let timer;
    const schedule=()=>{
      const current=Date.now();
      timer=setTimeout(()=>{setNow(Date.now());schedule();},Math.max(1,nextLocalMidnight(current)-current));
    };
    schedule();
    return ()=>clearTimeout(timer);
  },[]);
  return now;
}
export function EditableMessage({ node, sessionId, useSession, renderFactorySlot, loadImage, coordinator, openSession,mode='branch',latestSeq,supplemental=false,settingsReady=true,settingsIssue,evaluateUserText }) {
  const data = node.data;
  const view = useMemo(() => contentView(data), [data]);
  const contentViews = useMemo(() => orderedContentViews(data,view), [data,view]);
  const hasCopyText = !!view.text.trim();
  const snapshot = useSession((state) => state);
  const language = document.documentElement.lang || navigator.language;
  const calendarDay = useCalendarDay();
  const t = labels(language);
  const pending=pendingKey(sessionId,data.seq);
  const subscribe=useCallback(listener=>subscribeEdit(pending,listener),[pending]);
  const readDraft=useCallback(()=>drafts.get(pending) ?? null,[pending]);
  const readRequest=useCallback(()=>readPending(pending) ?? null,[pending]);
  const draftState=useSyncExternalStore(subscribe,readDraft,readDraft);
  const pendingRequest=useSyncExternalStore(subscribe,readRequest,readRequest);
  const [editing, setEditing] = useState(false);
  const {text:draft='',attachments=[],parts=[],rich:referenceEditing=false}=draftState ?? {};
  const supplementalMessage=supplemental || node.kind==='steering';
  const olderMain=node.kind==='user' && !supplementalMessage && latestSeq>data.seq;
  const preferredMode=draftState?.mode ?? mode;
  const branchEntry=olderMain && (mode==='current' || preferredMode==='current');
  const activeMode=editing ? preferredMode : branchEntry ? 'branch' : preferredMode;
  const modeHint=activeMode==='current'?t.currentTitle:t.branchMode;
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [openedChild, setOpenedChild] = useState(null);
  const recoverId=draftState?.recoverId ?? openedChild;
  const saving=editing && !!draftState?.submitting;
  const uncertain=!!pendingRequest && !saving;
  const editor = useRef(null), picker = useRef(null), pencil = useRef(null), mounted = useRef(true), copyTimer = useRef();
  const initialAttachmentOffset = useRef(null);
  const section = useRef(null), scrollAnchor = useRef(null);
  const restriction = (uncertain?'currentUncertain':null) ?? (!settingsReady?settingsIssue ?? 'settingsLoading':null) ?? editRestriction(node) ?? sessionRestriction(snapshot)
    ?? (!editing && draftState?.submitting ? 'duplicate' : null)
    ?? (activeMode==='current' && supplementalMessage ? 'supplemental' : null)
    ?? (activeMode==='current' && latestSeq!==data.seq ? latestSeq==null?'notReady':'latestOnly' : null);
  const facts = useMemo(() => ({ ...(data.referenceLabels ? { sessionLabels: data.referenceLabels } : {}), ...(data.skillNames ? { skillNames: data.skillNames } : {}) }), [data.referenceLabels, data.skillNames]);
  const references = useMemo(() => referenceEditing ? collectFileReferences(draft,evaluateUserText,facts) : [], [referenceEditing,draft,evaluateUserText,facts]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(copyTimer.current); scrollAnchor.current?.dispose(); scrollAnchor.current=null; };
  }, []);
  useEffect(() => {
    if (!pendingRequest) setError(previous=>previous===t.currentUncertain?null:previous);
  }, [pendingRequest,t.currentUncertain]);
  useLayoutEffect(() => {
    if (!editing || !editor.current) return;
    const area = editor.current;
    const resize = () => { area.style.height = 'auto'; area.style.height = `${Math.min(360, Math.max(62, area.scrollHeight))}px`; };
    resize();
    // Reference labels mount through React portals after the editor's first
    // layout. Size their final content once without shifting the conversation.
    const frame = referenceEditing ? requestAnimationFrame(() => {
      if (!area.isConnected) return;
      const anchor = captureEditScrollAnchor(section.current);
      resize(); anchor.restore();
    }) : null;
    let lastWidth = area.clientWidth;
    const observer = new ResizeObserver(() => { if (area.clientWidth !== lastWidth) { lastWidth = area.clientWidth; resize(); } });
    observer.observe(area);
    return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
  }, [editing, draft, referenceEditing]);
  // Restore only after the textarea has reached its final height for this render.
  useLayoutEffect(() => {
    scrollAnchor.current?.restore();
    scrollAnchor.current=null;
  });
  useEffect(() => {
    if (editing && editor.current) {
      editor.current.focus({preventScroll:true});
      if (editor.current.tagName === 'TEXTAREA') editor.current.setSelectionRange(editor.current.value.length, editor.current.value.length);
    }
  }, [editing]);

  function anchorLayoutChange() {
    scrollAnchor.current ??= captureEditScrollAnchor(section.current);
  }
  function updateDraft(changes) {
    const current=readDraft();
    if (current) writeDraft(pending,{...current,...changes});
  }
  function cancel(restoreFocus = true) {
    if (readDraft()?.submitting) return;
    anchorLayoutChange();
    writeDraft(pending,null);
    setError(uncertain?t.currentUncertain:null); setOpenedChild(null); setEditing(false);
    if (restoreFocus) requestAnimationFrame(() => pencil.current?.focus({preventScroll:true}));
  }
  function beginEdit() {
    if (restriction || readDraft()?.submitting) return;
    anchorLayoutChange();
    const existing=readDraft();
    const next=existing ? {...existing,mode:activeMode} : initialDraft(data,view.text,activeMode,collectFileReferences(view.text,evaluateUserText,facts));
    initialAttachmentOffset.current=null;
    writeDraft(pending,next);
    setOpenedChild(null); setError(null); setEditing(true);
  }
  async function save() {
    const current=readDraft();
    if (!current || current.submitting || current.recoverId || recoverId || uncertain) return;
    if (restriction) { setError(t[restriction]); return; }
    if (!current.text.trim() && !current.attachments.length) { setError(t.empty); return; }
    const requestId=crypto.randomUUID();
    const submission={...current,submitting:true};
    writeDraft(pending,submission);
    if (activeMode==='current') writePending(pending,requestId);
    setError(null);
    let result;
    try {
      result=await coordinator.save({sessionId,node,text:current.text,attachments:current.attachments,parts:current.parts,mode:activeMode,requestId});
    } catch (failure) {
      if (readDraft()===submission) writeDraft(pending,{...current,recoverId:failure.childId});
      if (failure.code!=='currentUncertain') writePending(pending,null);
      if (mounted.current) setError(t[failure.code] ?? (activeMode==='current'?t.currentFailed:t.failed));
      return;
    }
    if (readDraft()===submission) writeDraft(pending,null);
    writePending(pending,null);
    if (!mounted.current) return;
    setEditing(false);
    if (!result.childId) return;
    // A successful submission clears the draft even if navigation fails.
    setOpenedChild(result.childId);
    try { await openSession(result.childId); }
    catch { if (mounted.current) setError(t.branchFailed); return; }
    if (mounted.current) setError(t.returned);
  }
  function addFiles(files) {
    const current=readDraft();
    if (!current || current.submitting || recoverId || uncertain || !files.length) return;
    const added=Array.from(files,file=>newAttachment(file,`new:${++nextAttachmentKey}`));
    const next=[...current.attachments,...added];
    try {
      validateAttachments(next, data);
      anchorLayoutChange();
      if (current.rich) updateDraft({attachments:next});
      else {
        const offset=editor.current?.selectionStart ?? current.text.length;
        initialAttachmentOffset.current=offset;
        const before=current.text.slice(0,offset),after=current.text.slice(offset);
        const ordered=added.map(item=>({type:'attachment',key:item.key}));
        if (before) ordered.unshift({type:'text',text:before});
        if (after) ordered.push({type:'text',text:after});
        updateDraft({attachments:next,parts:ordered,rich:true});
      }
      setError(null);
    }
    catch (failure) { setError(t[failure.code] ?? t.failed); }
  }
  function changeAttachments(items) {
    const current=readDraft();
    if (!current || current.submitting || recoverId || uncertain) return false;
    try { validateAttachments(items,data); updateDraft({attachments:items}); return true; }
    catch (failure) { setError(t[failure.code] ?? t.failed); return false; }
  }
  function changeLayout(_keys,ordered) {
    const current=readDraft();
    if (!current || current.submitting || uncertain) return;
    anchorLayoutChange();
    const text=ordered.filter(part=>part.type==='text').map(part=>part.text).join('');
    updateDraft({text,parts:ordered});
    if (!recoverId) setError(null);
  }
  function changeDraft(text) { changeLayout([],text ? [{type:'text',text}] : []); }
  function removeImage(key) {
    const current=readDraft();
    if (!current || current.submitting || recoverId || uncertain) return;
    anchorLayoutChange();
    updateDraft({attachments:current.attachments.filter(item=>item.key!==key),parts:current.parts.filter(part=>part.key!==key)});
    setError(null);
  }
  function editorKeyDown(event) {
    // A Chinese IME's candidate-confirming Enter must never send/cancel.
    if (event.nativeEvent.isComposing || event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(true); }
    else if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      event.preventDefault(); event.stopPropagation();
      // Holding Enter must not retry a send after a fast failure.
      if (!event.repeat) void save();
    }
  }
  async function copy() {
    if (!hasCopyText) return;
    try {
      await navigator.clipboard.writeText(view.text);
      if (!mounted.current) return;
      setCopied(true); clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => { if (mounted.current) setCopied(false); }, 1600);
    } catch { if (mounted.current) setError(t.copyFailed); }
  }
  const clock = formatMessageClock(data.time,language,calendarDay);
  const fullClock = formatMessageTimestamp(data.time,language);
  return <section ref={section} className="dsh-ie" data-dsh-inline-edit="" data-editing={editing || undefined} aria-busy={saving}>
    {editing ? <div className="dsh-ie-editor" onDragOver={event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); }}
      onDrop={event => { if (event.dataTransfer.files.length) { event.preventDefault(); addFiles(event.dataTransfer.files); } }}>
      {attachments.some(item => item.type === 'image') && <ul className="dsh-ie-files" aria-label={t.attachments}>{attachments.filter(item => item.type === 'image').map(item =>
        <Attachment key={item.key} item={item} loadImage={loadImage} t={t} disabled={saving || !!recoverId || uncertain} onRemove={() => removeImage(item.key)}/>
      )}</ul>}
      {referenceEditing ? <ReferenceEditor ref={editor} label={t.label} value={draft} references={references}
        attachments={attachments} onAttachmentsChange={changeAttachments} onAttachmentLayout={changeLayout} initialParts={parts}
        initialAttachmentOffset={initialAttachmentOffset.current}
        disabled={saving || uncertain} maxLength={MAX_TEXT_LENGTH}
        onKeyDown={editorKeyDown} onFiles={addFiles} onLimit={() => setError(t.tooLong)}/>
      : <textarea ref={editor} aria-label={t.label} value={draft} disabled={saving || uncertain} maxLength={MAX_TEXT_LENGTH}
        onChange={(event) => changeDraft(event.target.value)}
        onPaste={event => { if (event.clipboardData.files.length) { event.preventDefault(); addFiles(event.clipboardData.files); } }}
        onKeyDown={editorKeyDown}/>}
      {restriction && <div className="dsh-ie-error" role="status">{t[restriction]}</div>}
      <input ref={picker} type="file" multiple className="dsh-ie-picker" aria-label={t.addFiles} disabled={saving || !!recoverId || uncertain}
        onChange={event => { addFiles(event.target.files); event.target.value = ''; }}/>
      <div className="dsh-ie-footer"><div className="dsh-ie-tools">
        <Tooltip label={t.addHint} side="bottom" portal maxWidth={280} delayMs={220} disabled={saving || !!recoverId || uncertain}>
          <button type="button" className="dsh-ie-icon" aria-label={t.addFiles} disabled={saving || !!recoverId || uncertain} onClick={() => picker.current?.click()}><Icon kind="attach"/></button>
        </Tooltip>
        <Tooltip label={modeHint} side="bottom" portal maxWidth={280} delayMs={220} openOnClick>
          <button type="button" className="dsh-ie-info" aria-label={modeHint}><Icon kind="info"/></button>
        </Tooltip>
      </div><div className="dsh-ie-buttons">
        <button type="button" className="dsh-ie-cancel" disabled={saving} onClick={event => cancel(event.detail === 0)}>{t.cancel}</button>
        <button type="button" className="dsh-ie-save" disabled={saving || !!restriction || !!recoverId || uncertain || (!draft.trim() && !attachments.length)} onClick={() => void save()}>{saving ? t.saving : t.save}</button>
      </div></div>
    </div> : <>
      {contentViews.map((content,index)=><React.Fragment key={index}>
        {renderFactorySlot('conversation.chat.user.content', {content,loadImage,facts,interactive:true})}
      </React.Fragment>)}
      <div className="dsh-ie-actions">
        {clock && <Tooltip label={fullClock} side="bottom" portal maxWidth={280} delayMs={220}>
          <time className="dsh-ie-time" tabIndex={0} aria-label={fullClock} dateTime={new Date(data.time).toISOString()}
            onClick={event => { if (event.detail > 0) event.currentTarget.blur(); }}>{clock}</time>
        </Tooltip>}
        {hasCopyText && <Tooltip label={copied ? t.copied : t.copyHint} side="bottom" portal maxWidth={280} delayMs={220}>
          <button type="button" className="dsh-ie-icon" aria-label={copied ? t.copied : t.copy} onClick={event => { void copy(); if (event.detail > 0) event.currentTarget.blur(); }}><Icon kind={copied ? 'check' : 'copy'}/></button>
        </Tooltip>}
        {!(mode==='current' && supplementalMessage) && <Tooltip label={restriction ? t[restriction] : branchEntry ? t.editInBranch : t.editHint} side="bottom" align={restriction ? 'end' : 'center'} portal maxWidth={280} delayMs={220}>
          <button type="button" ref={pencil} className="dsh-ie-icon" aria-label={branchEntry ? t.editInBranch : t.edit} aria-disabled={!!restriction} aria-description={restriction ? t[restriction] : undefined}
            onClick={beginEdit}><Icon kind="edit"/></button>
        </Tooltip>
        }
      </div>
    </>}
    {(error || uncertain) && <div className="dsh-ie-error" role="status">{error || t.currentUncertain}</div>}
    {uncertain && <button type="button" className="dsh-ie-recover" onClick={()=>{
      if (!window.confirm(t.confirmChecked)) return;
      writePending(pending,null);setError(null);setEditing(false);
    }}>{t.checkedOutcome}</button>}
    {recoverId && <button type="button" className="dsh-ie-recover" onClick={() => Promise.resolve(openSession(recoverId)).catch(() => setError(t.branchFailed))}>{t.recover}</button>}
  </section>;
}

export function apply(ctx) {
  const coordinator = createEditCoordinator(nativeAdapter(ctx));
  const form=ctx.configForms.get('dsh-inline-edit');
  const describe=ctx.configForms.describe();
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.dshInlineEditStyle = ''; style.textContent = css + tooltipCss; document.head.append(style);
    return () => { coordinator.dispose(); drafts.clear(); style.remove(); };
  });
  function Message(props) {
    const state=useSettings(form,describe);
    const evaluateUserText=useMemo(()=>ctx.uiConversation?.userText?.createEvaluator?.(),[]);
    const latest=ctx.sessions.binding(props.sessionId).session.projections.faceOf(LATEST_PROJECTION);
    const eligibility=useSyncExternalStore(latest.subscribe,latest.getSnapshot);
    return <EditableMessage key={`${props.sessionId}:${props.node.data.seq}`} {...props} evaluateUserText={evaluateUserText} settingsReady={!state.issue} settingsIssue={state.issue} latestSeq={eligibility?.latestSeq} supplemental={eligibility?.excluded.includes(props.node.data.seq)} mode={state.value?.mode==='current'?'current':'branch'} coordinator={coordinator} openSession={(id) => ctx.uiWorkspace.openSession(id)}/>;
  }
  for (const key of ['user', 'steering']) {
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
      name: 'conversation.chat.node', key, priority: -10, locale: 'chat',
    }, Message));
  }
  ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'dsh-inline-edit',order:55,
    label:()=>labels(document.documentElement.lang||navigator.language).settingsTitle},()=> <EditSettings form={form} describe={describe}/>));
  installNativeNodeBridge(ctx);
  installHistoryView(ctx);
}
