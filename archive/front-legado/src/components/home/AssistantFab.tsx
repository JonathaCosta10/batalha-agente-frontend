import { brand } from '../../lib/brand';

export function AssistantFab({onClick}:{onClick:()=>void}) {
  return <button className="fab" data-testid="button-open-iai" aria-label="Abrir conversa com i.ai" onClick={onClick}><img src={brand('ia-i-original.png')} alt=""/><span className="fab-beta" aria-hidden="true">beta</span></button>;
}
