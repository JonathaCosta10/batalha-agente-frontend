import { CATEGORY_ORDER, PHRASE_PRIORITY, PHRASES } from '../data/plan';
import type { Category, Plan, PlanTotals } from '../types';

export const BRL = (v:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
export const parseBRL = (value:string): number | null => {
  const normalized = value.trim().replace(/^R\$\s*/i,'').replace(/\s/g,'');
  if (!normalized || !/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^\d+(?:,\d{1,2})?$/.test(normalized)) return null;
  const result = Number(normalized.replace(/\./g,'').replace(',','.'));
  return Number.isFinite(result) && result >= 0 && result <= 1000000 ? Math.round(result*100)/100 : null;
};
export const inputBRL = (v:number) => v.toFixed(2).replace('.',',');
export const includes = (p:Plan,c:Category) => p.selected.includes(c);
const round = (v:number) => Math.round(v*100)/100;

export function calculations(p:Plan): PlanTotals {
  const deliveryCut = includes(p,'delivery') ? Math.max(0,p.deliveryCurrent-p.deliveryTarget) : 0;
  const shoppingCut = includes(p,'shopping') ? Math.max(0,p.shoppingCurrent-p.shoppingTarget) : 0;
  const otherCut = includes(p,'other') ? p.otherCut : 0;
  const released = round(deliveryCut+shoppingCut+otherCut);
  const initial = round(p.income-p.expenses);
  const available = round(initial+released);
  const reserve = includes(p,'reserve') ? p.reserveTarget : 0;
  const after = round(available-reserve);
  return { deliveryCut, shoppingCut, otherCut, released, initial, available, reserve, after };
}

export function commitmentText(p:Plan, category:Category): string {
  switch (category) {
    case 'delivery': return `Limitar delivery e refeições fora a ${BRL(p.deliveryTarget)} como meta mensal.`;
    case 'shopping': return `Limitar lojas e sites a ${BRL(p.shoppingTarget)} como meta mensal.`;
    case 'other': return `Reduzir ${BRL(p.otherCut)} em outros gastos flexíveis como meta mensal.`;
    case 'reserve': return `Separar ${BRL(p.reserveTarget)} para imprevistos como meta mensal.`;
  }
}
export const selectedCategories = (p:Plan) => CATEGORY_ORDER.filter(c => includes(p,c));
// Com proposta do backend, o texto e a subcategoria vêm dela (grafia da tabela); sem ela, exemplo local.
export const commitments = (p:Plan) => p.proposal ? p.proposal.itens.map(i => i.texto) : selectedCategories(p).map(c => commitmentText(p,c));
export const summaryOf = (p:Plan) => p.proposal
  ? { released: p.proposal.valorLiberado, reserve: p.proposal.reserva }
  : { released: calculations(p).released, reserve: calculations(p).reserve };

export const primaryPhraseCategory = (p:Plan): Category => PHRASE_PRIORITY.find(c => includes(p,c)) ?? 'other';
export function phraseFor(p:Plan, index:number): string {
  const phrases = PHRASES[primaryPhraseCategory(p)];
  return phrases[index % phrases.length];
}
