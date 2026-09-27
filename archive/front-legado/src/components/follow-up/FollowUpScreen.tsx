import { ArrowLeft } from 'lucide-react';
import followHeader from '../../assets/follow-up-header.png';
import { selectedCategories } from '../../services/planService';
import type { Plan, CommitmentCase } from '../../types';
import '../../styles/follow-up.css';
import { FollowUpCompanion } from './FollowUpCompanion';
import { FollowUpItem } from './FollowUpItem';
import { FollowUpProgress } from './FollowUpProgress';

type FollowUpScreenProps = { commitmentCase?:CommitmentCase|null; plan: Plan; onBack: () => void; onOpenChat: () => void };

export function FollowUpScreen({ plan, commitmentCase, onBack, onOpenChat }: FollowUpScreenProps) {
  const selected = selectedCategories(plan);
  const total = selected.length;

  return <div className="follow-screen">
    <header className="fu-topbar">
      <img className="fu-header-image" src={followHeader} alt="i.agora Acompanhe" />
    </header>

    <main>
      <section className="fu-hero" aria-labelledby="follow-title">
        <div className="fu-hero-row">
          <span className="fu-kicker">Início do cenário · {plan.period||"Período planejado"}</span>
          <button type="button" className="fu-back" onClick={onBack} aria-label="Voltar ao início" data-testid="button-follow-back"><ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" /><span>Início</span></button>
        </div>
        <h1 id="follow-title">Acompanhe seus objetivos</h1>
        <p>As metas mensais que você confirmou. O período indica o início do cenário, não uma promessa de alcançar o alvo nesse mês.</p>
      </section>

      <div className="fu-body">
        <FollowUpProgress />
        {commitmentCase&&<section className="fu-item" data-testid="approved-case"><h2>{commitmentCase.objective}</h2><p>{commitmentCase.personal_context}</p><p><strong>Seu próximo passo:</strong> {commitmentCase.action}</p></section>}

        <div className="fu-section-heading">
          <div><h2>Seus compromissos</h2><p>O plano que você confirmou.</p></div>
          <span className="fu-count" data-testid="text-follow-count">{total} {total === 1 ? 'compromisso' : 'compromissos'}</span>
        </div>

        {total > 0 ? <div className="fu-list" aria-label="Compromissos confirmados">
          {selected.map(category => <FollowUpItem key={category} plan={plan} category={category} />)}
        </div> : <div className="fu-empty">
          <strong>Ainda não há compromissos confirmados.</strong>
          <p>Converse com a i.ai para escolher o que faz sentido para seu planejamento.</p>
        </div>}

        <FollowUpCompanion onOpenChat={onOpenChat} />
      </div>
    </main>
  </div>;
}
