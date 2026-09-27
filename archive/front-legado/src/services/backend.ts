import type { Plan, Person, Stage, CommitmentCase } from '../types';
export type PlanState = { opening?:{message:string;phase:string}; commitmentCase?:CommitmentCase|null; planId:string;version:number;stage:Stage;draft:Plan;confirmed:Plan|null;confirmedAt:string|null;phraseIndex:number;profile:{person:Person;referencePeriod:{label:string;seal:{source:string;nature:string;measuredAt?:string}};planPeriod:{label:string};situation:string};totals:Record<string,number> };
export const openingReply=(state:Pick<PlanState,'opening'>)=>state.opening?.message||'Ainda não recebi os dados para apontar um ajuste com segurança. Aguarde o carregamento ou tente novamente.';
export class ApiError extends Error { constructor(message:string,public status:number,public state?:PlanState,public code?:string){super(message);} }
// Readable failure with the backend's code: erro_api.codigo (conversas) or codigo (i-agora), else http_<status>.
// Machine tokens such as "perfil_indisponivel" are never shown alone; motivo/mensagem is preferred.
export function describeError(body:Record<string,unknown>,status:number){
  const api=(body.erro_api&&typeof body.erro_api==='object'?body.erro_api:{}) as Record<string,unknown>;
  const code=String(api.codigo??body.codigo??`http_${status}`);
  const erro=typeof body.erro==='string'&&!/^[a-z0-9_]+$/.test(body.erro)?body.erro:'';
  const text=[body.motivo,api.mensagem,erro,body.reply].find(v=>typeof v==='string'&&v.trim()) as string|undefined;
  return {code,text:`${text||'O servidor não conseguiu responder.'} (código: ${code})`};
}
const prefix='/api/v1/context-agent/';
export class Backend {
  constructor(private transport:typeof fetch=(...args)=>globalThis.fetch(...args),private cookies:()=>string=()=>document.cookie){}
  async request<T>(path:string,method='GET',data?:unknown):Promise<T>{
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),50000);
    const csrf=this.cookies().split('; ').find(x=>x.startsWith('csrftoken='))?.slice(10)||'';
    try{
      let r:Response;
      try{r=await this.transport(prefix+path,{method,credentials:'same-origin',signal:ctrl.signal,headers:{'Content-Type':'application/json','X-CSRFToken':decodeURIComponent(csrf)},body:data===undefined?undefined:JSON.stringify(data)});}
      catch{const code=ctrl.signal.aborted?'timeout':'rede';throw new ApiError(`${ctrl.signal.aborted?'O servidor demorou demais a responder.':'Sem ligação ao servidor.'} (código: ${code})`,0,undefined,code);}
      // A proxy/HTML error page must not surface as a JSON parse error.
      const body=await r.json().catch(()=>({})) as Record<string,unknown>;
      if(!r.ok){const e=describeError(body,r.status);throw new ApiError(e.text,r.status,body.state as PlanState|undefined,e.code);}
      return body as T;
    }finally{clearTimeout(timer);}
  }
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
