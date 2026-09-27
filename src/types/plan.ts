export type Category = 'delivery' | 'shopping' | 'reserve' | 'other';
export type Stage = 'intro' | 'invite' | 'confirm' | 'card' | 'finish';
export type Author = 'bot' | 'user';
// demo: resposta fixa do modo demo (Gemini desligado); a tela mostra o selo, não parece fala do agente.
export type Message = { id: string; by: Author; text: string; demo?: boolean };
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
  ref: string; estado: ProposalState; regra: string; segmento: string;
  itens: ProposalItem[];
  valorLiberado: number; reserva: number; faltaAposCortes: number;
  fonte: string; medidoEm: string;
};
export type Gender = 'F' | 'M' | 'NAO_INFORMADO';
// Selo do nome gerado (backend planning/nomes_por_id.json): sem ele o nome não aparece na tela.
export type NameSeal = { natureza: 'nome_gerado'; fonte?: string; medido_em?: string; decidido?: string };
// `id` é o índice interno do servidor: NUNCA é identificador de pedido. A identidade é `idUsuario` (UUID).
export type Person = { id: number; nome: string; primeiroNome: string; genero: Gender; plan: Plan; idUsuario?: string | null; nomeSelo?: NameSeal | null; rotulo?: string; sourceAvailable?: boolean; referenceLabel?: string; planPeriodLabel?: string; sourceLabel?: string };
export type PersonRecord = { id: number; nome: string; abertoEm: string };
export type CommitmentCase = { objective:string; personal_context:string; action:string; category:Category; monthly_amount:string; reference_month:string; source:string };
export type Saved = { commitmentCase?:CommitmentCase|null; person: Person; stage: Stage; messages: Message[]; draft: Plan; confirmed: Plan | null; phraseIndex: number };
export type PlanTotals = { deliveryCut: number; shoppingCut: number; otherCut: number; released: number; initial: number; available: number; reserve: number; after: number };
