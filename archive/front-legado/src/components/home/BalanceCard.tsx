import { BALANCE_PERIOD, HIDDEN_VALUE } from '../../data/profile';
import { BRL } from '../../services/planService';
import { balanceOf, signedBRL } from '../../services/personService';
import type { Person } from '../../types';

export function BalanceCard({person,hidden}:{person:Person;hidden:boolean}) {
  const balance=balanceOf(person);
  const show=(value:string)=>person.sourceAvailable===false?"Não disponível":hidden?HIDDEN_VALUE:value;
  return <section className="balance-card" aria-label="Entradas menos saídas no período observado">
    <div className="card-heading"><span className="eyebrow">VISÃO DA CONTA</span><span className="period-pill">{person.referenceLabel||"Não disponível"}</span></div>
    <p className="balance-title">Fluxo do mês</p><p className="balance-value" data-testid="text-december-balance" style={balance<0?undefined:{color:'var(--text-primary)'}}>{show(signedBRL(balance))}</p>
    <div className="balance-details"><div className="value-row"><span>Entradas</span><b>{show(BRL(person.plan.income))}</b></div><div className="value-row"><span>Saídas</span><b>{show(BRL(person.plan.expenses))}</b></div></div>
  </section>;
}
