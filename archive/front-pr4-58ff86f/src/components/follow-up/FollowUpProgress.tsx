import { Sparkles } from 'lucide-react';

export function FollowUpProgress() {
  return <section className="fu-progress" aria-labelledby="follow-progress-title">
    <div className="fu-progress-top">
      <div><p className="fu-progress-label">ACOMPANHAMENTO COM I.AI</p><h2 id="follow-progress-title">Seu plano, em evolução</h2></div>
      <span className="fu-agent-icon"><Sparkles size={19} aria-hidden="true" /></span>
    </div>
    <p className="fu-agent-copy">Objetivos registrados no servidor. Ainda não há medição de evolução.</p>
    <p className="fu-update-note">O acompanhamento de gastos exige novos movimentos comparáveis; nenhum progresso foi estimado.</p>
  </section>;
}
