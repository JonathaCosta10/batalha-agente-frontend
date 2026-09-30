import { ChevronRight } from 'lucide-react';
import { brand } from '../../lib/brand';

export function CurrentAccountLink({onClick}:{onClick:()=>void}) {
  return <button className="current-account" data-testid="button-current-account" onClick={onClick}><img src={brand('extrato.svg')} alt=""/>Conta corrente<ChevronRight size={16}/></button>;
}
