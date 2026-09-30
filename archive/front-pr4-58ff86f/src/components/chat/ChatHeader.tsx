import { ArrowLeft, RotateCcw } from 'lucide-react';
import { brand } from '../../lib/brand';

export function ChatHeader({firstName,onClose,onRestart}:{firstName:string;onClose:()=>void;onRestart:()=>void}) {
  return <header className="chat-header">
    <button className="icon-btn" onClick={onClose} data-testid="button-close-chat" aria-label="Fechar conversa"><ArrowLeft size={22}/></button>
    <div className="chat-avatar"><img src={brand('ia-i-original.png')} alt=""/></div>
    <div className="chat-title"><strong>i.ai <span>com {firstName}</span></strong><span>Uma conversa para o seu momento</span></div>
    <button className="restart-chat" onClick={onRestart} data-testid="button-restart-chat" aria-label="Reiniciar com outra pessoa da base"><RotateCcw size={14}/>Reiniciar</button>
  </header>;
}
