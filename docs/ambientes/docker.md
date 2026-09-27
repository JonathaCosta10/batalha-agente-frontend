# Docker

## A imagem (`deploy/Dockerfile`)

| Linha | O que faz |
|---|---|
| 1 | base `python:3.11-slim` |
| 2 | `PYTHONDONTWRITEBYTECODE=1`, `PYTHONUNBUFFERED=1`, `PORT=8080` |
| 4-5 | instala `agent_backend/requirements.lock` + `gunicorn==23.0.0` |
| 6-8 | copia **só** `agent_backend/`, `deploy/` e `front_dist/` |
| 9-10 | permissões de leitura e utilizador não-root `10001` |
| 11 | `gunicorn deploy.wsgi:application --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --timeout 120`, sem access log |

`deploy.wsgi` fixa `DJANGO_SETTINGS_MODULE=deploy.settings` (`deploy/wsgi.py:2`), portanto a imagem corre sempre em
`demo_live` com chamadas pagas autorizadas (`deploy/settings.py:12-13`).

### Contexto de build e `front_dist`

- `front_dist/` não é versionado: é o `dist/` de `npm run build` **deste repositório** (front em `src/`, desde
  2026-09-27), copiado para a pasta de release (`deploy/README.md:6,36`).
- O `Dockerfile` espera ser a raiz do contexto com `agent_backend/`, `deploy/` e `front_dist/` ao lado
  (`deploy/README.md:36`): monta-se uma **pasta de release** e copia-se `deploy/Dockerfile` para `Dockerfile` nela.
- **Excluído da imagem** (`deploy/README.md:36`): `.env`, ADC, chaves, `.git`, caches, testes e evidências.
  Não há `.dockerignore` (**NAO_EXISTE**): a exclusão depende de a pasta de release ser montada só com o necessário.
  Atenção: `COPY agent_backend` (`Dockerfile:6`) copia também `agent_backend/tests/` e `agent_backend/evidence/` se
  estiverem na pasta de release — removê-los ao montá-la.
- Nenhum `ARG`/build arg: **nada de configuração nem segredo entra no build**; tudo é runtime.

Montagem da release (ilustrativa; o procedimento real não está versionado — `NAO_MEDIDO`):

```sh
REL=$(mktemp -d)
cp -r agent_backend deploy "$REL"/
rm -rf "$REL"/agent_backend/tests "$REL"/agent_backend/evidence
find "$REL" -name '__pycache__' -prune -exec rm -rf {} +
cp -r <front-publicado>/dist "$REL"/front_dist
cp deploy/Dockerfile "$REL"/Dockerfile
docker build -t i-agora:local "$REL"
```

## Correr localmente

Portas: o contentor escuta em `${PORT}` = **8080** (`Dockerfile:2,11`). Rotas: `/api/health/`,
`/api/v1/context-agent/conversas/…`, `/api/v1/context-agent/i-agora/…` e o front em `/` (`deploy/urls.py:14`).

Obrigatório: `DJANGO_SECRET_KEY` (sem ela o arranque falha, `deploy/settings.py:4`). Para conversar de verdade:
`GEMINI_API_KEY`. Para dados BigQuery e/ou GCS: credencial ADC montada.

```sh
# 1) ficheiro de ambiente FORA do repositório e fora da pasta de release, permissão 600
#    conteúdo: DJANGO_SECRET_KEY=...  GEMINI_API_KEY=...
chmod 600 ~/i-agora.env

# 2) só backend + front, sem BigQuery (perfil responde 503 NAO_MEDIDO)
docker run --rm -p 8080:8080 --env-file ~/i-agora.env i-agora:local

# 3) com BigQuery via ADC do utilizador, montado só-leitura (nunca copiado para a imagem)
docker run --rm -p 8080:8080 --env-file ~/i-agora.env \
  -v "$HOME/.config/gcloud/application_default_credentials.json:/secrets/adc.json:ro" \
  -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/adc.json \
  i-agora:local

curl -s http://localhost:8080/api/health/
# esperado: hosting "local-validation", storage "local" (deploy/urls.py:6)
```

Regras:

- **Nunca** `-e GEMINI_API_KEY=<valor>` na linha de comandos (fica no histórico do shell); usar `--env-file` com
  permissão 600 ou `-e GEMINI_API_KEY` sem valor, herdando do ambiente.
- Não definir `IAGORA_STATE_BUCKET` localmente a menos que se queira escrever no bucket real de produção.
- `IAGORA_MODE`, `IAGORA_ALLOW_PAID_CALLS`, `IAGORA_MAX_CALLS` **não têm efeito** na imagem (`deploy/settings.py:12-17`);
  o limite é `IAGORA_DAILY_CALLS` (padrão 900). Cada mensagem gasta até 3 chamadas pagas.
- `localhost` e `127.0.0.1` são sempre permitidos (`deploy/settings.py:5`).

`NAO_MEDIDO`: os comandos acima não foram executados na preparação deste documento. Em particular não foi medido se o
cookie CSRF `Secure` (`deploy/settings.py:10`) é aceite pelo browser em `http://localhost:8080`; se as mutações
falharem com 403, é a primeira hipótese a verificar.
