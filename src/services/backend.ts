import type { Plan, Person, Stage, CommitmentCase } from '../types';
import { PROFILE_TIMEOUT_MS } from './profileLoad';
import { parseErroApi, parseRetryAfter, type ErroApi } from './errorScreen';
export type PlanState = { opening?:{message:string;phase:string}; commitmentCase?:CommitmentCase|null; planId:string;version:number;stage:Stage;draft:Plan;confirmed:Plan|null;confirmedAt:string|null;phraseIndex:number;profile:{person:Person;referencePeriod:{label:string;seal:{source:string;nature:string;measuredAt?:string;jobId?:string}};planPeriod:{label:string};situation:string};totals:Record<string,number> };
// Sem abertura devolve null: a falta vira estado de erro na tela (openingLoad.ts), nunca uma fala do agente.
export const openingReply=(state:Pick<PlanState,'opening'>)=>typeof state.opening?.message==='string'&&state.opening.message.trim()?state.opening.message:null;
export class ApiError extends Error { constructor(message:string,public status:number,public state?:PlanState,public erroApi:ErroApi|null=null,public retryAfterS:number|null=null,public conversationId:string|null=null){super(message);} }
const prefix='/api/v1/context-agent/';
export type SessionUser={codigo:string;pessoa:string;nome_origem?:string};
export type Bootstrap={mode:string;usuario?:SessionUser};
// definir/ takes the id_usuario UUID only (positional index refused since 2026-09-27 10:32). Default: the
// reference user of backend/data/usuarios_verdade.csv (row 1, Maria); VITE_IAGORA_USUARIO swaps it.
export const DEFAULT_USER:string=(import.meta as {env?:Record<string,string|undefined>}).env?.VITE_IAGORA_USUARIO||'00108ccd-699c-453a-a9f9-a66aad6e03e5';
export class Backend {
  // sessao_id from POST perfil-usuario/definir/ (team backend), sent as X-Sessao-Id, which beats the cookie.
  // Stays null against agent_backend, which has no definir/ route and identifies by cookie only.
  sessionId:string|null=null;
  constructor(private transport:typeof fetch=(...args)=>globalThis.fetch(...args),private cookies:()=>string=()=>document.cookie,private firstTimeoutMs=PROFILE_TIMEOUT_MS){}
  async request<T>(path:string,method='GET',data?:unknown,timeoutMs=50000):Promise<T>{
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
    const csrf=this.cookies().split('; ').find(x=>x.startsWith('csrftoken='))?.slice(10)||'';
    try{
      const r=await this.transport(prefix+path,{method,credentials:'same-origin',signal:ctrl.signal,headers:{'Content-Type':'application/json','X-CSRFToken':decodeURIComponent(csrf),...(this.sessionId?{'X-Sessao-Id':this.sessionId}:{})},body:data===undefined?undefined:JSON.stringify(data)});
      // Corpo não-JSON (ex.: 403 de CSRF do Django em HTML, 502 do proxy) não pode virar SyntaxError na tela.
      const body=await r.json().catch(()=>null) as Record<string,unknown>|null;
      if(!r.ok){
        const b=body||{};
        // conversation_id also comes on a failed chat turn (the backend opened the conversation before failing).
        throw new ApiError(typeof b.erro==='string'?b.erro:typeof b.reply==='string'?b.reply:`Servidor indisponível (HTTP ${r.status}).`,r.status,(b.state||undefined) as PlanState|undefined,parseErroApi(b.erro_api),parseRetryAfter(r.headers?.get?.('Retry-After')),typeof b.conversation_id==='string'?b.conversation_id:null);
      }
      if(body===null)throw new ApiError('Resposta ilegível do servidor.',r.status);
      return body as T;
    }catch(e){
      if(ctrl.signal.aborted)throw new ApiError('Tempo esgotado ao carregar os registros (NAO_MEDIDO).',0);
      throw e;
    }finally{clearTimeout(timer);}
  }
  // A primeira consulta (sessão + perfil) usa o teto curto: a tela espera por ela com cronômetro.
  // definir/ -> sessao/?sessao_id=. A 404/405 on definir/ means a backend without it (agent_backend): cookie identity.
  async bootstrap(){
    if(!this.sessionId){
      try{const d=await this.request<{sessao_id:string}>('perfil-usuario/definir/','POST',{usuario:DEFAULT_USER},this.firstTimeoutMs);this.sessionId=d.sessao_id||null;}
      catch(e){if(!(e instanceof ApiError&&(e.status===404||e.status===405)))throw e;}
    }
    return this.request<Bootstrap>(this.sessionId?`conversas/sessao/?sessao_id=${encodeURIComponent(this.sessionId)}`:'conversas/sessao/','GET',undefined,this.firstTimeoutMs);
  }
  profile(){return this.request<{state:PlanState}>('i-agora/perfil/','GET',undefined,this.firstTimeoutMs);}
  state(){return this.request<{state:PlanState|null}>('i-agora/plano/');}
  // A abertura também é esperada com cronômetro: mesmo teto curto.
  open(next=false){return this.request<{state:PlanState}>('i-agora/sessao/abertura/','POST',{origem:'fab',next},this.firstTimeoutMs);}
  propose(){return this.request<{state:PlanState}>('i-agora/plano/proposta/','POST',{clientRequestId:crypto.randomUUID()});}
  confirm(version:number,plan:Plan,id:string){return this.request<{state:PlanState;replayed:boolean}>('i-agora/plano/confirmar/','POST',{version,plan,clientRequestId:id});}
  progress(version:number,stage:'card'|'finish',phraseIndex:number){return this.request<{state:PlanState}>('i-agora/plano/','PATCH',{version,stage,phraseIndex});}
  withdraw(){return this.request<{state:PlanState|null}>('i-agora/plano/proposta/','DELETE');}
  reset(){return this.request<{state:PlanState|null}>('i-agora/plano/','DELETE');}
  // A 404 means the user session (4 h) or the conversation expired: open a new session and send once more as a
  // new conversation (only when this client holds a sessao_id). The caller adopts the returned conversation_id.
  async chat(message:string,cid:string|null,id:string){
    const send=(c:string|null)=>this.request<{reply:string;conversation_id:string|null;status:string}>('conversas/mensagens/','POST',{schema_version:'1.0',conversation_id:c,client_message_id:id,message});
    try{return await send(cid);}
    catch(e){if(!(e instanceof ApiError&&e.status===404&&this.sessionId))throw e;this.sessionId=null;await this.bootstrap();return send(null);}
  }
}
export const backend=new Backend();
