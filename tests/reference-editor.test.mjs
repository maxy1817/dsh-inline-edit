import {test,after,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {loadNativeTooltip} from './helpers/native-primitives.mjs';

// Bundle the actual editor and its Lexical helpers together. A second Lexical
// instance cannot inspect or edit this editor's state, and a textarea mock would
// miss decorator, selection, history and plain-text command integration failures.
const dom=new JSDOM('<!doctype html><html lang="zh-CN"><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','navigator','Node','HTMLElement','HTMLTextAreaElement','Event','KeyboardEvent','InputEvent','CompositionEvent','MutationObserver','Text','DocumentFragment'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.ResizeObserver=class {observe(){}disconnect(){}};
// jsdom has no layout engine. Supply only missing Range geometry; scrolling
// and visual layout remain browser acceptance work, not assertions here.
dom.window.Range.prototype.getBoundingClientRect=()=>new dom.window.DOMRect();
dom.window.Range.prototype.getClientRects=()=>[];
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');
const {act}=React;
const {createRoot}=await import('react-dom/client');
const require=createRequire(import.meta.url);
const nativePrimitives=await loadNativeTooltip(require);
const built=await build({
  stdin:{contents:`export {EditableMessage} from './src/client.jsx';
    export {ReferenceEditor} from './src/reference-editor.jsx';
    export {$referenceLayout} from './src/vendor/dsh-reference-node.jsx';
    export {$getRoot,$createRangeSelection,$setSelection,$createTextNode,
      CONTROLLED_TEXT_INSERTION_COMMAND,DELETE_CHARACTER_COMMAND,UNDO_COMMAND,REDO_COMMAND,HISTORY_PUSH_TAG} from 'lexical';`,
    resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'js'},
  bundle:true,write:false,format:'cjs',platform:'browser',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},loader:{'.css':'text'},
  external:['react','react-dom','react/jsx-runtime','@deepseek-ai/dsh-client-ui-primitives'],logLevel:'silent',
});
const module={exports:{}};
vm.runInThisContext(`(function(require,module,exports){${built.outputFiles[0].text}\n})`)(id=>id==='@deepseek-ai/dsh-client-ui-primitives'?nativePrimitives:require(id),module,module.exports);
const api=module.exports;
const rawA=String.raw`@"C:\工作\有 空格.txt"`,rawB='@C:/资料/报告.md';
const original=`\n  开头😀 ${rawA} 中间 ${rawB}\n\n末尾 \t\n`;
const retained={attachmentId:'original',name:'old.txt',bytes:4};
function evaluator({text}){
  return [rawA,rawB].flatMap(raw=>{
    const nodes=[];let offset=0,index;
    while((index=text.indexOf(raw,offset))>=0){nodes.push({id:'file',start:index,end:index+raw.length,data:{path:raw.slice(1),label:raw===rawA?'有 空格.txt':'报告.md'}});offset=index+raw.length;}
    return nodes;
  }).sort((a,b)=>a.start-b.start);
}
function references(text){return evaluator({text}).map(({start,end,data})=>({start,end,...data}));}
function button(name){return [...document.querySelectorAll('button')].find(el=>(el.getAttribute('aria-label')||el.textContent)===name);}
function area(){return document.querySelector('.dsh-ie-reference-editor');}
function lexical(){const editor=area()?.__lexicalEditor;assert.ok(editor,'the mounted textbox must own a real Lexical editor');return editor;}
function projection(editor=lexical()){return editor.getEditorState().read(()=>api.$referenceLayout().text);}
let root;
async function unmount(){if(root){await act(async()=>root.unmount());root=null;}}
async function click(name){assert.ok(button(name),name);await act(async()=>button(name).click());}
async function edit(update,editor=lexical()){await act(async()=>editor.update(update,{discrete:true,tag:api.HISTORY_PUSH_TAG}));}
async function command(command,payload,editor=lexical()){await act(async()=>editor.dispatchCommand(command,payload));}
async function atText(text,offset){await edit(()=>{const node=api.$getRoot().getAllTextNodes().find(node=>node.getTextContent()===text);assert.ok(node,`text node ${JSON.stringify(text)}`);node.select(offset,offset);});}
async function input(text){await command(api.CONTROLLED_TEXT_INSERTION_COMMAND,text);}
async function removeFile(name){
  await edit(()=>{
    let found;
    function walk(node){if(node.getSource?.()==='attachment'&&node.getLabel()===name)found=node;for(const child of node.getChildren?.() || [])walk(child);}
    walk(api.$getRoot());assert.ok(found,`inline attachment ${name}`);found.selectNext(0,0);
  });
  await command(api.DELETE_CHARACTER_COMMAND,true);
}
async function dispatch(type,data={},target=area()){
  const event=new Event(type,{bubbles:true,cancelable:true});
  for(const [name,value] of Object.entries(data))Object.defineProperty(event,name,{value,configurable:true});
  await act(async()=>target.dispatchEvent(event));return event;
}
async function key(options){const event=new KeyboardEvent('keydown',{bubbles:true,cancelable:true,...options});await act(async()=>area().dispatchEvent(event));return event;}
async function mountMessage(overrides={}){
  await unmount();const calls=[],opened=[];
  const props={node:{kind:'user',data:{seq:3,time:0,content:[{type:'text',text:original},{type:'file',attachment:retained}]}},sessionId:'source',
    useSession:()=>({openState:'open',running:false}),renderFactorySlot:(_,props)=>React.createElement('p',{},props.content.text),
    evaluateUserText:evaluator,coordinator:{save:async args=>{calls.push(args);return {childId:'child'};}},openSession:id=>opened.push(id),...overrides};
  root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(api.EditableMessage,props)));
  return {calls,opened,props};
}
async function mountEditor(value=original,overrides={}){
  await unmount();const changes=[],files=[],limits=[];
  const props={value,references:references(value),disabled:false,label:'引用正文',maxLength:200_000,
    onChange:text=>changes.push(text),onFiles:list=>files.push([...list]),onLimit:()=>limits.push(true),...overrides};
  root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(api.ReferenceEditor,props)));
  return {changes,files,limits,props};
}

test('ordinary attachments share the text flow and preserve exact body without extra spaces or delete buttons',async()=>{
  const items=[{key:'a',name:'first.txt',file:new File(['one'],'first.txt')},{key:'b',name:'second.txt',file:new File(['two'],'second.txt')}];
  await mountEditor('前后',{attachments:items,initialAttachmentOffset:1});
  assert.equal(projection(),'前后');assert.deepEqual([...area().querySelectorAll('[data-dsh-ie-reference="attachment"]')].map(node=>node.textContent),items.map(item=>item.name));
  assert.equal(area().querySelector('button'),null,'native inline tokens do not add trailing remove controls');
  assert.equal(area().value,'前后');await input('尾');assert.equal(projection(),'前尾后','typing continues immediately after the inserted token group');
});

test('new attachment tokens insert at the last caret after a picker steals DOM focus',async()=>{
  const first={key:'first',name:'first.txt',file:new File(['one'],'first.txt')},second={key:'second',name:'second.txt',file:new File(['two'],'second.txt')};
  const {props}=await mountEditor('前后',{attachments:[]});await atText('前后',1);
  const picker=document.createElement('input');document.body.append(picker);picker.focus();
  await act(async()=>root.render(React.createElement(api.ReferenceEditor,{...props,attachments:[first,second]})));picker.remove();
  const order=lexical().getEditorState().read(()=>api.$getRoot().getFirstChild().getChildren().map(node=>node.getType()==='dsh-inline-edit-reference'?node.getReference():node.getTextContent()));
  assert.deepEqual(order,['前','first','second','后']);assert.equal(projection(),'前后');await input('继续');assert.equal(projection(),'前继续后');
});

test('attachment deletion, undo and redo project complete trusted items and never convert them into body paths',async()=>{
  const attachment={key:'safe',name:'file.txt',file:new File(['complete payload'],'file.txt')},updates=[];
  const {props}=await mountEditor('正文',{attachments:[attachment],onAttachmentsChange:items=>updates.push(items)});
  await edit(()=>api.$getRoot().getFirstChild().select(2,2));await command(api.DELETE_CHARACTER_COMMAND,true);
  assert.deepEqual(updates.at(-1),[]);assert.equal(projection(),'正文');
  await act(async()=>root.render(React.createElement(api.ReferenceEditor,{...props,attachments:[]})));
  await command(api.UNDO_COMMAND);assert.equal(updates.at(-1)?.[0],attachment);assert.equal(updates.at(-1)?.[0].file,attachment.file);assert.equal(projection(),'正文');
  await command(api.REDO_COMMAND);assert.deepEqual(updates.at(-1),[]);assert.equal(projection(),'正文');
});

test('a parent rejecting restored attachments rolls back undo without a token missing from the real payload',async()=>{
  const item={key:'safe',name:'file.txt',file:new File(['trusted'],'file.txt')};let rejected=false;
  const {props}=await mountEditor('正文',{attachments:[item],onAttachmentsChange:items=>{if(items.length){rejected=true;return false;}return true;}});
  await removeFile('file.txt');await act(async()=>root.render(React.createElement(api.ReferenceEditor,{...props,attachments:[]})));
  await command(api.UNDO_COMMAND);assert.equal(rejected,true);assert.equal(projection(),'正文');assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,0);
});

test('selecting and cutting an attachment-only token removes it and undo restores the original File',async()=>{
  const attachment={key:'only',name:'only.txt',file:new File(['keep me'],'only.txt')},updates=[];await mountEditor('',{attachments:[attachment],onAttachmentsChange:items=>updates.push(items)});
  await edit(()=>api.$getRoot().getFirstChild().select(0,1));const writes=[];
  const event=await dispatch('cut',{clipboardData:{setData:(type,text)=>writes.push([type,text])}});
  assert.equal(event.defaultPrevented,true);assert.deepEqual(writes,[['text/plain','']]);assert.deepEqual(updates.at(-1),[]);assert.equal(projection(),'');
  await command(api.UNDO_COMMAND);assert.equal(updates.at(-1)?.[0].file,attachment.file);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,1);
});

test('multiple attachment tokens allow text before, between and after them in one paragraph',async()=>{
  const attachments=[{key:'a',name:'a.txt'},{key:'b',name:'b.txt'}];await mountEditor('',{attachments});
  await edit(()=>api.$getRoot().getFirstChild().select(1,1));await input('中');
  await edit(()=>api.$getRoot().getFirstChild().select(0,0));await input('前');
  await edit(()=>api.$getRoot().selectEnd());await input('后');
  assert.equal(projection(),'前中后');assert.equal(area().querySelectorAll('p').length,1);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,2);
  await command(api.UNDO_COMMAND);assert.notEqual(projection(),'前中后');assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,2);
  await command(api.REDO_COMMAND);assert.equal(projection(),'前中后');
});

for(const backwards of [true,false])test(`multiple raw path references at the end support ${backwards?'Backspace':'Delete'} and immediate typing`,async()=>{
  await mountEditor(`${rawA}${rawB}`);if(!backwards)await edit(()=>api.$getRoot().getFirstChild().select(0,0));
  await key({key:backwards?'Backspace':'Delete'});assert.equal(projection(),backwards?rawA:rawB);
  await key({key:backwards?'Backspace':'Delete'});assert.equal(projection(),'');await input('继续输入');assert.equal(projection(),'继续输入');assert.equal(area().querySelector('button'),null);
  await command(api.UNDO_COMMAND);assert.equal(projection(),'');await command(api.UNDO_COMMAND);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="reference"]').length,1);
});

for(const mode of ['branch','current'])test(`real Lexical reference editor resends raw multiline text and original attachments in ${mode} mode`,async()=>{
  const {calls}=await mountMessage({mode,latestSeq:3});await click('编辑消息');
  assert.equal(document.querySelector('textarea'),null);assert.equal(projection(),original);
  const chips=[...document.querySelectorAll('[data-dsh-ie-reference="reference"]')];assert.equal(chips.length,2);
  assert.deepEqual(chips.map(chip=>chip.textContent),['有 空格.txt','报告.md']);
  assert.ok(chips.every(chip=>chip.getAttribute('contenteditable')==='false'&&chip.querySelector('[data-ref-chip="file"] svg')));
  assert.equal(area().getAttribute('role'),'textbox');assert.equal(area().getAttribute('aria-multiline'),'true');
  await click('发送');assert.equal(calls.length,1);assert.equal(calls[0].text,original);assert.equal(calls[0].mode,mode);assert.equal(calls[0].attachments[0].ref,retained);
});

test('CRLF, tabs, leading and trailing empty lines survive seeding and clipboard serialization',async()=>{
  const value=`\r\n\t${rawA}\r\n\r\n尾部 \t\r\n`;await mountEditor(value);assert.equal(projection(),value);
  await edit(()=>api.$getRoot().select(0,api.$getRoot().getChildrenSize()));const copied=[];
  await dispatch('copy',{clipboardData:{setData:(_,text)=>copied.push(text)}});assert.deepEqual(copied,[value]);
});

test('inserting text before, between and after multiple references preserves every raw token and caret',async()=>{
  const {calls}=await mountMessage();await click('编辑消息');
  await atText('  开头😀 ',0);await input('前');await input('置');
  await atText(' 中间 ',2);await input('中');await input('插');
  await atText('末尾 \t',4);await input('后');
  const expected=original.replace('  开头','前置  开头').replace(' 中间 ',' 中中插间 ').replace('末尾 \t','末尾 \t后');
  assert.equal(projection(),expected);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="reference"]').length,2);
  await click('发送');assert.equal(calls[0].text,expected);
});

for(const backwards of [true,false])test(`native ${backwards?'Backspace':'Delete'} removes an entire reference without damaging surrounding text`,async()=>{
  await mountEditor(`左${rawA}右`);
  await edit(()=>{const paragraph=api.$getRoot().getFirstChild();paragraph.select(backwards?2:1,backwards?2:1);});
  await command(api.DELETE_CHARACTER_COMMAND,backwards);
  assert.equal(projection(),'左右');assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,0);
  await command(api.UNDO_COMMAND);assert.equal(projection(),`左${rawA}右`);assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,1);
  await command(api.REDO_COMMAND);assert.equal(projection(),'左右');
});

test('duplicate reference labels remain separate occurrences and deleting one preserves the other',async()=>{
  const text=`${rawA} 与 ${rawA}`;await mountEditor(text);
  await edit(()=>api.$getRoot().getFirstChild().select(0,1));
  await command(api.CONTROLLED_TEXT_INSERTION_COMMAND,'替换');
  assert.equal(projection(),`替换 与 ${rawA}`);assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,1);
});

test('copy and cut serialize selected reference source and block gaps instead of display labels',async()=>{
  const {changes}=await mountEditor();
  await edit(()=>{const root=api.$getRoot();const selection=api.$createRangeSelection();selection.anchor.set(root.getKey(),0,'element');selection.focus.set(root.getKey(),root.getChildrenSize(),'element');api.$setSelection(selection);});
  const writes=[];const clipboardData={setData:(kind,text)=>writes.push([kind,text])};
  assert.equal((await dispatch('copy',{clipboardData})).defaultPrevented,true);
  assert.deepEqual(writes,[['text/plain',original]]);assert.equal(projection(),original);
  assert.equal((await dispatch('cut',{clipboardData})).defaultPrevented,true);
  assert.deepEqual(writes,[['text/plain',original],['text/plain',original]]);assert.equal(projection(),'');assert.equal(changes.at(-1),'');
  await command(api.UNDO_COMMAND);assert.equal(projection(),original);assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,2);
});

test('plain-text paste replaces a selected reference atomically and preserves pasted line breaks',async()=>{
  const {changes}=await mountEditor(`左${rawA}右`);await edit(()=>api.$getRoot().getFirstChild().select(1,2));
  const event=await dispatch('paste',{clipboardData:{files:[],getData:type=>type==='text/plain'?'粘贴\n第二行  ':''}});
  assert.equal(event.defaultPrevented,true);assert.equal(projection(),'左粘贴\n第二行  右');assert.equal(changes.at(-1),'左粘贴\n第二行  右');assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,0);
});

for(const route of ['picker','paste','drop'])test(`reference editor accepts ordinary files once through ${route} without rewriting body references`,async()=>{
  const {calls}=await mountMessage();await click('编辑消息');const file=new File(['full payload'],`${route}.txt`,{type:'text/plain'});
  let event;
  if(route==='picker'){
    const picker=document.querySelector('input[type=file]');Object.defineProperty(picker,'files',{value:[file],configurable:true});event=await dispatch('change',{},picker);
  }else event=await dispatch(route,{[route==='paste'?'clipboardData':'dataTransfer']:{files:[file],types:['Files'],getData:()=>''}});
  if(route!=='picker')assert.equal(event.defaultPrevented,true);
  assert.equal(projection(),original);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,2,'capture and bubbling must not add a file twice');assert.equal(document.querySelector('.dsh-ie-files'),null,'ordinary file chips stay inside the same textbox');assert.equal(area().querySelector('button'),null);
  await click('发送');assert.equal(calls.length,1);assert.equal(calls[0].text,original);assert.equal(calls[0].attachments.length,2);assert.equal(calls[0].attachments[0].ref,retained);assert.equal(calls[0].attachments[1].file,file);assert.equal(await calls[0].attachments[1].file.text(),'full payload');
});

test('parent attachment state follows deleting and undoing a newly pasted file before submission',async()=>{
  const {calls}=await mountMessage();await click('编辑消息');const file=new File(['restored complete file'],'undo.txt',{type:'text/plain'});
  await dispatch('paste',{clipboardData:{files:[file],getData:()=>''}});await removeFile(file.name);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,1);
  await command(api.UNDO_COMMAND);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,2);assert.equal(projection(),original);
  await click('发送');assert.equal(calls.length,1);assert.equal(calls[0].text,original);assert.equal(calls[0].attachments.find(item=>item.name===file.name).file,file);assert.equal(calls[0].attachments.find(item=>item.origin==='original').ref,retained);
});

test('cutting text and file tokens updates both parent states atomically while preserving image attachments',async()=>{
  const image={attachmentId:'image',name:'keep.png',bytes:4,mediaType:'image/png'};
  const {calls}=await mountMessage({node:{kind:'user',data:{seq:3,time:0,content:[{type:'text',text:original},{type:'file',attachment:retained},{type:'image',attachment:image}]}}});await click('编辑消息');
  await edit(()=>api.$getRoot().select(0,api.$getRoot().getChildrenSize()));await dispatch('cut',{clipboardData:{setData(){}}});
  assert.equal(projection(),'');assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,0);assert.equal(document.querySelectorAll('.dsh-ie-files li').length,1);assert.equal(button('发送').disabled,false);
  await command(api.UNDO_COMMAND);assert.equal(projection(),original);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,1);
  await click('发送');assert.equal(calls.length,1);assert.equal(calls[0].text,original);assert.equal(calls[0].attachments.length,2);assert.equal(calls[0].attachments.find(item=>item.type==='file').ref,retained);assert.equal(calls[0].attachments.find(item=>item.type==='image').ref,image);
});

for(const mode of ['branch','current'])for(const options of [{},{ctrlKey:true},{metaKey:true}])test(`${Object.keys(options)[0]||'plain'} Enter submits a reference draft exactly once in ${mode} mode`,async()=>{
  const {calls}=await mountMessage({mode,latestSeq:3});await click('编辑消息');await atText(' 中间 ',1);await input('新增');const expected=original.replace(' 中间 ',' 新增中间 ');
  assert.equal((await key({key:'Enter',...options})).defaultPrevented,true);assert.equal(calls.length,1);assert.equal(calls[0].text,expected);assert.equal(calls[0].attachments[0].ref,retained);
});

for(const options of [{isComposing:true},{keyCode:229},{isComposing:true,ctrlKey:true},{keyCode:229,metaKey:true}])test(`IME confirmation ${JSON.stringify(options)} never sends a reference draft`,async()=>{
  const {calls}=await mountMessage();await click('编辑消息');await atText(' 中间 ',1);
  const host=area(),editor=lexical();
  await act(async()=>host.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''})));
  assert.equal(editor.isComposing(),true,'the native compositionstart must activate Lexical composition');
  // A browser mutates its editable DOM before delivering insertCompositionText.
  await act(async()=>{
    const selection=document.getSelection(),text=selection.anchorNode,offset=selection.anchorOffset;
    assert.equal(text.nodeType,Node.TEXT_NODE);text.insertData(offset,'新');selection.collapse(text,offset+1);
    host.dispatchEvent(new InputEvent('input',{bubbles:true,data:'新',inputType:'insertCompositionText',isComposing:true}));
  });
  const expected=original.replace(' 中间 ',' 新中间 ');assert.equal(projection(),expected);
  await key({key:'Enter',...options});assert.equal(calls.length,0);assert.ok(area());assert.equal(projection(),expected);
  await act(async()=>host.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'新'})));
  assert.equal(editor.isComposing(),false);assert.equal(projection(),expected);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="reference"]').length,2);
});

test('Shift+Enter inserts a real Lexical line break while repeated Enter cannot submit',async()=>{
  const {calls}=await mountMessage();await click('编辑消息');await atText(' 中间 ',1);
  await key({key:'Enter',shiftKey:true});assert.equal(calls.length,0);assert.equal(projection(),original.replace(' 中间 ',' \n中间 '));
  await key({key:'Enter',repeat:true});assert.equal(calls.length,0);assert.ok(area());
});

for(const trigger of ['Escape','button'])test(`reference draft cancellation by ${trigger} restores original text, chips and attachments`,async()=>{
  const {calls}=await mountMessage();await click('编辑消息');const previousEditor=lexical();await atText(' 中间 ',1);await input('丢弃');await removeFile('old.txt');
  if(trigger==='Escape')await key({key:'Escape'});else await click('取消');
  assert.equal(area(),null);assert.equal(previousEditor.getRootElement(),null);assert.equal(calls.length,0);
  await click('编辑消息');assert.equal(projection(),original);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="reference"]').length,2);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,1);assert.equal(button('移除 old.txt'),undefined);
});

test('failed submission keeps edited reference draft and attachments available for retry',async()=>{
  const calls=[];await mountMessage({coordinator:{save:async args=>{calls.push(args);throw Error('offline');}}});await click('编辑消息');await atText(' 中间 ',1);await input('保留');const expected=projection();
  await click('发送');assert.equal(calls.length,1);assert.equal(projection(),expected);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="reference"]').length,2);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,1);assert.equal(button('发送').disabled,false);
  await click('发送');assert.equal(calls.length,2);assert.equal(calls[1].text,expected);assert.equal(calls[1].attachments[0].ref,retained);
});

for(const mode of ['branch','current'])test(`removing all reference text and the final attachment blocks empty ${mode} submission`,async()=>{
  const {calls}=await mountMessage({mode,latestSeq:3});await click('编辑消息');
  await edit(()=>api.$getRoot().select(0,api.$getRoot().getChildrenSize()));await dispatch('cut',{clipboardData:{setData(){}}});
  assert.equal(projection(),'');assert.equal(button('发送').disabled,true);await key({key:'Enter'});assert.equal(calls.length,0);assert.ok(area());
});

test('a session becoming busy cannot be submitted through the reference editor Enter handler',async()=>{
  let running=false;const {calls,props}=await mountMessage({useSession:()=>({openState:'open',running})});await click('编辑消息');await atText(' 中间 ',1);await input('草稿');const expected=projection();
  running=true;await act(async()=>root.render(React.createElement(api.EditableMessage,props)));assert.equal(button('发送').disabled,true);
  await key({key:'Enter'});assert.equal(calls.length,0);assert.equal(projection(),expected);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="reference"]').length,2);
});

test('a pending reference submission disables editor mutations and prevents duplicate Enter sends',async()=>{
  const calls=[];let complete;await mountMessage({mode:'current',latestSeq:3,coordinator:{save:args=>{calls.push(args);return new Promise(resolve=>complete=resolve);}}});await click('编辑消息');
  await key({key:'Enter'});assert.equal(calls.length,1);assert.equal(lexical().isEditable(),false);assert.equal(area().getAttribute('aria-disabled'),'true');
  await key({key:'Enter'});await dispatch('paste',{clipboardData:{files:[],getData:()=> 'blocked'}});await dispatch('drop',{dataTransfer:{files:[new File(['x'],'blocked.txt')],types:['Files']}});
  assert.equal(calls.length,1);assert.equal(projection(),original);assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"]').length,1);
  await act(async()=>complete({}));assert.equal(area(),null);assert.equal(calls[0].text,original);assert.equal(calls[0].attachments[0].ref,retained);
});

test('disabled reference editor blocks paste, file drop and cut mutations',async()=>{
  const {changes,files}=await mountEditor(original,{disabled:true});assert.equal(lexical().isEditable(),false);assert.equal(area().getAttribute('aria-disabled'),'true');
  await edit(()=>api.$getRoot().select(0,api.$getRoot().getChildrenSize()));
  await dispatch('paste',{clipboardData:{files:[],getData:()=> 'blocked'}});
  await dispatch('paste',{clipboardData:{files:[new File(['x'],'blocked.txt')]}});
  await dispatch('drop',{dataTransfer:{files:[new File(['x'],'blocked.txt')],types:['Files']}});
  await dispatch('cut',{clipboardData:{setData(){}}});assert.equal(projection(),original);assert.deepEqual(changes,[]);assert.deepEqual(files,[]);
});

test('paste limit counts the raw reference length and permits replacement within the limit',async()=>{
  const value=`左${rawA}右`;const {changes,limits}=await mountEditor(value,{maxLength:value.length});
  const event=await dispatch('paste',{clipboardData:{files:[],getData:()=> '超限'}});assert.equal(event.defaultPrevented,true);assert.equal(projection(),value);assert.deepEqual(changes,[]);assert.equal(limits.length,1);
  await edit(()=>api.$getRoot().getFirstChild().select(1,2));await dispatch('paste',{clipboardData:{files:[],getData:()=> '短'}});assert.equal(projection(),'左短右');assert.equal(limits.length,1);
});

test('non-cancelable oversized editor updates restore both valid draft and history',async()=>{
  const value=`左${rawA}右`;const {changes,limits}=await mountEditor(value,{maxLength:value.length+1});
  await atText('右',1);await input('好');const valid=projection();assert.equal(valid,value+'好');
  await input('超限');assert.equal(projection(),valid);assert.equal(limits.length,1);assert.deepEqual(changes,[valid]);
  await command(api.UNDO_COMMAND);assert.equal(projection(),value);await command(api.REDO_COMMAND);assert.equal(projection(),valid);assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,1);
});

test('controlled value changes reseed references, clear undo and preserve exact new source',async()=>{
  const {props}=await mountEditor(`左${rawA}右`);await atText('右',1);await input('旧修改');
  const value=`\n新 ${rawB}  \n`;await act(async()=>root.render(React.createElement(api.ReferenceEditor,{...props,value,references:references(value)})));
  assert.equal(projection(),value);assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,1);await command(api.UNDO_COMMAND);assert.equal(projection(),value);
});

test('changing the keyed session unmounts the old Lexical instance and discards its draft',async()=>{
  const {props,calls}=await mountMessage();await click('编辑消息');await atText(' 中间 ',1);await input('旧会话');const oldElement=area(),oldEditor=lexical();
  const next=`第二会话 ${rawB}`;await act(async()=>root.render(React.createElement(api.EditableMessage,{...props,key:'next:4',sessionId:'next',node:{kind:'user',data:{seq:4,time:0,content:[{type:'text',text:next}]}},latestSeq:4})));
  assert.equal(oldEditor.getRootElement(),null);assert.equal(oldElement.__lexicalEditor,null);assert.equal(area(),null);assert.equal(calls.length,0);
  await click('编辑消息');assert.equal(projection(),next);assert.notEqual(lexical(),oldEditor);assert.equal(document.querySelectorAll('[data-dsh-ie-reference]').length,1);
});

test('unmount unregisters the editor and cancels pending caret animation',async()=>{
  const {changes}=await mountEditor(`左${rawA}右`);await atText('右',1);await input('新');const editor=lexical(),element=area(),count=changes.length;await unmount();
  assert.equal(editor.getRootElement(),null);assert.equal(element.__lexicalEditor,null);
  await edit(()=>api.$getRoot().getFirstChild().append(api.$createTextNode('迟到')),editor);assert.equal(changes.length,count,'disposed listeners cannot publish a late draft');
});

afterEach(async()=>{await unmount();window.sessionStorage.clear();});
after(()=>dom.window.close());
