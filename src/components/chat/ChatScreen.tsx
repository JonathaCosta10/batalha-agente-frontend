import { useEffect, useRef, useState } from 'react';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import { chatView, REVEAL_MS } from '../../services/chatView';
import type { ChatFailure } from '../../hooks/usePlanConversation';
import type { ScreenError } from '../../services/errorScreen';
import { displayName } from '../../services/identity';
import type { OpeningStatus } from '../../services/openingLoad';
import type { Saved } from '../../types';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';
import { ErrorStatePanel, useRetryWait } from './ErrorStatePanel';
import { IntroBlock } from './IntroBlock';
import { MessageItem } from './MessageItem';
import { OpeningStatusPanel } from './OpeningStatusPanel';
import { StageActions, type StageHandlers } from './stages/StageActions';
import { TypingIndicator } from './TypingIndicator';

export type ChatOpening = { status:OpeningStatus; failure:ScreenError|null; startedAt:number; onRetry:()=>void; onRestartSession:()=>void };
export type ChatSendFailure = { failure:ChatFailure|null; restore:{text:string;nonce:number}|null; onRetry:()=>void };

type ChatScreenProps = {
  saved:Saved; typing:boolean; locked?:boolean; exporting:boolean; carouselIndex:number;
  onCarouselChange:(index:number)=>void; onClose:()=>void; onRestart:()=>void; onSend:(query:string)=>void;
  handlers:StageHandlers; opening?:ChatOpening; send?:ChatSendFailure;
};

export function ChatScreen({saved,typing,locked=false,exporting,carouselIndex,onCarouselChange,onClose,onRestart,onSend,handlers,opening,send}:ChatScreenProps) {
  const scrollEnd=useChatAutoScroll(saved,typing);
  const waiting=!!opening&&opening.status!=='ready';
  const chatError=send?.failure?.screen??null;
  // aguardar (429/503): o envio fica travado durante a espera pedida pelo servidor.
  const sendWait=useRetryWait(chatError);
  // The "i agora" click releases the preloaded opening after a short "digitando" (chatView.ts).
  const [revealing,setRevealing]=useState(false);
  const prevStage=useRef(saved.stage);
  useEffect(()=>{
    const from=prevStage.current;prevStage.current=saved.stage;
    if(from!=='intro'||saved.stage==='intro')return;
    setRevealing(true);const t=setTimeout(()=>setRevealing(false),REVEAL_MS);return()=>clearTimeout(t);
  },[saved.stage]);
  const view=chatView({stage:saved.stage,openingWaiting:waiting,typing,revealing,hasError:!!chatError});
  return <div className="chat">
    <ChatHeader firstName={displayName(saved.person)} onClose={onClose} onRestart={onRestart}/>
    <div className="chat-scroller" role="log" aria-live="polite" aria-relevant="additions">
      <div className="date-divider">Seu espaço de planejamento</div>
      <IntroBlock firstName={saved.person.primeiroNome} carouselIndex={carouselIndex} onCarouselChange={onCarouselChange}/>
      {view.showMessages&&saved.messages.filter(m=>m.id!=='intro').map(m=><MessageItem key={m.id} message={m}/>)}
      {view.panel==='opening'&&opening?<OpeningStatusPanel {...opening}/>
        :view.panel==='typing'?<TypingIndicator/>
        :view.panel==='error'&&chatError?<ErrorStatePanel screen={chatError} testid="chat-error" unsent={send?.failure?.text} onRetry={send!.onRetry} onRestartSession={opening?.onRestartSession??(()=>{})}/>
        :<StageActions saved={saved} exporting={exporting} handlers={handlers}/>}
      <div ref={scrollEnd}/>
    </div>
    <ChatComposer typing={typing} locked={locked||view.composerLocked||sendWait>0} restore={send?.restore} onSend={onSend}/>
  </div>;
}
