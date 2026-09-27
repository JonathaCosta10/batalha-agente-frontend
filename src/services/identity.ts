import type { Gender, NameSeal, Person } from '../types';

// Identidade vem só do servidor (perfil/ e sessao/abertura/). Regra do dono (2026-09-27):
// - a identidade é o id_usuario real (UUID) sorteado pelo servidor e guardado na sessão assinada;
//   o front nunca usa person.id numérico nem a posição numa lista como identificador;
// - o nome só aparece se vier do servidor com o selo `nomeSelo.natureza = "nome_gerado"`;
// - o gênero nunca aparece na tela (o front guarda sempre NAO_INFORMADO).
// O front NUNCA preenche com calculatePerson(), NOMES_F/NOMES_M nem com o alias "Pessoa N da base",
// e nunca mostra "null" nem saudação vazia.
// Ref.: docs/cobrancas/2026-09-27-identidade-do-usuario.md

// NAO_DEFINIDO pelo dono: texto neutro proposto ("Olá" + rótulo/código curto do id; só "Olá" sem id).
export const NEUTRAL_IDENTITY = {
  greeting:(label:string|null)=>label?`Olá, ${label}`:'Olá',
  account:'Perfil de demonstração',
};

const text = (v:unknown) => typeof v==='string'&&v.trim()&&v.trim().toLowerCase()!=='null'?v.trim():null;
// Alias técnico do backend antigo: não é nome, é posição numa lista.
const isAlias = (v:string) => /^pessoa\s+\d+\s+da\s+base$/i.test(v);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** id_usuario válido (UUID) ou null. Número, índice ou texto qualquer não é identidade. */
export const idUsuarioOf = (v:unknown) => {const t=text(v);return t&&UUID.test(t)?t.toLowerCase():null;};

const sealOf = (v:unknown):NameSeal|null => v&&typeof v==='object'&&!Array.isArray(v)&&(v as NameSeal).natureza==='nome_gerado'?v as NameSeal:null;

/** Rótulo neutro a partir do id (mesmo formato do backend: "Cliente " + 8 primeiros caracteres), ou null. */
export function labelFromId(id:unknown) {
  const t=text(id);if(!t)return null;
  const clean=t.replace(/[^0-9a-z]/gi,'').slice(0,8).toLowerCase();
  return clean?`Cliente ${clean}`:null;
}

type ServerPerson = Partial<Omit<Person,'nome'|'primeiroNome'|'genero'|'idUsuario'|'nomeSelo'>>&{nome?:unknown;primeiroNome?:unknown;genero?:unknown;idUsuario?:unknown;id_usuario?:unknown;rotulo?:unknown;nomeSelo?:unknown;nome_origem?:unknown;nomeOrigem?:unknown};

export function personFromServer(person:ServerPerson|Person|null|undefined):Person {
  const p=(person||{}) as ServerPerson;
  // -32 (perfil-usuario/definir/) marca o nome com nome_origem; o agent_backend com nomeSelo.natureza.
  const nomeSelo=sealOf(p.nomeSelo)||(p.nome_origem==='nome_gerado'||p.nomeOrigem==='nome_gerado'?{natureza:'nome_gerado'} as NameSeal:null);
  const realName=(v:unknown)=>{const t=text(v);return nomeSelo&&t&&!isAlias(t)?t:null;};
  const nome=realName(p.nome);
  const primeiroNome=realName(p.primeiroNome)||(nome?nome.split(/\s+/)[0]:null);
  const genero:Gender='NAO_INFORMADO';
  const idUsuario=idUsuarioOf(p.idUsuario??p.id_usuario);
  const rotulo=text(p.rotulo)||labelFromId(idUsuario);
  return {...(p as Person),nome:nome||'',primeiroNome:primeiroNome||'',genero,idUsuario,nomeSelo,rotulo:rotulo||undefined};
}

/** Falha local: o servidor não mandou id_usuario. Nenhum pedido que dependa da identidade é feito. */
export class IdentidadeAusente extends Error {
  readonly code='identidade_ausente';
  constructor(){super('O servidor não enviou o id_usuario desta sessão (NAO_MEDIDO).');}
}

/** Único identificador que o front pode enviar: o id_usuario (UUID). Ausente → IdentidadeAusente. */
export function requireIdUsuario(person:Pick<Person,'idUsuario'>|null|undefined):string {
  const id=idUsuarioOf(person?.idUsuario);
  if(!id)throw new IdentidadeAusente();
  return id;
}

/** Nome para exibir: o do servidor (com selo), senão o rótulo neutro, senão vazio (quem exibe põe o texto neutro). */
export const displayName = (p:Pick<Person,'primeiroNome'|'rotulo'>) => p.primeiroNome||p.rotulo||'';
export const greetingFor = (p:Pick<Person,'primeiroNome'|'rotulo'>) => p.primeiroNome?`Olá, ${p.primeiroNome}`:NEUTRAL_IDENTITY.greeting(p.rotulo||null);
