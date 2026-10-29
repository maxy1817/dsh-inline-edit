/** ONLY for an isolated DSH_HOME. Never reads API keys or makes model HTTP requests. */
import { LlmAdapter } from '@deepseek-ai/dsh-llm';
import { writeFile } from 'node:fs/promises';
export const name='dsh-inline-edit-offline-test';
export const inject=['llm','sessionQuery'];
class OfflineAdapter extends LlmAdapter {
 constructor(ctx){super();this.ctx=ctx;}
 providerInfo(id){return {id,name:'本地插件测试（无 API）'};}
 async listModels(provider){return [{provider,id:'offline',name:'离线测试模型',inputModalities:['text','image']}];}
 async resolveModel(provider,id){return {...(await this.listModels(provider))[0],id,context:{contextWindow:100000},defaultMaxTokens:1024};}
 async *stream(options){
  options.signal?.throwIfAborted();
  if(process.env.DSH_IE_TEST_TRACE && options.sessionId && !options.purpose){
   const o=await this.ctx.sessionQuery.observeSession(options.sessionId);
   try { await writeFile(process.env.DSH_IE_TEST_TRACE,JSON.stringify({sessionId:options.sessionId,messages:options.messages,events:o.events},null,2)); }
   finally { o[Symbol.dispose](); }
  }
  const last=options.messages.findLast(m=>m.role==='user'&&m.source?.kind==='user');
  if (last?.content?.some(b=>b.type==='text' && b.text.includes('[慢速测试]'))) await new Promise((resolve,reject)=>{const t=setTimeout(resolve,6000);options.signal?.addEventListener('abort',()=>{clearTimeout(t);reject(Error('aborted'));},{once:true});});
  const files=last?.content?.filter(b=>b.type==='file').map(b=>b.attachment.name)||[];
  const texts=last?.content?.filter(b=>b.type==='text').map(b=>b.text)||[];
  const text=options.purpose==='session-title'?'编辑功能测试': '离线测试已收到：'+texts.join('').split('[File ')[0].trim().slice(0,200)+(files.length?'；文件：'+files.join('、'):'')+'。此回复由本地测试适配器生成，未调用外部模型。';
  yield {type:'block-start',index:0,blockType:'text'};
  yield {type:'text-delta',index:0,text};
  yield {type:'block-end',index:0,block:{type:'text',text}};
  yield {type:'usage',usage:{inputTokens:1,outputTokens:1}};
  yield {type:'finish',reason:{kind:'stop'}};
 }
}
export function apply(ctx){ctx.effect(()=>ctx.llm.registerAdapter(['inline-edit-test'],new OfflineAdapter(ctx)));}
