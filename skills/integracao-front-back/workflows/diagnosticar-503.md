# integ.diagnosticar-503

1. PLAN: um 503 do chat tem duas causas que pedem ações diferentes; não trate as duas como "fora do ar".
2. GENERATE: logo depois do 503, `GET /api/v1/context-agent/conversas/status/` (o script já faz) e leia
   `ultimas_chamadas[-3:]`: `stage`, `model`, `latency_ms`, `outcome`, `tratamento_erro`.
3. CRITIQUE:
   - alguma com `outcome = failed_or_uncertain` → **PROVEDOR** (Gemini falhou, 429 ou timeout). Ex. medido
     2026-09-27 12:31 BRT: generate `flash-lite` falhou em 515 ms e a contingência `gemini-3.5-flash` deu timeout de 15 s;
   - todas `complete` → **DETERMINISTICO**: um guard do backend recusou o texto (ex. corrigido em `84ead9b`:
     "fluxo negativo de R$ 1.729,62" reprovado em `numeros_sem_fonte`);
   - `status/` fora ou vazio → `NAO_MEDIDO`. As métricas são do processo inteiro: é indício, não prova.
4. REPAIR: PROVEDOR → reporte ao dono do backend (política e cota em `docs/backend-unico-2026-09-27.md` de lá);
   DETERMINISTICO → capture pergunta e `reply` e abra o caso no backend. O front não reenvia além de uma vez.
5. VERIFY: `node skills/integracao-front-back/tools/gate.mjs --evidencia <e2e.json>` confirma a classe gravada.
