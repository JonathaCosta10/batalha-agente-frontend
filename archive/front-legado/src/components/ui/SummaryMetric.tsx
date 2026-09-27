import type { ReactNode } from 'react';
import { BRL } from '../../services/planService';

export function SummaryMetric({value,children}:{value:number;children:ReactNode}) {
  return <div className="summary-metric"><strong>{BRL(value)}</strong><span>{children}</span></div>;
}
