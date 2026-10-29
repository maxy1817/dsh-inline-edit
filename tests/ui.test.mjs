import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {loadNativeTooltip} from './helpers/native-primitives.mjs';
const dom=new JSDOM('<!doctype html><html lang="zh-CN"><head></head><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','navigator','Node','HTMLElement','HTMLTextAreaElement','Event','KeyboardEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
globalThis.ResizeObserver=class {
 constructor(callback){this.callback=callback;}
 observe(target){this.callback([{target,borderBoxSize:[{inlineSize:240,blockSize:40}]}]);}
 disconnect(){}
};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');
const {act}=React;
const {createRoot}=await import('react-dom/client');
const require=createRequire(import.meta.url);let client;
const nativePrimitives=await loadNativeTooltip(require);
window.__ModuleLoader__={load:definition=>{client=definition.factory(id=>id==='@deepseek-ai/dsh-client-ui-primitives'?nativePrimitives:require(id));}};
vm.runInThisContext(readFileSync(new URL('../lib/client.js',import.meta.url),'utf8'));
let root;
const node={kind:'user',data:{seq:3,time:0,content:[{type:'text',text:'原消息'},{type:'file',attachment:{attachmentId:'abc',name:'old.txt',bytes:3}}]}};
function button(name){return [...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||b.textContent)===name);}
async function click(name){await act(async()=>button(name).click());}
async function type(text){await act(async()=>{const el=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,text);el.dispatchEvent(new Event('input',{bubbles:true}));});}
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
test('native client artifact loads using host module-loader wrapper',()=>{assert.equal(client.name,'dsh-inline-edit');assert.equal(typeof client.apply,'function');assert.ok(client.inject.includes('fileUpload'));});
test('cancel restores both text and original attachments without a save',async()=>{
 const calls=await mount();await click('编辑消息');await type('改过');await click('移除 old.txt');await click('取消');
 assert.equal(document.querySelector('textarea'),null);assert.equal(calls.length,0);
 await click('编辑消息');assert.equal(document.querySelector('textarea').value,'原消息');assert.ok(button('移除 old.txt'));assert.equal(button('发送').disabled,true);
});
test('text-only edit sends while retaining attachment',async()=>{
 const calls=await mount();await click('编辑消息');assert.equal(button('发送').disabled,true);await type('新内容');assert.equal(button('发送').disabled,false);await click('发送');
 assert.equal(calls.length,1);assert.equal(calls[0].text,'新内容');assert.equal(calls[0].attachments[0].ref.name,'old.txt');
});
test('attachment-only removal enables send and sends unchanged text',async()=>{
 const calls=await mount();await click('编辑消息');await click('移除 old.txt');assert.equal(button('发送').disabled,false);await click('发送');
 assert.equal(calls[0].text,'原消息');assert.equal(calls[0].attachments.length,0);
});
test('attachment-only addition enables send, keeps original and new file',async()=>{
 const calls=await mount();await click('编辑消息');
 await act(async()=>{const input=document.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:[new File(['replacement'],'new.txt')],configurable:true});input.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.ok(button('移除 new.txt'));assert.equal(button('发送').disabled,false);await click('发送');
 assert.equal(calls[0].attachments.length,2);assert.equal(calls[0].text,'原消息');
});
test('IME Enter does not send; ordinary Enter remains newline; Ctrl+Enter submits',async()=>{
 const calls=await mount();await click('编辑消息');await type('已修改');
 await act(async()=>document.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,isComposing:true,bubbles:true})));
 assert.equal(calls.length,0);
 await act(async()=>document.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
 assert.equal(calls.length,0);
 await act(async()=>document.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,bubbles:true})));
 assert.equal(calls.length,1);
});
test('Escape cancels; repeated click cannot submit twice while pending',async()=>{
 let release,count=0;
 await mount({coordinator:{save:()=>{count++;return new Promise(r=>{release=r;});}}});await click('编辑消息');await type('changed');
 await act(async()=>document.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 assert.equal(document.querySelector('textarea'),null);assert.equal(count,0);
 await click('编辑消息');await type('changed');await act(async()=>{button('发送').click();button('发送').click();});
 assert.equal(count,1);assert.equal(button('取消').disabled,true);
 await act(async()=>release({childId:'child'}));
});
test('failed submission keeps draft and offers branch recovery without retry',async()=>{
 let count=0;await mount({coordinator:{save:async()=>{count++;throw {code:'branchFailed',childId:'child'};}}});
 await click('编辑消息');await type('keep this');await click('发送');
 assert.equal(document.querySelector('textarea').value,'keep this');assert.ok(button('打开新分支检查'));assert.equal(button('发送').disabled,true);assert.equal(count,1);
});

test('current mode edits only the last user message and never navigates to a new session',async()=>{
 await mount({mode:'current',latestSeq:9});await click('编辑消息');assert.equal(document.querySelector('textarea'),null);
 assert.match(button('编辑消息').getAttribute('aria-description'),/只能编辑最近一条主消息/);
 const calls=await mount({mode:'current',latestSeq:3,coordinator:{save:async()=>({sessionId:'source'})},openSession:()=>assert.fail('must not navigate')});
 await click('编辑消息');await type('原地修改');await click('发送');assert.equal(document.querySelector('textarea'),null);
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
 await click('编辑消息');await type('修改');await click('发送');assert.equal(button('发送').disabled,true);assert.equal(document.querySelector('textarea').disabled,true);assert.equal(count,1);
});

test('supplemental messages have no edit control in current mode',async()=>{
 await mount({mode:'current',latestSeq:3,supplemental:true});assert.equal(button('编辑消息'),undefined);assert.ok(button('复制消息'));
 await mount({mode:'current',latestSeq:3,node:{...node,kind:'steering'}});assert.equal(button('编辑消息'),undefined);
});
test('editing waits for saved settings instead of accidentally using branch fallback',async()=>{
 const calls=await mount({settingsReady:false});await click('编辑消息');
 assert.equal(document.querySelector('textarea'),null);assert.equal(calls.length,0);
 assert.match(button('编辑消息').getAttribute('aria-description'),/尚未加载完成/);
});

test('unknown outcome survives cancel and component remount until explicit confirmation',async()=>{
 let count=0;const props={sessionId:'persistent-unknown',mode:'current',latestSeq:3,coordinator:{save:async()=>{count++;throw {code:'currentUncertain'};}}};
 await mount(props);await click('编辑消息');await type('修改');await click('发送');await click('取消');await click('编辑消息');
 assert.equal(document.querySelector('textarea'),null);assert.equal(count,1);
 await mount(props);await click('编辑消息');assert.equal(document.querySelector('textarea'),null);
 window.confirm=()=>false;await click('我已检查提交结果');assert.ok(button('我已检查提交结果'));
 window.confirm=()=>true;await click('我已检查提交结果');await click('编辑消息');assert.ok(document.querySelector('textarea'));assert.equal(count,1);
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
 assert.match(document.querySelector('[role=tooltip]').textContent,/只能编辑最近一条主消息/);
 assert.equal(document.querySelector('textarea'),null);assert.equal(calls.length,0);
});

test('edit restriction notice clears immediately when the setting makes editing available',async()=>{
 await mount();
 const props={node,sessionId:'notice-mode-change',mode:'current',latestSeq:9,useSession:()=>({openState:'open',running:false}),renderFactorySlot:()=>null,coordinator:{save:async()=>assert.fail('must not submit')},openSession:()=>{}};
 await act(async()=>root.render(React.createElement(client.EditableMessage,props)));
 await click('编辑消息');assert.equal(document.querySelector('.dsh-ie-notice'),null);
 await act(async()=>root.render(React.createElement(client.EditableMessage,{...props,mode:'branch'})));
 assert.equal(document.querySelector('.dsh-ie-notice'),null);
 await click('编辑消息');assert.ok(document.querySelector('textarea'));
});

test('submission failures and uncertain outcomes stay visible after the notice timeout',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 await mount({coordinator:{save:async()=>{throw {code:'fileUpload'};}}});
 await click('编辑消息');await type('保留草稿');await click('发送');
 await act(async()=>t.mock.timers.tick(10000));
 assert.match(document.querySelector('.dsh-ie-error').textContent,/文件上传失败/);
 assert.equal(document.querySelector('textarea').value,'保留草稿');
 await mount({sessionId:'persistent-error-timer',mode:'current',latestSeq:3,coordinator:{save:async()=>{throw {code:'currentUncertain'};}}});
 await click('编辑消息');await type('等待确认');await click('发送');
 await act(async()=>t.mock.timers.tick(10000));
 assert.match(document.body.textContent,/暂时无法确认提交状态/);assert.equal(button('发送').disabled,true);
});

test('malformed attachments do not crash message rendering and cannot be edited',async()=>{
 for(const content of [[{type:'file'}],[null],null,[{type:'image',attachment:{attachmentId:'bad',bytes:-1}}]]){
  await mount({node:{kind:'user',data:{seq:3,content}}});await click('编辑消息');assert.equal(document.querySelector('textarea'),null);assert.match(button('编辑消息').getAttribute('aria-description'),/暂不支持/);
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
 if(outcome!=='uncertain'){assert.doesNotMatch(document.body.textContent,/暂时无法确认提交状态/);await click('编辑消息');assert.ok(document.querySelector('textarea'));}
});
test('copy and attachment actions use the same native-style tooltip without browser titles',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const [label,expected,edit] of [['复制消息',/复制消息/,false],['添加文件',/添加文件/,true],['移除 old.txt',/原文件/,true]]){
  await mount();if(edit)await click('编辑消息');const anchor=button(label);
  assert.equal(anchor.hasAttribute('title'),false);
  await act(async()=>anchor.dispatchEvent(new dom.window.MouseEvent('mouseover',{bubbles:true})));
  await act(async()=>t.mock.timers.tick(220));assert.match(document.querySelector('[role=tooltip]').textContent,expected);
 }
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
after(async()=>{await act(async()=>root?.unmount());dom.window.close();});
