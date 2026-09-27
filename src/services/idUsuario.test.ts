import test from 'node:test';
import assert from 'node:assert/strict';
import {Backend} from './backend';
import {IdentidadeAusente,idUsuarioOf,personFromServer,requireIdUsuario} from './identity';
import {IDENTITY_MISSING,TITLES,errorLine,telaDeErro} from './errorScreen';

// Regra do dono (2026-09-27): a identidade é o id_usuario (UUID) sorteado pelo servidor.
// O backend recusa com 400 qualquer índice. O front nunca envia person.id nem posição.
const ID='00108ccd-699c-453a-a9f9-a66aad6e03e5';

type Call={url:string;body:string};
const recorder=(state:unknown={})=>{
 const calls:Call[]=[];
 const transport=(async(url:RequestInfo|URL,init?:RequestInit)=>{calls.push({url:String(url),body:String(init?.body??'')});
  return new Response(JSON.stringify({state,replayed:false,reply:'ok',conversation_id:null,status:'ok'}),{status:200});}) as typeof fetch;
 return {calls,transport};
};

test('id_usuario ausente: IdentidadeAusente, nenhum pedido feito, e telaDeErro mostra erro claro',async()=>{
 const calls:string[]=[];
 const original=globalThis.fetch;
 globalThis.fetch=(async(url:RequestInfo|URL)=>{calls.push(String(url));return new Response('{}');}) as typeof fetch;
 try{
  const {fetchProposal}=await import('./planApi');
  for(const raw of [{id:1},{id:1,idUsuario:null},{id:1,idUsuario:''},{id:1,idUsuario:'null'}]){
   const person=personFromServer(raw as never);
   assert.equal(person.idUsuario,null);
   await assert.rejects(()=>fetchProposal(person),(e:unknown)=>e instanceof IdentidadeAusente);
   assert.throws(()=>requireIdUsuario(person),IdentidadeAusente);
  }
  assert.equal(calls.length,0,`nenhum pedido sem id_usuario; houve: ${calls.join(', ')}`);
 }finally{globalThis.fetch=original;}
 const s=telaDeErro(new IdentidadeAusente(),'acao');
 assert.equal(s.kind,'session');assert.equal(s.action,'reiniciar_sessao');assert.equal(s.detail,IDENTITY_MISSING);
 assert.equal(s.title,TITLES.acao);
 assert.ok(errorLine(s).includes('id_usuario'));assert.ok(!errorLine(s).includes('identidade_ausente'));
});

test('nunca se usa número/índice como identidade: só UUID passa',()=>{
 for(const v of [0,1,2,'1','2','42',' 7 ',1.5,-1,'Pessoa 1 da base','00108ccd'])
  assert.equal(idUsuarioOf(v),null,`"${String(v)}" não é id_usuario`);
 // person.id numérico nunca é promovido a idUsuario
 assert.equal(personFromServer({id:3} as never).idUsuario,null);
 assert.throws(()=>requireIdUsuario({idUsuario:'3'}),IdentidadeAusente);
 assert.equal(requireIdUsuario(personFromServer({id:3,idUsuario:ID} as never)),ID);
 assert.equal(personFromServer({id:3,id_usuario:ID.toUpperCase()} as never).idUsuario,ID);
});

test('nenhum pedido do front leva índice ou person.id no corpo nem na URL',async()=>{
 const person={id:7,idUsuario:ID};
 const {calls,transport}=recorder({profile:{person}});
 const api=new Backend(transport,()=> 'csrftoken=t');
 await api.bootstrap();await api.profile();await api.state();await api.open(false);await api.open(true);
 await api.propose();await api.confirm(1,{} as never,'cid');await api.progress(1,'card',0);
 await api.withdraw();await api.reset();await api.chat('olá',null,'mid');
 // 12 = the 11 routes + perfil-usuario/definir/ that bootstrap() calls first (team backend, 2026-09-27).
 assert.equal(calls.length,12);
 for(const c of calls){
  // The fallback draw only reads the list; its offset is a page position, never an identity.
  if(/usuario-real\/\?limite=1(&offset=\d+)?$/.test(c.url)){assert.equal(c.body,'',`${c.url} leva corpo`);continue;}
  const body=c.body?JSON.parse(c.body) as Record<string,unknown>:{};
  // definir/ is the one route whose contract carries `usuario`: the id_usuario UUID or the server draw "aleatorio"
  // (backend 94287d0), never an index; `excluir`, when sent, is a UUID too.
  if(c.url.endsWith('perfil-usuario/definir/')){
   assert.ok(body.usuario==='aleatorio'||idUsuarioOf(body.usuario),`definir/ leva usuario que não é UUID nem "aleatorio": ${String(body.usuario)}`);
   if('excluir' in body)assert.ok(idUsuarioOf(body.excluir),`definir/ leva excluir que não é UUID: ${String(body.excluir)}`);
   delete body.usuario;delete body.excluir;
  }
  for(const k of ['ref','indice','index','usuario','personId','person_id','id'])assert.ok(!(k in body),`${c.url} leva "${k}"`);
  assert.ok(!/\/\d+\/?$/.test(c.url),`${c.url} termina com número`);
  assert.ok(!Object.values(body).includes(person.id),`${c.url} leva person.id (${person.id})`);
 }
});

// O chat() ainda chama conversas/mensagens/ (a D-3 fixa conversas/interacao/ como rota única: pendente).
// O corpo de erro é o mesmo contrato erro_api que interacao/ devolve; o mapeador do chat cobre os dois.
test('erro_api de conversas/interacao/ (503 e 4xx com acao_cliente) vira estado de tela do chat',async()=>{
 const reply=(status:number,erro_api:Record<string,unknown>)=>new Backend((async()=>new Response(JSON.stringify({erro:'x',erro_api}),{status})) as typeof fetch,()=> '');
 const cases:Array<[number,Record<string,unknown>,string,string]>=[
  [503,{codigo:503,origem:'modelo',acao_cliente:'aguardar_e_tentar_novamente',tentar_novamente_em_s:20,mensagem:'Serviço ocupado.'},'tentar_de_novo','busy'],
  [400,{codigo:400,acao_cliente:'reformular'},'reformular','refused'],
  [404,{codigo:404,acao_cliente:'reiniciar_sessao'},'reiniciar_sessao','session'],
  [409,{codigo:409,acao_cliente:'enviar_como_nova'},'enviar_como_nova','refused'],
  [422,{codigo:422,acao_cliente:'nao_repetir'},'nao_repetir','refused'],
 ];
 for(const [status,erro_api,action,kind] of cases){
  const s=await reply(status,erro_api).chat('oi',null,'m1').then(()=>null,e=>telaDeErro(e,'mensagem'));
  assert.ok(s,`${status} devia falhar`);
  assert.equal(s!.action,action,`${status}`);assert.equal(s!.kind,kind,`${status}`);assert.equal(s!.title,TITLES.mensagem);
 }
 const busy=await reply(503,cases[0][1]).chat('oi',null,'m1').then(()=>null,e=>telaDeErro(e,'mensagem'));
 assert.equal(busy!.retryAfterS,20);assert.equal(busy!.serverMessage,'Serviço ocupado.');
});
