import { useEffect, useRef, useState } from 'react';
import { createMessage } from '../services/conversationService';
import { backend,ApiError,type PlanState } from '../services/backend';
import type { Plan, Person, Saved } from '../types';

const emptyPlan:Plan={income:0,expenses:0,deliveryCurrent:0,deliveryTarget:0,shoppingCurrent:0,shoppingTarget:0,otherCut:0,reserveTarget:0,selected:[]};
const unavailable:Person={id:0,nome:'Cliente da base',primeiroNome:'Cliente',genero:'NAO_INFORMADO',sourceAvailable:false,plan:emptyPlan};
// Profile loading: the loader stays at least minVisibleMs (no flash), says "slow" after slowAfterMs
// (the first BigQuery read measured ~10 s on 2026-09-27) and retries 5xx/network/incomplete payloads.
export const PROFILE_LOADING={minVisibleMs:800,slowAfterMs:4000,retryDelaysMs:[1500,3000]};
export type LoadStatus='loading'|'slow'|'ready'|'auth'|'error';
export const isAuthError=(e:unknown)=>e instanceof ApiError&&(e.status===401||e.status===403);
const retryable=(e:unknown)=>!(e instanceof ApiError)||e.status>=500;
export const isCompleteProfile=(s:PlanState|null|undefined)=>!!(s?.profile?.person?.id&&s.profile.referencePeriod?.label&&s.profile.situation&&s.draft);
const wait=(ms:number)=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
const initial:Saved={person:unavailable,stage:'intro',messages:[createMessage('Podemos conversar sobre seus objetivos. Os valores só aparecerão quando a fonte for carregada.')],draft:emptyPlan,confirmed:null,phraseIndex:0};

export function usePlanConversation(){
 const [saved,setSaved]=useState<Saved>(initial);
 const [typing,setTyping]=useState(false);
 const [statusText,setStatusText]=useState('Carregando os dados…');
 const [error,setError]=useState('');
 const [mode,setMode]=useState('');
 const [loadStatus,setLoadStatus]=useState<LoadStatus>('loading');
 const loading=useRef<Promise<boolean>|null>(null);
 const [profile,setProfile]=useState<PlanState['profile']|null>(null);
 const current=useRef<PlanState|null>(null);const cid=useRef<string|null>(null);
 const busy=useRef(false);const confirmAttempt=useRef<{body:string;id:string}|null>(null);
 const live=useRef(true);
 const apply=(s:PlanState,resetMessages=false)=>{
   current.current=s;setProfile(s.profile);
   setSaved(prev=>({...prev,person:s.profile.person,commitmentCase:s.commitmentCase||null,stage:s.commitmentCase&&!s.confirmed?'confirm':resetMessages?'intro':'invite',draft:s.draft,confirmed:s.confirmed,phraseIndex:s.phraseIndex,
     messages:resetMessages?[]:prev.messages}));
 };
 const append=(text:string,by:'user'|'bot'='bot')=>setSaved(p=>({...p,messages:[...p.messages,createMessage(text,by)]}));
 const run=async(work:()=>Promise<void>)=>{
   if(busy.current)return false;busy.current=true;setTyping(true);setStatusText('Preparando a próxima resposta…');setError('');
   try{await work();return true;}catch(e){
     if(e instanceof ApiError&&e.state)apply(e.state);
     if(isAuthError(e))setLoadStatus('auth');
     setError(e instanceof Error?e.message:'Não foi possível concluir. Nenhum compromisso foi confirmado.');return false;
   }finally{busy.current=false;if(live.current)setTyping(false);}
 };
 const loadProfile=async()=>{
   setLoadStatus('loading');setError('');
   const started=Date.now();
   const slow=setTimeout(()=>{if(live.current)setLoadStatus(s=>s==='loading'?'slow':s);},PROFILE_LOADING.slowAfterMs);
   try{
     for(let attempt=0;;attempt++){
       try{
         const b=await backend.bootstrap();setMode(b.mode);
         const r=await backend.profile();
         if(!isCompleteProfile(r.state))throw new Error('O perfil chegou incompleto do servidor.');
         await wait(PROFILE_LOADING.minVisibleMs-(Date.now()-started));
         if(live.current){apply(r.state,true);setLoadStatus('ready');}
         return true;
       }catch(e){
         const delay=PROFILE_LOADING.retryDelaysMs[attempt];
         if(!retryable(e)||delay===undefined){
           if(live.current){setLoadStatus(isAuthError(e)?'auth':'error');setError(e instanceof Error?e.message:'Não foi possível carregar o perfil.');}
           return false;
         }
         await wait(delay);
       }
     }
   }finally{clearTimeout(slow);}
 };
 // One load at a time; opening the chat waits for it instead of racing the busy guard.
 const load=()=>loading.current??=loadProfile().finally(()=>{loading.current=null;});
 useEffect(()=>{live.current=true;void load();return()=>{live.current=false;};},[]);
 const startWith=async(next=false)=>{
  if(loading.current&&!await loading.current)return false;
  if(!next&&cid.current)return Promise.resolve(true);
  return run(async()=>{
   setStatusText(next?'Selecionando outra pessoa e carregando seus dados…':'Carregando os dados deste perfil…');
   setSaved(p=>({...p,messages:[],commitmentCase:null,stage:'invite'}));
   const r=await backend.open(next);cid.current=null;confirmAttempt.current=null;apply(r.state,true);
   setStatusText(`Analisando os movimentos de ${r.state.profile.person.primeiroNome}…`);
   const opening=await backend.start(crypto.randomUUID());cid.current=opening.conversation_id;append(opening.reply);
   setSaved(p=>({...p,stage:'invite'}));
  });
 };
 const enterAgora=()=>{setSaved(p=>({...p,stage:'invite'}));document.querySelector<HTMLTextAreaElement>('[data-testid=input-free-text]')?.focus();};
 const assumeCommitments=()=>run(async()=>{
   const state=current.current;if(!state)throw new Error('Carregue o cliente antes de registrar objetivos.');
   const body=JSON.stringify({version:state.version,plan:saved.draft});
   if(confirmAttempt.current?.body!==body)confirmAttempt.current={body,id:crypto.randomUUID()};
   const r=await backend.confirm(state.version,saved.draft,confirmAttempt.current.id);apply(r.state);setSaved(p=>({...p,stage:'card'}));append('Aprovar e salvar minha meta','user');append('Seus objetivos foram registrados no servidor. Você pode vê-los em Acompanhe.');confirmAttempt.current=null;
 });
 const adjustValues=()=>run(async()=>{const r=await backend.withdraw();if(r.state)apply(r.state);append('Quero ajustar a proposta.','user');append('Claro. O que você gostaria de mudar para essa proposta fazer mais sentido na sua rotina?');});
 const progress=(stage:'card'|'finish',phraseIndex:number)=>run(async()=>{if(!current.current)throw new Error('Plano não carregado.');const r=await backend.progress(current.current.version,stage,phraseIndex);apply(r.state);setSaved(p=>({...p,stage}));});
 const finish=()=>{void progress('finish',saved.phraseIndex);};
 const nextPhrase=()=>{void progress('card',saved.phraseIndex+1);};
 const showCard=()=>{if(saved.confirmed)setSaved(p=>({...p,stage:'card'}));};
 const lastText=useRef('');
 const sendText=(query:string,echo=true)=>run(async()=>{
   lastText.current=query;if(echo)append(query,'user');const r=await backend.chat(query,cid.current,crypto.randomUUID());cid.current=r.conversation_id;append(r.reply);
   const s=await backend.state();if(s.state)apply(s.state);
 });
 const retry=()=>cid.current&&lastText.current?sendText(lastText.current,false):startWith(false);
 const reset=()=>startWith(true);
 return {saved,typing,statusText,error,mode,profile,loadStatus,retry,load,startWith,enterAgora,assumeCommitments,adjustValues,finish,nextPhrase,showCard,sendText,reset};
}
