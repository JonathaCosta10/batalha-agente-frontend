import { useState } from 'react';
import { ChatScreen, FollowUpScreen, HomeScreen, PlanSheet, Toast } from './components';
import { TOAST } from './data/conversation';
import { HOME_TAB, PLANNING_ACTION } from './data/navigation';
import { useCardExport } from './hooks/useCardExport';
import { usePlanConversation } from './hooks/usePlanConversation';
import { useToast } from './hooks/useToast';
import { sealLabel } from './services/profileLoad';
import { PrototypeLimits } from './components/ui/PrototypeLimits';
import type { SheetKind } from './types';

// Screen routing (home, chat, follow-up) and the overlays shared between them.
export default function App() {
  const conversation=usePlanConversation();
  const {saved}=conversation;
  const [toast,setToast]=useToast();
  const {exporting,saveCard,resetExport}=useCardExport(conversation.finish,setToast);
  const [chatOpen,setChatOpen]=useState(false);
  const [followOpen,setFollowOpen]=useState(false);
  const [carouselIndex,setCarouselIndex]=useState(0);
  const [sheet,setSheet]=useState<SheetKind|null>(null);
  const [nav,setNav]=useState(HOME_TAB);
  const [info,setInfo]=useState('');
  const [hidden,setHidden]=useState(false);

  // Resumes the current person's conversation (follow-up, "Ver card", "Ver conversa").
  const openChat=()=>{setFollowOpen(false);setChatOpen(true);setNav(HOME_TAB);setInfo('');};
  // The first query (session + profile) must resolve before any chat entry point works.
  const ready=conversation.profileStatus==='ready';
  // Opening resumes the bound profile; it never invents a goal or switches person.
  const startChat=()=>{
    if(!ready)return;
    void conversation.startWith();
    setCarouselIndex(0);
    resetExport();
    openChat();
  };
  const closeChat=()=>setChatOpen(false);
  const closeSheet=()=>{setSheet(null);setInfo('');};
  const reset=async()=>{
    if(!await conversation.reset())return;
    setCarouselIndex(0);
    setHidden(false);
    resetExport();
    setSheet(null);
    setNav(HOME_TAB);
    setInfo('');
    setChatOpen(false);
    setFollowOpen(false);
    setToast(TOAST.reset);
  };
  const viewCard=()=>{setSheet(null);openChat();conversation.showCard();};
  const openFollowUp=()=>{setSheet(null);setFollowOpen(true);window.scrollTo(0,0);};
  const closeFollowUp=()=>{setFollowOpen(false);window.scrollTo(0,0);};
  const navClick=(label:string)=>{setNav(label);setInfo(label===HOME_TAB?'':label);if(label!==HOME_TAB)setSheet('plan');};
  const quickAction=(label:string)=>{if(label===PLANNING_ACTION)startChat();else {setInfo(label);setSheet('plan');}};

  return <div className="app">
    <PrototypeLimits/>
    <div className="notice" role="status"><span>Hackathon · Base sintética do BigQuery · {saved.person.referenceLabel||"Aguardando dados"}. Não é um aplicativo oficial do Itaú. {conversation.profile&&({fluxo_negativo:"Saídas acima das entradas — isso não comprova dívida.",fluxo_equilibrado:"Entradas e saídas equivalentes no período.",sobra_observada:"Entradas acima das saídas no período."}[conversation.profile.situation])}</span></div>
    {ready&&conversation.error&&<div className="notice" role="alert">{conversation.error}<button onClick={()=>void conversation.load()}>Tentar carregar</button></div>}
    {!chatOpen&&followOpen&&saved.confirmed
      ?<FollowUpScreen commitmentCase={saved.commitmentCase} plan={saved.confirmed} onBack={closeFollowUp} onOpenChat={openChat}/>
      :!chatOpen?<HomeScreen
        person={saved.person} hasPlan={!!saved.confirmed} hidden={hidden} nav={nav}
        profileStatus={conversation.profileStatus} loadStartedAt={conversation.loadStartedAt} seal={sealLabel(conversation.profile?.referencePeriod.seal)} profileError={conversation.profileFailure?[conversation.profileFailure.detail,conversation.profileFailure.serverMessage&&`Servidor: ${conversation.profileFailure.serverMessage}`].filter(Boolean).join(' '):undefined} onRetryProfile={()=>void conversation.load()}
        onToggleHidden={()=>setHidden(v=>!v)} onOpenChat={startChat} onOpenFollowUp={openFollowUp}
        onNotices={()=>setToast(TOAST.notices)} onQuickAction={quickAction} onNav={navClick} onReset={()=>setSheet('reset')}
      />:<ChatScreen
        saved={saved} typing={conversation.typing} locked={!ready} exporting={exporting}
        carouselIndex={carouselIndex} onCarouselChange={setCarouselIndex}
        onClose={closeChat} onRestart={reset} onSend={conversation.sendText}
        opening={{status:conversation.openingStatus,failure:conversation.openingFailure,startedAt:conversation.openingStartedAt,onRetry:()=>void conversation.retryOpening(),onRestartSession:()=>void conversation.restartSession()}}
        send={{failure:conversation.chatFailure,restore:conversation.composerRestore,onRetry:conversation.retryChat}}
        handlers={{
          onEnterAgora:conversation.enterAgora,
          onAssume:conversation.assumeCommitments, onAdjust:conversation.adjustValues,
          onSaveCard:forceDownload=>saveCard(saved.confirmed,saved.phraseIndex,forceDownload),
          onNextPhrase:conversation.nextPhrase, onBackHome:closeChat,
        }}
      />}
    {sheet&&<PlanSheet
      kind={sheet} info={info} person={saved.person} confirmed={saved.confirmed}
      onClose={closeSheet} onReset={reset} onKeep={()=>setSheet(null)}
      onStartChat={()=>{closeSheet();startChat();}}
      onOpenChat={()=>{closeSheet();openChat();}} onViewCard={viewCard}
    />}
    {!chatOpen&&!followOpen&&<button className="secondary-link" disabled={conversation.typing||!ready} data-testid="button-next-client" onClick={()=>void conversation.startWith(true)}>Testar próximo perfil da base sintética</button>}
    <Toast message={toast}/>
  </div>;
}
