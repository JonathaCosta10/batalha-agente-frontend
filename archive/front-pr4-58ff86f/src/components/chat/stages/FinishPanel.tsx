import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../../ui/Button';

export function FinishPanel({onBackHome}:{onBackHome:()=>void}) {
  return <div className="control-panel">
    <div className="chat-finish-symbol"><Check size={23}/></div>
    <h3>Seu plano está pronto.</h3><p>Você pode acompanhar seus compromissos na página inicial e voltar a esta conversa quando quiser.</p>
    <Button testId="button-back-home" onClick={onBackHome}>Voltar ao início <ArrowRight size={16}/></Button>
  </div>;
}
