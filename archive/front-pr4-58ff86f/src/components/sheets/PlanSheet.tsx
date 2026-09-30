import { MessageCircle } from 'lucide-react';
import { PLAN_PERIOD } from '../../data/profile';
import { balanceOf, signedBRL } from '../../services/personService';
import { BRL, summaryOf } from '../../services/planService';
import type { Person, Plan, SheetKind } from '../../types';
import { Button } from '../ui/Button';
import { CommitmentList } from '../ui/CommitmentList';
import { ModalSheet } from '../ui/ModalSheet';
import { SummaryMetric } from '../ui/SummaryMetric';

type PlanSheetProps = {
  kind:SheetKind; info:string; person:Person; confirmed:Plan|null;
  onClose:()=>void; onReset:()=>void; onKeep:()=>void; onStartChat:()=>void; onOpenChat:()=>void; onViewCard:()=>void;
};

// Bottom sheet for: reset confirmation, sections not wired to an account yet, and the confirmed plan.
export function PlanSheet({kind,info,person,confirmed,onClose,onReset,onKeep,onStartChat,onOpenChat,onViewCard}:PlanSheetProps) {
  const label=kind==='reset'?'Recomeçar planejamento':info||'Meus compromissos financeiros';
  return <ModalSheet label={label} onClose={onClose}>
    {kind==='reset'?<>
      <span className="eyebrow">SEU PLANO</span><h2>Começar de novo?</h2>
      <p>Vamos selecionar outra pessoa da base e iniciar uma análise dos dados dela. Os planos anteriores não serão apagados.</p>
      <Button testId="button-confirm-reset" onClick={onReset}>Selecionar outra pessoa</Button>
      <Button testId="button-cancel-reset" variant="outline" onClick={onKeep}>Manter meu plano</Button>
    </>:info?<>
      <span className="eyebrow">SEU PLANO</span><h2>{info}</h2>
      <p>Esta área ainda não está conectada a uma conta bancária. Para continuar, converse com a i.ai sobre seu planejamento.</p>
      <Button testId="button-info-chat" onClick={onStartChat}>Conversar com i.ai</Button>
    </>:confirmed?<>
      <span className="eyebrow">{confirmed?.period||person.planPeriodLabel}</span><h2>Meus compromissos financeiros</h2>
      <p>Este é o plano que você confirmou. O fluxo observado permanece {signedBRL(balanceOf(person))}.</p>
      <CommitmentList plan={confirmed}/>
      <SummaryMetric value={summaryOf(confirmed).released}>de redução planejada nos gastos · reserva prevista: {BRL(summaryOf(confirmed).reserve)}</SummaryMetric>
      <Button testId="button-edit-confirmed-plan" onClick={onViewCard}>Ver card no chat <MessageCircle size={17}/></Button>
      <Button testId="button-continue-chat" variant="outline" onClick={onOpenChat}>Ver conversa</Button>
    </>:<>
      <h2>Ainda não há compromissos</h2><p>Converse com a i.ai para criar seu card.</p>
      <Button testId="button-empty-plan-chat" onClick={onStartChat}>Conversar com i.ai</Button>
    </>}
  </ModalSheet>;
}
