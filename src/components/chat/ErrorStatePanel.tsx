import { useElapsed } from '../../hooks/useElapsed';
import { retryRemaining, type ScreenError } from '../../services/errorScreen';

// Segundos que faltam da espera pedida pelo servidor; re-renderiza a cada segundo.
export function useRetryWait(screen:ScreenError|null) {
  const elapsed=useElapsed(screen?.at??0);
  return screen?retryRemaining(screen,screen.at+elapsed*1000):0;
}

type Props = { screen:ScreenError; testid:string; unsent?:string; onRetry:()=>void; onRestartSession:()=>void };

// Estado de erro (não é fala do agente): distinto das bolhas, role=alert, ação conforme o mapeador único.
export function ErrorStatePanel({screen,testid,unsent,onRetry,onRestartSession}:Props) {
  const wait=useRetryWait(screen);
  return <div className="opening-state opening-error" role="alert" data-testid={testid} data-action={screen.action}>
    <p className="opening-error-title">{screen.title}</p>
    <p>{screen.detail}</p>
    {unsent&&screen.action!=='enviar_como_nova'&&screen.action!=='reformular'&&<p className="opening-error-server">Mensagem não enviada: “{unsent}”</p>}
    {screen.serverMessage&&<p className="opening-error-server" data-testid={`${testid}-server-message`}>Servidor: {screen.serverMessage}</p>}
    {screen.encaminharHumano&&<p className="opening-error-server">Atendimento humano: NAO_IMPLEMENTADO nesta demonstração.</p>}
    {screen.action==='tentar_de_novo'&&<>
      {wait>0&&<p className="balance-status" role="status" aria-live="polite" data-testid={`${testid}-countdown`}>Pode tentar de novo em {wait}s.</p>}
      <button className="retry-btn" data-testid={`${testid}-retry`} disabled={wait>0} onClick={onRetry}>{wait>0?`Tentar de novo (${wait}s)`:'Tentar de novo'}</button>
    </>}
    {screen.action==='reiniciar_sessao'&&<button className="retry-btn" data-testid={`${testid}-restart`} onClick={onRestartSession}>Reiniciar sessão</button>}
  </div>;
}
