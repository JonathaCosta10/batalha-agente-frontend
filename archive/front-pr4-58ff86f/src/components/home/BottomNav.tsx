import { NAV_ITEMS } from '../../data/navigation';
import { brand } from '../../lib/brand';

export function BottomNav({active,onSelect}:{active:string;onSelect:(label:string)=>void}) {
  return <nav className="bottom-nav" aria-label="Navegação principal">{NAV_ITEMS.map(({label,icon})=>
    <button key={label} className={`nav-item ${active===label?'active':''}`} data-testid={`button-nav-${label.toLowerCase().replaceAll(' ','-')}`} aria-current={active===label?'page':undefined} onClick={()=>onSelect(label)}><span className="nav-icon"><img src={brand(icon)} alt=""/></span>{label}</button>
  )}</nav>;
}
