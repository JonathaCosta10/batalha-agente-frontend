import { Fragment } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PLANNING_ACTION, SHORTCUTS } from '../../data/navigation';
import { brand } from '../../lib/brand';

export function ShortcutGrid({locked=false,onSelect}:{locked?:boolean;onSelect:(label:string)=>void}) {
  return <div className="shortcut-grid" aria-label="Acesso rápido">
    {SHORTCUTS.map(({label,lines,icon,testId})=><button key={label} className="shortcut" data-testid={testId} disabled={locked&&label===PLANNING_ACTION} onClick={()=>onSelect(label)}>
      <span className="shortcut-icon-wrap">{icon?<img className="shortcut-icon" src={brand(icon)} alt=""/>:<SlidersHorizontal size={21}/>}</span>
      <span>{lines.map((line,i)=><Fragment key={line}>{i>0&&<br/>}{line}</Fragment>)}</span>
    </button>)}
  </div>;
}
