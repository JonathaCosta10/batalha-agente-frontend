import { ArrowLeft, ArrowRight, MessageCircle, ShoppingBag, SlidersHorizontal, Sparkles, UtensilsCrossed, Wallet } from 'lucide-react';
import followHeader from '../../../attached_assets/image_1790491967224.png';
import { BRL, LABELS, type Category, type Plan } from './lib/plan';
import './follow-up.css';

type FollowUpScreenProps = {
  plan: Plan;
  onBack: () => void;
  onOpenChat: () => void;
};

const order: Category[] = ['delivery', 'shopping', 'other', 'reserve'];
const icons = {
  delivery: UtensilsCrossed,
  shopping: ShoppingBag,
  other: SlidersHorizontal,
  reserve: Wallet,
};

function commitmentText(plan: Plan, category: Category) {
  switch (category) {
    case 'delivery': return `Limitar delivery a ${BRL(plan.deliveryTarget)} em janeiro.`;
    case 'shopping': return `Limitar compras por impulso a ${BRL(plan.shoppingTarget)} em janeiro.`;
    case 'other': return `Reduzir ${BRL(plan.otherCut)} em outros gastos flexíveis em janeiro.`;
    case 'reserve': return `Separar ${BRL(plan.reserveTarget)} para imprevistos em janeiro.`;
  }
}

export function FollowUpScreen({ plan, onBack, onOpenChat }: FollowUpScreenProps) {
  const selected = order.filter(category => plan.selected.includes(category));
  const total = selected.length;

  return <div className="follow-screen">
    <header className="fu-topbar">
      <img className="fu-header-image" src={followHeader} alt="i.agora Acompanhe" />
    </header>

    <main>
      <section className="fu-hero" aria-labelledby="follow-title">
        <div className="fu-hero-row">
          <span className="fu-kicker">Janeiro / 2026</span>
          <button type="button" className="fu-back" onClick={onBack} aria-label="Voltar ao início" data-testid="button-follow-back"><ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" /><span>Início</span></button>
        </div>
        <h1 id="follow-title">Acompanhe seu janeiro</h1>
        <p>Os compromissos que você assumiu na conversa, em um só lugar.</p>
      </section>

      <div className="fu-body">
        <section className="fu-progress" aria-labelledby="follow-progress-title">
          <div className="fu-progress-top">
            <div><p className="fu-progress-label">ACOMPANHAMENTO COM I.AI</p><h2 id="follow-progress-title">Seu plano, em evolução</h2></div>
            <span className="fu-agent-icon"><Sparkles size={19} aria-hidden="true" /></span>
          </div>
          <p className="fu-agent-copy">A i.ai vai acompanhar seus compromissos ao longo de janeiro.</p>
          <p className="fu-update-note">As atualizações sobre o seu plano aparecerão aqui.</p>
        </section>

        <div className="fu-section-heading">
          <div><h2>Seus compromissos</h2><p>O que você combinou para janeiro.</p></div>
          <span className="fu-count" data-testid="text-follow-count">{total} {total === 1 ? 'compromisso' : 'compromissos'}</span>
        </div>

        {total > 0 ? <div className="fu-list" aria-label="Compromissos confirmados para janeiro de 2026">
          {selected.map(category => {
            const Icon = icons[category];
            return <article className="fu-item" key={category} data-testid={`card-follow-${category}`}>
              <div className="fu-item-head">
                <span className="fu-item-icon"><Icon size={19} strokeWidth={2} aria-hidden="true" /></span>
                <h3 className="fu-item-name">{LABELS[category]}</h3>
              </div>
              <p className="fu-item-detail" data-testid={`text-follow-detail-${category}`}>{commitmentText(plan, category)}</p>
            </article>;
          })}
        </div> : <div className="fu-empty">
          <strong>Ainda não há compromissos confirmados.</strong>
          <p>Converse com a i.ai para escolher o que faz sentido para seu janeiro.</p>
        </div>}

        <aside className="fu-companion">
          <span className="fu-companion-mark"><MessageCircle size={18} aria-hidden="true" /></span>
          <div className="fu-companion-copy"><strong>Quer retomar a conversa?</strong><span>Seu planejamento continua no chat.</span></div>
          <button type="button" className="fu-chat" onClick={onOpenChat} aria-label="Abrir conversa com i.ai" data-testid="button-follow-chat"><ArrowRight size={18} aria-hidden="true" /></button>
        </aside>
      </div>
    </main>
  </div>;
}

export default FollowUpScreen;