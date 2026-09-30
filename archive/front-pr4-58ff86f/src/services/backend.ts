import type { Plan, Person, Stage, CommitmentCase } from '../types';
export type PlanState = { opening?:{message:string;phase:string}; commitmentCase?:CommitmentCase|null; planId:string;version:number;stage:Stage;draft:Plan;confirmed:Plan|null;confirmedAt:string|null;phraseIndex:number;profile:{person:Person;referencePeriod:{label:string;seal:{source:string;nature:string;measuredAt?:string}};planPeriod:{label:string};situation:string};totals:Record<string,number> };
export const openingReply=(state:Pick<PlanState,'opening'>)=>state.opening?.message||'Ainda não recebi os dados para apontar um ajuste com segurança. Aguarde o carregamento ou tente novamente.';
export class ApiError extends Error { constructor(message:string,public status:number,public state?:PlanState){super(message);} }
const prefix='/api/v1/context-agent/';
export class Backend {
  constructor(private transport:typeof fetch=(...args)=>globalThis.fetch(...args),private cookies:()=>string=()=>document.cookie){}
  async request<T>(path:string,method='GET',data?:unknown):Promise<T>{
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),80000);
    const csrf=this.cookies().split('; ').find(x=>x.startsWith('csrftoken='))?.slice(10)||'';
    try{
      const r=await this.transport(prefix+path,{method,credentials:'same-origin',signal:ctrl.signal,headers:{'Content-Type':'application/json','X-CSRFToken':decodeURIComponent(csrf)},body:data===undefined?undefined:JSON.stringify(data)});
      const body=await r.json();
      if(!r.ok)throw new ApiError(typeof body.erro==='string'?body.erro:typeof body.reply==='string'?body.reply:'Servidor indisponível.',r.status,body.state);
      return body as T;
    }finally{clearTimeout(timer);}
  }
  start(id:string){return this.request<{reply:string;conversation_id:string;status:string}>('conversas/abertura/','POST',{client_request_id:id});}
  bootstrap(){return this.request<{mode:string}>('conversas/sessao/');}
  profile(){return this.request<{state:PlanState}>('i-agora/perfil/');}
  state(){return this.request<{state:PlanState|null}>('i-agora/plano/');}
  open(next=false){return this.request<{state:PlanState}>('i-agora/sessao/abertura/','POST',{origem:'fab',next});}
  propose(){return this.request<{state:PlanState}>('i-agora/plano/proposta/','POST',{clientRequestId:crypto.randomUUID()});}
  confirm(version:number,plan:Plan,id:string){return this.request<{state:PlanState;replayed:boolean}>('i-agora/plano/confirmar/','POST',{version,plan,clientRequestId:id});}
  progress(version:number,stage:'card'|'finish',phraseIndex:number){return this.request<{state:PlanState}>('i-agora/plano/','PATCH',{version,stage,phraseIndex});}
  withdraw(){return this.request<{state:PlanState|null}>('i-agora/plano/proposta/','DELETE');}
  reset(){return this.request<{state:PlanState|null}>('i-agora/plano/','DELETE');}
  chat(message:string,cid:string|null,id:string){return this.request<{reply:string;conversation_id:string|null;status:string}>('conversas/mensagens/','POST',{schema_version:'1.0',conversation_id:cid,client_message_id:id,message});}
}
export const backend=new Backend();
