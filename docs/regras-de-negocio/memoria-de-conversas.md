# Memória de conversas

O que a conversa lembra, onde e por quanto tempo. Estados: **EXISTE** (no código e a funcionar), **PARCIAL**
(existe com limites que mudam o comportamento), **PLANEJADO** (não construído), **NAO_MEDIDO** (ninguém mediu).
Convenções de caminho: [README](README.md#dois-códigos-uma-convenção).

## Publicado (este repositório)

| Estado | O quê | Onde e por quanto tempo | Vai ao modelo? |
| --- | --- | --- | --- |
| EXISTE | **Identidade no navegador**: cookie assinado `i_agora_demo_session` (HttpOnly, SameSite Strict) + `csrftoken` | Cloud Run: 30 dias (`deploy/settings.py:16`); local: 30 min (`conversation/http.py:59, 92`) | não |
| EXISTE | **Histórico da conversa**: mensagem minimizada da pessoa + resposta libertada | memória do processo, por (pessoa, `conversation_id`); 30 min, 20 turnos, 5 conversas por pessoa, 100 no total (`conversation/service.py:37, 117-137`) | sim: 12 entradas ao gerador (`service.py:129`), 4 ao guard de entrada (`gateway.py:122`), e como `user_reported_history` / `user_statements` numeradas (`service.py:155-157`) |
| EXISTE | **Idempotência** por `client_message_id` (mesmo corpo → mesma resposta; outro corpo → 409) | memória, enquanto a conversa existir (`service.py:107-113`) | não |
| EXISTE | **Plano da pessoa** (pessoa, base observada com selo, rascunho, caso, confirmação, versão) | GCS com `ifGenerationMatch` no ar; SQLite local (`planning/http.py:12-16`, `gcs_store.py`, `store.py`); sobrevive a reinício | parcialmente: `goal_state` e fatos `BQ:*` entram no contexto (`planning/http.py:116-124`) |
| EXISTE | **Orçamento diário de chamadas** | GCS / SQLite, tabela `budget` (`store.py:94-102`) | não |
| EXISTE | **Auditoria**: só enums (`release`, `input_guard`, `output_guard`, `provider_failure`) | memória, últimas 1.000 (`service.py:43`); métricas sem conteúdo, últimas 300 (`gateway.py:59`) | não |
| PARCIAL | **Caso de compromisso**: preparado pela conversa, retirado a cada nova mensagem (`withdraw_case`) e refeito se a conversa o sustentar | persistido no plano (`store.py:33-49`) | sim, via `goal_state.commitment_case` |
| PARCIAL | **Projeção pendente**: o modelo propõe valores, a pessoa confirma no turno seguinte | memória, consumida no turno seguinte (`service.py:143, 214-215`) | sim, como fato `user_reported_unconfirmed` |
| PARCIAL | **Troca de pessoa / reinício** apaga a conversa (`forget`) mas mantém o plano da pessoa anterior | `planning/http.py:57-60, 67-70`; `service.py:82-86` | — |
| PLANEJADO | Conversas que sobrevivem a reinício ou a mais de uma instância; retenção e expurgo definidos | pré-requisito de produção em `docs/i-agora.md` | — |
| NAO_MEDIDO | Efeito dos 6 turnos de histórico na qualidade; quantas conversas expiraram; memória do processo; perda ao escalar o Cloud Run para > 1 instância | — | — |

**Divergência:** `docs/i-agora.md` diz "últimos 8 itens de histórico"; o código envia 12 ao gerador e 4 ao guard.
Vale o código.

## `-32` (fora de git)

| Estado | O quê | Onde e por quanto tempo | Vai ao modelo? |
| --- | --- | --- | --- |
| EXISTE | **Sessão do titular**: `POST perfil-usuario/definir/` devolve `sessao_id` com código, nome e gênero | dicionário em memória `_sessoes`, 4 h (`-32: services/perfil_usuario.py:27, 103`); expirada → 404 | nome e gênero entram na instrução |
| EXISTE | **Ponte para o chat**: `conversas/sessao/` recebe `sessao_id` e devolve cookie `conversa_sessao` + `csrftoken`; `X-Sessao-Id` tem precedência | cookie 4 h | — |
| EXISTE | **Histórico do chat livre** (`conversas/mensagens/`) | memória; 30 min, 20 turnos, 12 ao modelo (`-32: apps/conversas/service.py:47, 130-136`) | sim |
| EXISTE | **Registo de avaliações**: etapa, índice, perfil, fluxo, cenário, origem, modelo, latência, tokens, sha256 da resposta; recusa texto, UUID ou chave | `relatorios/avaliacoes/AAAA-MM-DD.jsonl`, em disco, sem expurgo definido (`-32: apps/conversas/interacao_avaliacao.py:22-23, 45, 365-376`) | não |
| PARCIAL | **Conversa guiada** (`conversas/interacao/`): sem memória; cada etapa recalcula tudo | nada entre etapas além da sessão | não vê falas anteriores |
| PARCIAL | **Plano assumido** no front ligado ao `-32` | só `localStorage` do navegador; não há `plano/confirmar/` no `-32` | não |
| PARCIAL | Modelos `ConversaAgenteSessao` e `MensagemAgenteRegistro` | `-32: apps/context_agent_datadriven/models.py:24, 102`; usados só pelo painel legado, não por `conversas/` | não |
| PLANEJADO | Resumo do que a pessoa já escolheu levado à conversa guiada | sem desenho | — |
| PLANEJADO | Servidor como verdade do plano, `localStorage` só como cache (decisão D5 do contrato do front) | espera o dono | — |
| NAO_MEDIDO | Referências quebradas em `operacional-v1.json` (`apps/conversas/estado.py`, `tests/test_politica_operacional.py` não existem) | — | — |

Reiniciar o Django do `-32` apaga sessões e histórico. No publicado, reiniciar apaga só o histórico da conversa; o
plano e o orçamento diário persistem.
