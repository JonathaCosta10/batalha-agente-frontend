# Estrutura e padroes — desafio-itau-batalha-de-agentes-time2

Fonte: `tools/descobrir-estrutura.mjs` (mapa_estrutura/0.1.0), mapa `estrutura-desafio-itau-batalha-de-agentes-time2-2026-09-27T0411.json`, gerado 2026-09-27T07:11:40.106Z.
Listagem: git. 141 ficheiros. Detectados 22 · ausentes 10 · NAO_MEDIDO 0 · anomalias 7.

Cada padrao abaixo cita `ficheiro:linha` (sha da linha no JSON) ou um caminho que existe.
`tools/verificar-mapa.mjs` recalcula cada evidencia; o que nao se pode apontar nao entra.

## Instrumentos

- **listagem**: MEDIDO — git ls-files -co --exclude-standard; ignorados por git check-ignore -v
- **python-ast**: MEDIDO — python 3.12.10 (C:\Users\ACER\Desktop\itaú-agentes---app-demo-&-backend-django\.venv\Scripts\python.exe), modulo ast
- **typescript-ast**: SEM_ALVO — 0 ficheiros TS/JS

## Fronteiras (repos Git aninhados, nunca misturados)

Nenhuma.

## Arvore e papeis de diretorio

| pasta | ficheiros | papeis |
|---|---:|---|
| `.` | 141 | codigo, config, entrada |
| `apps` | 49 | codigo |
| `apps/context_agent_datadriven` | 39 | codigo |
| `apps/context_agent_datadriven/agente` | 1 | codigo |
| `apps/context_agent_datadriven/agentes` | 9 | codigo |
| `apps/context_agent_datadriven/migrations` | 2 | migracoes |
| `apps/context_agent_datadriven/pastas_raiz` | 15 | - |
| `apps/context_agent_datadriven/rotas` | 3 | codigo |
| `apps/context_agent_datadriven/services` | 3 | servicos |
| `apps/context_agent_datadriven/templates` | 1 | templates |
| `apps/recomendacao` | 10 | codigo |
| `apps/recomendacao/migrations` | 2 | migracoes |
| `apps/recomendacao/services` | 3 | servicos |
| `archive` | 1 | archive |
| `desafio_itau` | 6 | codigo, config, entrada |
| `docs` | 51 | docs |
| `docs/archive` | 3 | archive |
| `docs/archive/2026-09-27` | 2 | - |
| `docs/estudo-i-agora` | 26 | - |
| `docs/estudo-i-agora/medicoes` | 9 | - |
| `docs/estudo-i-agora/schemas` | 4 | contratos |
| `docs/estudo-i-agora/sql` | 10 | codigo |
| `docs/inteirações-cloud` | 13 | - |
| `docs/inteirações-cloud/27-09-2026` | 13 | - |
| `docs/qualidade-conversa` | 3 | codigo |
| `docs/qualidade-conversa/medicoes` | 1 | - |
| `docs/templates` | 1 | templates |
| `notebooks` | 3 | dados |
| `notebooks/estudo-i-agora` | 2 | - |
| `relatorios` | 13 | relatorios |
| `relatorios/skills` | 13 | - |
| `templates` | 6 | templates |
| `templates/recommendations` | 5 | - |
| `tests` | 7 | testes |

Ignorados presentes no disco: `__pycache__` (.gitignore:1), `apps/context_agent_datadriven/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agente/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/antropic/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/google/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/openIa/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/migrations/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/pastas_raiz/controles_evals/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/pastas_raiz/docs/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/rotas/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/services/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/templates/__pycache__` (.gitignore:1), `apps/recomendacao/__pycache__` (.gitignore:1), `apps/recomendacao/migrations/__pycache__` (.gitignore:1), `apps/recomendacao/services/__pycache__` (.gitignore:1), `archive/2026-09-27` (desconhecida), `archive/2026-09-27/db.sqlite3` (.gitignore:3), `db.sqlite3` (.gitignore:3), `desafio_itau/__pycache__` (.gitignore:1), `docs/estudo-i-agora/sql/__pycache__` (.gitignore:1), `tests/__pycache__` (.gitignore:1).

## Stack minima (so para interpretar padroes)

- django >=4.2.0,<5.1.0 — `requirements.txt:1`
- django-cors-headers >=4.3.0 — `requirements.txt:3`
- djangorestframework >=3.14.0 — `requirements.txt:2`
- numpy >=1.24.0 — `requirements.txt:5`
- pandas >=2.0.0 — `requirements.txt:4`
- pydantic >=2.0.0 — `requirements.txt:8`

## Padroes detectados

| id | confianca | evidencia | detalhe |
|---|---|---|---|
| arvore.papeis-de-diretorio | media | `.` `apps` `apps/context_agent_datadriven` (+21) | {"codigo":[".","apps","apps/context_agent_datadriven","apps/context_agent_datadriven/agente","apps/context_agent_datadriven/agentes","apps/context_agent_data... |
| arvore.entradas | alta | `desafio_itau/asgi.py:9` `desafio_itau/wsgi.py:9` `manage.py:17` | {"parser_indisponivel":[]} |
| arvore.ignorados | alta | `.gitignore:1` `.gitignore:3` | {"caminhos":["__pycache__/ <- .gitignore:1","apps/context_agent_datadriven/__pycache__/ <- .gitignore:1","apps/context_agent_datadriven/agente/__pycache__/ <... |
| stack.manifestos | alta | `manage.py` `requirements.txt` | {"manifestos":["manage.py","requirements.txt"],"conhecidas":["django","django-cors-headers","djangorestframework","numpy","pandas","pydantic"]} |
| arq.django-projeto | alta | `desafio_itau/asgi.py:9` `desafio_itau/settings.py:22` `desafio_itau/wsgi.py:9` (+1) | {"settings":["desafio_itau/settings.py"],"installed_apps":["django.contrib.contenttypes","django.contrib.staticfiles","corsheaders","rest_framework","apps.re... |
| arq.django-apps | alta | `apps/context_agent_datadriven/apps.py:3` `apps/recomendacao/apps.py:3` | {"apps":["apps/context_agent_datadriven","apps/recomendacao"]} |
| arq.mvt | alta | `apps/context_agent_datadriven/models.py:12` `apps/context_agent_datadriven/urls.py:10` `apps/context_agent_datadriven/views.py:29` (+5) | {"por_app":[{"app":"apps/context_agent_datadriven","models":true,"views":true,"urls":true,"templates_html":6},{"app":"apps/recomendacao","models":true,"views... |
| arq.camadas-python | alta | `apps/context_agent_datadriven/views.py:19` `apps/context_agent_datadriven/views.py:25` `apps/context_agent_datadriven/views.py:26` (+5) | {"camadas":{"models":2,"repositorio":1,"servicos":5,"views":2},"arestas":{"servicos->models":2,"views->models":1,"views->repositorio":1,"views->servicos":4}} |
| arq.rotas-django | alta | `apps/context_agent_datadriven/urls.py:10` `apps/recomendacao/urls.py:18` `desafio_itau/urls.py:11` (+4) | {"rotas_path":20,"includes":["apps.context_agent_datadriven.urls","apps.recomendacao.urls"]} |
| arq.api-drf | alta | `apps/context_agent_datadriven/views.py:29` `apps/context_agent_datadriven/views.py:66` `apps/context_agent_datadriven/views.py:191` (+8) | {"endpoints_classe_ou_funcao":11} |
| arq.migracoes | alta | `apps/context_agent_datadriven/migrations/0001_initial.py:7` `apps/recomendacao/migrations/0001_initial.py:6` | {"por_pasta":{"apps/context_agent_datadriven/migrations":1,"apps/recomendacao/migrations":1}} |
| arq.cliente-api | alta | `apps/context_agent_datadriven/agentes/LLM_Models/google/cliente.py:53` `apps/context_agent_datadriven/services/agente_service.py:67` `apps/context_agent_datadriven/services/agente_service.py:200` (+1) | {"endpoints":[]} |
| arq.contratos-json-schema | alta | `docs/estudo-i-agora/schemas/envio-agente.schema.json:2` `docs/estudo-i-agora/schemas/extrato-sintetico.schema.json:2` `docs/estudo-i-agora/schemas/medicao.schema.json:2` (+13) | {"ficheiros":16,"dialetos":["https://json-schema.org/draft/2020-12/schema"]} |
| arq.contratos-exemplos | media | `docs/estudo-i-agora/medicoes/2026-09-27/estatistica_t3.json` `docs/estudo-i-agora/medicoes/2026-09-27/guard_e2e.json` `docs/estudo-i-agora/medicoes/2026-09-27/q01_volumetria.json` (+7) | {"ficheiros":10} |
| testes.python | alta | `tests/test_consultas_i_agora.py:30` `tests/test_medidor_usuario.py:15` `tests/test_primeira_chamada.py:31` (+4) | {"ficheiros":7,"frameworks":["django.test","unittest"],"localizacao":["tests/ na raiz"],"prefixo_test_":7} |
| conv.estilo-nomes-ficheiros | media | `apps/context_agent_datadriven/migrations/0001_initial.py` `apps/context_agent_datadriven/pastas_raiz/controles_evals/evals_google_agent.py` `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/sql/_base_cliente.sql` (+3) | {".html":{"contagem":{"minusculo":2,"snake_case":4},"dominante":"snake_case","fracao":1,"convencao":true},".ipynb":{"contagem":{"minusculo":1,"snake_case":1}... |
| conv.estilo-identificadores | alta | `apps/context_agent_datadriven/agente/router.py:8` `apps/context_agent_datadriven/agente/router.py:10` `apps/context_agent_datadriven/agentes/LLM_Models/google/cliente.py:48` | {"parser_indisponivel":[],"python/classe":{"contagem":{"PascalCase":63},"dominante":"PascalCase","fracao":1},"python/funcao":{"contagem":{"snake_case":168,"m... |
| conv.idioma-identificadores | media | `apps/context_agent_datadriven/agente/router.py:8` `apps/context_agent_datadriven/agente/router.py:10` `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py:12` (+1) | {"python":{"pt":327,"en":114,"exemplos_pt":["AgenteHarnessRouter","calcular_horario_casado"],"exemplos_en":["PROVIDER_NAME","get_secret"],"dominante":"pt-BR"... |
| conv.afixos | media | `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py` `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/sql/visao_categoria.sql` `apps/context_agent_datadriven/urls.py` (+9) | {"afixos":[{"tipo":"extensao-secundaria","afixo":".schema.json","grupo":".json","n":7},{"tipo":"prefixo","afixo":"test","grupo":".py","n":7},{"tipo":"nome-re... |
| conv.pastas-datadas | media | `docs/archive/2026-09-27` `docs/estudo-i-agora/medicoes/2026-09-27` `docs/inteirações-cloud/27-09-2026` (+1) | {"formatos":{"AAAA-MM-DD":3,"DD-MM-AAAA":1}} |
| conv.archive-indice | media | `archive/INDICE.md` `docs/archive/INDICE.md` | {"archives":["archive","docs/archive"],"com_indice":2} |
| conv.dependencias-usadas | media | `requirements.txt:1` `requirements.txt:2` `requirements.txt:3` (+3) | {"usadas":6,"sem_import":["pydantic","python-dotenv"],"nao_medidas":[],"notebooks_nao_parseados":2} |

## Ausentes (medido, nao ha)

- arvore.fronteiras-git: nenhuma pasta com .git dentro do alvo
- arq.react-componentes: 0 ficheiros TS/JS no alvo
- arq.react-telas: 0 ficheiros TS/JS no alvo
- arq.ts-tipos: 0 ficheiros TS/JS no alvo
- arq.ts-servicos: 0 ficheiros TS/JS no alvo
- arq.barrel-index: 0 ficheiros TS/JS no alvo
- arq.roteamento-front: 0 ficheiros TS/JS no alvo
- arq.proxy-dev: sem config de bundler nem "proxy" no package.json
- arq.contratos-openapi: nenhum ficheiro com chave openapi/swagger no topo
- testes.ts: 0 ficheiros TS/JS no alvo

## NAO_MEDIDO (nao se conseguiu medir — nunca e zero)

Nenhum.

## Anomalias (desvios do proprio padrao)

- **anom.camada-fora-da-pasta** (arq.camadas-python): apps/recomendacao/services/customer_repository.py: camada repositorio pelo nome, mas vive numa pasta de servicos — `apps/recomendacao/services/customer_repository.py`
- **anom.camada-saltada** (arq.camadas-python): views importa o repositorio directamente, saltando a camada de servicos que existe — `apps/recomendacao/views.py:15`
- **anom.caminho-nao-ascii** (conv.estilo-nomes-ficheiros): segmento com caracteres fora de ASCII: "inteirações-cloud" (quebra ferramentas e URLs sem escape) — `docs/inteirações-cloud`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): pydantic declarada mas nunca importada no codigo parseado (2 notebook(s) .ipynb nao parseados) — `requirements.txt:8`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): python-dotenv declarada mas nunca importada no codigo parseado (2 notebook(s) .ipynb nao parseados) — `requirements.txt:9`
- **anom.ficheiro-em-pasta-de-outro-tipo** (arvore.papeis-de-diretorio): apps/context_agent_datadriven/templates/context_agent_painel_html.py: codigo dentro de uma pasta templates/ (templates sao marcacao) — `apps/context_agent_datadriven/templates/context_agent_painel_html.py`
- **anom.formato-data-misto** (conv.pastas-datadas): pastas datadas em 2 formatos: AAAA-MM-DD, DD-MM-AAAA — `docs/archive/2026-09-27`, `docs/inteirações-cloud/27-09-2026`

---
Consumo pela `mapear-contexto-do-repositorio`: cada padrao DETECTADO e um facto com `ficheiro:linha` + sha,
na mesma forma das regras da F3; ela classifica, esta skill so detecta.
