import { useElapsed } from '../../hooks/useElapsed';
import type { ScreenError } from '../../services/errorScreen';
import { openingLoadingText, type OpeningStatus } from '../../services/openingLoad';
import { ErrorStatePanel } from './ErrorStatePanel';

type Props = { status:OpeningStatus; failure:ScreenError|null; startedAt:number; onRetry:()=>void; onRestartSession:()=>void };

function OpeningLoading({startedAt}:{startedAt:number}) {
  const elapsed=useElapsed(startedAt);
  // Esqueleto sem avatar do agente: ainda não há fala nenhuma.
  return <div className="opening-state" aria-busy="true" data-testid="opening-loading">
    <div className="skeleton skeleton-line" aria-hidden="true"/><div className="skeleton skeleton-line short" aria-hidden="true"/>
    <p className="balance-status" role="status" aria-live="polite" aria-atomic="true" data-testid="text-opening-loading">{openingLoadingText(elapsed)}</p>
  </div>;
}

// Estado da abertura no chat: carregando (cronômetro) ou erro (NAO_MEDIDO + ação). Não é mensagem do agente.
export function OpeningStatusPanel({status,failure,startedAt,onRetry,onRestartSession}:Props) {
  if(status==='ready')return null;
  if(status==='error'&&failure)return <ErrorStatePanel screen={failure} testid="opening-error" onRetry={onRetry} onRestartSession={onRestartSession}/>;
  return <OpeningLoading startedAt={startedAt}/>;
}
