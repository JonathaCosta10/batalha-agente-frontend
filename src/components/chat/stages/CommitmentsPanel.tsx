import { Check } from 'lucide-react';
import { BRL, calculations } from '../../../services/planService';
import type { Plan, CommitmentCase } from '../../../types';
import { Button } from '../../ui/Button';
import { CommitmentList } from '../../ui/CommitmentList';
import { SummaryMetric } from '../../ui/SummaryMetric';

export function CommitmentsPanel({draft,commitmentCase,onAssume,onAdjust}:{draft:Plan;commitmentCase:CommitmentCase;onAssume:()=>void;onAdjust:()=>void}) {
  const totals=calculations(draft);
  return <div className="control-panel" data-testid="commitment-case">
    <span className="eyebrow">PROPOSTA CONSTRUÍDA NA CONVERSA</span>
    <h3 style={{fontSize:18,marginTop:6}}>{commitmentCase.objective}</h3>
    <p><strong>O que vamos respeitar:</strong> {commitmentCase.personal_context}</p>
    <p><strong>Seu próximo passo:</strong> {commitmentCase.action}</p>
    <CommitmentList plan={draft}/>
    <SummaryMetric value={totals.released}>de redução mensal se a meta for atingida; reserva planejada: {BRL(totals.reserve)}. Não são duas entradas.</SummaryMetric>
    <p className="proposal-seal">Comparado com os dados de {commitmentCase.reference_month} · {commitmentCase.source}</p>
    <p>Ainda não é uma meta salva. Revise se essa proposta representa o que você quer. O resultado depende da sua realidade, não é uma promessa.</p>
    <Button testId="button-assume-commitments" onClick={onAssume}>Aprovar e salvar minha meta <Check size={17}/></Button>
    <Button testId="button-adjust-values" variant="outline" onClick={onAdjust}>Quero conversar e ajustar</Button>
  </div>;
}
