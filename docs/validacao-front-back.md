# Validação front ↔ back por localhost

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
