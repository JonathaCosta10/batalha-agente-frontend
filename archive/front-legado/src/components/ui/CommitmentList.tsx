import { CheckCircle2 } from 'lucide-react';
import { commitments } from '../../services/planService';
import type { Plan } from '../../types';

export function CommitmentList({plan}:{plan:Plan}) {
  return <ul className="commitment-list">{commitments(plan).map((item,i)=><li key={i}><CheckCircle2 size={17}/>{item}</li>)}</ul>;
}
