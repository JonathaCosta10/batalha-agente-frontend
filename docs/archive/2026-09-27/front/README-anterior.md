# agente-app-mobile — App demo Itaú & backend Django

Demo da **Batalha de Agentes Itaú (Time 2)**: um app bancário simulado (moldura Android) em três telas, com uma conversa pré-preenchida, o botão **"E agora?"** e um chat com o "Especialista Itaú". O backend Django guarda o motor de contextualização por cliente e o agente de IA (Google Gemini).

A solução tem **dois repositórios Git**:

| Pasta | Conteúdo | Git |
| :--- | :--- | :--- |
| raiz (`./`) | Front Vite + React 19 + TypeScript + Tailwind 4 | este repositório |
| `desafio-itau-batalha-de-agentes-time2/` | Backend Django 4.2+ + DRF | Git próprio, ignorado por este |

Para correr os dois juntos, mantenha a pasta do Django dentro da raiz, como abaixo.

---

## 1. Estrutura

```
./
├─ index.html, vite.config.ts        entrada Vite; proxy /api/v1/context-agent → 127.0.0.1:8000
├─ .secrets.example                  modelo do .secrets (chave do agente, só o Django lê)
├─ src/
│  ├─ App.tsx                        máquina de estados das telas (home | chat | communication)
│  ├─ components/
│  │  ├─ screens/                    Screen1ItauHome, Screen2Chat, Screen3Communication, LazyShimmerFrames
│  │  ├─ AndroidFrame.tsx            moldura telefone/web
│  │  ├─ CustomerSelectorBar.tsx     troca de cliente, atalhos de tela, "Duas Dinâmicas"
│  │  └─ DjangoArchitectureDrawer.tsx inspetor do backend + chamada real ao Gemini
│  ├─ data/mockCustomers.ts          1.000 clientes determinísticos (derivados do ID)
│  ├─ services/behavioralEngine.ts   texto da Variável 1, contexto e ranking (lado cliente)
│  └─ types/index.ts
└─ desafio-itau-batalha-de-agentes-time2/
   ├─ manage.py, requirements.txt, init_database.py (popula o SQLite)
   ├─ desafio_itau/                  settings, urls, wsgi/asgi, segredos.py (leitura do .secrets)
   ├─ apps/recomendacao/             clientes, Variável 1, "E agora?", Template 3, chave ON/OFF
   ├─ apps/context_agent_datadriven/ agente: primeira chamada, roteador YAML, negociação de modelo, evals
   ├─ templates/recommendations/     fluxo HTML servido pelo Django
   ├─ docs/                          arquitetura, fluxos, score, templates, contratos JSON Schema
   ├─ notebooks/                     regras_batalha_agentes.ipynb
   └─ tests/                         unittest (primeira chamada + leitura do .secrets)
```

---

## 2. Como executar

Pré-requisitos: Node.js e Python 3.12. Dois terminais PowerShell, a partir da raiz.

**Chave do agente** — copie o modelo e cole a chave do projeto Google que tem a cota:

```powershell
Copy-Item .secrets.example .secrets
# edite .secrets:  API_KEY_SECRECT="sua-chave"
```

O Django procura a chave nesta ordem (`desafio_itau/segredos.py`): variável de ambiente `API_KEY_SECRECT` → `API_KEY_SECRECT` no `.secrets` da raiz → legado `GEMINI_API_KEY` / `GSCONSOLE_SECRET` / `GOOGLE_API_KEY`. `SECRETS_FILE` troca o caminho do arquivo. O `.secrets` está no `.gitignore` e nunca vai para o navegador.

**Terminal 1 — Django (porta 8000):**

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r desafio-itau-batalha-de-agentes-time2\requirements.txt
.venv\Scripts\python.exe desafio-itau-batalha-de-agentes-time2\manage.py runserver 8000
```

**Terminal 2 — front (porta 3000):**

```powershell
npm install
npm run dev
```

Scripts do front: `dev`, `build`, `preview`, `lint` (`tsc --noEmit`), `clean`. `DISABLE_HMR=true` desliga o hot reload.

**Conferir a chave:** `GET http://127.0.0.1:8000/api/v1/context-agent/status-harness/` mostra `status` (`CONECTADO`/`PENDENTE`), `variavel_identificada` (ex.: `.secrets:API_KEY_SECRECT`) e a chave mascarada.

---

## 3. Telas e navegação

```
Tela 1 · Home Itaú ──FAB estrela──▶ Tela 2 · Conversa pré-preenchida ──"E agora?"──▶ Tela 3 · Especialista Itaú
        ▲                                   │ voltar                                     │ voltar → Tela 2
        └───────────────────────────────────┴────────────────────────────────────────────┘ "Início" → Tela 1
```

- A navegação é um `useState` em `src/App.tsx` (sem router); toda troca dispara um *skeleton* de 600 ms.
- A **chave ON/OFF** da Tela 2 escolhe o texto `TEXTO_1[NEUTRO]` (ON) ou `TEXTO_2[MASCULINO]`/`TEXTO_3[FEMININO]` (OFF, pela paridade do ID).
- O inspetor Django (botão na barra superior) tem a aba **Context_agent_datadriven**: escreva o texto inicial e clique **Chamar Gemini**.

Etapas, estados e o diagrama completo: [`desafio-itau-batalha-de-agentes-time2/docs/fluxos-de-conversacao.md`](desafio-itau-batalha-de-agentes-time2/docs/fluxos-de-conversacao.md).

---

## 4. Endpoints principais

| Método | Rota | Usada pelo front |
| :--- | :--- | :--- |
| `POST` | `/api/v1/context-agent/primeira-chamada/` — `{texto_inicial}` → `{sucesso, modelo, resposta}` ou `{erro}` | **sim** (inspetor) |
| `POST` | `/api/v1/context-agent/enviar-mensagem/` — conversa contextualizada com sessão e eval | não |
| `GET` | `/api/v1/context-agent/status-harness/` — auditoria do agente e da chave | não |
| `GET` | `/api/v1/chat/variavel-1/<id>/`, `/api/v1/comunicacao/e-agora/<id>/`, `/api/v1/contexto-score/<id>/` | não |
| `GET` | `/app/` → `/app/chat/<id>/` → `/app/comunicacao/<id>/` — mesmo fluxo em HTML do Django | — |

Tabela completa: [`docs/architecture.md`](desafio-itau-batalha-de-agentes-time2/docs/architecture.md). O proxy do Vite só encaminha `/api/v1/context-agent`.

---

## 5. Contratos

JSON Schema (draft 2020-12) em `desafio-itau-batalha-de-agentes-time2/docs/inteirações-cloud/27-09-2026/`: pares `padrao-envio.json` / `padrao-retorno.json` por endpoint e, em `knowledge/`, a forma da base de conhecimento do agente (rotas YAML, tese, métricas de eval). Índice: `INDICE.md` na mesma pasta.

---

## 6. Testes

```powershell
cd desafio-itau-batalha-de-agentes-time2
$env:PYTHONPATH = '.'
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Cobrem a primeira chamada (só o texto inicial vai ao Gemini) e a leitura da chave: `.secrets`, precedência do ambiente e a prova negativa (arquivo sem chave → nenhuma chamada à Google).

---

## 7. Limitações conhecidas

- A Tela 3 responde **no navegador** (palavras-chave + score, 650 ms); não chama `enviar-mensagem`.
- Texto da Tela 2, perfil do cliente e chave ON/OFF também são calculados no front; as APIs equivalentes do Django não são consumidas.
- `calculateAgentContext` e `generateTemplate3Response` (`src/services/behavioralEngine.ts`) não são usados por nenhuma tela; a planilha do Template 3 só aparece no HTML do Django.
- `.env.example` (herdado do AI Studio) não é lido pelo front; a chave vive só no `.secrets`.
- `enviar-mensagem` devolve um texto de contingência com `sucesso: true` quando todos os modelos falham.
