// A resposta fixa do modo demo (backend sem Gemini) não pode parecer fala do agente.
// Sinais aceites: modo da sessão (conversas/sessao/ → mode), mode/status da resposta, ou o texto fixo do backend
// (agent_backend/conversation/service.py e -32 apps/conversas/service.py começam por "Demonstração local:").
export const DEMO_SEAL = 'Resposta fixa de demonstração — Gemini desligado neste servidor';

type ReplyLike = { mode?:unknown; status?:unknown; reply?:unknown; codigo?:unknown };

export function isDemoReply(reply:ReplyLike|null|undefined, sessionMode?:string|null) {
  if(sessionMode==='demo')return true;
  const r=reply||{};
  if(r.mode==='demo'||r.status==='demo'||r.codigo==='demo')return true;
  return typeof r.reply==='string'&&/^\s*Demonstração local:/i.test(r.reply);
}
