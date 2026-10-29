import React, {useId,useMemo,useState,useSyncExternalStore} from 'react';
import {labels} from './messages.js';
export function useSettings(form) {
  const source=useMemo(()=>({subscribe:fn=>form.subscribe(fn),read:()=>form.getSnapshot()}),[form]);
  return useSyncExternalStore(source.subscribe,source.read,source.read);
}
export function EditSettings({form}) {
  const state=useSettings(form), [saving,setSaving]=useState(false), [status,setStatus]=useState('');
  const t=labels(document.documentElement.lang || navigator.language), id=useId();
  async function choose(mode) {
    if (saving || !state.writable || state.status!=='ready') return;
    setSaving(true); setStatus('');
    try { setStatus(await form.set('mode',mode) ? t.settingSaved : t.settingFailed); }
    catch { setStatus(t.settingFailed); }
    finally { setSaving(false); }
  }
  return <section className="dsh-ie-settings" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{t.settingsTitle}</h2>
    <p className="dsh-ie-settings-intro" id={`${id}-intro`}>{t.settingsIntro}</p>
    <fieldset disabled={saving || state.status!=='ready' || !state.writable} aria-describedby={`${id}-intro`} aria-busy={saving}>
      <legend>{t.modeLabel}</legend>
      {['branch','current'].map(mode=><label key={mode} className="dsh-ie-mode" data-selected={state.value?.mode===mode}>
        <input type="radio" name={`${id}-mode`} value={mode} checked={state.value?.mode===mode} aria-labelledby={`${id}-${mode}-title`} aria-describedby={`${id}-${mode}-description`} onChange={()=>void choose(mode)}/>
        <span className="dsh-ie-mode-body"><span className="dsh-ie-mode-title"><strong id={`${id}-${mode}-title`}>{mode==='branch'?t.branchTitle:t.currentTitle}</strong><span className="dsh-ie-mode-badge">{mode==='branch'?t.branchBadge:t.currentBadge}</span></span><small id={`${id}-${mode}-description`}>{mode==='branch'?t.branchDescription:t.currentDescription}</small></span>
      </label>)}
    </fieldset>
    <p className="dsh-ie-settings-status" role="status" aria-atomic="true" data-error={status===t.settingFailed}>{saving?t.settingSaving:state.status!=='ready'?t.settingLoading:!state.writable?t.settingReadOnly:status||t.autoSave}</p>
    <div className="dsh-ie-settings-note"><h3>{t.notesTitle}</h3><ul><li>{t.latestNote}</li><li>{t.effects}</li><li>{t.historyNote}</li></ul></div>
  </section>;
}
