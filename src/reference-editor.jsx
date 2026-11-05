import React, {forwardRef,useImperativeHandle,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {createEditor,$getRoot,$getSelection,$isRangeSelection,$createParagraphNode,$createTextNode,$setSelection,$getNodeByKey,$nodesOfType,
  $addUpdateTag,RootNode,HISTORY_MERGE_TAG,HISTORY_PUSH_TAG,HISTORIC_TAG,PASTE_TAG,
  SKIP_SCROLL_INTO_VIEW_TAG,SKIP_SELECTION_FOCUS_TAG} from 'lexical';
import {registerPlainText} from '@lexical/plain-text';
import {createEmptyHistoryState,registerHistory} from '@lexical/history';
import {ReferenceChipNode,$referenceLayout} from './vendor/dsh-reference-node.jsx';

/** Seed trusted, non-overlapping host parser ranges without rewriting their source. */
export function $seedReferenceText(value,references) {
  const root=$getRoot();root.clear();
  let paragraph=$createParagraphNode();root.append(paragraph);
  function append(text) {
    const lines=text.split('\n');
    lines.forEach((line,index)=>{
      if (index) { paragraph=$createParagraphNode();root.append(paragraph); }
      if (line) paragraph.append($createTextNode(line));
    });
  }
  let cursor=0;
  for (const reference of references || []) {
    const {start,end,path,label}=reference;
    if (!Number.isInteger(start)||!Number.isInteger(end)||start<cursor||end<=start||end>value.length||typeof path!=='string'||typeof label!=='string') continue;
    const raw=value.slice(start,end);
    if (raw.includes('\n')) continue;
    append(value.slice(cursor,start));
    paragraph.append(new ReferenceChipNode({source:'reference',ref:raw,label,appearance:'file',clipboardText:raw}));
    cursor=end;
  }
  append(value.slice(cursor));root.selectEnd();
}

// Native ui-conversation 0.2.1-rc.3 DecoratorPortals, MIT (DeepSeek).
function DecoratorPortals({editor}) {
  const [decorators,setDecorators]=useState(()=>editor.getDecorators());
  useLayoutEffect(()=>{
    setDecorators(editor.getDecorators());
    return editor.registerDecoratorListener(setDecorators);
  },[editor]);
  return <>{Object.entries(decorators).map(([key,view])=>{
    const element=editor.getElementByKey(key);
    return element===null ? null : createPortal(view,element,key);
  })}</>;
}

function selectionText() {
  const selection=$getSelection();
  if (!$isRangeSelection(selection)) return null;
  const layout=$referenceLayout(),a=layout.offset(selection.anchor),b=layout.offset(selection.focus);
  return a===null||b===null ? null : {text:layout.text.slice(Math.min(a,b),Math.max(a,b)),selection};
}

function $selectTextOffset(start,end=start) {
  const layout=$referenceLayout(),length=layout.text.length;
  function point(offset) {
    offset=Math.max(0,Math.min(length,offset));
    for(const node of $getRoot().getAllTextNodes()) {
      const from=layout.offset({key:node.getKey(),offset:0,type:'text'});
      if(from!==null&&offset>=from&&offset<=from+node.getTextContentSize())return {key:node.getKey(),offset:offset-from,type:'text'};
    }
    for(const block of $getRoot().getChildren()) {
      const children=block.getChildren?.() || [];
      for(let index=0;index<=children.length;index++) {
        const at=layout.offset({key:block.getKey(),offset:index,type:'element'});
        if(at!==null&&at>=offset)return {key:block.getKey(),offset:index,type:'element'};
      }
    }
    const root=$getRoot();return {key:root.getKey(),offset:root.getChildrenSize(),type:'element'};
  }
  const selection=$getRoot().selectEnd(),anchor=point(start),focus=point(end);
  selection.anchor.set(anchor.key,anchor.offset,anchor.type);selection.focus.set(focus.key,focus.offset,focus.type);
  return selection;
}

function $insertAttachments(items,selection) {
  if(!items.length)return;
  const selected=selection || $getRoot().selectEnd();
  const nodes=items.map(item=>new ReferenceChipNode({source:'attachment',ref:item.key,label:item.name,appearance:'file',clipboardText:''}));
  selected.insertNodes(nodes);nodes.at(-1).selectNext(0,0);
}

export const ReferenceEditor=forwardRef(function ReferenceEditor(props,forwardedRef) {
  const {value,references,attachments=[],disabled,label,maxLength,onChange,onKeyDown,onFiles,onLimit}=props;
  const element=useRef(null),current=useRef(props),emitted=useRef(value),frame=useRef(null);
  // Only parent-supplied trusted File/original attachment objects enter this
  // registry. Keep them for undo/redo until this editor is unmounted.
  const knownAttachments=useRef(new Map()),incomingKeys=useRef(new Set(attachments.map(item=>item.key))),projectedKeys=useRef([]),lastSelection=useRef(null);
  for(const item of attachments)knownAttachments.current.set(item.key,item);
  current.current=props;
  const [editor]=useState(()=>createEditor({namespace:'dsh-inline-edit',nodes:[ReferenceChipNode],onError:error=>{throw error;}}));
  const history=useRef(createEmptyHistoryState());
  useImperativeHandle(forwardedRef,()=>element.current,[]);

  function $rememberSelection() {
    const selection=$getSelection();if($isRangeSelection(selection))lastSelection.current=selection.clone();
  }
  function $restoredSelection() {
    const saved=lastSelection.current;
    if(saved&&$getNodeByKey(saved.anchor.key)&&$getNodeByKey(saved.focus.key)){$setSelection(saved.clone());return $getSelection();}
    return $getRoot().selectEnd();
  }

  function revealCaret() {
    if (frame.current!==null) cancelAnimationFrame(frame.current);
    frame.current=requestAnimationFrame(()=>{
      frame.current=null;
      const host=element.current,selection=host?.ownerDocument.getSelection();
      if (!host||!selection?.isCollapsed||!selection.rangeCount||!host.contains(selection.anchorNode)) return;
      const rect=selection.getRangeAt(0).getBoundingClientRect?.(),box=host.getBoundingClientRect();
      if (!rect||(!rect.height&&!rect.width)) return;
      if (rect.bottom>box.bottom) host.scrollTop+=rect.bottom-box.bottom;
      else if (rect.top<box.top) host.scrollTop-=box.top-rect.top;
    });
  }

  useLayoutEffect(()=>{
    let active=true;
    editor.setRootElement(element.current);
    const plain=registerPlainText(editor);
    const noAncestorScroll=editor.registerNodeTransform(RootNode,()=>{$addUpdateTag(SKIP_SCROLL_INTO_VIEW_TAG);});
    const trustedAttachments=editor.registerNodeTransform(ReferenceChipNode,node=>{
      if(node.getSource()==='attachment'&&!knownAttachments.current.has(node.getReference()))node.remove();
    });
    editor.update(()=>{
      $seedReferenceText(current.current.value,current.current.references);
      const offset=current.current.initialAttachmentOffset;
      $insertAttachments(current.current.attachments || [],Number.isInteger(offset)?$selectTextOffset(offset):$getSelection());
      $rememberSelection();projectedKeys.current=$referenceLayout().attachmentKeys;
    },{
      discrete:true,tag:[HISTORY_MERGE_TAG,SKIP_SCROLL_INTO_VIEW_TAG,SKIP_SELECTION_FOCUS_TAG],
    });
    let validState=editor.getEditorState();
    history.current.current={editor,editorState:validState};
    const undo=registerHistory(editor,history.current,1000);
    let validHistory={...history.current,undoStack:[...history.current.undoStack],redoStack:[...history.current.redoStack]};
    let restoring=false,revision=0;
    function rejectUpdate(version,notify) {
      const state=validState,snapshot=validHistory;
      queueMicrotask(()=>{
        if(!active||version!==revision)return;
        restoring=true;
        editor.setEditorState(state,{tag:HISTORIC_TAG});
        Object.assign(history.current,snapshot,{undoStack:[...snapshot.undoStack],redoStack:[...snapshot.redoStack]});
        restoring=false;notify?.();
      });
    }
    const changed=editor.registerUpdateListener(({editorState})=>{
      const {text,attachmentKeys}=editorState.read(()=>{$rememberSelection();return $referenceLayout();});
      const version=++revision;
      if (!restoring && text.length>current.current.maxLength) {
        // Covers non-cancelable IME/input updates as well as programmatic edits.
        // Restore the last valid editor and history together, without publishing
        // an oversized draft or leaving an invalid undo/redo entry behind.
        rejectUpdate(version,()=>current.current.onLimit?.());
        return;
      }
      if(attachmentKeys.length!==projectedKeys.current.length||attachmentKeys.some((key,index)=>key!==projectedKeys.current[index])) {
        const items=attachmentKeys.map(key=>knownAttachments.current.get(key)).filter(Boolean);
        // A later image/file can exhaust the host's total attachment budget
        // before undo restores a deleted item. Reject both state and history
        // together so the visible chips always match the real submit payload.
        if(current.current.onAttachmentsChange?.(items)===false){rejectUpdate(version);return;}
        projectedKeys.current=attachmentKeys;
      }
      validState=editorState;
      queueMicrotask(()=>{
        if (active&&version===revision) validHistory={...history.current,undoStack:[...history.current.undoStack],redoStack:[...history.current.redoStack]};
      });
      if (text!==emitted.current) { emitted.current=text;current.current.onChange(text); }
      revealCaret();
    });
    // Keep focus in the editor without moving the surrounding conversation.
    Object.defineProperty(element.current,'value',{configurable:true,get:()=>editor.getEditorState().read(()=>$referenceLayout().text)});
    element.current.setSelectionRange=(start,end)=>editor.update(()=>$selectTextOffset(start,end),{discrete:true,tag:SKIP_SCROLL_INTO_VIEW_TAG});
    // Restoring the seeded range after focus also keeps a token at the end
    // immediately followed by an editable caret, without adding whitespace.
    element.current?.focus({preventScroll:true});
    editor.update(()=>$restoredSelection(),{discrete:true,tag:SKIP_SCROLL_INTO_VIEW_TAG});
    return ()=>{
      active=false;changed();undo();trustedAttachments();noAncestorScroll();plain();
      if (frame.current!==null) cancelAnimationFrame(frame.current);
      frame.current=null;editor.setRootElement(null);
    };
  },[editor]);
  useLayoutEffect(()=>{editor.setEditable(!disabled);},[editor,disabled]);
  useLayoutEffect(()=>{
    if (value===emitted.current) return;
    emitted.current=value;
    editor.update(()=>{$seedReferenceText(value,references);$insertAttachments(current.current.attachments || [],$getSelection());$rememberSelection();},{discrete:true,tag:[HISTORY_MERGE_TAG,SKIP_SCROLL_INTO_VIEW_TAG,SKIP_SELECTION_FOCUS_TAG]});
    history.current.undoStack=[];history.current.redoStack=[];
    history.current.current={editor,editorState:editor.getEditorState()};
  },[editor,value,references]);
  useLayoutEffect(()=>{
    const next=new Set(attachments.map(item=>item.key)),previous=incomingKeys.current;
    incomingKeys.current=next;
    const present=editor.getEditorState().read(()=>$referenceLayout().attachmentKeys);
    const added=attachments.filter(item=>!previous.has(item.key)&&!present.includes(item.key));
    const removed=present.filter(key=>previous.has(key)&&!next.has(key));
    if(!added.length&&!removed.length)return;
    editor.update(()=>{
      for(const node of $nodesOfType(ReferenceChipNode))if(node.getSource()==='attachment'&&removed.includes(node.getReference()))node.remove();
      if(added.length)$insertAttachments(added,$restoredSelection());
    },{discrete:true,tag:HISTORY_PUSH_TAG});
  },[editor,attachments]);

  function copy(event,cut=false) {
    const selected=editor.getEditorState().read(selectionText);
    if (!selected||selected.selection.isCollapsed()||!event.clipboardData) return;
    event.preventDefault();event.stopPropagation();
    event.clipboardData.setData('text/plain',selected.text);
    if (cut&&!disabled) editor.update(()=>{
      const selection=$getSelection();if ($isRangeSelection(selection)) selection.removeText();
    },{discrete:true,tag:HISTORY_PUSH_TAG});
  }
  function paste(event) {
    event.preventDefault();event.stopPropagation();
    if (disabled) return;
    if (event.clipboardData.files.length) {onFiles(event.clipboardData.files);return;}
    const text=event.clipboardData.getData('text/plain');
    if (!text) return;
    const length=editor.getEditorState().read(()=>{
      const selected=selectionText();return $referenceLayout().text.length-(selected?.text.length||0)+text.length;
    });
    if (length>maxLength) {onLimit?.();return;}
    editor.update(()=>{
      const selection=$getSelection();
      if ($isRangeSelection(selection)) selection.insertText(text);
      else $getRoot().selectEnd().insertText(text);
    },{discrete:true,tag:PASTE_TAG});
  }
  return <>
    <div ref={element} className="dsh-ie-reference-editor" contentEditable={!disabled} suppressContentEditableWarning
      role="textbox" aria-multiline="true" aria-label={label} aria-disabled={disabled||undefined}
      onKeyDownCapture={onKeyDown} onPasteCapture={paste} onCopyCapture={event=>copy(event)} onCutCapture={event=>copy(event,true)}
      onDragOverCapture={event=>{if (event.dataTransfer.types.includes('Files')) event.preventDefault();}}
      onDropCapture={event=>{if (event.dataTransfer.files.length) {event.preventDefault();event.stopPropagation();if(!disabled)onFiles(event.dataTransfer.files);}}}/>
    <DecoratorPortals editor={editor}/>
  </>;
});
