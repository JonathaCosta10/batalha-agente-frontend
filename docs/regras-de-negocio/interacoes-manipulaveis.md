# Interações manipuláveis

Cada botão de ajuste do recorte: onde vive (ficheiro:linha), em que código e o efeito. **Mudar uma linha `-32`
não muda o serviço publicado.** Antes de mudar, leia [README.md](README.md#como-mudar-uma-regra-com-segurança).

Legenda da coluna *Código*: **pub** = este repositório, no ar · **-32** = `backend-agente-conversacional/`, fora de git.

## 1. Falas fixas e roteiro

| Botão | Valor atual | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| Textos de contingência (`auth`, `schema`, `not_found`, `conflict`, `limit`, `technical`, `denied`, `clarify`, `demo`) | catálogo fixo | pub | `agent_backend/conversation/service.py:21-31` | texto devolvido quando não há resposta aprovada; também passa por `safe_text` |
| Pergunta quando o caso não se sustenta | "Antes de propor um compromisso…" | pub | `conversation/service.py:188` | substitui o rascunho do modelo |
| Pergunta quando a projeção não se sustenta | "Para projetar com segurança…" | pub | `conversation/service.py:200` | idem |
| Texto da proposta | montado em código | pub | `conversation/commitments.py:45-57` | objetivo, contexto, ação, meta e aviso "não é resultado garantido" |
| Contra-argumento de igualdade salarial | texto fixo + fonte | pub | `conversation/fairness.py:14-21` | resposta firme com o Código de Ética 2024 |
| Mensagem do Acompanhe | "Objetivos registrados…" | pub | `planning/http.py:109` | explica `NAO_MEDIDO` |
| Instrução do modelo | Liquid estático | pub | `conversation/prompts/system.liquid`, `input_guard.liquid`, `output_guard.liquid`, `partials/*` | comportamento do agente e dos guards |
| Roteiro de falas | versão `2026-09-27.4`, 211 falas, 14 estágios | -32 | `apps/context_agent_datadriven/conversa/roteiro.json:2`; servido em `views_controle_conversa.py:57-69` | textos das etapas guiadas e `extremo.*`; o front publicado **não** consome |
| Fluxos de comportamento | versão `2026-09-27.2`, 16 fluxos | -32 | `apps/conversas/fluxos_comportamento.json` | mensagem-base e palavras exigidas por segmento × situação |
| Falas de extremos provisórias | `PROVISORIO` | -32 | `apps/conversas/extremos.py:30-37` | usadas se o roteiro não tiver a fala |
| `COMPLEMENTO_TOM` | frase por perfil | -32 | `apps/conversas/interacao.py:427-429` | acrescentada quando a fala não tem termo exigido |

Inventário das 188 falas do front: [falas-e-roteiro.md](falas-e-roteiro.md).

## 2. Limiares de negócio

| Botão | Valor | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| Situação do mês | saídas vs entradas (igualdade exata) | pub | `planning/domain.py:77` | `fluxo_negativo` / `fluxo_equilibrado` / `sobra_observada` |
| Categorias da proposta | `delivery`, `shopping`, `other`, `reserve` | pub | `planning/domain.py:9`; `conversation/schemas.py:44`; `commitments.py:41` | outras categorias são recusadas |
| Agrupamento delivery / shopping | nomes de macro | pub | `planning/domain.py:69-70` | define `deliveryCurrent` e `shoppingCurrent` |
| Limites do caso | alvo < gasto observado; reserva ≤ sobra; corte "outros" ≤ restante | pub | `planning/domain.py:54-60`; `store.py:78-80` | recusa o caso ou a confirmação |
| Falas mínimas antes do caso | 2 | pub | `conversation/commitments.py:33` | "Converse sobre seu contexto antes…" |
| Taxas da projeção | 5% e 8% ao mês (hipóteses) | pub | `conversation/projection.py:26`; `service.py:169` | meses até atingir o alvo |
| Valor monetário máximo | R$ 1.000.000.000, 2 casas | pub | `planning/domain.py:17` | recusa valores fora |
| Revalidação das normas | 2027-07-01 | pub | `conversation/context.py:32` | fontes passam a `requires_revalidation` |
| Limiar de sobra (Livre) | 15% | -32 | `politica/operacional-v1.json` (`t3.limiar_surplus`), lido em `.../estudos/i_agora/t3.py:24`; repetido em `apps/conversas/interacao.py:177` | segmento T3 |
| Equilíbrio | \|saldo\| < 1% das entradas | -32 | `interacao_dados.py:167-179` | situação `EQUILIBRIO` |
| Regra de proposta | `corte_seguro_ate_surplus_15` | -32 | `services/plano_proposta.py:24` | estados `OK` / `LIVRE_SEM_CORTE` / `CORTE_INSUFICIENTE` (`:195-199`) |
| Máximo de compromissos | 3 | -32 | `services/plano_proposta.py:25` | corta a lista |
| Corte por nível | Nível 1 = 100%, Nível 2 = 50%, Nível 3 = 0% | -32 | `services/plano_proposta.py:27` | valor liberado |
| Reserva do Livre | 20% das entradas | -32 | `services/plano_proposta.py:26` | teto da reserva em `LIVRE_SEM_CORTE` |
| Janela de dados | jan–nov/2025, corte 2025-12-22 | -32 | `desafio_itau/settings.py:108` (`DATA_CORTE`); `t3.py:8-9` | média da situação e do segmento |
| Gatilhos dos cenários | dívida ≥ 10% da entrada ou multa; inclinação ≥ 15%, ≥ R$ 30, média ≥ R$ 50 | -32 | `interacao_cenarios.py` | `consolidacao_divida`, `inclinacao_gasto` |

## 3. Modelo e contingência

| Botão | Valor | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| Modelo do agente | `AGENT_MODEL`, padrão `gemini-3.5-flash-lite` | pub | `harness/settings.py:23` | modelo da geração |
| Modelo dos guards | `GUARD_MODEL`, padrão = agente | pub | `harness/settings.py:24` | modelo dos dois guards |
| Allowlist | `gemini-3.5-flash-lite`, `gemini-3.8-flash` | pub | `conversation/gateway.py:23` | outro nome falha no arranque |
| Fallback de modelo | **nenhum** | pub | — | falha → texto `technical` (503) |
| Modelo reportado no health | fixo `gemini-3.5-flash-lite` | pub | `deploy/urls.py:6` | não reflete `AGENT_MODEL` (divergência) |
| Filtros de segurança | `BLOCK_MEDIUM_AND_ABOVE` em 4 categorias | pub | `conversation/gateway.py:24-26` | bloqueio pelo provedor |
| Raciocínio | `thinking_level=LOW` | pub | `gateway.py:106, 147` | custo e latência |
| Saída do agente / guard | 1.800 / 512 tokens | pub | `gateway.py:144, 104` | tamanho máximo |
| Chamadas por turno do agente | `max_llm_calls=1` | pub | `gateway.py:159` | sem auto-reparo |
| Orçamentos de contexto | entrada ADK ≤ 90.000 car.; dados ≤ 60.000; texto ≤ 24.000 | pub | `gateway.py:45, 154, 38` | excede → falha fechada |
| Ordem de modelos | `gemini-flash-latest` → `gemini-3.5-flash-lite` | -32 | `desafio_itau/modelos_llm.py` (`MODELOS_GOOGLE`) | `interacao/` tenta em ordem; `mensagens/` usa 3.5 |
| Contingência final | roteiro, depois 503 | -32 | `apps/conversas/interacao.py:589-597, 651-653` | texto do roteiro também avaliado |

## 4. Quotas e limites

| Botão | Valor | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| Mensagens por minuto | 6 por pessoa | pub | `conversation/service.py:37` (`requests_per_minute`) | 429 |
| Conversas | 5 por pessoa, 100 no processo | pub | `service.py:37, 117` | 429 |
| Turnos por conversa | 20 | pub | `service.py:37, 123` | 429 |
| Turno simultâneo | 1 por processo | pub | `service.py:75` | 429 |
| Chamadas Gemini por processo | local: `IAGORA_MAX_CALLS` 12 (máx. 60); Cloud Run: `IAGORA_DAILY_CALLS` 900 | pub | `harness/settings.py:21`; `deploy/settings.py:17` | `RuntimeError` → 503 |
| Chamadas Gemini por dia (persistido) | `IAGORA_DAILY_CALLS`, 900 | pub | `conversation/gateway.py:66-68`; `planning/store.py:94-102` | só com `IAGORA_STATE_BUCKET` |
| Corpo HTTP | 16.384 bytes (conversa); 16.000 (plano) | pub | `harness/settings.py:18`; `conversation/http.py:103`; `planning/http.py:28` | 400 |
| Mensagem | 2.000 caracteres | pub | `conversation/schemas.py:14` | 400 |
| Resposta | 4.000 caracteres, ≤ 12 alegações | pub | `rules.py:25`; `schemas.py:51-54` | 503 |
| BigQuery | teto 100 MB (`IAGORA_BQ_MAX_BYTES`, nunca acima), ≤ 1.000 linhas, ≤ 1.000 clientes | pub | `planning/bigquery.py:19, 60, 77` | `SourceUnavailable` → 503 `NAO_MEDIDO` |
| Chamadas Gemini (padrão) | 300 (0–3000, `CONVERSAS_MAX_CHAMADAS`); gateway 60 | -32 | `desafio_itau/settings.py:115-118`; `apps/conversas/views.py:31-32`; `gateway.py:80` | 503 |
| Limites do serviço de conversa | 6/min, 5 por pessoa, 100 sessões | -32 | `apps/conversas/service.py:47, 124` | 429 |

## 5. Tempos

| Botão | Valor | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| Turno completo | 45 s | pub | `conversation/service.py:35` (`timeout`) | 503 `technical`, resultado em cache (sem nova cobrança) |
| Pedido HTTP ao Gemini | 15 s, 1 tentativa | pub | `conversation/gateway.py:75-76` | falha sem retry |
| BigQuery | 25 s por pedido; consulta 10 s | pub | `planning/bigquery.py:31, 60` | 503 |
| Cache de clientes e perfil | 900 s | pub | `planning/bigquery.py:72, 85` | releitura |
| Gunicorn | 1 worker, 4 threads, 120 s | pub | `deploy/Dockerfile` (CMD) | concorrência do contentor |
| Gemini / pipeline | 15 s / 45 s | -32 | `apps/conversas/gateway.py:30`; `service.py:46` | idem |
| Cache do usuário real | 900 s | -32 | `desafio_itau/settings.py:109` | releitura |

## 6. Janelas de memória

| Botão | Valor | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| Validade da conversa | 30 min (`ttl=1800`) | pub | `conversation/service.py:37, 88-100` | apaga histórico, cache e projeção pendente |
| Histórico ao gerador | últimas 12 entradas (6 turnos) | pub | `conversation/service.py:129` | contexto do modelo |
| Histórico ao guard de entrada | últimas 4 entradas | pub | `conversation/gateway.py:122` | contexto do guard |
| Cookie da sessão | local 1.800 s; Cloud Run 30 dias (`IAGORA_SESSION_AGE`) | pub | `conversation/http.py:59, 92`; `deploy/settings.py:16` | identidade da pessoa no navegador |
| Plano | persistente (GCS / SQLite) | pub | `planning/http.py:12-16` | sobrevive a reinício |
| Sessão do titular | 4 h (`SESSAO_SEGUNDOS`) | -32 | `services/perfil_usuario.py:27` | 404 → `definir/` de novo |
| Histórico do chat | 30 min, 20 turnos, 12 ao modelo | -32 | `apps/conversas/service.py:47, 130-131, 136` | igual ao publicado |

Detalhe: [memoria-de-conversas.md](memoria-de-conversas.md).

## 7. Variáveis de ambiente

| Variável | Padrão | Código | Onde | Efeito |
| --- | --- | --- | --- | --- |
| `IAGORA_MODE` | `demo` (local); `demo_live` fixo no Cloud Run | pub | `harness/settings.py:19`; `deploy/settings.py:12` | `demo` = resposta fixa sem modelo; `live` exige autenticação |
| `IAGORA_ALLOW_PAID_CALLS` | não | pub | `harness/settings.py:20` | sem `yes`, nada chama o Gemini |
| `IAGORA_MAX_CALLS` | 12 (0–60) | pub | `harness/settings.py:21` | orçamento do processo |
| `IAGORA_DAILY_CALLS` | 900 | pub | `deploy/settings.py:17`; `gateway.py:68` | orçamento diário |
| `AGENT_MODEL` / `GUARD_MODEL` | `gemini-3.5-flash-lite` | pub | `harness/settings.py:23-24` | modelos |
| `GEMINI_API_KEY` | — | pub | `conversation/gateway.py:72` | sem ela, 503 (Secret Manager no ar) |
| `DJANGO_SECRET_KEY` | aleatória local; obrigatória no Cloud Run | pub | `harness/settings.py:5`; `deploy/settings.py:4` | assinatura do cookie |
| `IAGORA_STATE_BUCKET` | — | pub | `planning/http.py:13`; `gateway.py:66` | GCS para plano e orçamento |
| `IAGORA_PLAN_DB` | `/tmp/i-agora-plans.sqlite3` | pub | `planning/http.py:16` | SQLite local |
| `IAGORA_BQ_MAPPING` / `IAGORA_BQ_MAX_BYTES` | `bq_mapping.json` / 100 MB | pub | `planning/bigquery.py:17, 19` | leitura da base |
| `IAGORA_HOSTS` | domínio do serviço | pub | `deploy/settings.py:5` | hosts e origens CSRF |
| `IAGORA_FRONT_DIST` / `IAGORA_RELEASE` | `/app/front_dist` / `local` | pub | `deploy/urls.py:5-6` | estáticos e health |
| `IAGORA_PRINCIPAL_RESOLVER` | `None` | pub | `harness/settings.py:22` | modo `live` falha fechado sem ele |
| `INTERACAO_GUARD_ENTRADA_MODELO` | `1` (ligado) | -32 | `apps/conversas/views_interacao.py:54` | `0` pula o guard de entrada pelo modelo (poupa 1 chamada por mensagem); ficam o classificador de domínio e os guards de saída. **Sem teste** |
| `CONVERSAS_MAX_CHAMADAS` | 300 (0–3000) | -32 | `desafio_itau/settings.py:115-118` | orçamento de chamadas |
