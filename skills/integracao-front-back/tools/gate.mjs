// Gate da integracao-front-back (Node, sem rede).
// Uso:
//   node skills/integracao-front-back/tools/gate.mjs                     -> evals golden/adversarial
//   node skills/integracao-front-back/tools/gate.mjs --evidencia e2e.json -> julga uma evidencia do script
// Julga a evidencia de scripts/validar_chat_ponta_a_ponta.py: usuario UUID, ordem das etapas igual a do front,
// codigos de definir/sessao, e coerencia da classe do 503 com ultimas_chamadas de conversas/status/.
// Saida: 0 = conforme / TUDO OK; 1 = nao conforme ou eval falhou; 2 = NAO_MEDIDO (arquivo ausente).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POL = Object.fromEntries(readFileSync(join(skill, "policies", "gates.yaml"), "utf8").split(/\r?\n/)
  .map((l) => l.match(/^([a-z_]+):\s*(.+?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const SEQ = POL.sequencia.split(",");
const UUID = new RegExp(POL.uuid_regex);

// Devolve a lista de motivos de nao conformidade (vazia = conforme).
export function julgar(ev) {
  const m = [];
  if (!ev || !Array.isArray(ev.etapas)) return ["evidencia sem etapas"];
  if (!UUID.test(String(ev.usuario || "").toLowerCase())) m.push("usuario nao e UUID (indice posicional da 400)");
  const http = ev.etapas.filter((e) => e.etapa !== "classificacao_503");
  const ordem = http.map((e) => e.etapa).filter((n, i, a) => n !== "mensagens" || a[i - 1] !== "mensagens");
  if (ordem.join(",") !== SEQ.join(",")) m.push(`ordem das etapas diverge do front: ${ordem.join(",")}`);
  const por = (n) => http.find((e) => e.etapa === n);
  if (por("definir")?.http !== Number(POL.esperado_definir)) m.push(`definir deu ${por("definir")?.http}, esperado ${POL.esperado_definir}`);
  if (por("sessao")?.http !== Number(POL.esperado_sessao)) m.push(`sessao deu ${por("sessao")?.http}, esperado ${POL.esperado_sessao}`);
  const n503 = http.filter((e) => e.etapa === "mensagens" && e.http === 503).length;
  const cls = ev.etapas.filter((e) => e.etapa === "classificacao_503");
  if (n503 !== cls.length) m.push(`${n503} chat 503 e ${cls.length} classificacoes: todo 503 tem de ser classificado`);
  for (const c of cls) {
    const ch = c.ultimas_chamadas || [];
    const esperada = !ch.length ? "NAO_MEDIDO" : ch.some((x) => x.outcome !== POL.outcome_ok) ? "PROVEDOR" : "DETERMINISTICO";
    if (c.classe !== esperada) m.push(`classe ${c.classe} contradiz ultimas_chamadas (esperada ${esperada})`);
  }
  return m;
}

function evals() {
  let ok = 0, total = 0, neg = 0, apanhadas = 0;
  for (const pasta of ["golden", "adversarial"]) {
    const dir = join(skill, "evals", pasta);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const c = JSON.parse(readFileSync(join(dir, f), "utf8"));
      const motivos = julgar(c.evidencia), reprova = motivos.length > 0, deve = c.deve === "reprovar";
      total++; if (deve) neg++;
      const certo = deve ? reprova && (!c.falha_contem || motivos.some((x) => x.includes(c.falha_contem))) : !reprova;
      if (certo) { ok++; if (deve) apanhadas++; }
      console.log(`${certo ? "ok   " : "FALHA"} ${pasta}/${f}: ${reprova ? "NAO_CONFORME (" + motivos.join("; ") + ")" : "CONFORME"}`);
    }
  }
  if (!neg) { console.log("FALHA: nenhum caso adversarial (prova negativa ausente)"); return false; }
  console.log(`${ok === total ? "TUDO OK" : "FALHA"} — ${ok}/${total} casos, ${apanhadas}/${neg} provas negativas apanhadas`);
  return ok === total;
}

const i = process.argv.indexOf("--evidencia");
if (i > 0) {
  const arq = process.argv[i + 1];
  if (!arq || !existsSync(arq)) { console.log(`NAO_MEDIDO: evidencia ${arq} nao existe`); process.exit(2); }
  const motivos = julgar(JSON.parse(readFileSync(arq, "utf8")));
  console.log(motivos.length ? `NAO_CONFORME: ${motivos.join("; ")}` : "CONFORME");
  process.exit(motivos.length ? 1 : 0);
}
process.exit(evals() ? 0 : 1);
