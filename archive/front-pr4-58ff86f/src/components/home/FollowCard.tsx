import { ChevronRight } from 'lucide-react';
import { brand } from '../../lib/brand';

export function FollowCard({onClick}:{onClick:()=>void}) {
  return <button type="button" className="follow-card" data-testid="button-iagora-acompanhe" onClick={onClick}><img src={brand('i-agora.png')} alt="i.agora"/><span>Acompanhe</span><ChevronRight size={22} aria-hidden="true"/></button>;
}
