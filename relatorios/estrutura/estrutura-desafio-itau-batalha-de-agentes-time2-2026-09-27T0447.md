# Estrutura e padroes — desafio-itau-batalha-de-agentes-time2

Fonte: `tools/descobrir-estrutura.mjs` (mapa_estrutura/0.2.0), mapa `estrutura-desafio-itau-batalha-de-agentes-time2-2026-09-27T0447.json`, gerado 2026-09-27T07:47:55.866Z.
Listagem: git. 162 ficheiros. Detectados 26 · ausentes 10 · NAO_MEDIDO 0 · anomalias 14.

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
| `.` | 162 | codigo, config, entrada |
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
| `desafio_itau` | 7 | codigo, config, entrada |
| `docs` | 52 | docs |
| `docs/archive` | 3 | archive |
| `docs/archive/2026-09-27` | 2 | - |
| `docs/estudo-i-agora` | 27 | - |
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
| `relatorios` | 21 | relatorios |
| `relatorios/revisao-gemini` | 2 | - |
| `relatorios/skills` | 19 | - |
| `scripts` | 2 | codigo |
| `skills` | 7 | - |
| `skills/extracao-comportamental-iai` | 7 | - |
| `skills/extracao-comportamental-iai/evidencias` | 1 | - |
| `skills/extracao-comportamental-iai/scripts` | 4 | codigo |
| `templates` | 6 | templates |
| `templates/recommendations` | 5 | - |
| `tests` | 8 | testes |

Ignorados presentes no disco: `.claude` (.gitignore:9), `__pycache__` (.gitignore:1), `apps/context_agent_datadriven/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agente/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/antropic/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/google/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/LLM_Models/openIa/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/agentes/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/migrations/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/pastas_raiz/controles_evals/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/pastas_raiz/docs/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/rotas/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/services/__pycache__` (.gitignore:1), `apps/context_agent_datadriven/templates/__pycache__` (.gitignore:1), `apps/recomendacao/__pycache__` (.gitignore:1), `apps/recomendacao/migrations/__pycache__` (.gitignore:1), `apps/recomendacao/services/__pycache__` (.gitignore:1), `archive/2026-09-27` (desconhecida), `archive/2026-09-27/db.sqlite3` (.gitignore:3), `db.sqlite3` (.gitignore:3), `desafio_itau/__pycache__` (.gitignore:1), `docs/estudo-i-agora/sql/__pycache__` (.gitignore:1), `scripts/__pycache__` (.gitignore:1), `skills/extracao-comportamental-iai/evidencias/proposta-simulada-20260927-0420.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/proposta-simulada-20260927-0425.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/proposta-simulada-final-20260927.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/proposta-simulada-sem-cache-20260927.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmp0ycxx3yi` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmp4_796m3b` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmp5u11dh4w` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmp62zt_qi_` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmp66qtpisg` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpbkj02ei1` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpcku60sif` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpcuhau8xr` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpk9m5_mgx` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpkxvbj3sm` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpo9tt4p_d` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpp1lse52z` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpvab83dqp` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpwupcgqke` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/tmpwxfrgt_z` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/validacao-final-20260927.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/validacao-real-20260927-0420.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/validacao-real-20260927-0425.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/evidencias/validacao-real-sem-cache-20260927.json` (skills/extracao-comportamental-iai/evidencias/.gitignore:1), `skills/extracao-comportamental-iai/scripts/__pycache__` (.gitignore:1), `tests/__pycache__` (.gitignore:1).

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
| arvore.papeis-de-diretorio | media | `.` `apps` `apps/context_agent_datadriven` (+23) | {"codigo":[".","apps","apps/context_agent_datadriven","apps/context_agent_datadriven/agente","apps/context_agent_datadriven/agentes","apps/context_agent_data... |
| arvore.entradas | alta | `desafio_itau/asgi.py:9` `desafio_itau/wsgi.py:9` `manage.py:17` | {"parser_indisponivel":[]} |
| arvore.ignorados | alta | `.gitignore:1` `.gitignore:3` `.gitignore:9` (+1) | {"caminhos":[".claude/ <- .gitignore:9","__pycache__/ <- .gitignore:1","apps/context_agent_datadriven/__pycache__/ <- .gitignore:1","apps/context_agent_datad... |
| stack.manifestos | alta | `manage.py` `requirements.txt` | {"manifestos":["manage.py","requirements.txt"],"conhecidas":["django","django-cors-headers","djangorestframework","numpy","pandas","pydantic"]} |
| arq.django-projeto | alta | `desafio_itau/asgi.py:9` `desafio_itau/settings.py:22` `desafio_itau/wsgi.py:9` (+1) | {"settings":["desafio_itau/settings.py"],"installed_apps":["django.contrib.contenttypes","django.contrib.staticfiles","corsheaders","rest_framework","apps.re... |
| arq.django-apps | alta | `apps/context_agent_datadriven/apps.py:3` `apps/recomendacao/apps.py:3` | {"apps":["apps/context_agent_datadriven","apps/recomendacao"]} |
| arq.mvt | alta | `apps/context_agent_datadriven/models.py:12` `apps/context_agent_datadriven/urls.py:10` `apps/context_agent_datadriven/views.py:29` (+5) | {"por_app":[{"app":"apps/context_agent_datadriven","models":true,"views":true,"urls":true,"templates_html":6},{"app":"apps/recomendacao","models":true,"views... |
| arq.camadas-python | alta | `apps/context_agent_datadriven/views.py:19` `apps/context_agent_datadriven/views.py:25` `apps/context_agent_datadriven/views.py:26` (+5) | {"camadas":{"models":2,"repositorio":1,"servicos":5,"views":2},"arestas":{"servicos->models":2,"views->models":1,"views->repositorio":1,"views->servicos":4}} |
| arq.rotas-django | alta | `apps/context_agent_datadriven/urls.py:10` `apps/recomendacao/urls.py:18` `desafio_itau/urls.py:11` (+4) | {"rotas_path":20,"includes":["apps.context_agent_datadriven.urls","apps.recomendacao.urls"]} |
| arq.api-drf | alta | `apps/context_agent_datadriven/views.py:29` `apps/context_agent_datadriven/views.py:66` `apps/context_agent_datadriven/views.py:191` (+8) | {"endpoints_classe_ou_funcao":11} |
| arq.migracoes | alta | `apps/context_agent_datadriven/migrations/0001_initial.py:7` `apps/recomendacao/migrations/0001_initial.py:6` | {"por_pasta":{"apps/context_agent_datadriven/migrations":1,"apps/recomendacao/migrations":1}} |
| arq.cliente-api | alta | `apps/context_agent_datadriven/agentes/LLM_Models/google/cliente.py:54` `apps/context_agent_datadriven/services/agente_service.py:64` `apps/context_agent_datadriven/services/agente_service.py:197` (+2) | {"endpoints":[]} |
| arq.contratos-json-schema | alta | `docs/estudo-i-agora/schemas/envio-agente.schema.json:2` `docs/estudo-i-agora/schemas/extrato-sintetico.schema.json:2` `docs/estudo-i-agora/schemas/medicao.schema.json:2` (+13) | {"ficheiros":16,"dialetos":["https://json-schema.org/draft/2020-12/schema"]} |
| arq.contratos-exemplos | media | `docs/estudo-i-agora/medicoes/2026-09-27/estatistica_t3.json` `docs/estudo-i-agora/medicoes/2026-09-27/guard_e2e.json` `docs/estudo-i-agora/medicoes/2026-09-27/q01_volumetria.json` (+7) | {"ficheiros":10} |
| testes.python | alta | `tests/test_consultas_i_agora.py:30` `tests/test_medidor_usuario.py:15` `tests/test_primeira_chamada.py:31` (+5) | {"ficheiros":8,"frameworks":["django.test","unittest"],"localizacao":["tests/ na raiz"],"prefixo_test_":8} |
| conv.estilo-nomes-ficheiros | media | `apps/context_agent_datadriven/migrations/0001_initial.py` `apps/context_agent_datadriven/pastas_raiz/controles_evals/evals_google_agent.py` `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/sql/_base_cliente.sql` (+5) | {".html":{"contagem":{"minusculo":2,"snake_case":4},"dominante":"snake_case","fracao":1,"convencao":true},".ipynb":{"contagem":{"minusculo":1,"snake_case":1}... |
| conv.estilo-identificadores | alta | `apps/context_agent_datadriven/agente/router.py:8` `apps/context_agent_datadriven/agente/router.py:10` `apps/context_agent_datadriven/agentes/LLM_Models/google/cliente.py:49` | {"parser_indisponivel":[],"python/classe":{"contagem":{"PascalCase":69},"dominante":"PascalCase","fracao":1},"python/funcao":{"contagem":{"snake_case":187,"m... |
| conv.idioma-identificadores | media | `apps/context_agent_datadriven/agente/router.py:8` `apps/context_agent_datadriven/agente/router.py:10` `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py:12` (+1) | {"python":{"pt":363,"en":117,"exemplos_pt":["AgenteHarnessRouter","calcular_horario_casado"],"exemplos_en":["PROVIDER_NAME","get_secret"],"dominante":"pt-BR"... |
| conv.afixos | media | `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py` `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/sql/visao_categoria.sql` `apps/context_agent_datadriven/urls.py` (+9) | {"afixos":[{"tipo":"prefixo","afixo":"mapa","grupo":".json","n":9},{"tipo":"prefixo","afixo":"mapa","grupo":".md","n":9},{"tipo":"prefixo","afixo":"test","gr... |
| conv.pastas-datadas | media | `docs/archive/2026-09-27` `docs/estudo-i-agora/medicoes/2026-09-27` `docs/inteirações-cloud/27-09-2026` (+1) | {"formatos":{"AAAA-MM-DD":3,"DD-MM-AAAA":1}} |
| conv.archive-indice | media | `archive/INDICE.md` `docs/archive/INDICE.md` | {"archives":["archive","docs/archive"],"com_indice":2} |
| conv.dependencias-usadas | media | `requirements.txt:1` `requirements.txt:2` `requirements.txt:3` (+3) | {"usadas":6,"sem_import":["pydantic","python-dotenv"],"nao_medidas":[],"notebooks_nao_parseados":2} |
| arq.segredos-leitor-unico | media | `.gitignore:6` `desafio_itau/segredos.py:21` `desafio_itau/segredos.py:54` | {"leitores":["desafio_itau/segredos.py"],"ficheiros_segredo_referidos":[".secrets"],"regras_gitignore":[".gitignore:6"],"exemplos_versionados":[],"leitores_e... |
| arq.modelos-llm-centralizados | media | `desafio_itau/modelos_llm.py:12` `desafio_itau/modelos_llm.py:15` `desafio_itau/modelos_llm.py:18` | {"centro":"desafio_itau/modelos_llm.py","modelos_no_centro":["gemini-3.5-flash-lite","gemini-flash-latest"],"modulos_com_literal_fora_do_centro":["apps/conte... |
| arq.banco-por-migracoes | alta | `apps/context_agent_datadriven/migrations/0001_initial.py:7` `apps/recomendacao/migrations/0001_initial.py:6` `init_database.py:142` | {"migracoes":2,"aplica_migrate_no_codigo":["init_database.py:142"],"sql_cru_fora_de_migracoes":0,"sql_cru_em_testes":["tests/test_semantica_backend.py:115","... |
| conv.contratos-datados | alta | `docs/inteirações-cloud/27-09-2026/INDICE.md` `docs/inteirações-cloud/27-09-2026/chat-variavel-1/padrao-retorno.json:2` `docs/inteirações-cloud/27-09-2026/chave-interacao-tela-iai/padrao-envio.json:2` (+10) | {"pastas_com_indice":["docs/inteirações-cloud/27-09-2026"],"pastas_sem_indice":[],"formatos":["DD-MM-AAAA"],"schemas_datados":12,"schemas_total":16} |

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
- **anom.estilo-nome-divergente** (conv.estilo-nomes-ficheiros): pastas: convencao kebab-case (61%), 7 nome(s) fogem: context_agent_datadriven, LLM_Models, openIa, pastas_raiz, controles_evals, i_agora — `apps/context_agent_datadriven`, `apps/context_agent_datadriven/agentes/LLM_Models`, `apps/context_agent_datadriven/agentes/LLM_Models/openIa`, `apps/context_agent_datadriven/pastas_raiz`, `apps/context_agent_datadriven/pastas_raiz/controles_evals`, `apps/context_agent_datadriven/pastas_raiz/estudos/i_agora`
- **anom.ficheiro-em-pasta-de-outro-tipo** (arvore.papeis-de-diretorio): apps/context_agent_datadriven/templates/context_agent_painel_html.py: codigo dentro de uma pasta templates/ (templates sao marcacao) — `apps/context_agent_datadriven/templates/context_agent_painel_html.py`
- **anom.formato-data-misto** (conv.pastas-datadas): pastas datadas em 2 formatos: AAAA-MM-DD, DD-MM-AAAA — `docs/archive/2026-09-27`, `docs/inteirações-cloud/27-09-2026`
- **anom.modelo-llm-literal-espalhado** (arq.modelos-llm-centralizados): "claude-3-5-sonnet" literal em 1 modulo(s) de codigo fora do centro: nem existe em desafio_itau/modelos_llm.py (modelo proprio, fora da fonte unica) — `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py:13`, `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py:29`
- **anom.modelo-llm-literal-espalhado** (arq.modelos-llm-centralizados): "claude-3-haiku" literal em 1 modulo(s) de codigo fora do centro: nem existe em desafio_itau/modelos_llm.py (modelo proprio, fora da fonte unica) — `apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py:13`
- **anom.modelo-llm-literal-espalhado** (arq.modelos-llm-centralizados): "gemini-3.5-flash-lite" literal em 1 modulo(s) de codigo fora do centro: repete o que desafio_itau/modelos_llm.py ja define — `apps/context_agent_datadriven/rotas/manager.py:67`
- **anom.modelo-llm-literal-espalhado** (arq.modelos-llm-centralizados): "gemini-flash-latest" literal em 4 modulo(s) de codigo fora do centro: repete o que desafio_itau/modelos_llm.py ja define — `apps/context_agent_datadriven/agentes/agente.py:60`, `apps/context_agent_datadriven/models.py:17`, `apps/context_agent_datadriven/rotas/manager.py:33`, `apps/context_agent_datadriven/rotas/manager.py:50`, `apps/context_agent_datadriven/rotas/manager.py:84`, `apps/context_agent_datadriven/services/agente_service.py:112`
- **anom.modelo-llm-literal-espalhado** (arq.modelos-llm-centralizados): "gpt-4o" literal em 1 modulo(s) de codigo fora do centro: nem existe em desafio_itau/modelos_llm.py (modelo proprio, fora da fonte unica) — `apps/context_agent_datadriven/agentes/LLM_Models/openIa/cliente.py:13`, `apps/context_agent_datadriven/agentes/LLM_Models/openIa/cliente.py:29`
- **anom.modelo-llm-literal-espalhado** (arq.modelos-llm-centralizados): "gpt-4o-mini" literal em 1 modulo(s) de codigo fora do centro: nem existe em desafio_itau/modelos_llm.py (modelo proprio, fora da fonte unica) — `apps/context_agent_datadriven/agentes/LLM_Models/openIa/cliente.py:13`

---
Consumo pela `mapear-contexto-do-repositorio`: cada padrao DETECTADO e um facto com `ficheiro:linha` + sha,
na mesma forma das regras da F3; ela classifica, esta skill so detecta.
