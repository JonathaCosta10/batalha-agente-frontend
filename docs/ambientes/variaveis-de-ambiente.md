# Variáveis de ambiente

Levantamento por `git grep` de `os.environ`, `getenv`, `import.meta.env` e `process.env` em todo o código
versionado (excluindo `relatorios/`, `docs/` e `.claude/`), mais `deploy/Dockerfile`, `.env.example` e
`.secrets.example`. `import.meta.env` e `getenv`: **zero ocorrências** no código publicado — o front não lê
nenhuma variável em runtime.

Legenda de origem: **shell** = exportada no terminal; **-e** = `docker run -e`/`--env-file`; **SM** = Secret
Manager montado como variável no Cloud Run; **svc** = variável definida no serviço Cloud Run; **auto** = injetada
pela plataforma; **img** = `ENV` do Dockerfile; **código** = definida pelo próprio script.

## 1. Backend publicado (`agent_backend/` + `deploy/`)

| Variável | Quem lê | Padrão | Obrig.? | Segredo? | Local dev | Docker | CI | Cloud Run |
|---|---|---|---|---|---|---|---|---|
| `GEMINI_API_KEY` | `agent_backend/conversation/gateway.py:72`; `agent_backend/smoke.py:41-42` | nenhum | só em `demo_live` (sem ela: `RuntimeError('Server credential missing')` → 503) | **sim** | shell ou `smoke --key-file` (ficheiro 0600, `smoke.py:39-41`) | -e | não usada (smoke `demo`) | SM `i-agora-gemini` (mapeamento `NAO_MEDIDO`) |
| `DJANGO_SECRET_KEY` | `agent_backend/harness/settings.py:5`; `deploy/settings.py:4` | harness: aleatória por processo (`secrets.token_urlsafe(48)`); deploy: **nenhum** (`KeyError` no arranque) | **sim** em `deploy.settings` | **sim** (assina cookie de sessão) | opcional (aleatória invalida cookies a cada reinício) | -e | não precisa | SM `i-agora-signing` (mapeamento `NAO_MEDIDO`) |
| `DJANGO_SETTINGS_MODULE` | `agent_backend/manage.py:6`; `deploy/wsgi.py:2`; `agent_backend/tests/conftest.py:4`; `smoke.py:44` | harness (manage/testes) ou `deploy.settings` (wsgi) | não | não | código | código (wsgi) | código | código (wsgi) |
| `IAGORA_MODE` | `agent_backend/harness/settings.py:19` | `demo` | não | não | shell (`demo` / `demo_live`) | **ignorada**: `deploy/settings.py:12` fixa `demo_live` | smoke fixa `demo` (`smoke.py:45`) | ignorada (fixa `demo_live`) |
| `IAGORA_ALLOW_PAID_CALLS` | `agent_backend/harness/settings.py:20` | falso (só `yes` liga) | não | não | shell | **ignorada**: `deploy/settings.py:13` fixa `True` | smoke fixa `no` (`smoke.py:46`) | ignorada (fixa `True`) |
| `IAGORA_MAX_CALLS` | `agent_backend/harness/settings.py:21` | `12`, limitado a 0–60 | não | não | shell | **ignorada**: sobrescrita por `IAGORA_DAILY_CALLS` (`deploy/settings.py:17`) | smoke fixa `casos×3` (`smoke.py:47`) | ignorada |
| `IAGORA_DAILY_CALLS` | `deploy/settings.py:17`; `agent_backend/conversation/gateway.py:68` | `900` | não | não | não se aplica | -e opcional | não | svc (valor efetivo `NAO_MEDIDO`; `deploy/README.md:40` cita 900) |
| `AGENT_MODEL` | `agent_backend/harness/settings.py:23` | `gemini-3.5-flash-lite`; só aceita `ALLOWED_MODELS` (`gateway.py:23,56-57`) | não | não | shell | -e | não | svc/padrão (`NAO_MEDIDO`) |
| `GUARD_MODEL` | `agent_backend/harness/settings.py:24` | = `AGENT_MODEL` | não | não | shell | -e | não | svc/padrão (`NAO_MEDIDO`) |
| `IAGORA_STATE_BUCKET` | `agent_backend/planning/http.py:13,15`; `gateway.py:66`; `deploy/urls.py:6` | ausente → SQLite local | não (ausente = modo local) | não (nome de bucket; o acesso é por IAM) | ausente | ausente (ou -e + ADC) | ausente | svc `iagora-state-951291470271` (`deploy/README.md:9`) |
| `IAGORA_PLAN_DB` | `agent_backend/planning/http.py:16` | `/tmp/i-agora-plans.sqlite3` | não | não (mas o ficheiro contém planos) | shell | -e | padrão | não usada (bucket ativo) |
| `IAGORA_BQ_MAPPING` | `agent_backend/planning/bigquery.py:17` | `agent_backend/planning/bq_mapping.json` | não | não | shell | -e | não | padrão |
| `IAGORA_BQ_MAX_BYTES` | `agent_backend/planning/bigquery.py:19` | `100000000`, teto rígido 100 MB (`min(...)`) | não | não | shell | -e | não | padrão |
| `IAGORA_HOSTS` | `deploy/settings.py:5` | `i-agora.hsoares.com.br` (+ `localhost`, `127.0.0.1`, `testserver` sempre) | não | não | não se aplica | -e opcional | não | svc (valor `NAO_MEDIDO`; `deploy/README.md:38`) |
| `IAGORA_FRONT_DIST` | `deploy/urls.py:5` | `/app/front_dist` | não | não | não se aplica | padrão | não | padrão |
| `IAGORA_RELEASE` | `deploy/urls.py:6` (só eco em `/api/health/`) | `local` | não | não | não se aplica | -e opcional | não | svc (`NAO_MEDIDO`) |
| `K_SERVICE` | `deploy/urls.py:6` (`hosting: gcp-cloud-run` × `local-validation`) | ausente | não | não | ausente | ausente | ausente | auto (Cloud Run) |
| `PORT` | `deploy/Dockerfile:2,11` (bind do gunicorn) | `8080` | não | não | não se aplica | img | não | auto (Cloud Run injeta) |
| `DISABLE_HMR` | `vite.config.ts:22,24` | ausente (HMR ligado) | não | não | shell | não se aplica | não | não se aplica |
| `DJANGO_URL` | `vite.config.ts:19` (alvo do proxy `/api/v1`) | `http://127.0.0.1:8000` = o backend único (`Nova pasta/backend`, Django DRF) desde 2026-09-27 | não | não | shell | não se aplica | não | não se aplica |
| `VITE_IAGORA_USUARIO` | `src/services/backend.ts` (`FIXED_USER`, corpo de `POST perfil-usuario/definir/`) | vazio = pessoa sorteada pelo backend a cada carga (`"aleatorio"`, desde 27/09 14:35); definida = fixa essa pessoa. Fallback sem lista: `00108ccd-…` (Maria) | não (é um id sintético, não segredo; vai no bundle) | não | shell / `.env.local` | não se aplica | não | não se aplica |
| `IAGORA_DEV_ORIGINS` | `agent_backend/harness/settings.py:8-16,30` (`CSRF_TRUSTED_ORIGINS`) | `http://127.0.0.1:3000,http://localhost:3000` | não | não | shell | não se aplica (usa `deploy.settings`) | padrão | não se aplica |

Também no `deploy/Dockerfile:2`: `PYTHONDONTWRITEBYTECODE=1`, `PYTHONUNBUFFERED=1` (img; não são lidas pelo código).

**Credencial Google (ADC).** Nenhum ficheiro lê `GOOGLE_APPLICATION_CREDENTIALS` diretamente: BigQuery
(`agent_backend/planning/bigquery.py:25`) e GCS (`agent_backend/planning/gcs_store.py:17`) chamam
`google.auth.default(...)`, que resolve pela ordem da biblioteca: `GOOGLE_APPLICATION_CREDENTIALS` →
ficheiro do `gcloud auth application-default login` → service account do metadata server (Cloud Run).

**Total documentado:** 19 variáveis lidas pelo código publicado (tabela acima) + `GOOGLE_APPLICATION_CREDENTIALS`
(indireta, via ADC) + 2 declaradas só em exemplos e não lidas (`APP_URL`, `API_KEY_SECRECT`).

### Declaradas em exemplos mas **não lidas** pelo código publicado

| Variável | Onde aparece | Situação |
|---|---|---|
| `APP_URL` | `.env.example:9` | herança do modelo AI Studio; **nenhum** código a lê. |
| `GEMINI_API_KEY` (no `.env.example`) | `.env.example:1-4` | o comentário fala em injeção pelo AI Studio; no publicado a chave é lida só pelo backend, a partir do ambiente do processo (`gateway.py:72`), nunca pelo front nem de `.env`. `dotenv` está em `package.json:23` mas não é importado em `src/`. |
| `API_KEY_SECRECT` | `.secrets.example:3` | **não é lida por nenhum código deste repositório**; pertence ao backend `-32` (secção 3). Criar `.secrets` aqui não liga o Gemini do `agent_backend`. |

## 2. Regras

1. **Nunca versionar:** `.env*` (exceto `.env.example`), `.secrets` (exceto `.secrets.example`), `*.sqlite3`
   (`.gitignore:11-15`); ficheiros de ADC e chaves JSON de service account; `front_dist/`. Valores de
   `GEMINI_API_KEY` e `DJANGO_SECRET_KEY` nunca vão para ficheiro versionado, argumento de linha de comandos
   (`smoke.py:43` recusa pedir a chave por argumento) nem para o browser.
2. **Nunca no front:** nada de `VITE_*` com segredo. O Vite embute `import.meta.env.VITE_*` no bundle público; o
   publicado não lê nenhuma, e deve continuar assim.
3. **Nunca na imagem:** nenhuma credencial ADC nem chave no contentor/imagem (`deploy/README.md:11,36`); em Cloud Run
   os segredos entram por Secret Manager; em Docker local, por `-e`/`--env-file` guardado fora do contexto de build.
4. **Nomes:** variáveis próprias do produto usam o prefixo `IAGORA_`; exceções herdadas: `GEMINI_API_KEY`,
   `DJANGO_SECRET_KEY`, `AGENT_MODEL`, `GUARD_MODEL`. Variáveis da plataforma (`PORT`, `K_SERVICE`) não se definem à
   mão. Nova variável: prefixo `IAGORA_`, padrão seguro no código e linha nova nesta tabela.
5. **Precedência (publicado):**
   - Não há leitura de `.env` nem de `.secrets` pelo backend publicado: **só o ambiente do processo conta**.
   - `deploy.settings` importa o harness e **depois sobrescreve** `IAGORA_MODE`, `IAGORA_ALLOW_PAID_CALLS` e
     `IAGORA_MAX_CALLS` (`deploy/settings.py:3,12-17`): em Docker/Cloud Run essas três variáveis não têm efeito.
   - `smoke --live --key-file F` escreve `GEMINI_API_KEY` no ambiente do processo e sobrepõe a do shell (`smoke.py:39-41`).
   - Tetos no código vencem o ambiente: `IAGORA_BQ_MAX_BYTES` ≤ 100 MB (`bigquery.py:19`); `IAGORA_MAX_CALLS` ≤ 60 no
     harness (`harness/settings.py:21`); `AGENT_MODEL`/`GUARD_MODEL` fora da allowlist recusam arrancar o gateway
     (`gateway.py:56-57`).
6. **Rotação:**
   - `GEMINI_API_KEY`: criar chave nova → nova versão do segredo `i-agora-gemini` → nova revisão Cloud Run (a
     revisão fixa a versão do segredo; `deploy/README.md:11` diz "versão 1") → `/api/health/` e smoke pago de 1 caso
     → desativar a chave antiga. Comandos exatos: `NAO_MEDIDO` (não versionados).
   - `DJANGO_SECRET_KEY`: nova versão de `i-agora-signing` + nova revisão. **Efeito:** invalida todos os cookies de
     sessão assinados (`agent_backend/conversation/http.py:59,92`); planos já gravados no GCS deixam de ser
     alcançáveis pelo browser (a chave do objeto deriva do dono da sessão, `gcs_store.py:21`). Tratar como troca com
     perda de sessões.
   - Após qualquer rotação: `python scripts/secret_scan.py`.

## 3. Fora do publicado

Nada nesta secção corre no Cloud Run nem é lido por este repositório. Existe na cópia de trabalho do backend
`-32` (`backend-agente-conversacional`, **fora de git**) e no front **arquivado** (`frontend-agent-conversacional`,
repositório `mobile-front-agente`). Linhas lidas a 2026-09-27 nessas cópias locais.

| Variável | Quem lê | Padrão | Segredo? | Observação |
|---|---|---|---|---|
| `API_KEY_SECRECT` | `-32: desafio_itau/segredos.py:19,64,68` | nenhum | **sim** | chave Gemini do `-32`. |
| `SECRETS_FILE` | `-32: desafio_itau/segredos.py:30-31` | ausente | não (caminho) | se definida, substitui a busca de ficheiros. |
| `GEMINI_API_KEY`, `GSCONSOLE_SECRET`, `GOOGLE_API_KEY` | `-32: desafio_itau/segredos.py:20,72-75` | nenhum | **sim** | legado, último recurso. |
| `INTERACAO_GUARD_ENTRADA_MODELO` | `-32: apps/conversas/views_interacao.py:54` | `1` (ligado) | não | `0` pula o guard de entrada pelo modelo (poupa 1 chamada/mensagem). Sem teste. |
| `CONVERSAS_MODO` | `-32: desafio_itau/settings.py:116` | `demo_live` | não | padrão **pago**, ao contrário do harness publicado (`demo`). |
| `CONVERSAS_MAX_CHAMADAS` | `-32: desafio_itau/settings.py:117` | `300`, limitado a 0–3000 | não | orçamento por processo. |
| `USUARIO_REAL_ATIVO` | `-32: desafio_itau/settings.py:105` | `1` | não | `0` → rotas `/usuario-real/` respondem 503 `OFF`. |
| `USUARIO_REAL_PROJETO` | `-32: desafio_itau/settings.py:106` | `batalha-time-02-lxof` | não | projeto BigQuery (ADC). |
| `USUARIO_REAL_CACHE_SEGUNDOS` | `-32: desafio_itau/settings.py:109` | `900` | não | cache da leitura BigQuery. |
| `DJANGO_URL` | front arquivado: `vite.config.ts:19` | `http://127.0.0.1:8000` | não | alvo do proxy `/api/v1` do Vite. Desde 2026-09-27 o `vite.config.ts` deste repositório também a lê (tabela principal). |
| `DISABLE_HMR` | front arquivado: `vite.config.ts:23,25` | ausente | não | igual ao publicado. |

**Precedência da chave no `-32`** (`desafio_itau/segredos.py:29-35,62-77`):

1. variável de ambiente `API_KEY_SECRECT`;
2. `API_KEY_SECRECT` dentro de **um** ficheiro `.secrets`: `SECRETS_FILE` se definida; senão o **primeiro que
   existir** entre `../.secrets` (pasta pai do backend) e `../frontend-agent-conversacional/.secrets`. Não há fusão:
   se `../.secrets` existe sem a chave, o do front não é consultado;
3. legado: `GEMINI_API_KEY` → `GSCONSOLE_SECRET` → `GOOGLE_API_KEY` no ambiente.

A origem devolvida (`env:…` / `.secrets:…`) nunca contém o valor (`segredos.py:62-63`).

## Origem do front × CSRF no harness local (2026-09-27)

O harness (`agent_backend/harness/settings.py`) só aceita `POST` de origens listadas em `IAGORA_DEV_ORIGINS`.
Um front servido noutra porta recebe **403** no `POST /i-agora/sessao/abertura/`, e o chat mostra "A conversa
requer autenticação e autorização". Isto foi medido a 2026-09-27 às 09:12 BRT, com o front publicado em `:3001`.

**Regras de `IAGORA_DEV_ORIGINS`:**
- Lista separada por vírgulas.
- Aceita só `http://localhost`, `http://127.0.0.1` ou `http://[::1]`, sempre com porta explícita.
- `*`, `https`, host público, caminho ou ausência de porta fazem o processo **recusar o arranque** com
  `ValueError`. É uma falha fechada, com prova negativa em `agent_backend/tests/test_dev_origins.py`.
- O Cloud Run não a lê: usa `deploy.settings`, com as origens derivadas de `IAGORA_HOSTS`.

**Exemplo (2026-09-27, backend único)** — backend do time noutra porta e front na 3000 (PowerShell):

```powershell
# pasta Nova pasta/backend (Django DRF; origens CSRF confiáveis são as do settings de lá)
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8001
# pasta Frontend
$env:DJANGO_URL='http://127.0.0.1:8001'; npm run dev
```

Não suba o `agent_backend/` deste repositório junto com o backend do time: seriam dois processos disputando a `:8000`
e o front, sem `definir/`, cairia em identidade por cookie. O exemplo anterior (com `agent_backend` na 8001) está em
`docs/archive/2026-09-27/variaveis-de-ambiente-antes-backend-unico.md`. As regras de `IAGORA_DEV_ORIGINS` acima valem
só para o `agent_backend` (imagem do Cloud Run e testes pytest).
