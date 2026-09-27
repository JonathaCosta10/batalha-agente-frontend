import { useEffect, useRef, useState } from 'react';
import { createMessage } from '../services/conversationService';
import { backend,ApiError,type PlanState } from '../services/backend';
import { errorLine, telaDeErro, type ScreenError } from '../services/errorScreen';
import { IdentidadeAusente, personFromServer, requireIdUsuario } from '../services/identity';
import { openingFromState, type OpeningStatus } from '../services/openingLoad';
import { isDemoReply } from '../services/demoReply';
import type { ProfileStatus } from '../services/profileLoad';
import type { Plan, Person, Saved } from '../types';

const emptyPlan:Plan={income:0,expenses:0,deliveryCurrent:0,deliveryTarget:0,shoppingCurrent:0,shoppingTarget:0,otherCut:0,reserveTarget:0,selected:[]};
const unavailable:Person={id:0,nome:'',primeiroNome:'',genero:'NAO_INFORMADO',sourceAvailable:false,plan:emptyPlan};
// Sem fala inventada antes da abertura: o histórico começa vazio e a tela mostra o carregamento.
const initial:Saved={person:unavailable,stage:'intro',messages:[],draft:emptyPlan,confirmed:null,phraseIndex:0};

/** Falha no envio do chat: fica fora do histórico; guarda o texto para reenviar ou devolver ao campo. */
export type ChatFailure = { screen:ScreenError; text:string; id:string };

// Texto legível para o aviso global: falhas de API/rede passam pelo mapeador; erros locais já são frases nossas.
const globalText=(e:unknown)=>e instanceof ApiError||e instanceof IdentidadeAusente||e instanceof TypeError||e instanceof DOMException?errorLine(telaDeErro(e,'acao'))
  :e instanceof Error&&e.message?e.message:errorLine(telaDeErro(e,'acao'));

export function usePlanConversation(){
 const [saved,setSaved]=useState<Saved>(initial);
 const [typing,setTyping]=useState(false);
 const [error,setError]=useState('');
 const [mode,setMode]=useState('');
 const [profile,setProfile]=useState<PlanState['profile']|null>(null);
 const [profileStatus,setProfileStatus]=useState<ProfileStatus>('loading');
 const [loadStartedAt,setLoadStartedAt]=useState(()=>Date.now());
 const current=useRef<PlanState|null>(null);const cid=useRef<string|null>(null);
 const busy=useRef(false);const confirmAttempt=useRef<{body:string;id:string}|null>(null);
 const live=useRef(true);
 // Abertura: estado próprio, fora de saved.messages. O erro nunca é gravado como fala do agente.
 const [openingStatus,setOpeningStatus]=useState<OpeningStatus>('loading');
 const [openingFailure,setOpeningFailure]=useState<ScreenError|null>(null);
 const [openingStartedAt,setOpeningStartedAt]=useState(()=>Date.now());
 const [profileFailure,setProfileFailure]=useState<ScreenError|null>(null);
 const [chatFailure,setChatFailure]=useState<ChatFailure|null>(null);
 // Texto devolvido ao campo (enviar_como_nova / reformular); nonce força o composer a aplicar.
 const [composerRestore,setComposerRestore]=useState<{text:string;nonce:number}|null>(null);
 // O que "Tentar de novo" refaz: a mesma chamada que falhou; se o servidor já respondeu (sem abertura), reabre a pessoa atual.
 const retryNext=useRef(false);
 // True when the backend has conversas/ but no i-agora/ (perfil 404): the chat talks to conversas/ only.
 const chatOnly=useRef(false);
 const apply=(s:PlanState,resetMessages=false)=>{
   current.current=s;setProfile(s.profile);
   let messages:Saved['messages']=[];
   if(resetMessages){
     const opening=openingFromState(s);
     if(opening.ok){messages=[createMessage(opening.message)];setOpeningFailure(null);setOpeningStatus('ready');}
     else{retryNext.current=false;setOpeningFailure(opening.failure);setOpeningStatus('error');}
   }
   setSaved(prev=>({...prev,person:personFromServer(s.profile.person),commitmentCase:s.commitmentCase||null,stage:s.commitmentCase&&!s.confirmed?'confirm':resetMessages?'intro':'invite',draft:s.draft,confirmed:s.confirmed,phraseIndex:s.phraseIndex,
     messages:resetMessages?messages:prev.messages}));
 };
 const append=(text:string,by:'user'|'bot'='bot')=>setSaved(p=>({...p,messages:[...p.messages,createMessage(text,by)]}));
 const run=async(work:()=>Promise<void>)=>{
   if(busy.current)return false;busy.current=true;setTyping(true);setError('');
   try{await work();return true;}catch(e){
     if(e instanceof ApiError&&e.state)apply(e.state);
     setError(globalText(e));return false;
   }finally{busy.current=false;if(live.current)setTyping(false);}
 };
 // First query on opening: the screen waits for it (timer + skeleton) and keeps the chat locked until it resolves.
 const load=async()=>{
   if(busy.current)return false;
   setProfileStatus('loading');setLoadStartedAt(Date.now());setProfileFailure(null);
   // 503 perfil_indisponivel (BigQuery), rede, 20 s...: mesmo mapeador, texto legível no cartão com "Tentar de novo".
   const ok=await run(async()=>{try{const b=await backend.bootstrap();setMode(b.mode);
     const r=await backend.profile().catch(e=>{if(e instanceof ApiError&&e.status===404)return null;throw e;});
     // Team backend (no i-agora/ plan routes): chat-only, with the person of the session. No values, no opening invented.
     if(r===null){chatOnly.current=true;if(live.current){const u=b.usuario;setSaved(p=>({...p,person:personFromServer(u?{nome:u.pessoa,nome_origem:u.nome_origem,id_usuario:u.codigo}:null),stage:'invite'}));}return;}
     chatOnly.current=false;if(live.current)apply(r.state,true);}
     catch(e){if(live.current)setProfileFailure(telaDeErro(e,'perfil'));throw e;}});
   if(live.current)setProfileStatus(ok?'ready':'error');
   return ok;
 };
 useEffect(()=>{live.current=true;void load();return()=>{live.current=false;};},[]);
 // POST sessao/abertura/ (com withSession, antes refaz conversas/sessao/). Falha (rede, 4xx/5xx, 429, 503, CSRF, 20 s)
 // ou resposta sem `opening` → estado de erro no chat, pelo mapeador único.
 const startWith=async(next=false,withSession=false)=>{
   if(busy.current)return false;
   // Chat-only: there is no abertura/ to call; the composer is ready and the history keeps what was said.
   if(chatOnly.current&&!next){setOpeningFailure(null);setChatFailure(null);setOpeningStatus('ready');return true;}
   retryNext.current=next;setOpeningFailure(null);setChatFailure(null);setOpeningStatus('loading');setOpeningStartedAt(Date.now());
   setSaved(p=>({...p,messages:[]}));
   return run(async()=>{
     try{
       if(withSession){cid.current=null;const b=await backend.bootstrap();setMode(b.mode);}
       const r=await backend.open(next);cid.current=null;confirmAttempt.current=null;apply(r.state,true);
     }catch(e){
       if(e instanceof ApiError&&e.state)apply(e.state);
       if(live.current){setOpeningFailure(telaDeErro(e,'abertura'));setOpeningStatus('error');}
       // "Próximo perfil" é disparado da Home, onde o painel do chat não aparece: mantém o aviso global.
       if(next)throw e;
     }
   });
 };
 const retryOpening=()=>startWith(retryNext.current,openingFailure?.action==='reiniciar_sessao');
 const restartSession=()=>startWith(false,true);
 const enterAgora=()=>{setSaved(p=>({...p,stage:'invite'}));document.querySelector<HTMLTextAreaElement>('[data-testid=input-free-text]')?.focus();};
 const assumeCommitments=()=>run(async()=>{
   const state=current.current;if(!state)throw new Error('Carregue o cliente antes de registrar objetivos.');
   // Sem id_usuario do servidor não há pedido: IdentidadeAusente → telaDeErro (aviso global).
   requireIdUsuario(saved.person);
   const body=JSON.stringify({version:state.version,plan:saved.draft});
   if(confirmAttempt.current?.body!==body)confirmAttempt.current={body,id:crypto.randomUUID()};
   const r=await backend.confirm(state.version,saved.draft,confirmAttempt.current.id);apply(r.state);setSaved(p=>({...p,stage:'card'}));append('Aprovar e salvar minha meta','user');append('Seus objetivos foram registrados no servidor. Você pode vê-los em Acompanhe.');confirmAttempt.current=null;
 });
 const adjustValues=()=>run(async()=>{requireIdUsuario(saved.person);const r=await backend.withdraw();if(r.state)apply(r.state);append('Quero ajustar a proposta.','user');append('Claro. O que você gostaria de mudar para essa proposta fazer mais sentido na sua rotina?');});
 const progress=(stage:'card'|'finish',phraseIndex:number)=>run(async()=>{if(!current.current)throw new Error('Plano não carregado.');const r=await backend.progress(current.current.version,stage,phraseIndex);apply(r.state);setSaved(p=>({...p,stage}));});
 const finish=()=>{void progress('finish',saved.phraseIndex);};
 const nextPhrase=()=>{void progress('card',saved.phraseIndex+1);};
 const showCard=()=>{if(saved.confirmed)setSaved(p=>({...p,stage:'card'}));};
 // Envio do chat: a falha vira estado de tela (mapeador único), a mensagem sai do histórico e, conforme
 // acao_cliente, volta ao campo (enviar_como_nova/reformular), espera e reenvia (aguardar) ou não repete.
 const sendText=(query:string,id:string=crypto.randomUUID())=>{
   setChatFailure(null);
   return run(async()=>{
     const mine=createMessage(query,'user');
     setSaved(p=>({...p,messages:[...p.messages,mine]}));
     let reply:{reply:string;conversation_id:string|null};
     try{reply=await backend.chat(query,cid.current,id);}
     catch(e){
       const screen=telaDeErro(e,'mensagem');
       setSaved(p=>({...p,messages:p.messages.filter(m=>m.id!==mine.id)}));
       if(screen.action==='reiniciar_sessao')cid.current=null;
       if(screen.action==='enviar_como_nova'||screen.action==='reformular')setComposerRestore({text:query,nonce:Date.now()});
       setChatFailure({screen,text:query,id:screen.action==='enviar_como_nova'?crypto.randomUUID():id});
       return;
     }
     cid.current=reply.conversation_id;
     const bot={...createMessage(reply.reply),demo:isDemoReply(reply,mode)};
     setSaved(p=>({...p,messages:[...p.messages,bot]}));
     // The reply is already shown; a backend without i-agora/plano must not turn it into an error.
     if(chatOnly.current)return;
     const s=await backend.state().catch(()=>null);if(s?.state)apply(s.state);
   });
 };
 const retryChat=()=>{if(chatFailure)void sendText(chatFailure.text,chatFailure.id);};
 const reset=()=>run(async()=>{const r=await backend.reset();cid.current=null;confirmAttempt.current=null;setChatFailure(null);if(r.state)apply(r.state,true);});
 return {saved,typing,error,mode,profile,profileStatus,profileFailure,loadStartedAt,openingStatus,openingFailure,openingStartedAt,retryOpening,restartSession,
   chatFailure,composerRestore,retryChat,load,startWith,enterAgora,assumeCommitments,adjustValues,finish,nextPhrase,showCard,sendText,reset};
}
