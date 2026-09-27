export type Category = 'delivery' | 'shopping' | 'reserve' | 'other';
export type Stage = 'intro' | 'invite' | 'confirm' | 'card' | 'finish';
export type Author = 'bot' | 'user';
export type Message = { id: string; by: Author; text: string };
export type Plan = {
  income: number; expenses: number;
  deliveryCurrent: number; deliveryTarget: number;
  shoppingCurrent: number; shoppingTarget: number;
  otherCut: number; reserveTarget: number;
  selected: Category[]; period?: string;
  // Compatibility metadata for earlier proposal consumers; values remain server-sourced.
  proposal?: Proposal | null;
};
export type ProposalState = 'OK' | 'LIVRE_SEM_CORTE' | 'CORTE_INSUFICIENTE';
export type ProposalItem = { subcategoria: string; categoriaMacro: string; nivel: string; gastoAtual: number; corte: number; meta: number; texto: string };
export type Proposal = {
  ref: number; estado: ProposalState; regra: string; segmento: string;
  itens: ProposalItem[];
  valorLiberado: number; reserva: number; faltaAposCortes: number;
  fonte: string; medidoEm: string;
};
export type Gender = 'F' | 'M' | 'NAO_INFORMADO';
// Since 2026-09-27 the backend draws a real id_usuario and sends nome/primeiroNome/genero as null (nothing invented).
export type Person = { id: number; nome: string | null; primeiroNome: string | null; genero: Gender | null; idUsuario?: string; rotulo?: string; plan: Plan; sourceAvailable?: boolean; referenceLabel?: string; planPeriodLabel?: string; sourceLabel?: string };
export type PersonRecord = { id: number; nome: string; abertoEm: string };
export type CommitmentCase = { objective:string; personal_context:string; action:string; category:Category; monthly_amount:string; reference_month:string; source:string };
export type Saved = { commitmentCase?:CommitmentCase|null; person: Person; stage: Stage; messages: Message[]; draft: Plan; confirmed: Plan | null; phraseIndex: number };
export type PlanTotals = { deliveryCut: number; shoppingCut: number; otherCut: number; released: number; initial: number; available: number; reserve: number; after: number };
