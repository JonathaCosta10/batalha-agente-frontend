import test from 'node:test';
import assert from 'node:assert/strict';
import {openingReply,Backend,ApiError} from './backend';
import {BUSY,telaDeErro} from './errorScreen';
import {OPENING_FAILED,openingFromState,openingLoadingText} from './openingLoad';

const OLD_FAKE='Ainda não recebi os dados para apontar um ajuste com segurança';

test('first message uses server-grounded observation and directed question',()=>{
 const message='Em novembro de 2025, suas saídas ficaram R$ 200,00 acima das entradas. Esse gasto foi de rotina ou excepcional?';
 assert.equal(openingReply({opening:{message,phase:'understand_spending'}}),message);
 assert.deepEqual(openingFromState({opening:{message}}),{ok:true,message});
});

test('missing opening is an error state, never a bot message',()=>{
 assert.equal(openingReply({}),null);
 for(const state of [{},{opening:null},{opening:{message:''}},{opening:{message:'   '}},null,undefined]){
  const r=openingFromState(state as never,1000);
  assert.equal(r.ok,false);
  if(!r.ok){
   assert.equal(r.failure.kind,'missing');assert.equal(r.failure.action,'tentar_de_novo');assert.equal(r.failure.retryAfterS,null);
   assert.equal(r.failure.title,OPENING_FAILED);assert.ok(!JSON.stringify(r.failure).includes(OLD_FAKE));
  }
 }
 assert.equal(OPENING_FAILED,'Não consegui carregar a abertura da conversa agora (NAO_MEDIDO).');
});

test('429/503 on the opening say the service is busy and offer retry',()=>{
 for(const status of [429,503]){
  const s=telaDeErro(new ApiError('x',status),'abertura');
  assert.equal(s.kind,'busy');assert.equal(s.action,'tentar_de_novo');assert.ok(s.detail.startsWith(BUSY));
 }
});

test('retry resets the state: the next attempt starts from loading and a good answer clears the failure',()=>{
 const failed=telaDeErro(new ApiError('x',503),'abertura',0);
 assert.equal(failed.kind,'busy');
 assert.deepEqual(openingFromState({opening:{message:'Olá de volta.'}}),{ok:true,message:'Olá de volta.'});
 assert.equal(openingLoadingText(3.7),'Carregando a abertura da conversa… 3s');
 assert.equal(openingLoadingText(-2),'Carregando a abertura da conversa… 0s');
});

test('backend: HTML 403 (CSRF) and 429 with erro_api become ApiError, not SyntaxError',async()=>{
 const html=new Backend((async()=>new Response('<html>CSRF verification failed</html>',{status:403,headers:{'Content-Type':'text/html'}})) as typeof fetch,()=> '');
 await assert.rejects(()=>html.open(),(e:unknown)=> e instanceof ApiError && e.status===403);
 const busy=new Backend((async()=>new Response(JSON.stringify({erro:'Aguarde.',erro_api:{acao_cliente:'aguardar_e_tentar_novamente',tentar_novamente_em_s:12,mensagem:'Fila cheia.'}}),{status:429,headers:{'Retry-After':'40'}})) as typeof fetch,()=> '');
 await assert.rejects(()=>busy.open(),(e:unknown)=> e instanceof ApiError && e.status===429 && e.erroApi?.tentar_novamente_em_s===12 && e.retryAfterS===40);
 const s=await busy.open().then(()=>null,e=>telaDeErro(e,'abertura',0));
 assert.equal(s?.retryAfterS,12);assert.equal(s?.serverMessage,'Fila cheia.');
});

test('opening call uses the short first-query ceiling (timer), not the 50 s chat one',async()=>{
 const hanging=((_:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>((_r,reject)=>{init?.signal?.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')));})) as typeof fetch;
 const api=new Backend(hanging,()=> '',5);
 await assert.rejects(()=>api.open(),(e:unknown)=> e instanceof ApiError && e.status===0);
});
