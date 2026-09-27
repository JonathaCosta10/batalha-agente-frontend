// Abertura da conversa (POST i-agora/sessao/abertura/, ou o `opening` que vem no estado do perfil/reset).
// Quando ela não chega, a tela mostra um ESTADO DE ERRO (errorScreen.ts) — nunca uma fala do agente — e nada
// disso entra no histórico da conversa.
import { TITLES, type ScreenError } from './errorScreen';

export type OpeningStatus = 'loading' | 'ready' | 'error';
export const OPENING_FAILED = TITLES.abertura;
export const openingLoadingText = (seconds:number) => `Carregando a abertura da conversa… ${Math.max(0,Math.floor(seconds))}s`;

const str = (v:unknown) => typeof v==='string'&&v.trim()?v.trim():null;

/** Estado vindo do servidor: abertura presente vira a 1ª fala; ausente vira erro, não fala. */
export function openingFromState(state:{opening?:{message?:unknown}|null}|null|undefined, at=Date.now()):
  {ok:true;message:string}|{ok:false;failure:ScreenError} {
  const message=str(state?.opening?.message);
  if(message)return {ok:true,message};
  return {ok:false,failure:{context:'abertura',kind:'missing',action:'tentar_de_novo',status:200,title:OPENING_FAILED,
    detail:'O servidor respondeu sem o texto de abertura.',serverMessage:null,retryAfterS:null,encaminharHumano:false,at}};
}
