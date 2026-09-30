import { ShoppingBag, SlidersHorizontal, UtensilsCrossed, Wallet } from 'lucide-react';
import { LABELS } from '../../data/plan';
import { commitmentText } from '../../services/planService';
import type { Category, Plan } from '../../types';

const icons = { delivery: UtensilsCrossed, shopping: ShoppingBag, other: SlidersHorizontal, reserve: Wallet };

export function FollowUpItem({plan,category}:{plan:Plan;category:Category}) {
  const Icon = icons[category];
  return <article className="fu-item" data-testid={`card-follow-${category}`}>
    <div className="fu-item-head">
      <span className="fu-item-icon"><Icon size={19} strokeWidth={2} aria-hidden="true" /></span>
      <h3 className="fu-item-name">{LABELS[category]}</h3>
    </div>
    <p className="fu-item-detail" data-testid={`text-follow-detail-${category}`}>{commitmentText(plan, category)}</p>
  </article>;
}
