import type { Person, Proposal } from '../types';
import { backend } from './backend';
import { calculations, commitmentText, selectedCategories } from './planService';

// Compatibility facade for the earlier proposal consumer. Identity is the signed
// server session, never person.id + 1 or a caller-controlled ref in a POST body.
export const backendRef = (person:Person) => person.id;
export async function fetchProposal(person:Person):Promise<Proposal>{
 const current=await backend.state();
 if(current.state?.profile.person.id!==person.id)throw new Error('Perfil desatualizado; recarregue a sessão.');
 const {state}=await backend.propose();const p=state.draft;const t=calculations(p);
 return {ref:state.profile.person.id,estado:'OK',regra:'user_chosen_targets',segmento:state.profile.situation,
  itens:selectedCategories(p).map(c=>({subcategoria:c,categoriaMacro:c,nivel:'meta_escolhida',gastoAtual:c==='shopping'?p.shoppingCurrent:c==='delivery'?p.deliveryCurrent:0,corte:c==='shopping'?t.shoppingCut:c==='delivery'?t.deliveryCut:c==='other'?t.otherCut:0,meta:c==='shopping'?p.shoppingTarget:c==='delivery'?p.deliveryTarget:c==='reserve'?p.reserveTarget:p.otherCut,texto:commitmentText(p,c)})),
  valorLiberado:t.released,reserva:t.reserve,faltaAposCortes:Math.max(0,-t.after),fonte:state.profile.referencePeriod.seal.source,medidoEm:state.profile.referencePeriod.seal.measuredAt||'NAO_MEDIDO'};
}
