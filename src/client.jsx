import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Tooltip } from './vendor/dsh-tooltip.js';
import tooltipCss from './vendor/dsh-tooltip.css';
import { contentView, originalAttachments, newAttachment, draftChanged, validateAttachments, editRestriction, sessionRestriction, createEditCoordinator, nativeAdapter, MAX_TEXT_LENGTH } from './core.js';
import { labels } from './messages.js';
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

function Attachment({ item, onRemove, disabled, t }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (item.type !== 'image' || item.origin !== 'new') return;
    const next = URL.createObjectURL(item.file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [item]);
  const size = item.size < 1024 ? `${item.size} B` : item.size < 1048576 ? `${(item.size/1024).toFixed(1)} KB` : `${(item.size/1048576).toFixed(1)} MB`;
  return <li className="dsh-ie-file">
    {url ? <img src={url} alt=""/> : <span className="dsh-ie-file-icon"><FileGlyph size={28} muted/></span>}
    <span className="dsh-ie-file-label"><Tooltip label={item.name} side="bottom" portal maxWidth={280} delayMs={220}><span tabIndex={0}>{item.name}</span></Tooltip><small>{size}</small></span>
    <Tooltip label={t.removeHint} side="bottom" portal maxWidth={280} delayMs={220} disabled={disabled}>
      <button type="button" className="dsh-ie-icon" aria-label={`${t.remove} ${item.name}`} disabled={disabled} onClick={onRemove}><Icon kind="close"/></button>
    </Tooltip>
  </li>;
}

// Store identifiers only, never draft text or attachment data. Unknown outcomes
// remain blocked across component remounts and reloads in this browser tab.
const pendingEdits = new Map();
const pendingListeners = new Map();
function subscribePending(key,listener) {
  let listeners=pendingListeners.get(key);
  if (!listeners) pendingListeners.set(key,listeners=new Set());
  listeners.add(listener);
  return ()=>{ listeners.delete(listener);if (!listeners.size) pendingListeners.delete(key); };
}
function pendingKey(sessionId,seq) { return `dsh-inline-edit:pending:${sessionId}:${seq}`; }
function readPending(key) { try { return window.sessionStorage.getItem(key) || pendingEdits.get(key); } catch { return pendingEdits.get(key); } }
function writePending(key,id) {
  if (id) pendingEdits.set(key,id); else pendingEdits.delete(key);
  try { if (id) window.sessionStorage.setItem(key,id); else window.sessionStorage.removeItem(key); } catch { /* Memory guard remains available. */ }
  for (const listener of pendingListeners.get(key) ?? []) listener();
}
export function EditableMessage({ node, sessionId, useSession, renderFactorySlot, loadImage, coordinator, openSession,mode='branch',latestSeq,supplemental=false,settingsReady=true }) {
  const data = node.data;
  const view = useMemo(() => contentView(data), [data]);
  const snapshot = useSession((state) => state);
  const language = document.documentElement.lang || navigator.language;
  const t = labels(language);
  const [editing, setEditing] = useState(false);
  const [draftMode,setDraftMode]=useState(mode);
  const activeMode=editing ? draftMode : mode;
  const modeHint=activeMode==='current'?t.currentTitle:t.branchMode;
  const pending=pendingKey(sessionId,data.seq);
  const [draft, setDraft] = useState(view.text);
  const [attachments, setAttachments] = useState(() => originalAttachments(data));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recoverId, setRecoverId] = useState(null);
  const pendingSource=useMemo(()=>({subscribe:listener=>subscribePending(pending,listener),read:()=>readPending(pending) ?? null}),[pending]);
  const pendingRequest=useSyncExternalStore(pendingSource.subscribe,pendingSource.read,pendingSource.read);
  const uncertain=!!pendingRequest && !saving;
  const editor = useRef(null), picker = useRef(null), pencil = useRef(null), nextKey = useRef(0), mounted = useRef(true), inFlight = useRef(false), copyTimer = useRef();
  const requestId=useRef(null);
  const changed = draftChanged(data, draft, attachments);
  const restriction = (uncertain?'currentUncertain':null) ?? (!settingsReady?'notReady':null) ?? editRestriction(node) ?? sessionRestriction(snapshot)
    ?? (activeMode==='current' && (supplemental || node.kind==='steering') ? 'supplemental' : null)
    ?? (activeMode==='current' && latestSeq!==data.seq ? latestSeq==null?'notReady':'latestOnly' : null);
  const facts = useMemo(() => ({ ...(data.referenceLabels ? { sessionLabels: data.referenceLabels } : {}), ...(data.skillNames ? { skillNames: data.skillNames } : {}) }), [data.referenceLabels, data.skillNames]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(copyTimer.current); };
  }, []);
  useEffect(() => {
    if (!editing) setDraft(view.text);
  }, [view.text, editing]);
  useEffect(() => {
    if (!pendingRequest) setError(previous=>previous===t.currentUncertain?null:previous);
  }, [pendingRequest,t.currentUncertain]);
  useLayoutEffect(() => {
    if (!editing || !editor.current) return;
    const area = editor.current;
    const resize = () => { area.style.height = 'auto'; area.style.height = `${Math.min(360, Math.max(62, area.scrollHeight))}px`; };
    resize();
    let lastWidth = area.clientWidth;
    const observer = new ResizeObserver(() => { if (area.clientWidth !== lastWidth) { lastWidth = area.clientWidth; resize(); } });
    observer.observe(area);
    return () => observer.disconnect();
  }, [editing, draft]);
  useEffect(() => {
    if (editing && editor.current) { editor.current.focus(); editor.current.setSelectionRange(editor.current.value.length, editor.current.value.length); }
  }, [editing]);

  function cancel() {
    if (inFlight.current) return;
    setDraft(view.text); setAttachments(originalAttachments(data)); setError(uncertain?t.currentUncertain:null); setRecoverId(null); setEditing(false);
    if (!uncertain) requestId.current=null;
    requestAnimationFrame(() => pencil.current?.focus());
  }
  function beginEdit() {
    if (restriction) return;
    setRecoverId(null); setError(null); setDraft(view.text);
    setAttachments(originalAttachments(data)); setDraftMode(mode); setEditing(true);
  }
  async function save() {
    if (inFlight.current || recoverId || uncertain) return;
    if (restriction) { setError(t[restriction]); return; }
    if (!draft.trim() && !attachments.length) { setError(t.empty); return; }
    if (!changed) return;
    inFlight.current = true; setSaving(true); setError(null);
    try {
      requestId.current ??= crypto.randomUUID();
      if (activeMode==='current') writePending(pending,requestId.current);
      const result = await coordinator.save({ sessionId, node, text: draft, attachments,mode:activeMode,requestId:requestId.current });
      writePending(pending,null);
      if (!mounted.current) return;
      // Keep a recovery link even if native navigation itself fails.
      if (result.childId) { setRecoverId(result.childId); await openSession(result.childId); }
      if (mounted.current) { setEditing(false); setError(result.childId?t.returned:null); }
    } catch (failure) {
      if (failure.code!=='currentUncertain') writePending(pending,null);
      if (mounted.current) {
        if (failure.childId) setRecoverId(failure.childId);
        setError(t[failure.code] ?? (activeMode==='current'?t.currentFailed:t.failed));
        if (failure.code==='currentUncertain') writePending(pending,requestId.current);
        if (failure.code!=='currentUncertain') requestId.current=null;
      }
    } finally { inFlight.current = false; if (mounted.current) setSaving(false); }
  }
  function addFiles(files) {
    if (inFlight.current || recoverId || uncertain) return;
    const next = [...attachments, ...Array.from(files).map(file => newAttachment(file, `new:${++nextKey.current}`))];
    try { validateAttachments(next, data); setAttachments(next); setError(null); }
    catch (failure) { setError(t[failure.code] ?? t.failed); }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(view.text);
      if (!mounted.current) return;
      setCopied(true); clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => { if (mounted.current) setCopied(false); }, 1600);
    } catch { if (mounted.current) setError(t.copyFailed); }
  }
  const clock = Number.isFinite(data.time) ? new Intl.DateTimeFormat(language || 'zh-CN', { hour: '2-digit', minute: '2-digit' }).format(data.time) : '';
  return <section className="dsh-ie" data-dsh-inline-edit="" data-editing={editing || undefined} aria-busy={saving}>
    {editing ? <div className="dsh-ie-editor" onDragOver={event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); }}
      onDrop={event => { if (event.dataTransfer.files.length) { event.preventDefault(); addFiles(event.dataTransfer.files); } }}>
      {attachments.length > 0 && <ul className="dsh-ie-files" aria-label={t.attachments}>{attachments.map(item =>
        <Attachment key={item.key} item={item} t={t} disabled={saving || !!recoverId || uncertain} onRemove={() => { setAttachments(previous => previous.filter(file => file.key !== item.key)); setError(null); }}/>
      )}</ul>}
      <textarea ref={editor} aria-label={t.label} value={draft} disabled={saving || uncertain} maxLength={MAX_TEXT_LENGTH}
        onChange={(event) => { setDraft(event.target.value); setError(null); }}
        onPaste={event => { if (event.clipboardData.files.length) { event.preventDefault(); addFiles(event.clipboardData.files); } }}
        onKeyDown={(event) => {
          // A Chinese IME's candidate-confirming Enter must never send/cancel.
          if (event.nativeEvent.isComposing || event.isComposing || event.keyCode === 229) return;
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); }
          else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.stopPropagation(); void save(); }
        }}/>
      {restriction && <div className="dsh-ie-error" role="status">{t[restriction]}</div>}
      <input ref={picker} type="file" multiple className="dsh-ie-picker" aria-label={t.addFiles} disabled={saving || !!recoverId || uncertain}
        onChange={event => { addFiles(event.target.files); event.target.value = ''; }}/>
      <div className="dsh-ie-footer"><div className="dsh-ie-tools">
        <Tooltip label={t.addHint} side="bottom" portal maxWidth={280} delayMs={220} disabled={saving || !!recoverId || uncertain}>
          <button type="button" className="dsh-ie-icon" aria-label={t.addFiles} disabled={saving || !!recoverId || uncertain} onClick={() => picker.current?.click()}><Icon kind="attach"/></button>
        </Tooltip>
        <Tooltip label={modeHint} side="bottom" gap={6} portal maxWidth={280} delayMs={220} openOnClick>
          <button type="button" className="dsh-ie-info" aria-label={modeHint}><Icon kind="info"/></button>
        </Tooltip>
      </div><div className="dsh-ie-buttons">
        <button type="button" className="dsh-ie-cancel" disabled={saving} onClick={cancel}>{t.cancel}</button>
        <button type="button" className="dsh-ie-save" disabled={saving || !!restriction || !!recoverId || uncertain || (!draft.trim() && !attachments.length) || !changed} onClick={() => void save()}>{saving ? t.saving : t.save}</button>
      </div></div>
    </div> : <>
      {renderFactorySlot('conversation.chat.user.content', { content: view, loadImage, facts, interactive: true })}
      <div className="dsh-ie-actions">
        {clock && <time className="dsh-ie-time" dateTime={new Date(data.time).toISOString()}>{clock}</time>}
        <Tooltip label={copied ? t.copied : t.copy} side="left" portal maxWidth={280} delayMs={220}>
          <button type="button" className="dsh-ie-icon" aria-label={copied ? t.copied : t.copy} onClick={() => void copy()}><Icon kind={copied ? 'check' : 'copy'}/></button>
        </Tooltip>
        {!(activeMode==='current' && (supplemental || node.kind==='steering')) && <Tooltip label={restriction ? t[restriction] : t.edit} side="left" portal maxWidth={280} delayMs={220}>
          <button type="button" ref={pencil} className="dsh-ie-icon" aria-label={t.edit} aria-disabled={!!restriction} aria-description={restriction ? t[restriction] : undefined}
            onClick={beginEdit}><Icon kind="edit"/></button>
        </Tooltip>
        }
      </div>
    </>}
    {(error || uncertain) && <div className="dsh-ie-error" role="status">{error || t.currentUncertain}</div>}
    {uncertain && <button type="button" className="dsh-ie-recover" onClick={()=>{
      if (!window.confirm(t.confirmChecked)) return;
      writePending(pending,null);requestId.current=null;setError(null);setEditing(false);
    }}>{t.checkedOutcome}</button>}
    {recoverId && <button type="button" className="dsh-ie-recover" onClick={() => Promise.resolve(openSession(recoverId)).catch(() => setError(t.branchFailed))}>{t.recover}</button>}
  </section>;
}

export function apply(ctx) {
  const coordinator = createEditCoordinator(nativeAdapter(ctx));
  const form=ctx.configForms.get('dsh-inline-edit');
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.dshInlineEditStyle = ''; style.textContent = css + tooltipCss; document.head.append(style);
    return () => { coordinator.dispose(); style.remove(); };
  });
  function Message(props) {
    const state=useSettings(form);
    const latest=ctx.sessions.binding(props.sessionId).session.projections.faceOf(LATEST_PROJECTION);
    const eligibility=useSyncExternalStore(latest.subscribe,latest.getSnapshot);
    return <EditableMessage key={`${props.sessionId}:${props.node.data.seq}`} {...props} settingsReady={state.status==='ready'} latestSeq={eligibility?.latestSeq} supplemental={eligibility?.excluded.includes(props.node.data.seq)} mode={state.value?.mode==='current'?'current':'branch'} coordinator={coordinator} openSession={(id) => ctx.uiWorkspace.openSession(id)}/>;
  }
  for (const key of ['user', 'steering']) {
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
      name: 'conversation.chat.node', key, priority: -10, locale: 'chat',
    }, Message));
  }
  ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'dsh-inline-edit',order:55,
    label:()=>labels(document.documentElement.lang||navigator.language).settingsTitle},()=> <EditSettings form={form}/>));
  installNativeNodeBridge(ctx);
  installHistoryView(ctx);
}
