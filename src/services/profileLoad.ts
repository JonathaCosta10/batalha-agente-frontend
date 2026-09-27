// Primeira consulta ao abrir: sessão + i-agora/perfil/ (BigQuery). A 1ª chamada fria foi medida em 10,2 s
// (main: balanceApi.ts) e o backend guarda cache de 900 s; 20 s é o mesmo teto que já funcionava.
export const PROFILE_TIMEOUT_MS = 20000;
export type ProfileStatus = 'loading' | 'ready' | 'error';

export const loadingText = (seconds:number) => `Carregando os registros do perfil de demonstração… ${Math.max(0,Math.floor(seconds))}s`;
export const PROFILE_FAILED = 'Não foi possível carregar os registros agora (NAO_MEDIDO)';

// Selo: fonte · data (dd/mm/aaaa). Sem data medida, diz que não mediu em vez de inventar.
export function sealLabel(seal?:{source?:string;measuredAt?:string}|null) {
  if(!seal?.source) return '';
  const at=seal.measuredAt?new Date(seal.measuredAt):null;
  const date=at&&!Number.isNaN(at.getTime())?at.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'data NAO_MEDIDO';
  return `${seal.source} · ${date}`;
}
