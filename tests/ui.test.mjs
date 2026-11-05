import {test,after,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {loadNativeTooltip} from './helpers/native-primitives.mjs';
const dom=new JSDOM('<!doctype html><html lang="zh-CN"><head></head><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','navigator','Node','HTMLElement','HTMLTextAreaElement','Event','KeyboardEvent','InputEvent','CompositionEvent','MutationObserver','Text','DocumentFragment'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
globalThis.cancelAnimationFrame=clearTimeout;
dom.window.Range.prototype.getBoundingClientRect=()=>new dom.window.DOMRect();
dom.window.Range.prototype.getClientRects=()=>[];
globalThis.ResizeObserver=class {
 constructor(callback){this.callback=callback;}
 observe(target){this.callback([{target,borderBoxSize:[{inlineSize:240,blockSize:40}]}]);}
 disconnect(){}
};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');
const {act}=React;
const {createRoot}=await import('react-dom/client');
const require=createRequire(import.meta.url);let client,clientArtifact;
const nativePrimitives=await loadNativeTooltip(require);
window.__ModuleLoader__={load:definition=>{clientArtifact=definition.factory(id=>id==='@deepseek-ai/dsh-client-ui-primitives'?nativePrimitives:require(id));}};
vm.runInThisContext(readFileSync(new URL('../lib/client.js',import.meta.url),'utf8'));
// The integration tests edit the real source with its own bundled Lexical API.
// Importing a second Lexical instance cannot operate on this editor's nodes.
const built=await build({
 stdin:{contents:`export * from './src/client.jsx';
 export {$getRoot,CONTROLLED_TEXT_INSERTION_COMMAND,DELETE_CHARACTER_COMMAND,HISTORY_PUSH_TAG} from 'lexical';`,
 resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'js'},
 bundle:true,write:false,format:'cjs',platform:'browser',jsx:'automatic',
 define:{'process.env.NODE_ENV':'"production"'},loader:{'.css':'text'},
 external:['react','react-dom','react/jsx-runtime','@deepseek-ai/dsh-client-ui-primitives'],logLevel:'silent',
});
const sourceModule={exports:{}};
vm.runInThisContext(`(function(require,module,exports){${built.outputFiles[0].text}\n})`)(id=>id==='@deepseek-ai/dsh-client-ui-primitives'?nativePrimitives:require(id),sourceModule,sourceModule.exports);
client=sourceModule.exports;
let root;
const node={kind:'user',data:{seq:3,time:0,content:[{type:'text',text:'原消息'},{type:'file',attachment:{attachmentId:'abc',name:'old.txt',bytes:3}}]}};
const editorSelector='textarea,.dsh-ie-reference-editor';
function editor(){return document.querySelector(editorSelector);}
function editorDisabled(area=editor()){return area.matches('textarea')?area.disabled:area.getAttribute('contenteditable')==='false';}
function attachmentTokens(){return [...document.querySelectorAll('[data-dsh-ie-reference="attachment"]')];}
function attachmentToken(name){return attachmentTokens().find(token=>token.textContent===name);}
function lexicalNodes(root){return root.getChildren().flatMap(child=>[child,...(typeof child.getChildren==='function'?lexicalNodes(child):[])]);}
function button(name){return [...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||b.textContent)===name);}
async function click(name){await act(async()=>button(name).click());}
async function type(text){
 const area=editor();
 if(area.matches('textarea')){
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(area,text);area.dispatchEvent(new Event('input',{bubbles:true}));});
  return;
 }
 const lexical=area.__lexicalEditor;assert.ok(lexical,'rich text input must use the real Lexical editor');
 const before=attachmentTokens().length;
 await act(async()=>{
  lexical.update(()=>{
   const texts=client.$getRoot().getAllTextNodes(),first=texts[0],last=texts.at(-1);
   if(first){const selection=first.select(0,0);selection.focus.set(last.getKey(),last.getTextContentSize(),'text');}
   else client.$getRoot().getFirstChild().select(0,0);
  },{discrete:true});
  lexical.dispatchCommand(client.CONTROLLED_TEXT_INSERTION_COMMAND,text);
 });
 assert.equal(attachmentTokens().length,before,'editing body text must preserve its real attachment tokens');
}
async function removeAttachment(name){
 const area=editor(),lexical=area.__lexicalEditor;assert.ok(lexical,'ordinary files are removed through native text selection');
 assert.equal(button('移除 '+name),undefined,'ordinary file tokens have no added remove button');
 await act(async()=>{
  lexical.update(()=>{
   const token=lexicalNodes(client.$getRoot()).find(node=>node.getType()==='dsh-inline-edit-reference'&&node.getSource()==='attachment'&&node.getLabel()===name);
   assert.ok(token,'attachment token '+name);const parent=token.getParentOrThrow(),index=token.getIndexWithinParent();parent.select(index,index+1);
  },{discrete:true,tag:client.HISTORY_PUSH_TAG});
  lexical.dispatchCommand(client.DELETE_CHARACTER_COMMAND,true);
 });
 assert.equal(attachmentToken(name),undefined);
}
async function mount(overrides={}){
 if(root)await act(async()=>root.unmount());
 const calls=[];root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(React.createElement(client.EditableMessage,{
 node,sessionId:'source',useSession:()=>({openState:'open',running:false}),
 renderFactorySlot:(_,props)=>React.createElement('p',{},props.content.text),
 coordinator:{save:async args=>{calls.push(args);return {childId:'child'};}},openSession:()=>{},...overrides,
 })));
 return calls;
}
test('history bridge preserves competing message priorities and releases owned slots',async()=>{
 const {SlotCore}=await import('@deepseek-ai/dsh-client-ui-slots');
 const slots=new SlotCore();
 // Both source declarations exist before installation in this registry test.
 slots.inject=(_name,fn)=>fn();
 const Native=()=>null;
 const rootDispose=slots.register({name:'root',children:{'conversation.chat.flow':{kind:'single',scope:'session'}}},Native);
 const flowDispose=slots.register({name:'conversation.chat.flow',children:{'conversation.chat.node':{kind:'keyed',scope:'session'}}},Native);
 slots.register({name:'conversation.chat.node',key:'user'},Native);
 slots.register({name:'conversation.chat.node',key:'user',priority:-10},Native);
 slots.register({name:'conversation.chat.node',key:'turn-process',priority:-1},Native);
 const ctx={slots};const history=client.installHistoryView(ctx);const bridge=client.installNativeNodeBridge(ctx);
 assert.equal(slots.entries('dsh-inline-edit.node').length,3);
 assert.deepEqual(slots.entries('dsh-inline-edit.node').map(e=>e.options.priority??0),[-10,-1,0]);
 const late=slots.register({name:'conversation.chat.node',key:'steering',priority:-10},Native);
 await Promise.resolve();assert.equal(slots.entries('dsh-inline-edit.node').length,4);
 late();await Promise.resolve();assert.equal(slots.entries('dsh-inline-edit.node').length,3);
 bridge();history();assert.equal(slots.entries('dsh-inline-edit.node').length,0);flowDispose();rootDispose();
});
test('native client artifact loads using host module-loader wrapper',()=>{assert.equal(clientArtifact.name,'dsh-inline-edit');assert.equal(typeof clientArtifact.apply,'function');assert.ok(clientArtifact.inject.includes('fileUpload'));});

test('message clock includes the date after local midnight without reopening the chat',async(t)=>{
 const before=new Date(2026,10,4,23,59,59).getTime();
 t.mock.timers.enable({apis:['Date','setTimeout'],now:before});
 const time=new Date(2026,10,4,23,14).getTime();
 await mount({node:{...node,data:{...node.data,time}}});
 assert.equal(document.querySelector('time').textContent,'23:14');
 assert.equal(document.querySelector('time').dateTime,new Date(time).toISOString());
 await act(async()=>t.mock.timers.tick(1000));
 assert.equal(document.querySelector('time').textContent,'11月4日 23:14');
 await act(async()=>root.unmount());root=null;
});
test('an out-of-range timestamp does not break message actions',async()=>{
 await mount({node:{...node,data:{...node.data,time:1e20}}});
 assert.equal(document.querySelector('time'),null);assert.ok(button('编辑消息'));assert.ok(button('复制消息'));
});
for(const trigger of ['hover','focus']) test('message time reveals a full local timestamp on '+trigger,async(t)=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:new Date(2026,10,5,12).getTime()});
 const time=new Date(2026,10,5,9,5,7).getTime();
 await mount({node:{...node,data:{...node.data,time}}});
 const clock=document.querySelector('time');
 assert.equal(clock.textContent,'09:05');assert.equal(clock.getAttribute('title'),null);
 assert.equal(clock.tabIndex,0);assert.equal(clock.getAttribute('aria-label'),'2026年11月5日 09:05:07');
 await act(async()=>{
  if(trigger==='hover')clock.dispatchEvent(new dom.window.MouseEvent('mouseover',{bubbles:true}));
  else {document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));clock.focus();}
 });
 await act(async()=>t.mock.timers.tick(220));
 assert.equal(document.querySelector('[role=tooltip]').textContent,'2026年11月5日 09:05:07');
 await act(async()=>{if(trigger==='hover')clock.dispatchEvent(new dom.window.MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}));else clock.blur();});
 assert.equal(document.querySelector('[role=tooltip]'),null);
});
for(const kind of ['file','image']) for(const draft of ['', ' \n\t']) test(`attachment-only ${kind} with ${draft?'blank':'no'} text has no copy action but retains editing and resend`,async()=>{
 const attachment={type:kind,attachment:{attachmentId:'only',name:'only.'+(kind==='image'?'png':'txt'),bytes:3,...(kind==='image'?{mediaType:'image/png'}:{})}};
 const content=draft?[{type:'text',text:draft},attachment]:[attachment];
 const calls=await mount({node:{...node,data:{...node.data,content}}});
 assert.equal(Boolean(button('复制消息')),false);assert.equal(Boolean(button('已复制')),false);
 assert.ok(document.querySelector('time'));assert.equal(button('编辑消息').getAttribute('aria-disabled'),'false');
 await click('编辑消息');assert.equal(editor().value,draft);assert.equal(button('发送').disabled,false);
 await click('发送');assert.equal(calls.length,1);assert.equal(calls[0].text,draft);
 assert.equal(calls[0].attachments.length,1);assert.deepEqual(calls[0].attachments[0].ref,attachment.attachment);
});
test('copying mixed text and attachments preserves all whitespace and line breaks',async()=>{
 const previous=Object.getOwnPropertyDescriptor(navigator,'clipboard');const writes=[];
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{writes.push(text);}}});
 try{
  const text=' \n 第一行  \n第二行\t \n';
  const content=[{type:'text',text},node.data.content[1],{type:'image',attachment:{attachmentId:'image',name:'image.png',bytes:3,mediaType:'image/png'}}];
  await mount({node:{...node,data:{...node.data,content}}});
  assert.ok(button('复制消息'));await click('复制消息');assert.deepEqual(writes,[text]);
  assert.ok(button('已复制'));assert.ok(button('编辑消息'));assert.ok(document.querySelector('time'));
 }finally{if(previous)Object.defineProperty(navigator,'clipboard',previous);else delete navigator.clipboard;}
});
for(const detail of [1,0]) for(const outcome of ['success','failure']) test(`${detail?'pointer':'keyboard'} copy preserves the right focus after ${outcome}`,async()=>{
 const previous=Object.getOwnPropertyDescriptor(navigator,'clipboard');const writes=[];let finish;
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{writes.push(text);return new Promise((resolve,reject)=>{finish=()=>outcome==='success'?resolve():reject(Error('clipboard unavailable'));});}}});
 try{
  await mount();const control=button('复制消息');
  await act(async()=>{control.focus();control.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,detail}));});
  assert.deepEqual(writes,['原消息']);assert.equal(document.activeElement===control,detail===0);
  const next=detail?button('编辑消息'):control;
  if(detail)await act(async()=>next.focus());
  await act(async()=>finish());assert.equal(document.activeElement,next,'clipboard completion must not steal focus');
  if(outcome==='success')assert.equal(control.getAttribute('aria-label'),'已复制');
  else assert.match(document.querySelector('.dsh-ie-error').textContent,/复制失败/);
 }finally{if(previous)Object.defineProperty(navigator,'clipboard',previous);else delete navigator.clipboard;}
});
test('pointer activation of the time does not hold the action row open',async()=>{
 await mount();const clock=document.querySelector('time');
 await act(async()=>{clock.focus();clock.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,detail:1}));});
 assert.equal(document.querySelector('.dsh-ie-actions').contains(document.activeElement),false);
});
test('cancel restores both text and original attachments without a save',async()=>{
 const calls=await mount();await click('编辑消息');await type('改过');await removeAttachment('old.txt');await click('取消');
 assert.equal(editor(),null);assert.equal(calls.length,0);
 await click('编辑消息');assert.equal(editor().value,'原消息');assert.ok(attachmentToken('old.txt'));assert.equal(button('移除 old.txt'),undefined);assert.equal(button('发送').disabled,false);
});
test('pointer cancel does not leave focus holding message actions open',async()=>{
 const calls=await mount();await click('编辑消息');
 await act(async()=>{
  button('取消').focus();
  button('取消').dispatchEvent(new window.MouseEvent('click',{bubbles:true,detail:1}));
 });
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,0));});
 assert.equal(editor(),null);assert.equal(calls.length,0);
 assert.equal(document.querySelector('.dsh-ie-actions').contains(document.activeElement),false);
});
for (const trigger of ['Escape','keyboard cancel']) test(trigger+' restores focus to the edit action',async()=>{
 const calls=await mount();await click('编辑消息');
 await act(async()=>{
  if(trigger==='Escape') editor().dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  else {button('取消').focus();button('取消').dispatchEvent(new window.MouseEvent('click',{bubbles:true,detail:0}));}
 });
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,0));});
 assert.equal(editor(),null);assert.equal(calls.length,0);
 assert.equal(document.activeElement,button('编辑消息'));
});
test('text-only edit sends while retaining attachment',async()=>{
 const calls=await mount();await click('编辑消息');assert.equal(button('发送').disabled,false);await type('新内容');assert.equal(button('发送').disabled,false);await click('发送');
 assert.equal(calls.length,1);assert.equal(calls[0].text,'新内容');assert.equal(calls[0].attachments[0].ref.name,'old.txt');
});
for(const route of ['picker','paste','drop']) test(`native file reference tags retain attachment payloads and body paths after ${route}`,async()=>{
 const text='保留 @C:/资料/报告.txt 与 @"C:/工作/有 空格.md"\n尾部空格  ';
 const retained=node.data.content[1].attachment;
 const calls=await mount({node:{...node,data:{...node.data,content:[{type:'text',text},{type:'file',attachment:retained}]}}});
 await click('编辑消息');
 const file=new File(['the complete attachment payload'],`${route}-report.txt`,{type:'text/plain'});
 const discarded=new File(['remove me'],'discarded.txt',{type:'text/plain'});
 let event;
 await act(async()=>{
  if(route==='picker'){
   const picker=document.querySelector('input[type=file]');
   Object.defineProperty(picker,'files',{value:[file,discarded],configurable:true});
   event=new Event('change',{bubbles:true});picker.dispatchEvent(event);
  }else{
   event=new Event(route,{bubbles:true,cancelable:true});
   Object.defineProperty(event,route==='paste'?'clipboardData':'dataTransfer',{value:{files:[file,discarded],types:['Files']}});
   (route==='paste'?editor():document.querySelector('.dsh-ie-editor')).dispatchEvent(event);
  }
 });
 if(route!=='picker')assert.equal(event.defaultPrevented,true);
 const chips=[...document.querySelectorAll('[data-dsh-ie-reference="attachment"] span[data-ref-chip="file"]')];
 assert.deepEqual(chips.map(chip=>chip.textContent),['old.txt',file.name,discarded.name]);
 for(const chip of chips){assert.match(chip.className,/refChip/);assert.ok(chip.querySelector('svg[aria-hidden="true"]'),'the published reference glyph must accompany the native file label');}
 assert.ok(chips.every(chip=>editor().contains(chip)),'ordinary files share the text flow');
 assert.equal(document.querySelector('.dsh-ie-files'),null,'ordinary files do not create a second attachment row');
 assert.ok(chips.every(chip=>!chip.closest('[data-dsh-ie-reference]').querySelector('button')),'native labels have no added delete X');
 assert.equal(editor().value,text);
 await removeAttachment('discarded.txt');
 assert.equal(document.querySelectorAll('[data-dsh-ie-reference="attachment"] span[data-ref-chip="file"]').length,2);
 assert.equal(editor().value,text,'attachment removal must not rewrite literal @ paths');
 await click('发送');assert.equal(calls.length,1);assert.equal(calls[0].text,text);
 assert.equal(calls[0].attachments.length,2);
 assert.equal(calls[0].attachments[0].ref,retained,'the original attachment reference must pass through unchanged');
 assert.equal(calls[0].attachments[1].file,file,'the added file must remain the original File object, not a filename token');
 assert.equal(calls[0].attachments[1].origin,'new');
 assert.equal(await calls[0].attachments[1].file.text(),'the complete attachment payload');
});
test('adding ordinary files to plain text inserts native tokens at the caret and continues typing immediately after them',async()=>{
 const calls=await mount({node:{...node,data:{...node.data,content:[{type:'text',text:'前后'}]}}});await click('编辑消息');
 assert.equal(editor().tagName,'TEXTAREA');editor().setSelectionRange(1,1);
 const files=[new File(['first payload'],'first.txt'),new File(['second payload'],'second.txt')];
 await act(async()=>{
  const picker=document.querySelector('input[type=file]');Object.defineProperty(picker,'files',{value:files,configurable:true});
  picker.dispatchEvent(new Event('change',{bubbles:true}));
 });
 assert.ok(editor().__lexicalEditor);assert.equal(editor().value,'前后');
 assert.deepEqual(attachmentTokens().map(token=>token.textContent),files.map(file=>file.name));
 assert.ok(attachmentTokens().every(token=>editor().contains(token)&&!token.querySelector('button')));
 assert.equal(document.querySelector('.dsh-ie-files'),null);assert.equal(button('移除 first.txt'),undefined);assert.equal(button('移除 second.txt'),undefined);
 await act(async()=>editor().__lexicalEditor.dispatchCommand(client.CONTROLLED_TEXT_INSERTION_COMMAND,'继续'));
 assert.equal(editor().value,'前继续后','file insertion leaves a normal caret immediately after the token group, without spaces');
 await click('发送');assert.equal(calls[0].text,'前继续后');assert.equal(calls[0].attachments.length,2);
 assert.equal(calls[0].attachments[0].file,files[0]);assert.equal(calls[0].attachments[1].file,files[1]);
});
for (const mode of ['branch','current']) test(`plain Enter sends edited text and preserves original attachments in ${mode} mode`,async()=>{
 const calls=await mount({mode,latestSeq:3});await click('编辑消息');
 const text='修改后的第一行\n第二行保留';await type(text);
 const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});
 await act(async()=>editor().dispatchEvent(event));
 assert.equal(event.defaultPrevented,true);
 assert.equal(calls.length,1);assert.equal(calls[0].text,text);assert.equal(calls[0].mode,mode);
 assert.equal(calls[0].attachments.length,1);assert.deepEqual(calls[0].attachments[0].ref,node.data.content[1].attachment);
 assert.equal(editor(),null);
});
for (const mode of ['branch','current']) for (const kind of ['text','file','image']) for (const trigger of ['click','Enter','Ctrl+Enter','Cmd+Enter']) {
 test(`unchanged text with ${kind} resends via ${trigger} in ${mode} mode`,async()=>{
  const content=[{type:'text',text:'你好'}];
  if(kind!=='text') content.push({type:kind,attachment:{attachmentId:'original',name:'original.'+(kind==='image'?'png':'txt'),bytes:3}});
  const calls=await mount({mode,latestSeq:3,node:{...node,data:{...node.data,content}}});
  await click('编辑消息');assert.equal(editor().value,'你好');assert.equal(button('发送').disabled,false);
  if(trigger==='click') await click('发送');
  else {
   const event=new KeyboardEvent('keydown',{key:'Enter',ctrlKey:trigger==='Ctrl+Enter',metaKey:trigger==='Cmd+Enter',bubbles:true,cancelable:true});
   await act(async()=>editor().dispatchEvent(event));
   assert.equal(event.defaultPrevented,true,'sending must not also insert a newline');
  }
  assert.equal(calls.length,1);assert.equal(calls[0].text,'你好');assert.equal(calls[0].mode,mode);
  assert.equal(calls[0].attachments.length,content.length-1);
  if(kind!=='text') assert.deepEqual(calls[0].attachments[0].ref,content[1].attachment);
  assert.equal(editor(),null);
 });
}
for (const mode of ['branch','current']) for (const kind of ['file','image']) {
 test(`Enter resends an unchanged ${kind}-only message in ${mode} mode`,async()=>{
  const attachment={type:kind,attachment:{attachmentId:'only',name:'only.'+(kind==='image'?'png':'txt'),bytes:3}};
  const calls=await mount({mode,latestSeq:3,node:{...node,data:{...node.data,content:[attachment]}}});
  await click('编辑消息');assert.equal(editor().value,'');assert.equal(button('发送').disabled,false);
  await act(async()=>editor().dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));
  assert.equal(calls.length,1);assert.equal(calls[0].text,'');assert.equal(calls[0].mode,mode);
  assert.equal(calls[0].attachments[0].ref.attachmentId,'only');
 });
}
test('removing the last attachment disables an empty retry',async()=>{
 await mount({node:{...node,data:{...node.data,content:[node.data.content[1]]}}});
 await click('编辑消息');assert.equal(button('发送').disabled,false);await removeAttachment('old.txt');assert.equal(button('发送').disabled,true);
});
for (const draft of ['', ' \n\t']) test('blank text without attachments cannot submit: '+JSON.stringify(draft),async()=>{
 const calls=await mount({node:{...node,data:{...node.data,content:[{type:'text',text:'你好'}]}}});
 await click('编辑消息');await type(draft);assert.equal(button('发送').disabled,true);
 const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});
 await act(async()=>editor().dispatchEvent(event));
 assert.equal(event.defaultPrevented,true);
 assert.equal(calls.length,0);
});
test('attachment-only removal enables send and sends unchanged text',async()=>{
 const calls=await mount();await click('编辑消息');await removeAttachment('old.txt');assert.equal(button('发送').disabled,false);await click('发送');
 assert.equal(calls[0].text,'原消息');assert.equal(calls[0].attachments.length,0);
});
test('attachment-only addition enables send, keeps original and new file',async()=>{
 const calls=await mount();await click('编辑消息');
 await act(async()=>{const input=document.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:[new File(['replacement'],'new.txt')],configurable:true});input.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.ok(attachmentToken('new.txt'));assert.equal(button('移除 new.txt'),undefined);assert.equal(button('发送').disabled,false);await click('发送');
 assert.equal(calls[0].attachments.length,2);assert.equal(calls[0].text,'原消息');
});
for (const [name,keys] of [
 ['Shift+Enter',{shiftKey:true}],
 ['Ctrl+Shift+Enter',{ctrlKey:true,shiftKey:true}],
 ['Cmd+Shift+Enter',{metaKey:true,shiftKey:true}],
 ['Alt+Enter',{altKey:true}],
]) test(name+' leaves native text editing available without submitting',async()=>{
 const calls=await mount();await click('编辑消息');
 const area=editor();
 const event=new KeyboardEvent('keydown',{key:'Enter',...keys,bubbles:true,cancelable:true});
 await act(async()=>area.dispatchEvent(event));
 assert.equal(calls.length,0);
 // Lexical supplies the newline itself; textarea editing uses the browser.
 assert.equal(event.defaultPrevented,!!area.__lexicalEditor);
 if(keys.shiftKey)assert.equal(area.value,'原消息\n','native rich text handling inserts a real line break');
 assert.equal(editor(),area);
});

for (const [name,composition] of [['isComposing',{isComposing:true}],['keyCode 229',{keyCode:229}]]) {
 for (const ctrlKey of [false,true]) test(`IME ${name} ${ctrlKey?'Ctrl+Enter':'Enter'} confirms a candidate without submitting`,async()=>{
  const calls=await mount();await click('编辑消息');
  const area=editor();
  await act(async()=>area.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''})));
  assert.equal(area.__lexicalEditor.isComposing(),true);
  await act(async()=>{
   const selection=document.getSelection(),text=selection.anchorNode,offset=selection.anchorOffset;
   assert.equal(text.nodeType,Node.TEXT_NODE);
   // Native composition replaces Lexical's boundary placeholder rather than
   // inserting an extra character in front of that temporary composition span.
   text.replaceData(offset,text.data[offset]==='\u200b'?1:0,'新');selection.collapse(text,offset+1);
   area.dispatchEvent(new InputEvent('input',{bubbles:true,data:'新',inputType:'insertCompositionText',isComposing:true}));
  });
  assert.equal(area.value,'原消息新');assert.ok(attachmentToken('old.txt'));
  const event=new KeyboardEvent('keydown',{key:'Enter',ctrlKey,...composition,bubbles:true,cancelable:true});
  await act(async()=>area.dispatchEvent(event));
  assert.equal(calls.length,0);assert.equal(event.defaultPrevented,false);
  assert.equal(editor(),area);
  await act(async()=>area.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'新'})));
  assert.equal(area.__lexicalEditor.isComposing(),false);assert.equal(area.value,'原消息新');
  await click('发送');assert.equal(calls[0].text,'原消息新');assert.equal(calls[0].attachments[0].ref,node.data.content[1].attachment);
 });
}

test('held Enter is consumed without submitting and pending sends cannot submit again',async()=>{
 let release,count=0;
 await mount({coordinator:{save:()=>{count++;return new Promise(resolve=>{release=resolve;});}}});
 await click('编辑消息');const area=editor();
 async function enter(repeat=false) {
  const event=new KeyboardEvent('keydown',{key:'Enter',repeat,bubbles:true,cancelable:true});
  await act(async()=>area.dispatchEvent(event));
  assert.equal(event.defaultPrevented,true);
 }
 await enter(true);assert.equal(count,0,'a held key must not trigger a new submission');
 await enter();assert.equal(count,1);assert.equal(editorDisabled(area),true);
 await enter(true);await enter();assert.equal(count,1);
 await act(async()=>release({childId:'child'}));
 assert.equal(editor(),null);
});

test('Enter cannot submit after the session becomes busy while editing',async()=>{
 let snapshot={openState:'open',running:false};const calls=[];
 const props={node,sessionId:'keyboard-session-busy',useSession:()=>snapshot,renderFactorySlot:()=>null,
  coordinator:{save:async args=>{calls.push(args);return {childId:'child'};}},openSession:()=>{}};
 await mount(props);await click('编辑消息');await type('保留草稿');
 snapshot={...snapshot,running:true};
 await act(async()=>root.render(React.createElement(client.EditableMessage,props)));
 assert.equal(button('发送').disabled,true);
 const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});
 await act(async()=>editor().dispatchEvent(event));
 assert.equal(event.defaultPrevented,true);assert.equal(calls.length,0);
 assert.equal(editor().value,'保留草稿');
});
test('Escape cancels; repeated click cannot submit twice while pending',async()=>{
 let release,count=0;
 await mount({coordinator:{save:()=>{count++;return new Promise(r=>{release=r;});}}});await click('编辑消息');
 await act(async()=>editor().dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 assert.equal(editor(),null);assert.equal(count,0);
 await click('编辑消息');await act(async()=>{button('发送').click();button('发送').click();});
 assert.equal(count,1);assert.equal(button('取消').disabled,true);
 await act(async()=>release({childId:'child'}));
});
test('failed submission keeps draft and offers branch recovery without retry',async()=>{
 let count=0;await mount({coordinator:{save:async()=>{count++;throw {code:'branchFailed',childId:'child'};}}});
 await click('编辑消息');await type('keep this');await click('发送');
 assert.equal(editor().value,'keep this');assert.ok(button('打开新分支检查'));assert.equal(button('发送').disabled,true);assert.equal(count,1);
});

test('current mode edits only the last user message and never navigates to a new session',async()=>{
 await mount({mode:'current',latestSeq:9});await click('编辑消息');assert.equal(editor(),null);
 assert.match(button('编辑消息').getAttribute('aria-description'),/仅支持最近一条主消息/);
 const calls=await mount({mode:'current',latestSeq:3,coordinator:{save:async()=>({sessionId:'source'})},openSession:()=>assert.fail('must not navigate')});
 await click('编辑消息');await type('原地修改');await click('发送');assert.equal(editor(),null);
});
test('each confirmed current regeneration uses a fresh request when the message updates in place',async()=>{
 const calls=[];
 const props={node,sessionId:'repeated-regeneration',mode:'current',latestSeq:3,useSession:()=>({openState:'open',running:false}),renderFactorySlot:()=>null,
  coordinator:{save:async args=>{calls.push(args);return {sessionId:'repeated-regeneration',accepted:true};}},openSession:()=>assert.fail('must not navigate')};
 await mount(props);await click('编辑消息');await click('发送');
 const replacement={...node,data:{...node.data,seq:8}};
 await act(async()=>root.render(React.createElement(client.EditableMessage,{...props,node:replacement,latestSeq:8})));
 await click('编辑消息');await click('发送');
 assert.equal(calls.length,2);assert.deepEqual(calls.map(call=>call.node.data.seq),[3,8]);
 assert.equal(calls[0].text,calls[1].text);assert.ok(calls[0].requestId);assert.ok(calls[1].requestId);
 assert.notEqual(calls[0].requestId,calls[1].requestId);
});
test('settings save uses accepted server state and retains selection when save fails',async()=>{
 if(root)await act(async()=>root.unmount());root=createRoot(document.getElementById('root'));
 let state={status:'ready',writable:true,value:{mode:'branch'}},ok=true;const listeners=new Set(),writes=[];
 const form={getSnapshot:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},set:async(k,v)=>{writes.push([k,v]);if(ok){state={...state,value:{mode:v}};listeners.forEach(fn=>fn());}return ok;}};
 await act(async()=>root.render(React.createElement(client.EditSettings,{form})));
 await act(async()=>document.querySelector('input[value=current]').click());
 assert.equal(document.querySelector('input[value=current]').checked,true);assert.match(document.body.textContent,/已保存/);
 ok=false;await act(async()=>document.querySelector('input[value=branch]').click());
 assert.equal(document.querySelector('input[value=current]').checked,true);assert.match(document.body.textContent,/保存失败/);assert.deepEqual(writes,[['mode','current'],['mode','branch']]);
});
test('uncertain current submission is not retried by a second click',async()=>{
 let count=0;await mount({sessionId:'uncertain-case',mode:'current',latestSeq:3,coordinator:{save:async()=>{count++;throw {code:'currentUncertain'};}}});
 await click('编辑消息');await type('修改');await click('发送');assert.equal(button('发送').disabled,true);assert.equal(editorDisabled(),true);assert.equal(count,1);
});

test('supplemental messages have no edit control in current mode',async()=>{
 await mount({mode:'current',latestSeq:3,supplemental:true});assert.equal(button('编辑消息'),undefined);assert.ok(button('复制消息'));
 await mount({mode:'current',latestSeq:3,node:{...node,kind:'steering'}});assert.equal(button('编辑消息'),undefined);
});
test('editing waits for saved settings instead of accidentally using branch fallback',async()=>{
 const calls=await mount({settingsReady:false});await click('编辑消息');
 assert.equal(editor(),null);assert.equal(calls.length,0);
 assert.match(button('编辑消息').getAttribute('aria-description'),/读取消息编辑设置/);
});

test('unknown outcome survives cancel and component remount until explicit confirmation',async()=>{
 let count=0;const props={sessionId:'persistent-unknown',mode:'current',latestSeq:3,coordinator:{save:async()=>{count++;throw {code:'currentUncertain'};}}};
 await mount(props);await click('编辑消息');await type('修改');await click('发送');await click('取消');await click('编辑消息');
 assert.equal(editor(),null);assert.equal(count,1);
 await mount(props);await click('编辑消息');assert.equal(editor(),null);
 window.confirm=()=>false;await click('我已检查提交结果');assert.ok(button('我已检查提交结果'));
 window.confirm=()=>true;await click('我已检查提交结果');await click('编辑消息');assert.ok(editor());assert.equal(count,1);
});
test('draft retains branch mode when saved setting changes while editing',async()=>{
 await mount();const calls=[];const props={node,sessionId:'pinned-mode',mode:'branch',latestSeq:3,useSession:()=>({openState:'open',running:false}),renderFactorySlot:()=>null,coordinator:{save:async args=>{calls.push(args);return {childId:'c'};}},openSession:()=>{}};
 await act(async()=>root.render(React.createElement(client.EditableMessage,props)));
 await click('编辑消息');await type('新内容');
 await act(async()=>root.render(React.createElement(client.EditableMessage,{...props,mode:'current'})));
 await click('在新分支重新生成');
 assert.equal(document.querySelector('[role=tooltip]').textContent,'在新分支重新生成');
 assert.equal(document.querySelector('.dsh-ie-info').hasAttribute('title'),false);
 assert.equal(button('发送').hasAttribute('title'),false);
 await click('发送');assert.equal(calls[0].mode,'branch');
});
test('current-mode tooltip follows the draft until it closes, then uses the new setting',async()=>{
 await mount();const calls=[];
 const props={node,sessionId:'pinned-current-mode',mode:'current',latestSeq:3,useSession:()=>({openState:'open',running:false}),renderFactorySlot:()=>null,coordinator:{save:async args=>{calls.push(args);return {sessionId:'pinned-current-mode'};}},openSession:()=>{}};
 await act(async()=>root.render(React.createElement(client.EditableMessage,props)));
 await click('编辑消息');await type('原地修改');
 await act(async()=>root.render(React.createElement(client.EditableMessage,{...props,mode:'branch'})));
 const info=document.querySelector('.dsh-ie-info');
 assert.equal(info.getAttribute('aria-label'),'在当前对话重新生成');
 await click('在当前对话重新生成');
 assert.equal(document.querySelector('[role=tooltip]').textContent,'在当前对话重新生成');
 await click('发送');assert.equal(calls[0].mode,'current');
 await click('编辑消息');assert.equal(document.querySelector('.dsh-ie-info').getAttribute('aria-label'),'在新分支重新生成');
 await click('取消');
});

test('restricted edit clicks add no inline notice and retain the hover explanation',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const calls=await mount({mode:'current',latestSeq:9});await click('编辑消息');
 assert.equal(document.querySelector('.dsh-ie-notice'),null);
 assert.equal(document.querySelector('.dsh-ie-error'),null);
 await click('编辑消息');
 assert.equal(document.querySelector('.dsh-ie-notice'),null);
 const pencil=button('编辑消息');
 assert.equal(pencil.hasAttribute('title'),false);
 await act(async()=>pencil.dispatchEvent(new dom.window.MouseEvent('mouseover',{bubbles:true})));
 await act(async()=>t.mock.timers.tick(220));
 assert.equal(document.querySelector('[role=tooltip]').textContent,'仅支持最近一条主消息；更早消息请使用分支模式。');
 assert.equal(editor(),null);assert.equal(calls.length,0);
});

test('edit restriction notice clears immediately when the setting makes editing available',async()=>{
 await mount();
 const props={node,sessionId:'notice-mode-change',mode:'current',latestSeq:9,useSession:()=>({openState:'open',running:false}),renderFactorySlot:()=>null,coordinator:{save:async()=>assert.fail('must not submit')},openSession:()=>{}};
 await act(async()=>root.render(React.createElement(client.EditableMessage,props)));
 await click('编辑消息');assert.equal(document.querySelector('.dsh-ie-notice'),null);
 await act(async()=>root.render(React.createElement(client.EditableMessage,{...props,mode:'branch'})));
 assert.equal(document.querySelector('.dsh-ie-notice'),null);
 await click('编辑消息');assert.ok(editor());
});

test('submission failures and uncertain outcomes stay visible after the notice timeout',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 await mount({coordinator:{save:async()=>{throw {code:'fileUpload'};}}});
 await click('编辑消息');await type('保留草稿');await click('发送');
 await act(async()=>t.mock.timers.tick(10000));
 assert.match(document.querySelector('.dsh-ie-error').textContent,/文件上传失败/);
 assert.equal(editor().value,'保留草稿');
 await mount({sessionId:'persistent-error-timer',mode:'current',latestSeq:3,coordinator:{save:async()=>{throw {code:'currentUncertain'};}}});
 await click('编辑消息');await type('等待确认');await click('发送');
 await act(async()=>t.mock.timers.tick(10000));
 assert.match(document.body.textContent,/暂时无法确认提交状态/);assert.equal(button('发送').disabled,true);
});

test('malformed attachments do not crash message rendering and cannot be edited',async()=>{
 for(const content of [[{type:'file'}],[null],null,[{type:'image',attachment:{attachmentId:'bad',bytes:-1}}]]){
  await mount({node:{kind:'user',data:{seq:3,content}}});await click('编辑消息');assert.equal(editor(),null);assert.match(button('编辑消息').getAttribute('aria-description'),/暂不支持/);
 }
});
for (const outcome of ['success','rejected','uncertain']) test(`remounted editor observes pending request ${outcome}`,async()=>{
 let finish,fail;const work=new Promise((resolve,reject)=>{finish=resolve;fail=reject;});let calls=0;
 const props={sessionId:`remount-${outcome}`,mode:'current',latestSeq:3,coordinator:{save:()=>{calls++;return work;}}};
 await mount(props);await click('编辑消息');await type('新内容');await click('发送');
 await mount(props);assert.equal(button('编辑消息').getAttribute('aria-disabled'),'true');
 await act(async()=>{if(outcome==='success')finish({sessionId:props.sessionId});else fail({code:outcome==='uncertain'?'currentUncertain':'fileUpload'});});
 assert.equal(button('编辑消息').getAttribute('aria-disabled'),outcome==='uncertain'?'true':'false');
 assert.equal(!!button('我已检查提交结果'),outcome==='uncertain');assert.equal(calls,1);
 if(outcome!=='uncertain'){assert.doesNotMatch(document.body.textContent,/暂时无法确认提交状态/);await click('编辑消息');assert.ok(editor());}
});
test('copy and attachment actions use the same native-style tooltip without browser titles',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const [label,expected,edit] of [['复制消息',/^复制$/,false],['编辑消息',/^编辑$/,false],['添加文件',/^添加附件$/,true],['移除 photo.png',/原文件/,true]]){
  await mount({node:{...node,data:{...node.data,content:[...node.data.content,previewImage]}}});if(edit)await click('编辑消息');const anchor=button(label);
  assert.equal(anchor.hasAttribute('title'),false);
  await act(async()=>anchor.dispatchEvent(new dom.window.MouseEvent('mouseover',{bubbles:true})));
  await act(async()=>t.mock.timers.tick(220));assert.match(document.querySelector('[role=tooltip]').textContent,expected);
 }
});

test('copy hint stays below its own button even with a native turn control underneath',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const originalRect=HTMLElement.prototype.getBoundingClientRect;
 const nativeButton=document.createElement('button');nativeButton.textContent='下一轮';document.body.append(nativeButton);
 const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
 HTMLElement.prototype.getBoundingClientRect=function(){
  if(this===nativeButton)return rect(475,188,80,26);
  if(this.getAttribute('aria-label')==='复制消息')return rect(500,150,30,30);
  if(this.classList.contains('dsh-ie-tip-bubble'))return rect(0,0,80,26);
  return originalRect.call(this);
 };
 try{
  await mount();
  await act(async()=>button('复制消息').dispatchEvent(new dom.window.MouseEvent('mouseover',{bubbles:true})));
  await act(async()=>t.mock.timers.tick(220));
  const tip=document.querySelector('[role=tooltip]');
  assert.equal(tip.dataset.side,'bottom');assert.equal(tip.style.left,'515px');assert.equal(tip.style.top,'188px');
 }finally{HTMLElement.prototype.getBoundingClientRect=originalRect;nativeButton.remove();}
});
test('styling uses host control tokens and never reshapes the host dialog',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 const tip=readFileSync(new URL('../src/vendor/dsh-tooltip.css',import.meta.url),'utf8');
 assert.ok(css.includes('--dsw-alias-button-primary-fill'));assert.ok(css.includes('--dsw-alias-label-primary-foreground'));
 assert.equal(css.includes('[role=dialog]'),false);assert.ok(tip.includes('--dsw-font-family'));assert.ok(tip.includes('--dsw-alias-tooltip-bg'));
});
test('information hint becomes visible without waiting for ResizeObserver delivery',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});const Original=globalThis.ResizeObserver;
 globalThis.ResizeObserver=class{observe(){}disconnect(){}};
 try {await mount();await click('编辑消息');const info=document.querySelector('.dsh-ie-info');
 await act(async()=>info.dispatchEvent(new dom.window.MouseEvent('mouseover',{bubbles:true})));
 await act(async()=>t.mock.timers.tick(220));
 const tip=document.querySelector('[role=tooltip]');assert.ok(tip);assert.equal(tip.style.visibility,'visible');
 }finally{await act(async()=>root.unmount());root=null;globalThis.ResizeObserver=Original;}
});
const previewImage={type:'image',attachment:{attachmentId:'preview-image',name:'photo.png',mediaType:'image/png',bytes:3}};
test('editing shows a retained image thumbnail through the host loader without reading ordinary files',async()=>{
 const reads=[],revokes=[];const previous=URL.revokeObjectURL;URL.revokeObjectURL=url=>revokes.push(url);
 try{
  const calls=await mount({node:{...node,data:{...node.data,content:[previewImage,node.data.content[1]]}},loadImage:async ref=>{reads.push(ref);return 'blob:host-image';}});
  assert.equal(reads.length,0);await click('编辑消息');
  const image=document.querySelector('.dsh-ie-file img');assert.ok(image);assert.equal(image.getAttribute('src'),'blob:host-image');assert.equal(image.alt,'photo.png');
  assert.deepEqual(reads,[previewImage.attachment]);assert.ok(attachmentToken('old.txt'));assert.equal(button('移除 old.txt'),undefined);
  await type('新问题');assert.equal(reads.length,1,'typing must not reload a retained image');
  await click('发送');assert.equal(calls[0].attachments[0].ref,previewImage.attachment);
  assert.deepEqual(revokes,[],'host-owned URLs must not be revoked by the editor');
 }finally{URL.revokeObjectURL=previous;}
});
for(const failure of ['reject','throw','empty','decode']) test('image preview '+failure+' keeps a usable attachment card',async()=>{
 const calls=await mount({node:{...node,data:{...node.data,content:[previewImage]}},loadImage:()=>{
  if(failure==='throw')throw Error('read failed');if(failure==='reject')return Promise.reject(Error('read failed'));
  return Promise.resolve(failure==='empty'?null:'blob:invalid-image');
 }});
 await click('编辑消息');
 if(failure==='decode'){const image=document.querySelector('.dsh-ie-file img');assert.ok(image);await act(async()=>image.dispatchEvent(new Event('error')));}
 assert.equal(document.querySelector('.dsh-ie-file img'),null);assert.ok(document.querySelector('.dsh-ie-file-icon'));
 assert.ok(button('移除 photo.png'));assert.match(document.querySelector('.dsh-ie-file').textContent,/photo.png/);
 assert.equal(button('发送').disabled,false);
 await click('移除 photo.png');assert.equal(button('发送').disabled,true);assert.equal(calls.length,0);
});
test('late image preview from a cancelled editor cannot replace the next editor preview',async()=>{
 const pending=[];
 await mount({node:{...node,data:{...node.data,content:[previewImage]}},loadImage:()=>new Promise(resolve=>pending.push(resolve))});
 await click('编辑消息');assert.equal(pending.length,1);await click('取消');
 await click('编辑消息');assert.equal(pending.length,2);
 await act(async()=>pending[1]('blob:new-editor'));assert.equal(document.querySelector('.dsh-ie-file img').getAttribute('src'),'blob:new-editor');
 await act(async()=>pending[0]('blob:cancelled-editor'));assert.equal(document.querySelector('.dsh-ie-file img').getAttribute('src'),'blob:new-editor');
});
test('new image previews revoke only their own object URLs on removal and cancellation',async()=>{
 const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,created=[],revoked=[];
 URL.createObjectURL=file=>{const url='blob:local-'+created.length;created.push({file,url});return url;};
 URL.revokeObjectURL=url=>revoked.push(url);
 try{
  await mount();await click('编辑消息');
  async function addImage(name){await act(async()=>{const picker=document.querySelector('input[type=file]');Object.defineProperty(picker,'files',{value:[new File(['png'],name,{type:'image/png'})],configurable:true});picker.dispatchEvent(new Event('change',{bubbles:true}));});}
  await addImage('first.png');assert.equal(document.querySelector('.dsh-ie-file img').getAttribute('src'),'blob:local-0');
  await click('移除 first.png');assert.deepEqual(revoked,['blob:local-0']);
  await addImage('second.png');await click('取消');assert.deepEqual(revoked,['blob:local-0','blob:local-1']);
 }finally{URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;}
});

async function openImagePreview(name='photo.png') {
 const opener=button(`查看图片：${name}`);
 assert.ok(opener,'a loaded image must have an accessible preview button');
 assert.ok(opener.classList.contains('dsh-ie-image-preview'));
 await act(async()=>{opener.focus();opener.click();});
 const dialog=document.querySelector('[role="dialog"][aria-label="图片预览"]');
 assert.ok(dialog,'the released ImageLightbox must open');
 assert.equal(dialog.getAttribute('aria-modal'),'true');
 assert.equal(dialog.parentElement,document.body,'the preview must escape the editor through its native portal');
 return {opener,dialog};
}
async function addPreviewFile(name='new.png') {
 const file=new File(['png'],name,{type:'image/png'});
 await act(async()=>{
  const picker=document.querySelector('input[type=file]');
  Object.defineProperty(picker,'files',{value:[file],configurable:true});
  picker.dispatchEvent(new Event('change',{bubbles:true}));
 });
 return file;
}
for(const trigger of ['Escape','close','mask']) test(`image lightbox closes via ${trigger} without cancelling or submitting the draft`,async()=>{
 const reads=[],revokes=[];const previous=URL.revokeObjectURL;URL.revokeObjectURL=url=>revokes.push(url);
 try {
  const calls=await mount({node:{...node,data:{...node.data,content:[{type:'text',text:'原消息'},previewImage,node.data.content[1]]}},
   loadImage:async ref=>{reads.push(ref);return 'blob:host-lightbox';}});
  await click('编辑消息');await type('保留这份草稿');
  const {opener,dialog}=await openImagePreview();
  assert.equal(dialog.querySelector('img').getAttribute('src'),opener.querySelector('img').getAttribute('src'));
  assert.equal(dialog.querySelector('img').alt,'photo.png');
  assert.deepEqual(reads,[previewImage.attachment],'opening the image must reuse its already loaded host URL');
  assert.equal(document.activeElement,button('关闭预览'));
  await act(async()=>{
   if(trigger==='Escape')document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
   else if(trigger==='close')button('关闭预览').click();
   else dialog.querySelector('div[aria-hidden="true"]').dispatchEvent(new dom.window.MouseEvent('mousedown',{bubbles:true}));
  });
  assert.equal(document.querySelector('[role="dialog"]'),null);
  assert.equal(document.activeElement,opener);
  assert.equal(editor().value,'保留这份草稿');
  assert.ok(button('移除 photo.png'));assert.ok(attachmentToken('old.txt'));assert.equal(button('移除 old.txt'),undefined);assert.equal(calls.length,0);
  assert.deepEqual(revokes,[],'closing the lightbox must not revoke host-owned URLs');
  await act(async()=>root.unmount());root=null;
  assert.deepEqual(revokes,[],'unmounting must also preserve host URL ownership');
 }finally{URL.revokeObjectURL=previous;}
});
test('image lightbox reuses a new image URL until the attachment is removed',async()=>{
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL,created=[],revoked=[];
 URL.createObjectURL=file=>{created.push(file);return 'blob:new-lightbox';};URL.revokeObjectURL=url=>revoked.push(url);
 try {
  const calls=await mount();await click('编辑消息');await type('新图片草稿');
  const file=await addPreviewFile();
  const {dialog}=await openImagePreview('new.png');
  assert.equal(dialog.querySelector('img').getAttribute('src'),'blob:new-lightbox');
  await click('关闭预览');assert.deepEqual(created,[file]);assert.deepEqual(revoked,[]);
  await openImagePreview('new.png');await click('关闭预览');
  assert.deepEqual(created,[file]);assert.deepEqual(revoked,[],'reopening must not allocate or retire an attachment URL');
  assert.equal(editor().value,'新图片草稿');assert.ok(attachmentToken('old.txt'));assert.equal(button('移除 old.txt'),undefined);assert.equal(calls.length,0);
  await click('移除 new.png');assert.deepEqual(revoked,['blob:new-lightbox']);assert.equal(calls.length,0);
 }finally{await act(async()=>root?.unmount());root=null;URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});
test('image lightbox traps forward and reverse Tab and restores the thumbnail focus',async()=>{
 const calls=await mount({node:{...node,data:{...node.data,content:[previewImage]}},loadImage:async()=>'blob:keyboard-image'});
 await click('编辑消息');const {opener,dialog}=await openImagePreview();
 for(const shiftKey of [false,true]) {
  const event=new KeyboardEvent('keydown',{key:'Tab',shiftKey,bubbles:true,cancelable:true});
  await act(async()=>document.activeElement.dispatchEvent(event));
  assert.equal(event.defaultPrevented,true);assert.equal(document.activeElement,button('关闭预览'));
 }
 await act(async()=>dialog.querySelector('img').dispatchEvent(new dom.window.MouseEvent('mousedown',{bubbles:true})));
 assert.equal(document.querySelector('[role="dialog"]'),dialog,'the enlarged image is not the dismissal mask');
 await click('关闭预览');assert.equal(document.activeElement,opener);assert.equal(calls.length,0);
});
test('image lightbox closes when its loader source changes and does not display a stale URL',async()=>{
 const revoked=[],calls=[];const revoke=URL.revokeObjectURL;URL.revokeObjectURL=url=>revoked.push(url);
 const props={node:{...node,data:{...node.data,content:[previewImage]}},sessionId:'preview-source-change',
  useSession:()=>({openState:'open',running:false}),renderFactorySlot:()=>null,
  coordinator:{save:async args=>{calls.push(args);return {childId:'child'};}},openSession:()=>{},loadImage:async()=>'blob:first-source'};
 try {
  await mount(props);await click('编辑消息');await type('换源时保留');await openImagePreview();
  await act(async()=>root.render(React.createElement(client.EditableMessage,{...props,loadImage:async()=>'blob:second-source'})));
  assert.equal(document.querySelector('[role="dialog"]'),null);
  assert.equal(button('查看图片：photo.png').querySelector('img').getAttribute('src'),'blob:second-source');
  const {dialog}=await openImagePreview();assert.equal(dialog.querySelector('img').getAttribute('src'),'blob:second-source');
  await click('关闭预览');assert.equal(editor().value,'换源时保留');assert.equal(calls.length,0);
  assert.deepEqual(revoked,[]);
 }finally{await act(async()=>root?.unmount());root=null;URL.revokeObjectURL=revoke;}
});
test('unmounting an open image lightbox removes its portal and keyboard capture and releases its local URL',async()=>{
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL,revoked=[];
 URL.createObjectURL=()=>'blob:unmounted-lightbox';URL.revokeObjectURL=url=>revoked.push(url);
 try {
  const calls=await mount();await click('编辑消息');await addPreviewFile();await openImagePreview('new.png');
  await act(async()=>root.unmount());root=null;
  assert.equal(document.querySelector('[role="dialog"]'),null);assert.deepEqual(revoked,['blob:unmounted-lightbox']);
  const event=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
  document.dispatchEvent(event);assert.equal(event.defaultPrevented,false,'native capture listeners must be removed with the portal');
  assert.equal(calls.length,0);
 }finally{await act(async()=>root?.unmount());root=null;URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});

async function withEditorScrollGeometry(run) {
 const host=document.getElementById('root'),scroller=document.createElement('div'),following=document.createElement('p');
 const originalRect=HTMLElement.prototype.getBoundingClientRect,originalFocus=HTMLElement.prototype.focus;
 const originalHeight=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'scrollHeight');
 scroller.style.overflowY='auto';scroller.style.overflowAnchor='none';scroller.setAttribute('data-conversation-scroll','');
 host.before(scroller);scroller.append(host,following);following.textContent='下方的模型回复';
 const state={top:300,writes:[],focus:[],nativeAnchoring:false,lastHeight:80};
 const areaHeight=area=>Math.max(62,area.value.split('\n').length*30);
 const sectionHeight=()=>{const area=host.querySelector(editorSelector);return area?72+(parseFloat(area.style.height)||62)+host.querySelectorAll('.dsh-ie-file').length*56:80;};
 function sectionRect(){
  const height=sectionHeight();
  if(state.nativeAnchoring)state.top+=height-state.lastHeight;
  state.lastHeight=height;
  return {left:100,right:500,width:400,top:1000-state.top,bottom:1000-state.top+height,height};
 }
 Object.defineProperties(scroller,{
  scrollTop:{get:()=>state.top,set:value=>{
   state.top=Math.max(0,Math.min(scroller.scrollHeight-scroller.clientHeight,value));
   state.writes.push({top:state.top,textareaHeight:host.querySelector(editorSelector)?.style.height});
  }},
  clientHeight:{get:()=>500},scrollHeight:{get:()=>2000+sectionHeight()},
 });
 scroller.scrollTo=options=>{assert.equal(options.behavior,'instant');scroller.scrollTop=options.top;};
 Object.defineProperty(HTMLElement.prototype,'scrollHeight',{configurable:true,get(){return this.matches(editorSelector)?areaHeight(this):0;}});
 HTMLElement.prototype.getBoundingClientRect=function(){
  if(this.matches('.dsh-ie'))return sectionRect();
  if(this===following){const bottom=sectionRect().bottom;return {left:100,right:500,width:400,top:bottom+16,bottom:bottom+96,height:80};}
  return originalRect.call(this);
 };
 HTMLElement.prototype.focus=function(options){
  if(this.matches(editorSelector+',[aria-label="编辑消息"]')){
   state.focus.push({element:this,options});
   // Model the extra browser scroll that preventScroll must suppress.
   if(!options?.preventScroll)scroller.scrollTop+=120;
  }
  return originalFocus.call(this,options);
 };
 try{await run({state,scroller,following,position:()=>following.getBoundingClientRect().top});}
 finally{
  await act(async()=>root?.unmount());root=null;
  HTMLElement.prototype.getBoundingClientRect=originalRect;HTMLElement.prototype.focus=originalFocus;
  if(originalHeight)Object.defineProperty(HTMLElement.prototype,'scrollHeight',originalHeight);else delete HTMLElement.prototype.scrollHeight;
  scroller.before(host);scroller.remove();
 }
}

test('editor scroll anchoring waits for initial textarea sizing before restoring position and focus',async()=>{
 await withEditorScrollGeometry(async({state,scroller,position})=>{
  await mount({node:{...node,data:{...node.data,content:[{type:'text',text:'第一行\n第二行\n第三行\n第四行'}]}}});
  const before=position();await click('编辑消息');
  const area=editor();
  assert.equal(area.style.height,'120px');
  assert.equal(position(),before,'the following model response must stay at its original viewport position');
  assert.deepEqual(state.writes,[{top:412,textareaHeight:'120px'}],'scroll compensation must run after the final textarea height is applied');
  assert.equal(document.activeElement,area);assert.deepEqual(state.focus.map(call=>call.options),[{preventScroll:true}]);
  assert.equal(scroller.style.overflowAnchor,'none','the native anchoring policy must remain unchanged');
 });
});

test('editor scroll anchoring preserves the lower edge through multiline growth and keyboard cancellation',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 await withEditorScrollGeometry(async({state,position})=>{
  await mount();const before=position();await click('编辑消息');
  const openingTop=state.top;
  await type('第一行\n第二行\n第三行\n第四行\n第五行');
  assert.equal(editor().style.height,'150px');
  assert.equal(state.top,openingTop+88);assert.equal(position(),before);
  assert.equal(state.writes.at(-1).textareaHeight,'150px');
  await act(async()=>editor().dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  await act(async()=>t.mock.timers.tick(1));
  assert.equal(editor(),null);assert.equal(state.top,300);assert.equal(position(),before);
  assert.equal(document.activeElement,button('编辑消息'));assert.deepEqual(state.focus.at(-1).options,{preventScroll:true});
 });
});

test('editor scroll anchoring keeps following content stable when image attachments are added and removed',async()=>{
 await withEditorScrollGeometry(async({state,position})=>{
  await mount({node:{...node,data:{...node.data,content:[node.data.content[0],previewImage]}}});const before=position();await click('编辑消息');const openingTop=state.top;
  await act(async()=>{
   const picker=document.querySelector('input[type=file]');
   Object.defineProperty(picker,'files',{value:[new File(['second'],'second.png',{type:'image/png'})],configurable:true});
   picker.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(document.querySelectorAll('.dsh-ie-file').length,2);assert.equal(state.top,openingTop+56);assert.equal(position(),before);
  await click('移除 photo.png');assert.equal(state.top,openingTop);assert.equal(position(),before);
  await click('移除 second.png');assert.equal(state.top,openingTop-56);assert.equal(position(),before);
 });
});

test('editor scroll anchoring leaves native compensation intact instead of scrolling twice',async()=>{
 await withEditorScrollGeometry(async({state,scroller,position})=>{
  await mount();const before=position();state.nativeAnchoring=true;scroller.style.overflowAnchor='auto';
  await click('编辑消息');assert.equal(position(),before);
  await type('第一行\n第二行\n第三行\n第四行');assert.equal(position(),before);
  await removeAttachment('old.txt');assert.equal(position(),before);
  await act(async()=>button('取消').dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,detail:1})));
  assert.equal(position(),before);assert.deepEqual(state.writes,[]);
  assert.equal(scroller.style.overflowAnchor,'auto');
 });
});

afterEach(async()=>{await act(async()=>root?.unmount());root=null;});
after(()=>dom.window.close());
