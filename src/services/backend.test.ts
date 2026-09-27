import test from 'node:test';
import assert from 'node:assert/strict';
import {Backend,ApiError} from './backend';

test('confirmation sends stable id, cookie identity and CSRF, not a customer ID',async()=>{
 const calls:Array<{url:string;init:RequestInit}>=[];
 const transport=(async(url:RequestInfo|URL,init?:RequestInit)=>{calls.push({url:String(url),init:init||{}});return new Response(JSON.stringify({state:{},replayed:false}),{status:201});}) as typeof fetch;
 const api=new Backend(transport,()=> 'csrftoken=testcsrf');
 await api.confirm(4,{} as never,'fixed-id');await api.confirm(4,{} as never,'fixed-id');
 assert.equal(calls[0].init.body,calls[1].init.body);
 assert.equal(calls[0].init.credentials,'same-origin');
 assert.equal((calls[0].init.headers as Record<string,string>)['X-CSRFToken'],'testcsrf');
 assert.ok(!String(calls[0].init.body).includes('customer_id'));
});

test('source failure is not replaced by invented demo values',async()=>{
 const api=new Backend((async()=>new Response(JSON.stringify({erro:'Fonte indisponível'}),{status:503})) as typeof fetch,()=> '');
 await assert.rejects(()=>api.profile(),(e:unknown)=> e instanceof ApiError && e.status===503);
});
type Call={url:string;init:RequestInit};
const scripted=(replies:Array<[number,unknown]>,calls:Call[])=>(async(url:RequestInfo|URL,init?:RequestInit)=>{
 calls.push({url:String(url),init:init||{}});const [status,body]=replies.shift()||[500,{}];
 return new Response(JSON.stringify(body),{status});}) as typeof fetch;
const header=(c:Call,name:string)=>(c.init.headers as Record<string,string>)[name];

test('team backend: definir/ opens the session, sessao/ gets sessao_id, chat sends X-Sessao-Id',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[201,{sessao_id:'abc'}],[200,{mode:'demo_live',usuario:{codigo:'u1',pessoa:'Maria'}}],[200,{reply:'ok',conversation_id:'c1',status:'ok'}]],calls),()=> 'csrftoken=t');
 const b=await api.bootstrap();
 assert.equal(b.usuario?.pessoa,'Maria');
 assert.ok(calls[0].url.endsWith('perfil-usuario/definir/'));
 assert.match(JSON.parse(String(calls[0].init.body)).usuario,/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
 assert.ok(calls[1].url.endsWith('conversas/sessao/?sessao_id=abc'));
 await api.chat('O que eu faço com as sobras?',null,'m1');
 assert.equal(header(calls[2],'X-Sessao-Id'),'abc');
});

test('agent_backend: definir/ 404 falls back to cookie identity, no X-Sessao-Id',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[404,{}],[200,{mode:'demo'}]],calls),()=> '');
 await api.bootstrap();
 assert.ok(calls[1].url.endsWith('conversas/sessao/'));
 assert.equal(header(calls[1],'X-Sessao-Id'),undefined);
});

test('expired session: chat 404 reopens the session once and resends as a new conversation',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[404,{}],[201,{sessao_id:'new'}],[200,{mode:'demo'}],[200,{reply:'ok',conversation_id:'c2',status:'ok'}]],calls),()=> '');
 api.sessionId='old';
 const r=await api.chat('oi','c-old','m1');
 assert.equal(r.conversation_id,'c2');
 assert.equal(JSON.parse(String(calls[3].init.body)).conversation_id,null);
 assert.equal(header(calls[3],'X-Sessao-Id'),'new');
});

test('negative: a 503 on chat is not retried and surfaces the backend message',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[503,{erro_api:{codigo:503,mensagem:'Tente de novo.'}}]],calls),()=> '');
 await assert.rejects(()=>api.chat('oi',null,'m1'),(e:unknown)=>e instanceof ApiError&&e.status===503);
 assert.equal(calls.length,1);
});
