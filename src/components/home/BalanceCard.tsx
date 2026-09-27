import { useElapsed } from '../../hooks/useElapsed';
import { HIDDEN_VALUE } from '../../data/profile';
import { BRL } from '../../services/planService';
import { balanceOf, signedBRL } from '../../services/personService';
import { loadingText, PROFILE_FAILED, type ProfileStatus } from '../../services/profileLoad';
import type { Person } from '../../types';

type BalanceCardProps = { person:Person; hidden:boolean; status:ProfileStatus; startedAt:number; seal:string; detail?:string; onRetry:()=>void };


function LoadingBalance({startedAt}:{startedAt:number}) {
  const elapsed=useElapsed(startedAt);
  // Skeleton only: no number is shown before the source answers.
  return <>
    <p className="balance-title">Fluxo do mês</p>
    <div className="skeleton skeleton-value" aria-hidden="true"/>
    <div className="balance-details" aria-hidden="true"><div className="value-row"><span>Entradas</span><i className="skeleton skeleton-row"/></div><div className="value-row"><span>Saídas</span><i className="skeleton skeleton-row"/></div></div>
    <p className="balance-status" role="status" aria-live="polite" aria-atomic="true" data-testid="text-profile-loading">{loadingText(elapsed)}</p>
  </>;
}

export function BalanceCard({person,hidden,status,startedAt,seal,detail,onRetry}:BalanceCardProps) {
  const balance=balanceOf(person);
  const show=(value:string)=>person.sourceAvailable===false?"Não disponível":hidden?HIDDEN_VALUE:value;
  return <section className="balance-card" aria-label="Entradas menos saídas no período observado" aria-busy={status==='loading'}>
    <div className="card-heading"><span className="eyebrow">VISÃO DA CONTA</span><span className="period-pill">{status==='loading'?'Carregando':status==='ready'&&person.referenceLabel||"Não disponível"}</span></div>
    {status==='loading'?<LoadingBalance startedAt={startedAt}/>
    :status==='error'?<div className="balance-error" role="alert" data-testid="text-profile-error"><p>{PROFILE_FAILED}</p>{detail&&<p className="balance-status" data-testid="text-profile-error-detail">{detail}</p>}<button className="retry-btn" data-testid="button-profile-retry" onClick={onRetry}>Tentar de novo</button></div>
    :<>
      <p className="balance-title">Fluxo do mês</p><p className="balance-value" data-testid="text-december-balance" style={balance<0?undefined:{color:'var(--text-primary)'}}>{show(signedBRL(balance))}</p>
      <div className="balance-details"><div className="value-row"><span>Entradas</span><b>{show(BRL(person.plan.income))}</b></div><div className="value-row"><span>Saídas</span><b>{show(BRL(person.plan.expenses))}</b></div></div>
      {seal&&<p className="balance-seal" data-testid="text-profile-seal">Fonte: {seal}</p>}
    </>}
  </section>;
}
