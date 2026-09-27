import type { Person, Proposal } from '../types';
import { backend } from './backend';
import { idUsuarioOf, requireIdUsuario } from './identity';
import { calculations, commitmentText, selectedCategories } from './planService';

// Compatibility facade for the earlier proposal consumer. The request identity is the signed server
// session; the only identifier the front may name is the id_usuario (UUID), never the numeric
// person.id nor a list position. Without id_usuario no request is made (IdentidadeAusente).
export const backendRef = (person:Pick<Person,'idUsuario'>) => requireIdUsuario(person);
export async function fetchProposal(person:Person):Promise<Proposal>{
 const ref=requireIdUsuario(person);
 const current=await backend.state();
 if(idUsuarioOf(current.state?.profile.person.idUsuario)!==ref)throw new Error('Perfil desatualizado; recarregue a sessão.');
 const {state}=await backend.propose();const p=state.draft;const t=calculations(p);
 return {ref,estado:'OK',regra:'user_chosen_targets',segmento:state.profile.situation,
  itens:selectedCategories(p).map(c=>({subcategoria:c,categoriaMacro:c,nivel:'meta_escolhida',gastoAtual:c==='shopping'?p.shoppingCurrent:c==='delivery'?p.deliveryCurrent:0,corte:c==='shopping'?t.shoppingCut:c==='delivery'?t.deliveryCut:c==='other'?t.otherCut:0,meta:c==='shopping'?p.shoppingTarget:c==='delivery'?p.deliveryTarget:c==='reserve'?p.reserveTarget:p.otherCut,texto:commitmentText(p,c)})),
  valorLiberado:t.released,reserva:t.reserve,faltaAposCortes:Math.max(0,-t.after),fonte:state.profile.referencePeriod.seal.source,medidoEm:state.profile.referencePeriod.seal.measuredAt||'NAO_MEDIDO'};
}
