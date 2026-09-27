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

Após clonar este Git, clone também o backend privado como subpasta (é preciso ter acesso a ele):

```powershell
git clone https://github.com/JonathaCosta10/desafio-itau-batalha-de-agentes-time2.git
```

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
.venv\Scripts\python.exe desafio-itau-batalha-de-agentes-time2\init_database.py
.venv\Scripts\python.exe desafio-itau-batalha-de-agentes-time2\manage.py runserver 8000
```

**Terminal 2 — front (porta 3000):**

```powershell
npm install
npm run dev
```

`init_database.py` aplica `migrate` e depois popula, de forma idempotente, produtos, a chave ON e os 1.000 clientes; pode ser corrido de novo sem perder a escolha da chave. Um `db.sqlite3` anterior a 2026-09-27 (sem migrações) deve ser arquivado e recriado, porque com ele `enviar-mensagem` dá HTTP 500. As mudanças de contrato do backend estão em `desafio-itau-batalha-de-agentes-time2/docs/CHANGELOG-semantica.md`.

Scripts do front: `dev`, `build`, `preview`, `lint` (`tsc --noEmit`), `clean`. `DISABLE_HMR=true` desliga o hot reload.

**Conferir a chave:** `GET http://127.0.0.1:8000/api/v1/context-agent/status-harness/` mostra `AUSENTE` ou `CONFIGURADA` e a chave mascarada. `?validar=1` consulta a Google e informa `VALIDADA`, `INVALIDA` ou `NAO_MEDIDO`; nenhum desses estados mede a cota.

---

## 3. Telas e navegação

```
Tela 1 · Home Itaú ──FAB estrela──▶ Tela 2 · Conversa pré-preenchida ──"E agora?"──▶ Tela 3 · Especialista Itaú
        ▲                                   │ voltar                                     │ voltar → Tela 2
        └───────────────────────────────────┴────────────────────────────────────────────┘ "Início" → Tela 1
```

- A navegação é um `useState` em `src/App.tsx` (sem router); toda troca dispara um *skeleton* de 600 ms.
- A **chave ON/OFF** da Tela 2 escolhe a tag e o título `TEXTO_1[NEUTRO]` (ON) ou `TEXTO_2[MASCULINO]`/`TEXTO_3[FEMININO]` (OFF, pela paridade do ID). O corpo do texto é compartilhado pelas três variantes na implementação atual.
- O inspetor Django (botão na barra superior) tem a aba **Context_agent_datadriven**: escreva o texto inicial e clique **Chamar Gemini**.

O fluxo real do front está em [`docs/architecture.md`](docs/architecture.md). Os fluxos e contratos Django ficam no [repositório do backend](https://github.com/JonathaCosta10/desafio-itau-batalha-de-agentes-time2/tree/main/docs).

---

## 4. Endpoints principais

| Método | Rota | Usada pelo front |
| :--- | :--- | :--- |
| `POST` | `/api/v1/context-agent/primeira-chamada/` — `{texto_inicial}` → `{sucesso, modelo, resposta}` ou `{erro}` | **sim** (inspetor) |
| `POST` | `/api/v1/context-agent/enviar-mensagem/` — conversa contextualizada com sessão e eval | não |
| `GET` | `/api/v1/context-agent/status-harness/` — auditoria do agente e da chave | não |
| `GET` | `/api/v1/chat/variavel-1/<id>/`, `/api/v1/comunicacao/e-agora/<id>/`, `/api/v1/contexto-score/<id>/` | não |
| `GET` | `/app/` → `/app/chat/<id>/` → `/app/comunicacao/<id>/` — mesmo fluxo em HTML do Django | — |

Tabela completa: [arquitetura do backend](https://github.com/JonathaCosta10/desafio-itau-batalha-de-agentes-time2/blob/main/docs/architecture.md). O proxy do Vite só encaminha `/api/v1/context-agent`.

---

## 5. Contratos

JSON Schema (draft 2020-12) no [índice de contratos do backend](https://github.com/JonathaCosta10/desafio-itau-batalha-de-agentes-time2/blob/main/docs/inteira%C3%A7%C3%B5es-cloud/27-09-2026/INDICE.md): pares `padrao-envio.json` / `padrao-retorno.json` por endpoint e, em `knowledge/`, a forma da base de conhecimento do agente.

---

## 6. Testes

```powershell
cd desafio-itau-batalha-de-agentes-time2
$env:PYTHONPATH = '.'
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Cobrem a primeira chamada (só o texto inicial vai ao Gemini), a leitura da chave,
as migrações, o recorte de 1.000 IDs, a chave ON/OFF e a identificação de
contingência. As chamadas externas são simuladas nos testes.

---

## 7. Limitações conhecidas

- A Tela 3 responde **no navegador** (palavras-chave + score, 650 ms); não chama `enviar-mensagem`.
- Texto da Tela 2, perfil do cliente e chave ON/OFF também são calculados no front; as APIs equivalentes do Django não são consumidas.
- `calculateAgentContext` e `generateTemplate3Response` (`src/services/behavioralEngine.ts`) não são usados por nenhuma tela; a planilha do Template 3 só aparece no HTML do Django.
- `.env.example` (herdado do AI Studio) não é lido pelo front; a chave vive só no `.secrets`.
- `enviar-mensagem` devolve HTTP 503 com `sucesso: false`, `origem_resposta: contingencia` e texto local quando nenhum modelo responde.
