// Adapted from DeepSeek Harness ui-conversation 0.2.1-rc.3, MIT.
// Copyright (c) 2026 DeepSeek. See THIRD_PARTY_NOTICES.md.
// Keep the native atomic ReferenceChipNode contract and one-newline block
// projection. Only presentation uses the public host ReferenceChip, and the
// projection omits composer command/menu bookkeeping this editor does not own.
import React from 'react';
import {DecoratorNode, $getRoot, $isElementNode, $isLineBreakNode, $isTextNode} from 'lexical';
import {ReferenceChip} from '@deepseek-ai/dsh-client-ui-primitives';

export class ReferenceChipNode extends DecoratorNode {
  static getType() { return 'dsh-inline-edit-reference'; }
  static clone(node) {
    return new ReferenceChipNode({source:node.__source,ref:node.__ref,label:node.__label,
      appearance:node.__appearance,clipboardText:node.__clipboardText},node.__invalid,node.__key);
  }
  static importJSON(json) { return new ReferenceChipNode(json,json.invalid); }
  constructor(insert, invalid=false, key) {
    super(key);
    this.__source=insert.source;
    this.__ref=insert.ref;
    this.__label=insert.label;
    this.__appearance=insert.appearance;
    this.__clipboardText=insert.clipboardText;
    this.__invalid=invalid;
  }
  exportJSON() {
    return {...super.exportJSON(),type:ReferenceChipNode.getType(),version:1,
      source:this.__source,ref:this.__ref,label:this.__label,appearance:this.__appearance,
      clipboardText:this.__clipboardText,invalid:this.__invalid};
  }
  createDOM() {
    const element=document.createElement('span');
    element.setAttribute('data-dsh-ie-reference',this.__source);
    element.setAttribute('contenteditable','false');
    return element;
  }
  updateDOM() { return false; }
  isInline() { return true; }
  // Native arrows cross the chip in one move; deletion removes it whole.
  isKeyboardSelectable() { return false; }
  // The display name is never the clipboard or submission representation.
  getTextContent() { return this.__clipboardText; }
  setInvalid(invalid) { this.getWritable().__invalid=invalid; }
  isInvalid() { return this.getLatest().__invalid; }
  getSource() { return this.getLatest().__source; }
  getReference() { return this.getLatest().__ref; }
  getLabel() { return this.getLatest().__label; }
  getAppearance() { return this.getLatest().__appearance; }
  decorate() {
    return <span className="dsh-ie-reference-token">
      <ReferenceChip appearance={this.__appearance || 'file'} label={this.__label} title={this.__clipboardText || this.__label}/>
    </span>;
  }
}

export function $isReferenceChipNode(node) { return node instanceof ReferenceChipNode; }

/** Native clipboard projection: leaf text verbatim, one newline per block gap. */
export function $referenceLayout() {
  let text='';
  const bounds=new Map(), children=new Map(),attachmentKeys=[];
  function walk(element) {
    const start=text.length, kids=element.getChildren();
    children.set(element.getKey(),kids.map(kid=>kid.getKey()));
    for (const kid of kids) {
      const from=text.length;
      if ($isReferenceChipNode(kid)) {
        if (kid.getSource()==='attachment') attachmentKeys.push(kid.getReference());
        else text+=kid.getTextContent();
      } else if ($isTextNode(kid)) text+=kid.getTextContent();
      else if ($isLineBreakNode(kid)) text+='\n';
      else if ($isElementNode(kid)) walk(kid);
      bounds.set(kid.getKey(),{start:from,end:text.length});
    }
    bounds.set(element.getKey(),{start,end:text.length});
  }
  const root=$getRoot(), blocks=root.getChildren();
  children.set(root.getKey(),blocks.map(block=>block.getKey()));
  blocks.forEach((block,index)=>{
    if (index) text+='\n';
    if ($isElementNode(block)) walk(block);
  });
  bounds.set(root.getKey(),{start:0,end:text.length});
  function offset(point) {
    const own=bounds.get(point.key);
    if (!own) return null;
    if (point.type==='text') return Math.min(own.end,own.start+point.offset);
    const child=children.get(point.key)?.[point.offset];
    return child===undefined ? own.end : bounds.get(child)?.start ?? null;
  }
  return {text,offset,attachmentKeys};
}
