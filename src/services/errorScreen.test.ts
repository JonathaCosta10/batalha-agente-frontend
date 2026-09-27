import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError} from './backend';
import {BUSY,NO_NETWORK,TITLES,errorLine,parseErroApi,retryRemaining,telaDeErro} from './errorScreen';

const api=(status:number,erro:Record<string,unknown>|null,retryAfter:number|null=null)=>new ApiError('corpo cru do servidor',status,undefined,parseErroApi(erro),retryAfter);

test('acao_cliente reiniciar_sessao → botão que refaz sessão + abertura',()=>{
 for(const ctx of ['abertura','mensagem'] as const){
  const s=telaDeErro(api(404,{acao_cliente:'reiniciar_sessao',codigo:404}),ctx);
  assert.equal(s.action,'reiniciar_sessao');assert.equal(s.kind,'session');assert.equal(s.title,TITLES[ctx]);
 }
 assert.equal(telaDeErro(api(401,{acao_cliente:'reiniciar_sessao'}),'mensagem').action,'reiniciar_sessao');
});

test('acao_cliente nao_repetir → sem retry, sem reenvio, sem contagem',()=>{
 const s=telaDeErro(api(403,{acao_cliente:'nao_repetir',tentar_novamente_em_s:30}),'mensagem');
 assert.equal(s.action,'nao_repetir');assert.equal(s.retryAfterS,null);
 assert.equal(telaDeErro(api(405,{acao_cliente:'nao_repetir'}),'abertura').action,'nao_repetir');
});

test('acao_cliente enviar_como_nova → a mensagem volta ao campo (na abertura, só tenta de novo)',()=>{
 const s=telaDeErro(api(409,{acao_cliente:'enviar_como_nova'}),'mensagem');
 assert.equal(s.action,'enviar_como_nova');assert.ok(s.detail.includes('voltou ao campo'));
 assert.equal(telaDeErro(api(409,{acao_cliente:'enviar_como_nova'}),'abertura').action,'tentar_de_novo');
});

test('acao_cliente reformular → a mensagem volta ao campo para reescrever',()=>{
 const s=telaDeErro(api(400,{acao_cliente:'reformular'}),'mensagem');
 assert.equal(s.action,'reformular');assert.ok(s.detail.includes('reescreva'));
});

test('acao_cliente aguardar (e variantes do contrato) → contagem com tentar_novamente_em_s e retry depois',()=>{
 for(const acao of ['aguardar','aguardar_e_tentar_novamente','aguardar_ou_encaminhar']){
  const s=telaDeErro(api(429,{acao_cliente:acao,tentar_novamente_em_s:30,mensagem:'Muitas mensagens seguidas.',encaminhar_humano:acao==='aguardar_ou_encaminhar'}),'mensagem',10_000);
  assert.equal(s.action,'tentar_de_novo');assert.equal(s.kind,'busy');assert.ok(s.detail.startsWith(BUSY));
  assert.equal(s.retryAfterS,30);assert.equal(s.serverMessage,'Muitas mensagens seguidas.');
  assert.equal(retryRemaining(s,10_000),30);assert.equal(retryRemaining(s,22_400),18);assert.equal(retryRemaining(s,40_000),0);assert.equal(retryRemaining(s,99_000),0);
  assert.equal(s.encaminharHumano,acao==='aguardar_ou_encaminhar');
 }
});

test('sem erro_api: decide pelo HTTP, sem mensagem do servidor nem contagem inventada',()=>{
 const cases:[number,string,string][]=[[400,'mensagem','reformular'],[400,'abertura','nao_repetir'],[401,'abertura','reiniciar_sessao'],[403,'abertura','reiniciar_sessao'],
  [404,'mensagem','reiniciar_sessao'],[405,'mensagem','nao_repetir'],[409,'mensagem','enviar_como_nova'],[429,'abertura','tentar_de_novo'],[500,'abertura','tentar_de_novo'],[503,'mensagem','tentar_de_novo']];
 for(const [status,ctx,action] of cases){
  const s=telaDeErro(api(status,null),ctx as never);
  assert.equal(s.action,action,`${status}/${ctx}`);assert.equal(s.serverMessage,null);assert.equal(s.encaminharHumano,false);
  assert.ok(!errorLine(s).includes('corpo cru'),'não mostra o texto cru do corpo');
 }
 assert.equal(telaDeErro(api(503,null),'abertura').retryAfterS,null);
 assert.equal(telaDeErro(api(429,null,7),'abertura').retryAfterS,7);
 // acao_cliente desconhecida também cai no HTTP
 assert.equal(telaDeErro(api(404,{acao_cliente:'nova_acao_futura'}),'mensagem').action,'reiniciar_sessao');
 // erro_api malformado: ignorado com segurança
 assert.equal(parseErroApi('oops'),null);assert.equal(parseErroApi([]),null);
 const partial=parseErroApi({tentar_novamente_em_s:'abc',mensagem:''});
 assert.equal(partial?.tentar_novamente_em_s,null);assert.equal(partial?.mensagem,null);
});

test('perfil/ 503 {"erro":"perfil_indisponivel"} vira estado legível com Tentar de novo (sem o código cru)',async()=>{
 const {Backend}=await import('./backend');
 const b=new Backend((async()=>new Response(JSON.stringify({erro:'perfil_indisponivel',estado:'NAO_MEDIDO'}),{status:503})) as typeof fetch,()=> '');
 const s=await b.profile().then(()=>null,e=>telaDeErro(e,'perfil'));
 assert.ok(s);assert.equal(s!.kind,'busy');assert.equal(s!.action,'tentar_de_novo');
 assert.equal(s!.title,TITLES.perfil);assert.ok(s!.title.includes('NAO_MEDIDO'));
 assert.ok(!errorLine(s!).includes('perfil_indisponivel'));
});

test('sem rede:"Sem ligação ao serviço (NAO_MEDIDO)", nunca "Failed to fetch"',()=>{
 const s=telaDeErro(new TypeError('Failed to fetch'),'mensagem');
 assert.equal(s.kind,'network');assert.equal(s.action,'tentar_de_novo');assert.equal(s.detail,NO_NETWORK);
 assert.ok(!errorLine(s).includes('Failed'));
 assert.equal(telaDeErro(undefined,'acao').detail,NO_NETWORK);
 assert.equal(telaDeErro(new ApiError('Tempo esgotado',0),'abertura').kind,'timeout');
 for(const t of Object.values(TITLES))assert.ok(t.includes('NAO_MEDIDO'));
});
