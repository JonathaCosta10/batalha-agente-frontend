# Validação front ↔ back por localhost

## 2026-09-27 14:07 BRT — "continuo com erro": o reenvio batia no cache da falha

**Sintoma (dono, 13:35):** `POST conversas/mensagens/` → 503, `Retry-After: 10`, e "Tentar de novo" não saía do erro.

**Causa medida (backend `9152041`, pela `:3000`):** o backend guarda toda resposta, falhas incluídas, em
`(sessão, conversa, client_message_id)` e nunca regera com o mesmo id (`apps/conversas/service.py` `_send`, "sem
cobrança dupla"). O front reenviava com o **mesmo** id → recebia a mesma falha do cache (16–31 ms, nenhum modelo chamado).
Além disso o front descartava o `conversation_id` que vem no corpo da falha, e cada reenvio abria uma conversa nova
(teto de 5 por sessão → 429).

**Correção no front (`src/services/chatRetry.ts`, `usePlanConversation.ts`, `backend.ts`):**
- falha que o servidor respondeu (status > 0) → o reenvio leva um `client_message_id` novo; sem resposta (rede,
  timeout do cliente) o id fica, para receber do cache a resposta que o servidor possa ter concluído;
- o `conversation_id` do corpo da falha é adotado (`ApiError.conversationId`);
- `busy` (429/503/504) com `Retry-After` ≤ 30 s → **um** reenvio automático depois da espera; o botão continua.
- Prova: `chatRetry.test.ts` (4 testes, 2 negativos). `npm test` 44/44, `tsc` 0 erros.

**Medição real (`scratchpad/e2e_retry.py`, Gemini real):**

| Hora | Turnos | Resultado |
| --- | --- | --- |
| 13:36 | 3 | 200, 200, 503 (`resposta_reprovada_validacao`; a mesma pergunta numa conversa nova → 200 em 21 s) |
| 13:39 | 5 | 200 ×4, depois 429 `cota_provedor`; mesmo id → 429 do cache em 31 ms; id novo após 30 s → 429 (todos os modelos em resfriamento) |
| 14:06 | 3 | 200, 200, 429 `cota_provedor`; mesmo id → cache em 16 ms; id novo após 30 s → 503 (ainda sem modelo) |

**O que continua:** a cota gratuita do Gemini (`conversas/status/` → `roteador.resfriamentos` às 13:40:
`3.5-flash` `cota_dia` 861 s, `3.5-flash-lite` `cota_dia`, `3.1-flash-lite` `timeout`). Cada turno faz 3 chamadas
(input_guard, generate, output_guard). Isto não se resolve no front; é cota/plano do projeto no AI Studio (dono) e
rotação do router (backend-21). Com a correção, a conversa volta sozinha quando um modelo sai do resfriamento.

## Atual — backend único (2026-09-27 12:31 BRT, front `c4a9ff3`)

O backend local é **um só**: o Django DRF de `Nova pasta/backend` (repo `batalha-agente-backend`, `84ead9b`) em
`127.0.0.1:8000`. O Vite `:3000` manda `/api/v1` para `DJANGO_URL` (padrão `http://127.0.0.1:8000`). O `agent_backend/`
deste repo não sobe junto. Sequência do front (`src/services/backend.ts`):

| # | Chamada | Detalhe | 12:31 BRT |
| --- | --- | --- | --- |
| 1 | `POST perfil-usuario/definir/` | `{"usuario": "<id_usuario UUID>"}`; índice → 400 desde 10:32; padrão `00108ccd-…` (Maria), `VITE_IAGORA_USUARIO` troca | 201 |
| 2 | `GET conversas/sessao/?sessao_id=` | recebe cookies `csrftoken` + `conversa_sessao`; daqui em diante `X-Sessao-Id` em todo pedido | 200 |
| 3 | `GET i-agora/perfil/` | 404 → modo só-chat (sem inventar valores nem abertura) | 200 |
| 4 | `POST i-agora/sessao/abertura/` | abertura guiada pelo perfil | 201 |
| 5 | `POST conversas/mensagens/` | 404 com sessão → reabre a sessão uma vez e reenvia como conversa nova | **503 por provedor** |
| 6 | `GET i-agora/plano/` | | 200 |

Selos: 12:31 BRT, `scripts/validar_chat_ponta_a_ponta.py` pelo proxy `:3000` — o chat deu 503 porque o generate
`flash-lite` falhou em 515 ms e a contingência `gemini-3.5-flash` teve timeout de 15 s; sem rejeição determinística.
11:52 BRT, mesmo caminho: "O que eu faço com as sobras?" → 200 `needs_clarification` em 14,5 s ("…fluxo líquido de
-1729.62 R$ por mês… não havendo sobras…"). A resposta do bot é renderizada por `src/components/chat/RichText.tsx`.

**Como correr** (skill versionada: [`skills/integracao-front-back/SKILL.md`](../skills/integracao-front-back/SKILL.md)):

```bash
python scripts/validar_chat_ponta_a_ponta.py --pergunta "O que eu faço com as sobras?" --saida <scratchpad>/e2e.json
node skills/integracao-front-back/tools/gate.mjs --evidencia <scratchpad>/e2e.json   # julga a evidência
node skills/integracao-front-back/tools/gate.mjs                                      # evals: 9/9, 6/6 negativas
```

Um 503 do chat é classificado por `GET conversas/status/` (`ultimas_chamadas`): algum `outcome` `failed_or_uncertain`
→ PROVEDOR; todos `complete` → DETERMINISTICO (guard do backend recusou). Armadilha: não mande corpo com acento por
`curl` no Git Bash — chega fora de UTF-8 e dá 400; o script usa Python.

---

## Histórico — agent_backend (09:47 / 09:50 BRT)

O que segue mediu o `agent_backend/` deste repo, que **não** é mais o backend local da integração. A versão
inteira de antes desta atualização está em `docs/archive/2026-09-27/validacao-front-back-antes-backend-unico.md`.

Medido em **2026-09-27 09:47 BRT** (demo, pelo proxy do Vite) e **09:50 BRT** (`demo_live`, direto no Django), commit
`2fe71fb` (árvore com alterações não commitadas só em `agent_backend/conversation/knowledge/*.json`). O Django em `:8000`
corria com `--noreload`, portanto com o código carregado no arranque; as rotas são as mesmas do commit.

Evidências (valor · fonte · data em cada número abaixo):

- demo: [`agent_backend/evidence/contrato-local-2026-09-27T0947.json`](../agent_backend/evidence/contrato-local-2026-09-27T0947.json)
- demo_live sem chave Gemini: [`agent_backend/evidence/contrato-local-2026-09-27T0950-live.json`](../agent_backend/evidence/contrato-local-2026-09-27T0950-live.json)
- `contrato-local-2026-09-27T0949-live-SERVIDOR-NAO-SUBIU.json`: tentativa em que o `:8001` não arrancou (faltava
  `PYTHONPATH`); guardada renomeada, **não é medição**. O script passou a abortar sem gravar quando a base não responde.

## Como correr

```bash
# demo, pelo proxy do Vite (é o teste de "encaixe": mesmo caminho, cookies, Origin e X-CSRFToken do browser)
.venv/Scripts/python.exe scripts/validar_contrato_local.py

# demo_live direto no Django (segunda instância; nunca ultrapassa IAGORA_MAX_CALLS chamadas pagas no processo)
PYTHONPATH=$PWD IAGORA_MODE=demo_live IAGORA_ALLOW_PAID_CALLS=yes IAGORA_MAX_CALLS=12 \
  IAGORA_DEV_ORIGINS=http://127.0.0.1:8001,http://127.0.0.1:3000 IAGORA_PLAN_DB=<tmp>/plans.sqlite3 \
  GEMINI_API_KEY=<no ambiente do processo> \
  .venv/Scripts/python.exe agent_backend/manage.py runserver 127.0.0.1:8001 --noreload
.venv/Scripts/python.exe scripts/validar_contrato_local.py --base http://127.0.0.1:8001 --dialogo-live --max-chat 4 --rotulo live

# prova negativa do verificador de forma (casos ruins sintéticos têm de reprovar)
.venv/Scripts/python.exe scripts/validar_contrato_local.py --autoteste
```

`--dialogo-live` envia até 4 falas (objetivo · contexto · ação · valor mensal, em falas distintas, como exige
`commitments.validate_case`); cada fala live custa 3 chamadas (guard de entrada, geração, guard de saída), logo 4 falas =
12 = o teto. `--aceitar-chat-indisponivel` transforma um 503 do chat em `NAO_MEDIDO` em vez de `FALHA`.
Saída não-zero se uma chamada esperada-OK falha (status ou forma) ou se uma prova negativa não falha.

## Chamadas do front

Todas passam por `Backend.request` (`src/services/backend.ts:8-17`): prefixo `/api/v1/context-agent/`,
`credentials:'same-origin'`, `Content-Type: application/json`, `X-CSRFToken` do cookie `csrftoken`, timeout 50 s.
Em erro lê `erro` ou `reply` (string) e `state` (se houver). Os campos lidos vêm do tipo `PlanState` (`backend.ts:2`) e dos
usos em `usePlanConversation.ts` e componentes. Forma = campos do tipo TS presentes e com o tipo JSON certo.

| # | Chamador no front | Gatilho na UI | Método e caminho | Corpo | Campos lidos pelo front | demo (09:47) | demo_live (09:50) | Forma | Latência demo / live |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `backend.ts:18` bootstrap ← `usePlanConversation.ts:50` | montagem do App; botão "Atualizar" (`App.tsx:57`) | GET `conversas/sessao/` | — | `mode` (guardado no hook, **não mostrado** por `App.tsx`) | 200 OK | 200 OK | ok | 30 / 6 ms |
| 2 | `backend.ts:19` profile ← `usePlanConversation.ts:51` | logo após bootstrap | GET `i-agora/perfil/` | — | `state.profile.person.{id,nome,primeiroNome,plan,sourceAvailable,referenceLabel,planPeriodLabel}`, `referencePeriod.label`, `situation`, `draft`, `confirmed`, `phraseIndex`, `commitmentCase`, `opening` | 200 OK | 200 OK | ok | 3 558 / 9 016 ms (BigQuery) |
| 3 | `backend.ts:20` state ← `usePlanConversation.ts:86` | depois de cada resposta do chat | GET `i-agora/plano/` | — | `state` (como 2) ou `null` | 200 OK | 200 OK | ok | 27 / 4 ms |
| 4 | `backend.ts:21` open ← `usePlanConversation.ts:71` | FAB/atalho Planejamento (`App.tsx:30`); "Testar próximo perfil" (`App.tsx:84`, `next:true`) | POST `i-agora/sessao/abertura/` | `{origem:'fab',next}` | `state` (e `opening` para a 1.ª fala) | 201 OK; `next` 201, pessoa 1→2 | 201 OK; `next` 201 | ok | 10 e 1 372 / 28 e 991 ms |
| 5 | `backend.ts:27` chat ← `usePlanConversation.ts:85` | ChatComposer → `onSend` (`ChatComposer.tsx:8`, `App.tsx:70`) | POST `conversas/mensagens/` | `{schema_version:'1.0',conversation_id,client_message_id,message}` | `reply`, `conversation_id` (`status` ignorado) | 200 OK (texto fixo demo) | **503 `NAO_MEDIDO`** (sem `GEMINI_API_KEY`) | ok (envelope `reply`) | 22 / 1 284 ms |
| 6 | `backend.ts:23` confirm ← `usePlanConversation.ts:77` | "Aprovar e salvar minha meta" (`CommitmentsPanel.tsx:19`) | POST `i-agora/plano/confirmar/` | `{version,plan,clientRequestId}` | `state` (`replayed` ignorado) | **BLOQUEADO** — sonda 409 | **BLOQUEADO** — sonda 409 | ok (erro) | 7 / 15 ms |
| 6b | idem, mesmo `clientRequestId` | reenvio após falha (`usePlanConversation.ts:76`) | idem | idem | idem | **BLOQUEADO** (sem 1.ª confirmação) | **BLOQUEADO** | — | — |
| 7 | `backend.ts:24` progress ← `usePlanConversation.ts:80` | salvar card → `finish` (`useCardExport`, `App.tsx:17`); "Gerar outra frase" (`CardPanel.tsx:14`) | PATCH `i-agora/plano/` | `{version,stage,phraseIndex}` | `state` | **BLOQUEADO** — sonda 400 | **BLOQUEADO** — sonda 400 | ok (erro) | 5 / 16 ms |
| 8 | `backend.ts:25` withdraw ← `usePlanConversation.ts:79` | "Quero conversar e ajustar" (`CommitmentsPanel.tsx:20`) | DELETE `i-agora/plano/proposta/` | — | `state` ou `null` | 200 OK | 200 OK | ok | 6 / 12 ms |
| 9 | `backend.ts:26` reset ← `usePlanConversation.ts:88` | "Recomeçar planejamento" (`PlanSheet.tsx:23`, `ChatHeader.tsx:9`) | DELETE `i-agora/plano/` | — | `state` ou `null` | 200 OK | 200 OK | ok | 22 / 19 ms |
| 10 | `backend.ts:22` propose ← **só** `planApi.ts:11` (`fetchProposal`) | **nenhum** — `planApi.ts` não é importado | POST `i-agora/plano/proposta/` | `{clientRequestId}` | `state` | BLOQUEADO — 409 | BLOQUEADO — 409 | ok (erro) | 6 / 14 ms |

Motivo exato dos `BLOQUEADO`: em `demo` o chat é resposta fixa (`service.py:141-142`, `gateway=None`) e nunca chama
`on_commitment_proposed`; em `demo_live` sem chave o guard de entrada falha antes da geração. Sem `commitmentCase` no
estado, o backend recusa como desenhado: proposta 409 "Ainda não há proposta para aprovar", confirmar 409 "Ainda não há
uma proposta construída na conversa", progresso 400 "Confirme o plano antes de avançar", acompanhamento 404. Estas
recusas foram **observadas** (sondas), mas o caminho feliz de 6, 6b e 7 **não foi exercitado**.

## Provas negativas

| Prova | Esperado | demo (09:47) | demo_live (09:50) |
|---|---|---|---|
| POST `sessao/abertura/` sem `X-CSRFToken` | 403 | 403 ✔ | 403 ✔ |
| POST com `Origin: http://evil.example` (token válido) | 403 | 403 ✔ | 403 ✔ |
| GET `perfil/` sem cookie de sessão (`principal_for` → `None`) | 401 | 401 ✔ | 401 ✔ |
| POST `mensagens/` com CSRF válido e sem cookie de sessão | 401 | 401 ✔ | 401 ✔ |

Autoteste do verificador (`--autoteste`, 09:48 BRT): 6/6 — campo em falta, tipo errado, booleano como número e estado
sem `draft` reprovam; forma boa passa.

## Encaixe: o que o front lê × o que o backend devolve

| Id | Achado | Onde no front | Fonte |
|---|---|---|---|
| E1 | `state.opening` **nunca vem** (ausente em perfil, abertura e estado). `openingReply()` cai sempre no fallback "Ainda não recebi os dados para apontar um ajuste com segurança…", mesmo com o perfil carregado. | `backend.ts:3`, `usePlanConversation.ts:32` | ambas as evidências, `opcionais_ausentes` |
| E2 | `primeiroNome == nome` = "Pessoa 1 da base" (alias inteiro): o cabeçalho do chat e a Home mostram o alias completo como "primeiro nome". | `ChatScreen.tsx:19,22`, `HomeScreen.tsx:20` | `domain.py:184`; evidência demo |
| E3 | `plan.period` chega cru, "2026-01" (AAAA-MM); PlanSheet, SharePreview e Acompanhe mostram-no assim, enquanto `person.planPeriodLabel` = "Janeiro / 2026". | `PlanSheet.tsx:30`, `SharePreview.tsx:9`, `FollowUpScreen.tsx:24` | evidência demo |
| E4 | `state.totals` vem com as 8 chaves de `PlanTotals` (bate), mas o front **não o lê**: recalcula com `calculations()`. Duas contas do mesmo número. | nenhum uso de `.totals` em `src/` | evidência demo |
| E5 | `referencePeriod.seal.measuredAt` vem (e ainda `jobId`, `bytesProcessed`, `cache`), mas só `planApi.ts:14` (código morto) o lê: a UI não mostra selo nem data da medição. | `planApi.ts:14` | evidência demo |
| E6 | `commitmentCase` vem **ausente** (não `null`) sem caso; o front trata com `||null`. Forma com caso: `NAO_MEDIDO`. | `usePlanConversation.ts:31`, `CommitmentsPanel.tsx:12-17` | ambas |
| E7 | `perfil/` devolve o perfil **duas vezes**: espalhado no topo (`person`, `referencePeriod`, …) e em `state.profile`; o front só lê `state`. `abertura/` também devolve `person` no topo, não lido. | `backend.ts:19,21` | `planning/http.py:49,62` |
| E8 | `mode` é guardado pelo hook mas `App.tsx` não o usa: a UI não distingue demo de live. `status` e `citations` do chat, e `replayed` da confirmação, também não são lidos. | `usePlanConversation.ts:50,89` | leitura de código |
| E9 | Constantes fixas `BALANCE_PERIOD='Dezembro/25'` e `PLAN_PERIOD='JANEIRO / 2026'` ainda importadas em `BalanceCard.tsx`, `PlanSheet.tsx` e `SharePreview.tsx`, mas não usadas no render (usa-se o rótulo do servidor). | `src/data/profile.ts:2-3` | leitura de código |
| E10 | Em live, `conversation_context` chama `store().withdraw_case` a **cada** fala (`planning/http.py:113-114`): uma fala depois de haver caso retira-o e sobe a versão. O front relê o estado após cada fala (`usePlanConversation.ts:86`), por isso não fica com versão velha. Não medido em runtime. | — | leitura de código |

## Chamadas mortas e rotas não usadas

- **Código morto no front:** `src/services/planApi.ts` (`fetchProposal`, `backendRef`) não é importado por nenhum
  ficheiro; é o único chamador de `backend.propose()`. Não existe `balanceApi.ts` em `src/` (fora de `src/archive`).
  Nenhum outro `fetch` em `src/` além de `backend.ts`.
- **Rotas do backend que o front nunca chama:** `GET i-agora/acompanhamento/` (o ecrã Acompanhe usa o `confirmed` do
  estado), `PATCH i-agora/plano/rascunho/` (responde sempre 409 por desenho, `planning/http.py:87-89`) e
  `POST i-agora/plano/proposta/` (só via código morto).

## O que continua `NAO_MEDIDO`

- **Conversa com Gemini em localhost:** `GEMINI_API_KEY` não existe no ambiente do processo nem nas variáveis de
  utilizador/máquina desta máquina (verificado sem ler valores, antes das corridas). O backend só lê a chave do ambiente
  (`gateway.py:72`); `.secrets`/`API_KEY_SECRECT` não são lidos por este repositório. Chamadas pagas usadas: **0** (o
  guard falhou em `_client()` antes de qualquer pedido de rede; log do `:8001`: `provider_stage_failure stage=input_guard
  type=RuntimeError`).
- Caminho feliz de **confirmar, replay idempotente, progresso e acompanhamento 200**: depende de um `commitmentCase` que
  só o diálogo live produz. Coberto apenas por teste (`test_integrated_planning.py`).
- Forma de `commitmentCase` vinda do servidor.
