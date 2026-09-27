import { ShieldCheck } from 'lucide-react';

export function PlanNotice() {
  return <div className="notice"><ShieldCheck size={20} style={{flexShrink:0,marginTop:2}}/><div><strong>Um espaço para planejar</strong>Os valores são estimativas. Você decide quais compromissos assumir no período escolhido.</div></div>;
}
