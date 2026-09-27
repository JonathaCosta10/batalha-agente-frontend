import { BOT } from '../data/conversation';
import { MARIA, NOMES_F, NOMES_M, PEOPLE_LIMIT, SOBRENOMES } from '../data/people';
import type { Person, Saved } from '../types';
import { BRL } from './planService';

const roundTo = (value:number, step:number) => Math.round(value/step)*step;

// Synthetic person for the demo: names follow the archived generator; the money figures scale
// Maria's prototype ratios by income. The i.agora docs do not define these values (NAO_DEFINIDO).
export function calculatePerson(id:number): Person {
  const safeId = id % PEOPLE_LIMIT;
  if (safeId === 0) return MARIA;
  const isFemale = safeId % 2 === 0;
  const primeiroNome = isFemale ? NOMES_F[Math.floor(safeId/2) % NOMES_F.length] : NOMES_M[Math.floor((safeId-1)/2) % NOMES_M.length];
  const sobrenome = SOBRENOMES[(safeId*7) % SOBRENOMES.length];
  const score = Math.min(1000, Math.max(120, ((safeId*37) % 850) + 150));
  const income = roundTo(2500 + (score*11) % 9500, 100);
  const expenses = roundTo(income * (0.9 + ((safeId*13) % 23)/100), 10);
  const ratio = income / MARIA.plan.income;
  const scaled = (value:number) => roundTo(value*ratio, 10);
  return {
    id:safeId, nome:`${primeiroNome} ${sobrenome}`, primeiroNome, genero:isFemale?'F':'M',
    plan:{
      income, expenses,
      deliveryCurrent:scaled(MARIA.plan.deliveryCurrent), deliveryTarget:scaled(MARIA.plan.deliveryTarget),
      shoppingCurrent:scaled(MARIA.plan.shoppingCurrent), shoppingTarget:scaled(MARIA.plan.shoppingTarget),
      otherCut:scaled(MARIA.plan.otherCut), reserveTarget:scaled(MARIA.plan.reserveTarget), selected:[],
    },
  };
}

export const balanceOf = (p:Person) => Math.round((p.plan.income-p.plan.expenses)*100)/100;
// The prototype prints negative balances with a true minus sign (−R$ 380,00).
export const signedBRL = (v:number) => v<0 ? `−${BRL(-v)}` : BRL(v);
export const initialFor = (person:Person): Saved => ({
  person, stage:'intro', messages:[{id:'intro',by:'bot',text:BOT.intro(person.primeiroNome)}],
  draft:{...person.plan,selected:[]}, confirmed:null, phraseIndex:0,
});
