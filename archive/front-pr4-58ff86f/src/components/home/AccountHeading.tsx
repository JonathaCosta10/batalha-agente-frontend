import { Eye, EyeOff } from 'lucide-react';
import { brand } from '../../lib/brand';

export function AccountHeading({hidden,onToggle}:{hidden:boolean;onToggle:()=>void}) {
  return <div className="account-heading">
    <div className="account-heading-title"><h1>Meu Itaú</h1><img className="brand-img" src={brand('itau-laranja.png')} alt="Itaú"/></div>
    <button className="account-eye" aria-label={hidden?'Mostrar saldo':'Ocultar saldo'} data-testid="button-toggle-balance" onClick={onToggle}>{hidden?<EyeOff size={18}/>:<Eye size={18}/>}</button>
  </div>;
}
