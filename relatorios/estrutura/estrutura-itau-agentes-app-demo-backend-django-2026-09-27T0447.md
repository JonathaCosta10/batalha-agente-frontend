# Estrutura e padroes — itaú-agentes---app-demo-&-backend-django

Fonte: `tools/descobrir-estrutura.mjs` (mapa_estrutura/0.2.0), mapa `estrutura-itau-agentes-app-demo-backend-django-2026-09-27T0447.json`, gerado 2026-09-27T07:47:59.134Z.
Listagem: git (excluido: relatorios/estrutura/). 298 ficheiros. Detectados 23 · ausentes 13 · NAO_MEDIDO 0 · anomalias 12.

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
| `.` | 298 | codigo, config, entrada |
| `docs` | 7 | docs |
| `docs/archive` | 2 | archive |
| `docs/archive/2026-09-27` | 1 | - |
| `docs/bcb-8` | 3 | - |
| `i-agora-codigo` | 253 | - |
| `i-agora-codigo/i-agora-codigo` | 253 | config |
| `i-agora-codigo/i-agora-codigo/artifacts` | 175 | - |
| `i-agora-codigo/i-agora-codigo/assets` | 7 | - |
| `i-agora-codigo/i-agora-codigo/attached_assets` | 1 | - |
| `i-agora-codigo/i-agora-codigo/docs` | 36 | docs |
| `i-agora-codigo/i-agora-codigo/lib` | 20 | codigo |
| `i-agora-codigo/i-agora-codigo/scripts` | 4 | config |
| `relatorios` | 13 | relatorios |
| `relatorios/skills` | 13 | - |
| `src` | 14 | codigo, entrada |
| `src/components` | 8 | componentes |
| `src/components/screens` | 4 | telas |
| `src/data` | 1 | codigo, dados |
| `src/services` | 1 | servicos |
| `src/types` | 1 | tipos |

Ignorados presentes no disco: `.claude` (.gitignore:17), `.secrets` (.gitignore:14), `.venv` (.gitignore:3), `desafio-itau-batalha-de-agentes-time2` (.gitignore:2), `dist` (.gitignore:5), `handoff-2026-09-27T0418.local.md` (.gitignore:16), `i-agora-codigo/i-agora-codigo/artifacts/api-server/.tsbuildinfo` (i-agora-codigo/i-agora-codigo/.gitignore:7), `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/.tsbuildinfo` (i-agora-codigo/i-agora-codigo/.gitignore:7), `node_modules` (.gitignore:1), `secrets.contrato.local.md` (.gitignore:16).

## Stack minima (so para interpretar padroes)

- express ^5.2.1 — `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:18`
- react catalog: — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json:61`
- react-dom catalog: — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json:63`
- tailwindcss catalog: — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json:70`
- vite catalog: — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json:73`
- react catalog: — `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/package.json:59`
- react-dom catalog: — `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/package.json:61`
- tailwindcss catalog: — `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/package.json:67`
- vite catalog: — `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/package.json:71`
- typescript ~5.9.3 — `i-agora-codigo/i-agora-codigo/package.json:17`
- express ^4.21.2 — `package.json:21`
- react ^19.0.1 — `package.json:18`
- react-dom ^19.0.1 — `package.json:19`
- tailwindcss ^4.3.3 — `package.json:31`
- typescript ^7.0.2 — `package.json:33`
- vite ^8.3.0 — `package.json:20`

## Padroes detectados

| id | confianca | evidencia | detalhe |
|---|---|---|---|
| arvore.papeis-de-diretorio | media | `.` `docs` `docs/archive` (+11) | {"codigo":[".","i-agora-codigo/i-agora-codigo/lib","src","src/data"],"config":[".","i-agora-codigo/i-agora-codigo","i-agora-codigo/i-agora-codigo/scripts"],"... |
| arvore.entradas | alta | `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:7` `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:9` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json:7` (+6) | {"parser_indisponivel":[]} |
| arvore.ignorados | alta | `.gitignore:1` `.gitignore:2` `.gitignore:3` (+5) | {"caminhos":[".claude/ <- .gitignore:17",".secrets <- .gitignore:14",".venv/ <- .gitignore:3","desafio-itau-batalha-de-agentes-time2/ <- .gitignore:2","dist/... |
| arvore.fronteiras-git | alta | `.gitignore:2` `desafio-itau-batalha-de-agentes-time2/.git` | {"fronteiras":["desafio-itau-batalha-de-agentes-time2 (repo-aninhado, ignorado)"]} |
| stack.manifestos | alta | `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json` `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/package.json` (+7) | {"manifestos":["i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json","i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/package.json","i-... |
| arq.react-componentes | alta | `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/App.tsx:14` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/App.tsx:17` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/App.tsx:20` (+211) | {"componentes":214,"por_pasta":{"i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src":6,"i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/... |
| arq.react-telas | alta | `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/FollowUpScreen.tsx:29` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/pages/not-found.tsx:4` `src/components/screens/LazyShimmerFrames.tsx:3` (+4) | {"telas":["FollowUpScreen","NotFound","Screen1ItauHome","Screen1Skeleton","Screen2Chat","Screen2Skeleton","Screen3Communication"]} |
| arq.ts-tipos | alta | `i-agora-codigo/i-agora-codigo/lib/api-zod/src/generated/types/healthStatus.ts:9` `src/types/index.ts:1` `src/types/index.ts:3` (+6) | {"centralizados":9,"exportados_fora":19} |
| arq.ts-servicos | media | `src/services/behavioralEngine.ts:75` `src/services/behavioralEngine.ts:131` `src/services/behavioralEngine.ts:203` | {} |
| arq.barrel-index | alta | `i-agora-codigo/i-agora-codigo/lib/api-client-react/src/index.ts:1` `i-agora-codigo/i-agora-codigo/lib/api-zod/src/generated/types/index.ts:9` `i-agora-codigo/i-agora-codigo/lib/api-zod/src/index.ts:1` (+1) | {} |
| arq.roteamento-front | alta | `src/App.tsx:23` `src/App.tsx:195` `src/App.tsx:198` (+11) | {"modo":"maquina-de-estados","tipos":["ScreenType"],"estados":["chat","communication","home"]} |
| arq.cliente-api | media | `src/components/DjangoArchitectureDrawer.tsx:60` | {"endpoints":["/api/v1/context-agent/primeira-chamada/"]} |
| arq.proxy-dev | media | `vite.config.ts:15` | {"prefixos":["/api/v1/context-agent"]} |
| arq.contratos-json-schema | alta | `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/components.json:2` `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/components.json:2` | {"ficheiros":2,"dialetos":["https://ui.shadcn.com/schema.json"]} |
| arq.contratos-openapi | media | `i-agora-codigo/i-agora-codigo/lib/api-spec/openapi.yaml:1` | {} |
| arq.contratos-exemplos | media | `docs/bcb-8/indice.json` `docs/bcb-8/resolucao-conjunta-08-2023.json` `docs/bcb-8/resolucao-conjunta-20-2026.json` (+2) | {"ficheiros":5} |
| conv.estilo-nomes-ficheiros | media | `docs/bcb-8` `i-agora-codigo` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/public/brand/i-agora.png` (+3) | {".css":{"contagem":{"kebab-case":1,"minusculo":3},"dominante":"kebab-case","fracao":1,"convencao":false},".html":{"contagem":{"minusculo":3},"dominante":nul... |
| conv.estilo-identificadores | alta | `i-agora-codigo/i-agora-codigo/artifacts/api-server/build.mjs:11` `i-agora-codigo/i-agora-codigo/artifacts/api-server/build.mjs:13` `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/App.tsx:14` (+3) | {"parser_indisponivel":[],"ts/classe":{"contagem":{"PascalCase":3},"dominante":"PascalCase","fracao":1},"ts/componente":{"contagem":{"PascalCase":214},"domin... |
| conv.idioma-identificadores | media | `i-agora-codigo/i-agora-codigo/artifacts/api-server/build.mjs:13` `i-agora-codigo/i-agora-codigo/artifacts/api-server/src/routes/health.ts:7` `src/App.tsx:29` (+1) | {"ts":{"pt":37,"en":809,"exemplos_pt":["isChaveAtiva","modeloUsado"],"exemplos_en":["buildAll","data"],"dominante":"en"},"tokens_casados":846,"metodo":"lexic... |
| conv.afixos | media | `README.md` `i-agora-codigo/i-agora-codigo/artifacts/api-server/.replit-artifact/artifact.toml` `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json` (+9) | {"afixos":[{"tipo":"nome-repetido","afixo":"package.json","grupo":".json","n":10},{"tipo":"nome-repetido","afixo":"tsconfig.json","grupo":".json","n":9},{"ti... |
| conv.pastas-datadas | alta | `docs/archive/2026-09-27` | {"formatos":{"AAAA-MM-DD":1}} |
| conv.archive-indice | baixa | `docs/archive/INDICE.md` | {"archives":["docs/archive"],"com_indice":1} |
| conv.dependencias-usadas | media | `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:13` `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:16` `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:17` (+15) | {"usadas":18,"sem_import":["@google/genai","@replit/connectors-sdk","@workspace/db","cookie-parser","dotenv","drizzle-zod","motion"],"nao_medidas":[],"notebo... |

## Ausentes (medido, nao ha)

- arq.django-projeto: 0 ficheiros Python no alvo
- arq.django-apps: 0 ficheiros Python no alvo
- arq.mvt: 0 ficheiros Python no alvo
- arq.camadas-python: 0 ficheiros Python no alvo
- arq.rotas-django: 0 ficheiros Python no alvo
- arq.api-drf: 0 ficheiros Python no alvo
- arq.migracoes: 0 ficheiros Python no alvo
- testes.python: 0 ficheiros Python no alvo
- testes.ts: 0 ficheiros *.test.* / *.spec.* / __tests__/
- arq.segredos-leitor-unico: nenhuma leitura de segredo em codigo fora de testes (AST: ambiente com nome de chave/segredo ou literal .secrets/.env)
- arq.modelos-llm-centralizados: literais de modelo em 1 modulo(s) e nenhum modulo com >= 2 constantes de modelo
- arq.banco-por-migracoes: sem migracoes versionadas
- conv.contratos-datados: 2 JSON Schema(s), nenhum dentro de pasta datada

## NAO_MEDIDO (nao se conseguiu medir — nunca e zero)

Nenhum.

## Anomalias (desvios do proprio padrao)

- **anom.componente-fora-da-pasta** (arq.react-componentes): FollowUpScreen (i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/FollowUpScreen.tsx) fora das pastas de componentes/telas — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/FollowUpScreen.tsx:29`
- **anom.componente-fora-da-pasta** (arq.react-componentes): IntroCarousel (i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/IntroCarousel.tsx) fora das pastas de componentes/telas — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/IntroCarousel.tsx:16`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): @google/genai declarada mas nunca importada no codigo parseado — `package.json:14`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): @replit/connectors-sdk declarada mas nunca importada no codigo parseado — `i-agora-codigo/i-agora-codigo/package.json:13`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): @workspace/db declarada mas nunca importada no codigo parseado — `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:14`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): cookie-parser declarada mas nunca importada no codigo parseado — `i-agora-codigo/i-agora-codigo/artifacts/api-server/package.json:15`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): dotenv declarada mas nunca importada no codigo parseado — `package.json:22`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): drizzle-zod declarada mas nunca importada no codigo parseado — `i-agora-codigo/i-agora-codigo/lib/db/package.json:16`
- **anom.dependencia-sem-import** (conv.dependencias-usadas): motion declarada mas nunca importada no codigo parseado — `package.json:23`
- **anom.estilo-nome-divergente** (conv.estilo-nomes-ficheiros): .png: convencao kebab-case (95%), 1 nome(s) fogem: image_1790491967224.png — `i-agora-codigo/i-agora-codigo/attached_assets/image_1790491967224.png`
- **anom.estilo-nome-divergente** (conv.estilo-nomes-ficheiros): .tsx: convencao kebab-case (70%), 12 nome(s) fogem: App.tsx, FollowUpScreen.tsx, IntroCarousel.tsx, App.tsx, App.tsx, AndroidFrame.tsx — `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/App.tsx`, `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/FollowUpScreen.tsx`, `i-agora-codigo/i-agora-codigo/artifacts/i-agora-prototipo/src/IntroCarousel.tsx`, `i-agora-codigo/i-agora-codigo/artifacts/mockup-sandbox/src/App.tsx`, `src/App.tsx`, `src/components/AndroidFrame.tsx`
- **anom.estilo-nome-divergente** (conv.estilo-nomes-ficheiros): pastas: convencao kebab-case (90%), 1 nome(s) fogem: attached_assets — `i-agora-codigo/i-agora-codigo/attached_assets`

---
Consumo pela `mapear-contexto-do-repositorio`: cada padrao DETECTADO e um facto com `ficheiro:linha` + sha,
na mesma forma das regras da F3; ela classifica, esta skill so detecta.
