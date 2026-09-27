import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { ChatScreen, FollowUpScreen, HomeScreen, PlanSheet, Toast } from './components';
import { ProfileLoader } from './components/ui/ProfileLoader';
import { TOAST } from './data/conversation';
import { HOME_TAB, PLANNING_ACTION } from './data/navigation';
import { useCardExport } from './hooks/useCardExport';
import { usePlanConversation } from './hooks/usePlanConversation';
import { useToast } from './hooks/useToast';
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
  // Opening resumes the bound profile; it never invents a goal or switches person.
  const startChat=()=>{
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
    {conversation.error&&<div className="notice" role="alert"><span>{conversation.error}</span>
      {conversation.loadStatus==='auth'&&<button className="notice-refresh" data-testid="button-refresh-auth" onClick={()=>void conversation.load()}><RotateCw size={14} aria-hidden="true"/>Atualizar</button>}
    </div>}
    {!chatOpen&&(conversation.loadStatus==='loading'||conversation.loadStatus==='slow')
      ?<ProfileLoader status={conversation.loadStatus}/>
      :!chatOpen&&followOpen&&saved.confirmed
      ?<FollowUpScreen commitmentCase={saved.commitmentCase} plan={saved.confirmed} onBack={closeFollowUp} onOpenChat={openChat}/>
      :!chatOpen?<HomeScreen
        person={saved.person} hasPlan={!!saved.confirmed} hidden={hidden} nav={nav}
        onToggleHidden={()=>setHidden(v=>!v)} onOpenChat={startChat} onOpenFollowUp={openFollowUp}
        onNotices={()=>setToast(TOAST.notices)} onQuickAction={quickAction} onNav={navClick} onReset={()=>setSheet('reset')}
      />:<ChatScreen
        saved={saved} typing={conversation.typing} exporting={exporting}
        carouselIndex={carouselIndex} onCarouselChange={setCarouselIndex}
        onClose={closeChat} onRestart={reset} onSend={conversation.sendText}
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
    {!chatOpen&&!followOpen&&conversation.loadStatus==='ready'&&<button className="secondary-link" disabled={conversation.typing} data-testid="button-next-client" onClick={()=>void conversation.startWith(true)}>Testar próximo perfil da base sintética</button>}
    <Toast message={toast}/>
  </div>;
}
