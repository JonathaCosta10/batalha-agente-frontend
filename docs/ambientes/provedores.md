# Provedores por ambiente

Cada provedor externo, como o código o autentica, o que muda entre ambientes e **o que acontece quando falta**.
Regra geral do código: falta de provedor **falha fechado** — resposta 503 com código `technical` ou estado
`NAO_MEDIDO`, nunca dado inventado nem troca silenciosa de modelo/fonte.

## Resumo

| Provedor | Autenticação | Local dev | Docker (local) | CI | Cloud Run |
|---|---|---|---|---|---|
| Gemini | chave de API (AI Studio) em `GEMINI_API_KEY` | shell, só com `IAGORA_MODE=demo_live` + `IAGORA_ALLOW_PAID_CALLS=yes` | `-e GEMINI_API_KEY` (sempre `demo_live`) | não usado (`demo`) | Secret Manager `i-agora-gemini` |
| BigQuery | ADC (`google.auth.default`) | ADC do utilizador | ADC montado read-only (`NAO_MEDIDO`) | não usado | ADC da SA `squad-agent-sa` |
| Armazenamento de planos | SQLite local ou GCS via ADC | SQLite `/tmp/i-agora-plans.sqlite3` | SQLite no `/tmp` do contentor | SQLite (testes) | GCS `gcs-cas`, bucket `iagora-state-951291470271` |
| Secret Manager | IAM do serviço | NAO_EXISTE | NAO_EXISTE | NAO_EXISTE | `i-agora-gemini`, `i-agora-signing` |
| Artifact Registry / Cloud Build | IAM do operador | NAO_EXISTE | build local `docker build` | NAO_EXISTE | `agentes/i-agora`, deploy por digest |
| Cloud Run | — | — | — | — | serviço `i-agora`, `us-central1`, projeto `batalha-time-02-lxof` |

Fonte Cloud Run: `deploy/README.md:5-12,36-40`.

## Gemini

- **Só AI Studio (chave de API).** O cliente é criado com `genai.Client(api_key=key, vertexai=False, ...)`
  (`agent_backend/conversation/gateway.py:72-76`), usado tanto nos guards (`gateway.py:99`) como no agente ADK
  (`gateway.py:139-140`). **Vertex AI via ADC: NAO_EXISTE** no código publicado nem no `-32` (grep por `vertexai`
  só encontra `vertexai=False`).
- Timeout 15 s e **1 tentativa** (`gateway.py:75-76`): sem retry nem fallback de modelo.
- Modelos aceites: `gemini-3.5-flash-lite`, `gemini-3.8-flash` (`gateway.py:23`); outro valor em
  `AGENT_MODEL`/`GUARD_MODEL` faz o gateway recusar (`gateway.py:56-57`).
- Orçamento: por processo (`IAGORA_MAX_CALLS` no harness; `IAGORA_DAILY_CALLS`, padrão 900, no deploy) e, com
  bucket, diário persistido em GCS (`gateway.py:66-68`). Tentativas falhadas contam (`gateway.py:69`).
- **Modo `demo`** (padrão local, `harness/settings.py:19`): resposta fixa, **nenhuma** chamada ao Gemini
  (`conversation/http.py:19-20`).

**Quando falta:** modo live sem autorização paga → `ValueError('Live access not configured')`
(`conversation/http.py:21-22`); chave ausente → `RuntimeError('Server credential missing')` (`gateway.py:73-74`);
orçamento esgotado → `RuntimeError` (`gateway.py:64-65`). Todos saem como **503 `technical`** pelo envelope
(`agent_backend/conversation/http.py:124-125,142-147`; `service.py:54,135,207,213`).

## BigQuery

- Tabela fixa `batalha-time-02-lxof.hackathon_dados.extrato_sintetico` (`agent_backend/planning/bigquery.py:11-12`),
  dados **sintéticos** do evento (`deploy/README.md:8`).
- Autenticação: `google.auth.default(scopes=[bigquery])` (`bigquery.py:25`). Local = `gcloud auth
  application-default login`; Cloud Run = service account `squad-agent-sa` (`deploy/README.md:12`, que regista
  permissões **amplas herdadas**, incluindo BigQuery admin — não é IAM mínimo).
- Só leitura parametrizada, dry run antes da consulta, teto `maximumBytesBilled` ≤ 100 MB
  (`bigquery.py:19,55-59`); mapeamento de colunas validado contra o schema real (`bigquery.py:40-51`,
  `bq_mapping.json`).

**Quando falta:** sem ADC → `SourceUnavailable('BigQuery sem autorização ADC…')` (`bigquery.py:27`); HTTP ≥ 400 ou
rede → `SourceUnavailable` (`bigquery.py:32,35`); mapeamento ausente/incompatível → `SourceUnavailable`
(`bigquery.py:41-50`). O endpoint devolve **503 com `estado: NAO_MEDIDO`, `codigo: source`**
(`agent_backend/planning/http.py:38`). Nenhuma base fictícia substitui a real.

## Armazenamento de planos

- **Seleção:** `IAGORA_STATE_BUCKET` definido → `GCSPlanStore`; senão → `PlanStore` SQLite em `IAGORA_PLAN_DB`
  (`agent_backend/planning/http.py:13-16`). `/api/health/` reporta `storage: gcs-cas` ou `local`
  (`deploy/urls.py:6`).
- **GCS `gcs-cas`** (`agent_backend/planning/gcs_store.py`): um objeto privado por dono,
  `plans/<sha256(dono)>.sqlite3` (`:21`); descarrega o snapshot para um diretório temporário 0600 (`:26-32`), faz a
  transação SQLite local e reenvia com **`ifGenerationMatch`** (`:35-37`). SQLite **nunca** montado em GCS/FUSE
  (`:3`). Limite 5 MB por snapshot (`:29`). Autenticação ADC com escopo `devstorage.read_write` (`:17`).
- Firestore: **NAO_EXISTE** — bloqueado pela política organizacional (`deploy/README.md:10`).

**Quando falta / conflito:** GCS indisponível ou leitura/escrita falhada → `RuntimeError` → **503 `technical`**
(`gcs_store.py:24,31,39` → `planning/http.py:41`); geração mudou (HTTP 412) → `Conflict` → **409 `stale`**
(`gcs_store.py:38` → `planning/http.py:39`). Local: SQLite em `/tmp` perde-se ao reiniciar o contentor.

## Secret Manager

- Segredos `i-agora-gemini` e `i-agora-signing`, versão 1 (`deploy/README.md:11`).
- **Mapeamento para variáveis: NAO_MEDIDO.** O código só lê `GEMINI_API_KEY` (`gateway.py:72`) e
  `DJANGO_SECRET_KEY` (`deploy/settings.py:4`); os nomes indicam `i-agora-gemini` → `GEMINI_API_KEY` e
  `i-agora-signing` → `DJANGO_SECRET_KEY`, mas o comando de deploy que faz a ligação não está versionado.
- O código **não chama** a API do Secret Manager: os segredos chegam como variáveis de ambiente.

**Quando falta:** sem `DJANGO_SECRET_KEY` o `deploy.settings` falha no arranque (`KeyError`, `deploy/settings.py:4`)
— a revisão não fica saudável. Sem `GEMINI_API_KEY` o serviço arranca, mas cada mensagem responde 503.

## Artifact Registry, Cloud Build e Cloud Run

- Cloud Build publica em Artifact Registry `agentes/i-agora`; o Cloud Run usa **digest**, não tag mutável
  (`deploy/README.md:36`).
- Serviço `i-agora`, `us-central1`, 1 vCPU, 1 GiB, mínimo 0, máximo 1 instância, concorrência 4
  (`deploy/README.md:5,38`); um único worker gunicorn (`deploy/Dockerfile:11`) porque o histórico de conversa vive em
  memória.
- Nenhum `cloudbuild.yaml`, script de deploy ou IaC está versionado: **NAO_EXISTE** (ver [ci-cd.md](ci-cd.md)).

## O que muda entre ambientes

| Aspeto | Local dev | Docker (local) | CI | Cloud Run |
|---|---|---|---|---|
| Settings | harness | deploy | harness | deploy |
| Modo | `demo` por padrão | `demo_live` fixo | `demo` | `demo_live` fixo |
| Host permitido | `localhost`, `127.0.0.1`, `[::1]` (`harness/settings.py:7`) | `IAGORA_HOSTS` + localhost (`deploy/settings.py:5`) | harness | `IAGORA_HOSTS` |
| Cookie de sessão | 30 min (padrão 1800 s, `conversation/http.py:59`) | 30 dias (`deploy/settings.py:16`) | 30 min | 30 dias |
| Cabeçalhos de segurança/CSP | não | sim (`deploy/middleware.py`) | não | sim, + HSTS quando HTTPS |
| Front | Vite `:3000` com proxy | `front_dist` servido pelo Django | build só verificado | `front_dist` na imagem |
