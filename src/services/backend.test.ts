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
 const api=new Backend(scripted([[201,{sessao_id:'abc',usuario:{codigo:'00108ccd-699c-453a-a9f9-a66aad6e03e5'}}],[200,{mode:'demo_live',usuario:{codigo:'u1',pessoa:'Maria'}}],[200,{reply:'ok',conversation_id:'c1',status:'ok'}]],calls),()=> 'csrftoken=t');
 const b=await api.bootstrap();
 assert.equal(b.usuario?.pessoa,'Maria');
 assert.ok(calls[0].url.endsWith('perfil-usuario/definir/'));
 // Page load: the server draws the person (backend 94287d0); the front keeps the UUID it answered.
 assert.deepEqual(JSON.parse(String(calls[0].init.body)),{usuario:'aleatorio'});
 assert.deepEqual(api.userPick,{id:'00108ccd-699c-453a-a9f9-a66aad6e03e5',origem:'aleatorio'});
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
 assert.equal(api.userPick,null);
});

test('older team backend: 400 to "aleatorio" falls back to the list draw, then definir/ by UUID',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[400,{}],[200,{total:1,usuarios:[{id_usuario:'001221d1-3626-45c1-807a-990502adf808'}]}],[201,{sessao_id:'x'}],[200,{mode:'demo_live'}]],calls),()=> '');
 await api.bootstrap();
 assert.ok(calls[1].url.endsWith('usuario-real/?limite=1'));
 assert.deepEqual(JSON.parse(String(calls[2].init.body)),{usuario:'001221d1-3626-45c1-807a-990502adf808'});
 assert.deepEqual(api.userPick,{id:'001221d1-3626-45c1-807a-990502adf808',origem:'aleatorio'});
});

test('expired session: chat 404 reopens the session once and resends as a new conversation',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[404,{}],[201,{sessao_id:'new'}],[200,{mode:'demo'}],[200,{reply:'ok',conversation_id:'c2',status:'ok'}]],calls),()=> '');
 api.sessionId='old';api.userPick={id:'001221d1-3626-45c1-807a-990502adf808',origem:'aleatorio'};
 const r=await api.chat('oi','c-old','m1');
 assert.equal(r.conversation_id,'c2');
 assert.equal(JSON.parse(String(calls[3].init.body)).conversation_id,null);
 assert.equal(header(calls[3],'X-Sessao-Id'),'new');
 // Same person across the expiry: no new draw, definir/ gets the id already picked.
 assert.ok(!calls.some(c=>c.url.includes('usuario-real/')));
 assert.equal(JSON.parse(String(calls[1].init.body)).usuario,'001221d1-3626-45c1-807a-990502adf808');
});

const A='00108ccd-699c-453a-a9f9-a66aad6e03e5',B='001221d1-3626-45c1-807a-990502adf808';
test('random pick: total from usuario-real/, random offset, that id goes to definir/',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[200,{total:1000,usuarios:[{id_usuario:A}]}],[200,{total:1000,usuarios:[{id_usuario:B}]}]],calls),()=> '');
 const p=await api.pickUser(null,()=>0.5);
 assert.deepEqual(p,{id:B,origem:'aleatorio'});
 assert.ok(calls[1].url.endsWith('usuario-real/?limite=1&offset=500'));
});

test('negative: "próximo perfil" never draws the current person again',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[200,{total:2,usuarios:[{id_usuario:A}]}],[200,{total:2,usuarios:[{id_usuario:B}]}]],calls),()=> '');
 assert.deepEqual(await api.pickUser(A,()=>0),{id:B,origem:'aleatorio'});
});

test('negative: an unreadable list falls back to the default and says so (origem padrao, not aleatorio)',async()=>{
 const api=new Backend(scripted([[503,{}]],[]),()=> '');
 assert.deepEqual(await api.pickUser(),{id:A,origem:'padrao'});
});

test('próximo perfil on the team backend opens a new definir/ with another person',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[201,{sessao_id:'s2',usuario:{codigo:B}}],[200,{mode:'demo_live'}]],calls),()=> '');
 api.sessionId='s1';api.userPick={id:A,origem:'aleatorio'};
 assert.equal(await api.nextPerson(),true);
 // The server draws, excluding the current person.
 assert.deepEqual(JSON.parse(String(calls[0].init.body)),{usuario:'aleatorio',excluir:A});
 assert.deepEqual(api.userPick,{id:B,origem:'aleatorio'});
 assert.equal(api.sessionId,'s2');
});

test('negative: a 503 on chat is not retried and surfaces the backend message',async()=>{
 const calls:Call[]=[];
 const api=new Backend(scripted([[503,{erro_api:{codigo:503,mensagem:'Tente de novo.'}}]],calls),()=> '');
 await assert.rejects(()=>api.chat('oi',null,'m1'),(e:unknown)=>e instanceof ApiError&&e.status===503);
 assert.equal(calls.length,1);
});
