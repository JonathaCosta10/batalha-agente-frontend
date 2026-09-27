import { ArrowRight, MessageCircle } from 'lucide-react';

export function FollowUpCompanion({onOpenChat}:{onOpenChat:()=>void}) {
  return <aside className="fu-companion">
    <span className="fu-companion-mark"><MessageCircle size={18} aria-hidden="true" /></span>
    <div className="fu-companion-copy"><strong>Quer retomar a conversa?</strong><span>Seu planejamento continua no chat.</span></div>
    <button type="button" className="fu-chat" onClick={onOpenChat} aria-label="Abrir conversa com i.ai" data-testid="button-follow-chat"><ArrowRight size={18} aria-hidden="true" /></button>
  </aside>;
}
