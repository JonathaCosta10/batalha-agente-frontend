import { ChevronRight } from 'lucide-react';
import { brand } from '../../../lib/brand';

export function AgoraTrigger({onClick}:{onClick:()=>void}) {
  return <button className="agora-trigger" data-testid="button-open-iagora" aria-label="Começar planejamento com i.agora" onClick={onClick}><img src={brand('i-agora.png')} alt=""/><ChevronRight size={16}/></button>;
}
