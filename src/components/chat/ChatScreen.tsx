import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
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
  // Sem abertura: nem CTA, nem "digitando", nem campo livre — só o estado de carregamento/erro.
  const waiting=!!opening&&opening.status!=='ready';
  const chatError=send?.failure?.screen??null;
  // aguardar (429/503): o envio fica travado durante a espera pedida pelo servidor.
  const sendWait=useRetryWait(chatError);
  return <div className="chat">
    <ChatHeader firstName={displayName(saved.person)} onClose={onClose} onRestart={onRestart}/>
    <div className="chat-scroller" role="log" aria-live="polite" aria-relevant="additions">
      <div className="date-divider">Seu espaço de planejamento</div>
      <IntroBlock firstName={saved.person.primeiroNome} carouselIndex={carouselIndex} onCarouselChange={onCarouselChange}/>
      {saved.messages.filter(m=>m.id!=='intro').map(m=><MessageItem key={m.id} message={m}/>)}
      {waiting?<OpeningStatusPanel {...opening}/>
        :typing?<TypingIndicator/>
        :chatError?<ErrorStatePanel screen={chatError} testid="chat-error" unsent={send?.failure?.text} onRetry={send!.onRetry} onRestartSession={opening?.onRestartSession??(()=>{})}/>
        :<StageActions saved={saved} exporting={exporting} handlers={handlers}/>}
      <div ref={scrollEnd}/>
    </div>
    <ChatComposer typing={typing} locked={locked||waiting||sendWait>0} restore={send?.restore} onSend={onSend}/>
  </div>;
}
