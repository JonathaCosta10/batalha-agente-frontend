export type Category = 'delivery' | 'shopping' | 'reserve' | 'other';
export type Stage = 'intro' | 'invite' | 'confirm' | 'card' | 'finish';
export type Message = { id: string; by: 'bot' | 'user'; text: string };
export type Plan = {
  income: number; expenses: number;
  deliveryCurrent: number; deliveryTarget: number;
  shoppingCurrent: number; shoppingTarget: number;
  otherCut: number; reserveTarget: number;
  selected: Category[];
};
export type Saved = { stage: Stage; messages: Message[]; draft: Plan; confirmed: Plan | null; phraseIndex: number };
export const STORAGE_KEY = 'i-agora-maria-janeiro-2026-v4';
export const INTRO = 'Que bom ter você aqui, Maria!';
export const DEFAULT_PLAN: Plan = { income:5000, expenses:5380, deliveryCurrent:600, deliveryTarget:350, shoppingCurrent:450, shoppingTarget:250, otherCut:130, reserveTarget:200, selected:[] };
export const INITIAL: Saved = { stage:'intro', messages:[{id:'intro',by:'bot',text:INTRO}], draft:DEFAULT_PLAN, confirmed:null, phraseIndex:0 };
export const BRL = (v:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
export const parseBRL = (value:string): number | null => {
  const normalized = value.trim().replace(/^R\$\s*/i,'').replace(/\s/g,'');
  if (!normalized || !/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^\d+(?:,\d{1,2})?$/.test(normalized)) return null;
  const result = Number(normalized.replace(/\./g,'').replace(',','.'));
  return Number.isFinite(result) && result >= 0 && result <= 1000000 ? Math.round(result*100)/100 : null;
};
export const inputBRL = (v:number) => v.toFixed(2).replace('.',',');
export const includes = (p:Plan,c:Category) => p.selected.includes(c);
export function calculations(p:Plan) {
  const deliveryCut = includes(p,'delivery') ? Math.max(0,p.deliveryCurrent-p.deliveryTarget) : 0;
  const shoppingCut = includes(p,'shopping') ? Math.max(0,p.shoppingCurrent-p.shoppingTarget) : 0;
  const otherCut = includes(p,'other') ? p.otherCut : 0;
  const released = Math.round((deliveryCut+shoppingCut+otherCut)*100)/100;
  const initial = Math.round((p.income-p.expenses)*100)/100;
  const available = Math.round((initial+released)*100)/100;
  const reserve = includes(p,'reserve') ? p.reserveTarget : 0;
  const after = Math.round((available-reserve)*100)/100;
  return { deliveryCut, shoppingCut, otherCut, released, initial, available, reserve, after };
}
export const LABELS: Record<Category,string> = {
  delivery:'Delivery e refeições fora', shopping:'Compras por impulso',
  reserve:'Reserva para imprevistos', other:'Outros gastos flexíveis'
};
export function commitments(p:Plan): string[] {
  const lines:string[] = [];
  if(includes(p,'delivery')) lines.push(`Limitar delivery a ${BRL(p.deliveryTarget)} em janeiro.`);
  if(includes(p,'shopping')) lines.push(`Limitar compras por impulso a ${BRL(p.shoppingTarget)} em janeiro.`);
  if(includes(p,'other')) lines.push(`Reduzir ${BRL(p.otherCut)} em outros gastos flexíveis em janeiro.`);
  if(includes(p,'reserve')) lines.push(`Separar ${BRL(p.reserveTarget)} para imprevistos em janeiro.`);
  return lines;
}
export const PHRASES: Record<'delivery'|'shopping'|'reserve'|'other',string[]> = {
  delivery:['Meu delivery vai sentir saudade. Meus planos vão agradecer.','Hoje eu escolhi cozinhar novos planos.','Menos pedidos. Mais espaço para o que importa.'],
  shopping:['Dei um tempo no “eu mereço”. Tô investindo no “eu quero realizar”.','Minha lista de desejos agora tem prioridades.','Compro com calma. Planejo com carinho.'],
  reserve:['Plot twist: este mês, os imprevistos vão me encontrar mais preparada.','Um pouquinho de hoje cuida do meu amanhã.','O futuro ganhou um cantinho no meu mês.'],
  other:['Pequenas escolhas abrem espaço para grandes planos.','Meu mês, minhas escolhas, meu ritmo.','Cada ajuste conta uma história nova.']
};
export function primaryPhraseCategory(p:Plan): keyof typeof PHRASES {
  return (['delivery','shopping','reserve','other'].find(c=>p.selected.includes(c as Category)) || 'other') as keyof typeof PHRASES;
}
export function safeLoad():Saved {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') as Saved | null;
    if(value && Array.isArray(value.messages) && value.draft && Array.isArray(value.draft.selected) && typeof value.stage === 'string') {
      const messages=value.messages.map(m=>m.id==='intro'?{...m,text:INTRO}:m);
      const challengeIndex=messages.findIndex(m=>m.by==='user'&&m.text==='Topo o desafio');
      const cardIndex=messages.findIndex((m,i)=>i>challengeIndex&&m.by==='bot'&&(m.text.startsWith('O primeiro passo já tem nome:')||m.text.startsWith('Preparei um card para marcar esse momento')));
      const confirmationIndex=messages.findIndex((m,i)=>i>challengeIndex&&m.by==='bot'&&m.text.startsWith('Confira os compromissos de exemplo'));
      const retainedIndex=cardIndex>challengeIndex?cardIndex:confirmationIndex;
      const history=challengeIndex<0?messages:retainedIndex>challengeIndex
        ?[...messages.slice(0,challengeIndex+1),...messages.slice(retainedIndex)]
        :[...messages.slice(0,challengeIndex+1),{id:'confirm-migration',by:'bot' as const,text:'Confira os compromissos de exemplo para janeiro de 2026:'}];
      const needsConfirmation=['review','priorities','amounts'].includes(value.stage)||(value.stage==='card'&&!value.confirmed);
      const stage=needsConfirmation?'confirm':value.stage;
      const draft=stage==='confirm'&&!value.draft.selected.length
        ?{...value.draft,selected:['delivery' as Category]}:value.draft;
      return {
        stage, draft, messages:history,
        confirmed:value.confirmed??null,
        phraseIndex:Number.isInteger(value.phraseIndex)?value.phraseIndex:0,
      };
    }
  } catch { /* Ignore malformed or unavailable local storage. */ }
  return INITIAL;
}