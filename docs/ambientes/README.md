# Ambientes, provedores e variáveis de ambiente

Documentação de **como cada peça se liga a cada provedor** em cada ambiente e das **regras de variáveis de
ambiente**. Só entra aqui o que o código ou a configuração deste repositório mostram, com `ficheiro:linha`.
O que não foi verificado está marcado `NAO_MEDIDO`; o que não existe está marcado `NAO_EXISTE`.

> Levantado a 2026-09-27 sobre o commit `d02b9e1` (branch `docs/entrega-consolidada-2026-09-27`).

| Documento | Conteúdo |
|---|---|
| [variaveis-de-ambiente.md](variaveis-de-ambiente.md) | Todas as variáveis lidas pelo código: quem lê, padrão, obrigatória, segredo, origem por ambiente; regras (nunca versionar, nomes, precedência, rotação); secção **fora do publicado** (`-32` e front arquivado). |
| [provedores.md](provedores.md) | Gemini, BigQuery, armazenamento (SQLite local × GCS `gcs-cas`), Secret Manager, Artifact Registry/Cloud Build, Cloud Run — o que muda por ambiente e o que falha fechado. |
| [docker.md](docker.md) | Como a imagem é montada (`deploy/Dockerfile`, `front_dist`, exclusões), como correr localmente com credenciais montadas sem as pôr na imagem, portas. |
| [ci-cd.md](ci-cd.md) | CI existente (proposta inativa), `scripts/secret_scan.py`, caminho build → Artifact Registry → Cloud Run por digest → rollback; automático × manual. |

## Os quatro ambientes

| Ambiente | Settings Django | Servidor | Front |
|---|---|---|---|
| **Local (dev)** | `agent_backend.harness.settings` (`agent_backend/manage.py:6`) | `runserver 127.0.0.1:8000` | Vite `:3000` com proxy `/api/v1/context-agent` → `127.0.0.1:8000` (`vite.config.ts:16`) |
| **Docker (local)** | `deploy.settings` (`deploy/wsgi.py:2`) | gunicorn `:${PORT}` = 8080 (`deploy/Dockerfile:2,11`) | `front_dist/` servido pelo próprio Django (`deploy/urls.py:5,7-13`) |
| **CI** | `agent_backend.harness.settings` (`agent_backend/tests/conftest.py:4`) | nenhum (testes + smoke em modo `demo`) | `npm test`, `lint`, `build` — **proposta inativa** (`docs/ci/conversation.yml`) |
| **Cloud Run** | `deploy.settings` | gunicorn, 1 worker, 4 threads (`deploy/Dockerfile:11`) | `front_dist/` na imagem |

## Quem fala com quem

```mermaid
flowchart LR
  subgraph LOCAL["Local (dev)"]
    V["Vite :3000"] -->|"proxy /api/v1/context-agent"| DL["Django harness :8000"]
    DL -->|"GEMINI_API_KEY do shell<br/>(só se IAGORA_MODE=demo_live e ALLOW_PAID=yes)"| GEM1["Gemini API (AI Studio)"]
    DL -->|"ADC do utilizador<br/>(gcloud auth application-default login)"| BQ1["BigQuery<br/>extrato_sintetico"]
    DL -->|"sem IAGORA_STATE_BUCKET"| SQL1[("SQLite /tmp/i-agora-plans.sqlite3")]
  end
  subgraph DOCKER["Docker (local)"]
    DD["gunicorn :8080<br/>deploy.settings + front_dist"] -->|"-e GEMINI_API_KEY"| GEM2["Gemini API"]
    DD -->|"ADC montado read-only<br/>(opcional, NAO_MEDIDO)"| BQ2["BigQuery"]
    DD -->|"sem bucket"| SQL2[("SQLite no /tmp do contentor")]
  end
  subgraph CI["CI (proposta inativa)"]
    T["pytest + smoke demo<br/>+ secret_scan"] -.->|"nenhum provedor"| X["sem rede para GCP/Gemini"]
  end
  subgraph CR["Cloud Run i-agora (us-central1)"]
    R["gunicorn :8080<br/>SA squad-agent-sa"] -->|"Secret Manager i-agora-gemini"| GEM3["Gemini API"]
    R -->|"ADC da service account"| BQ3["BigQuery"]
    R -->|"IAGORA_STATE_BUCKET<br/>ifGenerationMatch"| GCS[("GCS iagora-state-…")]
    AR["Artifact Registry agentes/i-agora"] -->|"imagem por digest"| R
  end
```

Fonte do lado Cloud Run: `deploy/README.md:5-12,36-38`. O mapeamento segredo → variável no serviço
(`i-agora-gemini` → `GEMINI_API_KEY`, `i-agora-signing` → `DJANGO_SECRET_KEY`) **não está versionado**: é inferido do
código que lê essas variáveis e está marcado `NAO_MEDIDO` em [provedores.md](provedores.md).
