import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import type { Saved } from '../../types';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';
import { IntroBlock } from './IntroBlock';
import { MessageItem } from './MessageItem';
import { StageActions, type StageHandlers } from './stages/StageActions';
import { TypingIndicator } from './TypingIndicator';

type ChatScreenProps = {
  saved:Saved; typing:boolean; exporting:boolean; carouselIndex:number;
  onCarouselChange:(index:number)=>void; onClose:()=>void; onRestart:()=>void; onSend:(query:string)=>void;
  handlers:StageHandlers;
};

export function ChatScreen({saved,typing,exporting,carouselIndex,onCarouselChange,onClose,onRestart,onSend,handlers}:ChatScreenProps) {
  const scrollEnd=useChatAutoScroll(saved,typing);
  return <div className="chat">
    <ChatHeader firstName={saved.person.primeiroNome} onClose={onClose} onRestart={onRestart}/>
    <div className="chat-scroller" role="log" aria-live="polite" aria-relevant="additions">
      <div className="date-divider">Seu espaço de planejamento</div>
      <IntroBlock firstName={saved.person.primeiroNome} carouselIndex={carouselIndex} onCarouselChange={onCarouselChange}/>
      {saved.messages.filter(m=>m.id!=='intro').map(m=><MessageItem key={m.id} message={m}/>)}
      {typing?<TypingIndicator/>:<StageActions saved={saved} exporting={exporting} handlers={handlers}/>}
      <div ref={scrollEnd}/>
    </div>
    <ChatComposer typing={typing} onSend={onSend}/>
  </div>;
}
