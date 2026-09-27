# Estrutura e padroes — itaú-agentes---app-demo-&-backend-django

Fonte: `tools/descobrir-estrutura.mjs` (mapa_estrutura/0.1.0), mapa `estrutura-itau-agentes-app-demo-backend-django-2026-09-27T0411.json`, gerado 2026-09-27T07:11:36.705Z.
Listagem: git (excluido: relatorios/estrutura/). 114 ficheiros. Detectados 20 · ausentes 12 · NAO_MEDIDO 0 · anomalias 4.

Cada padrao abaixo cita `ficheiro:linha` (sha da linha no JSON) ou um caminho que existe.
`tools/verificar-mapa.mjs` recalcula cada evidencia; o que nao se pode apontar nao entra.

## Instrumentos

- **listagem**: MEDIDO — git ls-files -co --exclude-standard; ignorados por git check-ignore -v
- **python-ast**: SEM_ALVO — 0 ficheiros .py
- **typescript-ast**: MEDIDO — typescript 7.0.2 (API sync) em C:\Users\ACER\Desktop\itaú-agentes---app-demo-&-backend-django\node_modules\typescript

## Fronteiras (repos Git aninhados, nunca misturados)

- `desafio-itau-batalha-de-agentes-time2` — repo-aninhado, ignorado pelo .gitignore; evidencia `desafio-itau-batalha-de-agentes-time2/.git`, `.gitignore:2`

## Arvore e papeis de diretorio

| pasta | ficheiros | papeis |
|---|---:|---|
| `.` | 114 | codigo, config, entrada |
| `.claude` | 75 | contexto-agente |
| `.claude/skills` | 75 | - |
| `.claude/skills/descoberta-de-estrutura` | 75 | - |
| `docs` | 4 | docs |
| `docs/archive` | 2 | archive |
| `docs/archive/2026-09-27` | 1 | - |
| `relatorios` | 11 | relatorios |
| `relatorios/skills` | 11 | - |
| `src` | 14 | codigo, entrada |
| `src/components` | 8 | componentes |
| `src/components/screens` | 4 | telas |
| `src/data` | 1 | codigo, dados |
| `src/services` | 1 | servicos |
| `src/types` | 1 | tipos |

Ignorados presentes no disco: `.secrets` (.gitignore:14), `.venv` (.gitignore:3), `desafio-itau-batalha-de-agentes-time2` (.gitignore:2), `dist` (.gitignore:5), `node_modules` (.gitignore:1), `secrets.contrato.local.md` (.gitignore:16).

## Stack minima (so para interpretar padroes)

- express ^4.21.2 — `package.json:21`
- react ^19.0.1 — `package.json:18`
- react-dom ^19.0.1 — `package.json:19`
- tailwindcss ^4.3.3 — `package.json:31`
- typescript ^7.0.2 — `package.json:33`
- vite ^8.3.0 — `package.json:20`

## Padroes detectados

| id | confianca | evidencia | detalhe |
|---|---|---|---|
| arvore.papeis-de-diretorio | media | `.` `.claude` `docs` (+8) | {"codigo":[".","src","src/data"],"config":["."],"entrada":[".","src"],"contexto-agente":[".claude"],"docs":["docs"],"archive":["docs/archive"],"relatorios":[... |
| arvore.entradas | alta | `index.html:15` `package.json:7` `src/main.tsx:6` | {"parser_indisponivel":[]} |
| arvore.ignorados | alta | `.gitignore:1` `.gitignore:2` `.gitignore:3` (+3) | {"caminhos":[".secrets <- .gitignore:14",".venv/ <- .gitignore:3","desafio-itau-batalha-de-agentes-time2/ <- .gitignore:2","dist/ <- .gitignore:5","node_modu... |
| arvore.fronteiras-git | alta | `.gitignore:2` `desafio-itau-batalha-de-agentes-time2/.git` | {"fronteiras":["desafio-itau-batalha-de-agentes-time2 (repo-aninhado, ignorado)"]} |
| stack.manifestos | media | `package.json` | {"manifestos":["package.json"],"conhecidas":["express","react","react-dom","tailwindcss","typescript","vite"]} |
| arq.react-componentes | alta | `src/App.tsx:22` `src/components/AndroidFrame.tsx:13` `src/components/CustomerSelectorBar.tsx:25` (+6) | {"componentes":9,"por_pasta":{"src":1,"src/components":3,"src/components/screens":5}} |
| arq.react-telas | alta | `src/components/screens/LazyShimmerFrames.tsx:3` `src/components/screens/LazyShimmerFrames.tsx:59` `src/components/screens/Screen1ItauHome.tsx:21` (+2) | {"telas":["Screen1ItauHome","Screen1Skeleton","Screen2Chat","Screen2Skeleton","Screen3Communication"]} |
| arq.ts-tipos | media | `src/types/index.ts:1` `src/types/index.ts:3` `src/types/index.ts:5` (+5) | {"centralizados":8,"exportados_fora":0} |
| arq.ts-servicos | media | `src/services/behavioralEngine.ts:75` `src/services/behavioralEngine.ts:131` `src/services/behavioralEngine.ts:203` | {} |
| arq.barrel-index | media | `src/components/index.ts:2` | {} |
| arq.roteamento-front | alta | `src/App.tsx:23` `src/App.tsx:195` `src/App.tsx:198` (+11) | {"modo":"maquina-de-estados","tipos":["ScreenType"],"estados":["chat","communication","home"]} |
| arq.cliente-api | media | `src/components/DjangoArchitectureDrawer.tsx:60` | {"endpoints":["/api/v1/context-agent/primeira-chamada/"]} |
| arq.proxy-dev | media | `vite.config.ts:15` | {"prefixos":["/api/v1/context-agent"]} |
| conv.estilo-nomes-ficheiros | media | `src/App.tsx` `src/components/AndroidFrame.tsx` | {".css":{"contagem":{"minusculo":1},"dominante":null,"fracao":0,"convencao":false},".html":{"contagem":{"minusculo":1},"dominante":null,"fracao":0,"convencao... |
| conv.estilo-identificadores | alta | `src/App.tsx:22` `src/App.tsx:23` `src/App.tsx:40` (+2) | {"parser_indisponivel":[],"ts/componente":{"contagem":{"PascalCase":9},"dominante":"PascalCase","fracao":1},"ts/funcao":{"contagem":{"camelCase":18},"dominan... |
| conv.idioma-identificadores | media | `src/App.tsx:23` `src/App.tsx:29` `src/components/DjangoArchitectureDrawer.tsx:45` | {"ts":{"pt":37,"en":174,"exemplos_pt":["isChaveAtiva","modeloUsado"],"exemplos_en":["activeScreen","setActiveScreen"],"dominante":"en"},"tokens_casados":211,... |
| conv.afixos | media | `docs/INDICE.md` `relatorios/skills/mapa-2026-09-27T0331.json` `relatorios/skills/mapa-2026-09-27T0331.md` (+1) | {"afixos":[{"tipo":"prefixo","afixo":"mapa","grupo":".json","n":5},{"tipo":"prefixo","afixo":"mapa","grupo":".md","n":5},{"tipo":"prefixo","afixo":"screen","... |
| conv.pastas-datadas | alta | `docs/archive/2026-09-27` | {"formatos":{"AAAA-MM-DD":1}} |
| conv.archive-indice | baixa | `docs/archive/INDICE.md` | {"archives":["docs/archive"],"com_indice":1} |
| conv.dependencias-usadas | media | `package.json:15` `package.json:16` `package.json:17` (+3) | {"usadas":6,"sem_import":["@google/genai","dotenv","express","motion"],"nao_medidas":[],"notebooks_nao_parseados":0} |

## Ausentes (medido, nao ha)

- arq.django-projeto: 0 ficheiros Python no alvo
- arq.django-apps: 0 ficheiros Python no alvo
- arq.mvt: 0 ficheiros Python no alvo
- arq.camadas-python: 0 ficheiros Python no alvo
- arq.rotas-django: 0 ficheiros Python no alvo
- arq.api-drf: 0 ficheiros Python no alvo
- arq.migracoes: 0 ficheiros Python no alvo
- arq.contratos-json-schema: nenhum .json com chave "$schema" no topo
- arq.contratos-openapi: nenhum ficheiro com chave openapi/swagger no topo
- arq.contratos-exemplos: nenhum .json de dados em docs/ ou contracts/
- testes.python: 0 ficheiros Python no alvo
- testes.ts: 0 ficheiros *.test.* / *.spec.* / __tests__/

## NAO_MEDIDO (nao se conseguiu medir — nunca e zero)

Nenhum.

## Anomalias (desvios do proprio padrao)

- **anom.dependencia-sem-import** (conv.dependencias-usadas): @google/genai declarada mas nunca importada no codigo parseado — `package.json:14`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): dotenv declarada mas nunca importada no codigo parseado — `package.json:22`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): express declarada mas nunca importada no codigo parseado — `package.json:21`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): motion declarada mas nunca importada no codigo parseado — `package.json:23`

---
Consumo pela `mapear-contexto-do-repositorio`: cada padrao DETECTADO e um facto com `ficheiro:linha` + sha,
na mesma forma das regras da F3; ela classifica, esta skill so detecta.
