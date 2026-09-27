import { PLAN_PERIOD } from '../../data/profile';
import { brand } from '../../lib/brand';
import { phraseFor } from '../../services/planService';
import type { Plan } from '../../types';

export function SharePreview({plan,index}:{plan:Plan;index:number}) {
  const phrase=phraseFor(plan,index);
  return <div className="preview-card" role="img" aria-label={`Prévia do card: ${phrase} Pequenas mudanças. Mais equilíbrio. Qual vai ser seu próximo passo?`} data-testid="image-share-preview">
    <span className="card-label">{plan.period||"Meu próximo passo"}</span><span className="card-symbol" aria-hidden>↗</span><strong className="card-phrase">{phrase}</strong><div className="card-bottom">Pequenas mudanças. Mais equilíbrio.</div><div className="card-invite">Qual vai ser seu próximo passo?</div><div className="card-marks"><img src={brand('itau-referencia.png')} alt="Itaú"/><img src={brand('i-agora.png')} alt="i.agora"/></div>
  </div>;
}
