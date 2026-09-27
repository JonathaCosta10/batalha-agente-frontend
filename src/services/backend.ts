import type { Plan, Person, Stage, CommitmentCase } from '../types';
import { PROFILE_TIMEOUT_MS } from './profileLoad';
import { parseErroApi, parseRetryAfter, type ErroApi } from './errorScreen';
export type PlanState = { opening?:{message:string;phase:string}; commitmentCase?:CommitmentCase|null; planId:string;version:number;stage:Stage;draft:Plan;confirmed:Plan|null;confirmedAt:string|null;phraseIndex:number;profile:{person:Person;referencePeriod:{label:string;seal:{source:string;nature:string;measuredAt?:string;jobId?:string}};planPeriod:{label:string};situation:string};totals:Record<string,number> };
// Sem abertura devolve null: a falta vira estado de erro na tela (openingLoad.ts), nunca uma fala do agente.
export const openingReply=(state:Pick<PlanState,'opening'>)=>typeof state.opening?.message==='string'&&state.opening.message.trim()?state.opening.message:null;
export class ApiError extends Error { constructor(message:string,public status:number,public state?:PlanState,public erroApi:ErroApi|null=null,public retryAfterS:number|null=null){super(message);} }
const prefix='/api/v1/context-agent/';
export class Backend {
  constructor(private transport:typeof fetch=(...args)=>globalThis.fetch(...args),private cookies:()=>string=()=>document.cookie,private firstTimeoutMs=PROFILE_TIMEOUT_MS){}
  async request<T>(path:string,method='GET',data?:unknown,timeoutMs=50000):Promise<T>{
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
    const csrf=this.cookies().split('; ').find(x=>x.startsWith('csrftoken='))?.slice(10)||'';
    try{
      const r=await this.transport(prefix+path,{method,credentials:'same-origin',signal:ctrl.signal,headers:{'Content-Type':'application/json','X-CSRFToken':decodeURIComponent(csrf)},body:data===undefined?undefined:JSON.stringify(data)});
      // Corpo não-JSON (ex.: 403 de CSRF do Django em HTML, 502 do proxy) não pode virar SyntaxError na tela.
      const body=await r.json().catch(()=>null) as Record<string,unknown>|null;
      if(!r.ok){
        const b=body||{};
        throw new ApiError(typeof b.erro==='string'?b.erro:typeof b.reply==='string'?b.reply:`Servidor indisponível (HTTP ${r.status}).`,r.status,(b.state||undefined) as PlanState|undefined,parseErroApi(b.erro_api),parseRetryAfter(r.headers?.get?.('Retry-After')));
      }
      if(body===null)throw new ApiError('Resposta ilegível do servidor.',r.status);
      return body as T;
    }catch(e){
      if(ctrl.signal.aborted)throw new ApiError('Tempo esgotado ao carregar os registros (NAO_MEDIDO).',0);
      throw e;
    }finally{clearTimeout(timer);}
  }
  // A primeira consulta (sessão + perfil) usa o teto curto: a tela espera por ela com cronômetro.
  bootstrap(){return this.request<{mode:string}>('conversas/sessao/','GET',undefined,this.firstTimeoutMs);}
  profile(){return this.request<{state:PlanState}>('i-agora/perfil/','GET',undefined,this.firstTimeoutMs);}
  state(){return this.request<{state:PlanState|null}>('i-agora/plano/');}
  // A abertura também é esperada com cronômetro: mesmo teto curto.
  open(next=false){return this.request<{state:PlanState}>('i-agora/sessao/abertura/','POST',{origem:'fab',next},this.firstTimeoutMs);}
  propose(){return this.request<{state:PlanState}>('i-agora/plano/proposta/','POST',{clientRequestId:crypto.randomUUID()});}
  confirm(version:number,plan:Plan,id:string){return this.request<{state:PlanState;replayed:boolean}>('i-agora/plano/confirmar/','POST',{version,plan,clientRequestId:id});}
  progress(version:number,stage:'card'|'finish',phraseIndex:number){return this.request<{state:PlanState}>('i-agora/plano/','PATCH',{version,stage,phraseIndex});}
  withdraw(){return this.request<{state:PlanState|null}>('i-agora/plano/proposta/','DELETE');}
  reset(){return this.request<{state:PlanState|null}>('i-agora/plano/','DELETE');}
  chat(message:string,cid:string|null,id:string){return this.request<{reply:string;conversation_id:string|null;status:string}>('conversas/mensagens/','POST',{schema_version:'1.0',conversation_id:cid,client_message_id:id,message});}
}
export const backend=new Backend();
