import React, {useSyncExternalStore} from 'react';
import {EDIT_PROJECTION,filterEntries} from './history.js';
const EMPTY=[];
/** Delegate to native Flow and native node components through an owned child
 * slot. Native child-slot ownership is exclusive, so it cannot be redeclared.
 * This is a scoped public-slot bridge, not DOM hiding or a registry mutation. */
export function installHistoryView(ctx) {
  return ctx.slots.inject('conversation.chat.flow',()=>{
    let disposeFlow, original;
    function adopt() {
      const entry=ctx.slots.entries('conversation.chat.flow').find(e=>e.children?.['conversation.chat.node']);
      if (!entry || original===entry) return;
      disposeFlow?.(); original=entry;
      const Original=entry.component;
      function HistoryFlow(props) {
        const session=ctx.sessions.binding(props.sessionId).session;
        const projection=session.projections.faceOf(EDIT_PROJECTION);
        const ranges=useSyncExternalStore(projection.subscribe,projection.getSnapshot) ?? EMPTY;
        const chat=props.useChat(s=>s);
        const conversation=ctx.uiConversation.binding(props.sessionId).snapshot;
        const snap=useSyncExternalStore(conversation.subscribe,conversation.getSnapshot);
        const entries=filterEntries(props.entries,chat.nodes,snap.views.grouped('chat'),ranges);
        return <Original {...props} entries={entries}
          renderSlot={(key,owner,options)=>props.renderSlot(key==='conversation.chat.node'?'dsh-inline-edit.node':key,owner,options)}/>;
      }
      disposeFlow=ctx.slots.register({name:'conversation.chat.flow',priority:-10,
        locale:entry.locale,store:entry.store,inject:entry.inject,
        children:{'dsh-inline-edit.node':entry.children['conversation.chat.node']},
      },HistoryFlow);
    }
    const unsub=ctx.slots.subscribe('conversation.chat.flow',adopt);
    adopt();
    return ()=>{unsub();disposeFlow?.();};
  });
}
/** Mirror only the public render contract, recursively giving native child
 * slots a plugin-owned address. Native factories and domain hooks stay native.
 * Nothing is registered into, removed from, or rewritten on the source tree. */
export function installNativeNodeBridge(ctx) {
  function mirror(source,target) {
    const copies=new Map();
    function sync() {
      const entries=ctx.slots.entries(source);
      for (const [entry,dispose] of copies) if (!entries.includes(entry)) { copies.delete(entry);dispose(); }
      for (const entry of entries) {
        if (copies.has(entry)) continue;
        const names=Object.fromEntries(Object.keys(entry.children??{}).map(key=>[key,'dsh-inline-edit.bridge.'+key]));
        const children=Object.fromEntries(Object.entries(entry.children??{}).map(([key,spec])=>[names[key],spec]));
        const Original=entry.component;
        function Bridged(props) {
          return <Original {...props}
            renderSlot={(key,...args)=>props.renderSlot(names[key]??key,...args)}
            renderSlotChain={(key,...args)=>props.renderSlotChain(names[key]??key,...args)}/>;
        }
        const dispose=ctx.slots.register({name:target,...entry.options,
          locale:entry.locale,store:entry.store,inject:entry.inject,select:entry.select,children},Bridged);
        const descendants=Object.keys(names).map(key=>mirror(key,names[key]));
        copies.set(entry,()=>{descendants.forEach(f=>f());dispose();});
      }
    }
    const unsub=ctx.slots.subscribe(source,sync);sync();
    return ()=>{unsub();for(const dispose of copies.values())dispose();copies.clear();};
  }
  return ctx.slots.inject('dsh-inline-edit.node',()=>mirror('conversation.chat.node','dsh-inline-edit.node'));
}
