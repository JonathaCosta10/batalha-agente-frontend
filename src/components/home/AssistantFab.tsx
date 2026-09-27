import { brand } from '../../lib/brand';

export function AssistantFab({disabled=false,onClick}:{disabled?:boolean;onClick:()=>void}) {
  return <button className="fab" data-testid="button-open-iai" aria-label="Abrir conversa com i.ai" disabled={disabled} onClick={onClick}><img src={brand('ia-i-original.png')} alt=""/><span className="fab-beta" aria-hidden="true">beta</span></button>;
}
