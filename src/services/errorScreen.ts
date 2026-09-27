// Mapeador ÚNICO: falha da API (erro_api §5.4, HTTP, rede, tempo) → estado de tela.
// Usado pela abertura, pelo envio de mensagens do chat e pelo aviso global das demais ações.
// Nunca devolve texto técnico cru ("Failed to fetch", SyntaxError...) nem o texto da falha como fala do agente.
// Contrato: docs/backend-32/contrato-api-frontend.md §5.2–5.5 (erros_api-v1 1.1.0).

import { PROFILE_FAILED } from './profileLoad';

// erro_api do contrato. Cada campo é validado: ausente/malformado = null.
export type ErroApi = {
  codigo:string|null; origem:string|null; acao_cliente:string|null;
  tentar_novamente_em_s:number|null; encaminhar_humano:boolean; mensagem:string|null;
};

export type ErrorContext = 'abertura' | 'mensagem' | 'acao' | 'perfil';
/** O que a tela oferece. */
export type ErrorAction =
  | 'tentar_de_novo'    // botão "Tentar de novo" (com contagem se o servidor pediu espera)
  | 'reiniciar_sessao'  // botão que refaz conversas/sessao/ + abertura
  | 'nao_repetir'       // sem retry e sem reenvio
  | 'enviar_como_nova'  // a mensagem volta ao campo (novo client_message_id)
  | 'reformular';       // a mensagem volta ao campo para ser reescrita
export type ErrorKind = 'missing' | 'busy' | 'timeout' | 'network' | 'session' | 'refused' | 'server';

export type ScreenError = {
  context:ErrorContext; kind:ErrorKind; action:ErrorAction; status:number;
  title:string;            // o que falhou, com NAO_MEDIDO
  detail:string;           // por quê / o que fazer, em linguagem simples
  serverMessage:string|null;   // erro_api.mensagem, só quando veio
  retryAfterS:number|null;     // espera pedida (erro_api.tentar_novamente_em_s ou Retry-After)
  encaminharHumano:boolean;
  at:number;               // instante da falha (base da contagem)
};

export const TITLES:Record<ErrorContext,string> = {
  abertura:'Não consegui carregar a abertura da conversa agora (NAO_MEDIDO).',
  mensagem:'Não consegui enviar a sua mensagem agora (NAO_MEDIDO).',
  acao:'Não consegui concluir esta ação agora (NAO_MEDIDO). Nada foi confirmado.',
  perfil:`${PROFILE_FAILED}.`,
};
export const BUSY = 'O serviço está ocupado; tente em alguns segundos.';
export const NO_NETWORK = 'Sem ligação ao serviço (NAO_MEDIDO).';
export const IDENTIDADE_AUSENTE = 'identidade_ausente';
export const IDENTITY_MISSING = 'O servidor não enviou o identificador (id_usuario) desta sessão; nenhum pedido foi feito. Reinicie a sessão.';

const str = (v:unknown) => typeof v==='string'&&v.trim()?v.trim():null;
const secs = (v:unknown) => {
  const n=typeof v==='string'&&v.trim()?Number(v):v;
  return typeof n==='number'&&Number.isFinite(n)&&n>0?Math.min(Math.ceil(n),600):null;
};

export function parseErroApi(value:unknown):ErroApi|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const v=value as Record<string,unknown>;
  const codigo=typeof v.codigo==='number'?String(v.codigo):str(v.codigo);
  return {codigo,origem:str(v.origem),acao_cliente:str(v.acao_cliente),
    tentar_novamente_em_s:secs(v.tentar_novamente_em_s),encaminhar_humano:v.encaminhar_humano===true,mensagem:str(v.mensagem)};
}

/** Retry-After em segundos (a forma em data HTTP é ignorada: não medimos o relógio do servidor). */
export const parseRetryAfter = (header:string|null|undefined) => secs(header??null);

type ErrorLike = { status?:unknown; erroApi?:ErroApi|null; retryAfterS?:number|null };

const WAIT_ACTIONS = new Set(['aguardar','aguardar_e_tentar_novamente','aguardar_ou_encaminhar']);

/** acao_cliente do servidor → ação da tela; null = desconhecida (decide pelo HTTP). */
function fromAcao(acao:string|null, context:ErrorContext):ErrorAction|null {
  if(!acao)return null;
  if(WAIT_ACTIONS.has(acao))return 'tentar_de_novo';
  if(acao==='reiniciar_sessao')return 'reiniciar_sessao';
  if(acao==='nao_repetir')return 'nao_repetir';
  // Sem texto do cliente (abertura/ação) não há o que devolver ao campo.
  if(acao==='enviar_como_nova')return context==='mensagem'?'enviar_como_nova':'tentar_de_novo';
  if(acao==='reformular')return context==='mensagem'?'reformular':'nao_repetir';
  return null;
}

function fromStatus(status:number, context:ErrorContext):ErrorAction {
  if(status===400)return context==='mensagem'?'reformular':'nao_repetir';
  // 403 sem erro_api é o CSRF do Django: refazer a sessão renova o cookie csrftoken.
  if(status===401||status===403||status===404)return 'reiniciar_sessao';
  if(status===405)return 'nao_repetir';
  if(status===409)return context==='mensagem'?'enviar_como_nova':'tentar_de_novo';
  return 'tentar_de_novo';
}

export function telaDeErro(error:unknown, context:ErrorContext, at=Date.now()):ScreenError {
  const e=(error&&typeof error==='object'?error:{}) as ErrorLike;
  const status=typeof e.status==='number'?e.status:-1;
  const erroApi=e.erroApi??null;
  const base={context,status,title:TITLES[context],serverMessage:erroApi?.mensagem??null,
    retryAfterS:erroApi?.tentar_novamente_em_s??e.retryAfterS??null,encaminharHumano:!!erroApi?.encaminhar_humano,at};
  // Falha local antes de qualquer pedido: o servidor não mandou o id_usuario (identity.ts, IdentidadeAusente).
  if((error as {code?:unknown}|null)?.code===IDENTIDADE_AUSENTE)return {...base,kind:'session',action:'reiniciar_sessao',retryAfterS:null,detail:IDENTITY_MISSING};
  if(status===0)return {...base,kind:'timeout',action:'tentar_de_novo',detail:'O servidor não respondeu a tempo.'};
  if(status<0)return {...base,kind:'network',action:'tentar_de_novo',detail:NO_NETWORK};
  const action=fromAcao(erroApi?.acao_cliente??null,context)??fromStatus(status,context);
  const http=`HTTP ${status}`;
  switch(action){
    case 'reiniciar_sessao':return {...base,kind:'session',action,detail:`A sessão expirou ou não foi aceita (${http}). Reinicie a sessão para continuar.`};
    case 'nao_repetir':return {...base,kind:'refused',action,retryAfterS:null,detail:`O servidor recusou este pedido (${http}); repetir não resolve.`};
    case 'enviar_como_nova':return {...base,kind:'refused',action,retryAfterS:null,detail:`A mensagem voltou ao campo; envie de novo (${http}).`};
    case 'reformular':return {...base,kind:'refused',action,retryAfterS:null,detail:`A mensagem voltou ao campo; reescreva e envie de novo (${http}).`};
    default:{
      const busy=status===429||status===503||status===504||WAIT_ACTIONS.has(erroApi?.acao_cliente??'');
      return busy?{...base,kind:'busy',action,detail:`${BUSY} (${http})`}
        :{...base,kind:'server',action,detail:`O servidor não concluiu o pedido (${http}).`};
    }
  }
}

/** Linha única para avisos globais (nunca a mensagem técnica crua). */
export const errorLine = (s:ScreenError) => [s.title,s.detail,s.serverMessage&&`Servidor: ${s.serverMessage}`].filter(Boolean).join(' ');

/** Segundos que ainda faltam da espera pedida pelo servidor (0 = já pode tentar). */
export function retryRemaining(s:Pick<ScreenError,'retryAfterS'|'at'>|null, now=Date.now()) {
  if(!s?.retryAfterS)return 0;
  return Math.max(0,Math.ceil(s.retryAfterS-(now-s.at)/1000));
}
