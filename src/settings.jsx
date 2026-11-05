import React, {useEffect,useId,useMemo,useState,useSyncExternalStore} from 'react';
import {labels} from './messages.js';
export function useSettings(form,describe) {
  const source=useMemo(()=>({subscribe:fn=>form.subscribe(fn),read:()=>form.getSnapshot()}),[form]);
  const mirror=useMemo(()=>({subscribe:fn=>describe?.subscribe(fn) ?? (()=>{}),read:()=>describe?.getSnapshot() ?? null}),[describe]);
  const state=useSyncExternalStore(source.subscribe,source.read,source.read);
  const mirrored=useSyncExternalStore(mirror.subscribe,mirror.read,mirror.read);
  const issue=state.status==='ready'
    ? ['branch','current'].includes(state.value?.mode) ? null : 'settingsInvalid'
    : state.status==='unavailable' ? 'settingsUnavailable'
    : mirrored?.status==='idle' && mirrored.error ? 'settingsReadFailed'
    : mirrored?.status==='ready' && mirrored.view ? 'settingsInvalid'
    : 'settingsLoading';
  return {...state,issue};
}
export function EditSettings({form,describe}) {
  const state=useSettings(form,describe), [saving,setSaving]=useState(false), [retrying,setRetrying]=useState(false), [status,setStatus]=useState('');
  const t=labels(document.documentElement.lang || navigator.language), id=useId();
  useEffect(()=>{
    // A cached native form does not retry an unsuccessful first describe read.
    // Reopening settings may retry once; further retries are explicit.
    void describe?.ensure().catch(()=>{});
  },[describe]);
  async function retry() {
    if (retrying || !describe) return;
    setRetrying(true);
    try { await describe.ensure(); } catch { /* The mirror retains its read failure. */ }
    finally { setRetrying(false); }
  }
  async function choose(mode) {
    if (saving || !state.writable || state.issue) return;
    setSaving(true); setStatus('');
    try { setStatus(await form.set('mode',mode) ? t.settingSaved : t.settingFailed); }
    catch { setStatus(t.settingFailed); }
    finally { setSaving(false); }
  }
  return <section className="dsh-ie-settings" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{t.settingsTitle}</h2>
    <p className="dsh-ie-settings-intro" id={`${id}-intro`}>{t.settingsIntro}</p>
    <fieldset disabled={saving || !!state.issue || !state.writable} aria-describedby={`${id}-intro`} aria-busy={saving}>
      <legend>{t.modeLabel}</legend>
      {['branch','current'].map(mode=><label key={mode} className="dsh-ie-mode" data-selected={state.value?.mode===mode}>
        <input type="radio" name={`${id}-mode`} value={mode} checked={state.value?.mode===mode} aria-labelledby={`${id}-${mode}-title`} aria-describedby={`${id}-${mode}-description`} onChange={()=>void choose(mode)}/>
        <span className="dsh-ie-mode-body"><span className="dsh-ie-mode-title"><strong id={`${id}-${mode}-title`}>{mode==='branch'?t.branchTitle:t.currentTitle}</strong><span className="dsh-ie-mode-badge">{mode==='branch'?t.branchBadge:t.currentBadge}</span></span><small id={`${id}-${mode}-description`}>{mode==='branch'?t.branchDescription:t.currentDescription}</small></span>
      </label>)}
    </fieldset>
    <p className="dsh-ie-settings-status" role="status" aria-atomic="true" data-error={status===t.settingFailed || !!state.issue && state.issue!=='settingsLoading'}>{saving?t.settingSaving:state.issue ? state.issue==='settingsLoading'?t.settingLoading:t[state.issue] : !state.writable?t.settingReadOnly:status||t.autoSave}</p>
    {describe && (state.issue==='settingsReadFailed' || retrying) && <button type="button" className="dsh-ie-recover" disabled={retrying} onClick={()=>void retry()}>{retrying?t.settingLoading:t.retrySettings}</button>}
    <div className="dsh-ie-settings-note"><h3>{t.notesTitle}</h3><ul><li>{t.latestNote}</li><li>{t.effects}</li><li>{t.historyNote}</li></ul></div>
  </section>;
}
