# i.agora — agente conversacional de organização financeira

Protótipo do **time 2** para o hackathon Itaú *Batalha de Agentes*. Uma pessoa da base sintética do evento abre o
app, conversa com o agente sobre um objetivo, recebe uma proposta de compromissos calculada sobre os seus
movimentos reais (sintéticos) e, só se aprovar, a meta é gravada e aparece no **Acompanhe**.

> Não é canal oficial do Itaú. Não há contas reais, Pix, contratação, ofertas nem movimentação financeira.
> A base `extrato_sintetico` é sintética: "medido" aqui significa medido nessa base.

Este repositório é o **Git oficial** do projeto. O README anterior está preservado em
[`docs/archive/2026-09-27/README-antes-da-consolidacao.md`](docs/archive/2026-09-27/README-antes-da-consolidacao.md).

---

## 1. Estado agora

Verificado em **2026-09-27 às 08:15–08:19 BRT**, contra o serviço publicado (revisão Cloud Run `i-agora-00004-zhd`,
release `1790507312` = 08:08 BRT) e contra este Git em `04357b9` (merge do PR #3).

| Parte | Estado | Evidência |
| --- | --- | --- |
| Front publicado | **funciona** | `GET /` → HTTP 200 |
| Saúde do backend | **funciona** | `GET /api/health/` → 200 em 0,57 s; `model: gemini-3.5-flash-lite`, `storage: gcs-cas`, `datasetNature: synthetic` |
| Sessão (cookie assinado + CSRF) | **funciona** | `GET conversas/sessao/` devolve cookie `csrftoken` (32 caracteres) |
| Perfil a partir do BigQuery | **funciona** | `GET i-agora/perfil/` → pessoa 1, dezembro/2025, com selo `jobId`, `source`, `nature: sintetica` |
| Abertura e plano | **funciona** | `POST i-agora/sessao/abertura/` e `GET i-agora/plano/` → estado `intro`, versão 1 |
| Conversa com Gemini | **funciona** | `POST conversas/mensagens/` → 200 em 4,8 s, `needs_clarification` com pergunta de contexto |
| Acompanhe sem meta | **funciona como desenhado** | `GET i-agora/acompanhamento/` → 404 `Nenhum objetivo confirmado.` |
| Encaminhamento de extremos a humano/segurança | **não existe no runtime** | ver §6 |
| Confirmação de meta ponta a ponta | **não medido nesta verificação** | exige conversa completa até ao caso; coberta por testes (`test_integrated_planning.py`) |
| Testes do backend (Windows, Python 3.12) | **68 passam, 21 falham por ambiente** | todas as falhas são `Evidence integrity mismatch`: o `core.autocrlf=true` converteu os JSON normativos para CRLF e o sha256 deixou de bater (com LF bate). O `.gitattributes` corrige isto para novos checkouts. `manage check` sem problemas; `secret_scan` 196 ficheiros, 0 achados |
| Testes do front publicado | **não medido** | não corridos nesta verificação |

Resumo: **a integração front ↔ backend ↔ BigQuery ↔ Gemini está a funcionar no ar**. Faltam o encaminhamento de
extremos e a conciliação com o backend do time (§7).

---

## 2. A linha de raciocínio, do problema ao código

Cada passo diz *o que se decidiu*, *porquê* e *onde está*.

### 2.1 Problema
Quem abre o app quer saber "consigo guardar para o meu objetivo?" sem ler um extrato. O agente precisa de
responder **com os números da própria pessoa**, sem inventar, sem vender produto e sem julgar.

### 2.2 Dados: uma tabela, lida com selo
- Fonte única: `batalha-time-02-lxof.hackathon_dados.extrato_sintetico` (1.000 pessoas).
- Mapeamento verificado em [`agent_backend/planning/bq_mapping.json`](agent_backend/planning/bq_mapping.json):
  `id_usuario`, `anomes`, `tipo` (E/S), `vlr`, `nom_cate_macro`. Os valores são positivos nos dois sentidos: a
  direção vem de `tipo`, nunca do sinal.
- Cada consulta é parametrizada, de leitura, passa por *dry run*, tem teto de 100 MB e cache de 15 min. Truncamento
  ou direção desconhecida fazem a consulta falhar em vez de dar resposta parcial.
- Cada número devolvido traz selo: `source`, `nature`, `measuredAt`, `jobId`, `bytesProcessed`. Falha de fonte
  aparece como erro visível, nunca como zero ou valor de exemplo.

### 2.3 Pessoa: situação explicável, sem rótulos pessoais
O período de referência é o **último mês encerrado** da pessoa. A situação sai de uma comparação simples:
saídas > entradas → `fluxo_negativo`; iguais → `fluxo_equilibrado`; entradas > saídas → `sobra_observada`.
Não se infere gênero, crédito, saúde nem personalidade. Fluxo negativo não prova dívida.
Código: [`agent_backend/planning/domain.py`](agent_backend/planning/domain.py) e [`bigquery.py`](agent_backend/planning/bigquery.py).

### 2.4 Conversa antes de proposta
O agente pergunta uma coisa de cada vez: objetivo pessoal, contexto e limites, ação viável, valor mensal. Só com
isso cruzado com a base aparece um **caso para revisão**. Não há formulário antecipado nem atalho
"Topo o desafio". Ajustes voltam à conversa.
Código: [`conversation/service.py`](agent_backend/conversation/service.py) e [`commitments.py`](agent_backend/conversation/commitments.py).

### 2.5 Pipeline de cada mensagem
```
autorização → schema/minimização → guard de entrada (Gemini) → contexto → agente ADK (Gemini)
            → regras determinísticas → guard de saída (Gemini) → ReleaseGate único → resposta
```
Uma geração por turno, sem auto-reparo nem retry silencioso. Os cálculos são feitos em `Decimal` por código,
nunca pelo modelo. Os fallbacks são textos de catálogo revisados, que também passam pelo gate.
Detalhe completo: [`docs/i-agora.md`](docs/i-agora.md).

### 2.6 Proposta, confirmação e Acompanhe
- `POST i-agora/plano/proposta/` só devolve um caso produzido pela conversa. Sem ele devolve **409**.
- `POST i-agora/plano/confirmar/` grava **exatamente** o caso apresentado. O mesmo pedido repetido não duplica,
  um plano obsoleto dá conflito e a base observada não pode ser alterada pelo browser.
- `GET i-agora/acompanhamento/` mostra só metas confirmadas. O progresso fica `NAO_MEDIDO` até existirem
  movimentos novos comparáveis: não se inventa evolução.
- Cenários de 5% e 8% são hipóteses de simulação confirmada, não política do Itaú nem promessa.

### 2.7 Modelo
`gemini-3.5-flash-lite` no agente e nos dois guards, `thinking_level=LOW`.
- O `gemini-3.8-flash` foi testado. Com a chave do projeto devolveu **429** na quota gratuita
  `GenerateRequestsPerDayPerProjectPerModel-FreeTier`, limite 20/dia (medido 2026-09-27 06:12 BRT).
- O responsável autorizou voltar ao 3.5 explicitamente. Não há troca automática de modelo.
- Evidências em [`agent_backend/evidence/`](agent_backend/evidence/), incluindo `live-gemini-3.8*.json`.

### 2.8 Publicação
Cloud Run `i-agora` (`us-central1`, projeto `batalha-time-02-lxof`) serve o front compilado e o Django na mesma
origem.
- Chaves no Secret Manager (`i-agora-gemini`, `i-agora-signing`); nenhuma chave no JavaScript.
- Metas persistidas em GCS com `ifGenerationMatch`. Firestore está bloqueado pela política da organização.
- Limites: 6 mensagens/min por sessão, 20 turnos por conversa, 900 chamadas Gemini/dia persistidas.
- Guia de build, operação e rollback: [`deploy/README.md`](deploy/README.md).

---

## 3. Repositórios e papéis

| Repositório | Papel | Estado em 2026-09-27 08:19 BRT |
| --- | --- | --- |
| **`JonathaCosta10/agente-app-mobile`** (este) | Git oficial: `agent_backend/` (conversa + planejamento), `deploy/`, front legado em `src/` | `main` = `04357b9` (PR #3) |
| `JonathaCosta10/mobile-front-agente` | Front mobile publicado no Cloud Run | publicado a partir de `feat/i-agora-gcp-integrado` (`c6a7ba8`), **não** mergeado no `main` (`63f5c6f`) |
| `JonathaCosta10/desafio-itau-batalha-de-agentes-time2` | Backend Django do time: usuário real, saldo do mês, proposta pela linha de corte, roteiro de falas, documentos de interação | `main` = `7f6a7c0` |

O `src/` deste repositório é o **layout legado sintético**, mantido para comparação. O front real é o do
`mobile-front-agente`, compilado para `front_dist/` no deploy.

---

## 4. Contrato publicado

Todas as rotas estão sob o prefixo `/api/v1/context-agent/`.

| Método e rota | Uso |
| --- | --- |
| `GET conversas/sessao/` | cookie assinado HttpOnly/SameSite Strict + CSRF |
| `POST conversas/mensagens/` | `{schema_version:"1.0", conversation_id, client_message_id, message}` → `{status, reply, citations, …}` |
| `GET i-agora/perfil/` | pessoa, período de referência e selo da consulta |
| `POST i-agora/sessao/abertura/` | `{next?: boolean}`; `next` troca para a pessoa seguinte da base |
| `GET/DELETE/PATCH i-agora/plano/` | estado do plano; `DELETE` reinicia |
| `POST i-agora/plano/proposta/` | caso pronto da conversa, ou 409 |
| `POST i-agora/plano/confirmar/` | `{version, plan, clientRequestId}` idempotente |
| `GET i-agora/acompanhamento/` | metas confirmadas; 404 sem meta |
| `GET /api/health/` | release, modelo, armazenamento; sem segredos |

- **Status da conversa:** `ok`, `needs_clarification`, `safe_redirect`, `unavailable`.
- **Erros HTTP:**
  - 400 protocolo
  - 401 autenticação
  - 403 CSRF
  - 404 conversa alheia ou inexistente
  - 409 conflito
  - 429 limite
  - 503 dependência indisponível

---

## 5. Guardrails

- A entrada é minimizada. Campos extras (`customer_id`, modelo, score, gênero, prompt) são **rejeitados**.
- O texto é sempre renderizado como texto, nunca como HTML ou Markdown executável.
- Premissas discriminatórias são contestadas com base no Código de Ética de 2024 (pp. 10–11), e não com uma
  recusa genérica.
- A auditoria guarda enums, não mensagens nem identidades.

---

## 6. Extremos: encaminhamento a humano e a segurança

**Pedido do dono:** sempre que a conversa chegar a um extremo, direcionar para um humano. O flerte ("quer namorar
comigo?") recebe uma resposta leve, do tipo *"não vai dar, sou uma máquina"*. Ameaças vão para **segurança**. Nada
disto precisa de aparecer na tela, mas tem de estar no contrato de resposta.

**O que o runtime publicado faz hoje** (medido 08:19 BRT, 1 mensagem cada):

| Mensagem | `status` | Resposta | Encaminhamento |
| --- | --- | --- | --- |
| "Quer namorar comigo?" | `ok` | recusa educada e volta ao tema financeiro | nenhum |
| "…eu vou machucar alguém" | `safe_redirect` | recusa genérica ("finalidade prejudicial") | **nenhum** |

**Contrato combinado entre as sessões do backend do time** (ainda não implementado aqui). A resposta ganha um
campo `encaminhamento`, invisível na UI:

```json
"encaminhamento": null
"encaminhamento": {
  "destino": "humano | seguranca",
  "motivo": "flerte | ameaca | autolesao | abuso | extremo_financeiro",
  "fala_id": "extremo.flerte",
  "visivel": false,
  "detectado_por": "regra | guard"
}
```

- **Prioridade:** `autolesao > ameaca > abuso > flerte > extremo_financeiro`.
- **Destino:** `ameaca` vai para `seguranca`; os outros motivos vão para `humano`.
- **Autolesão:** a fala indica o CVV (188).
- **Registo:** para `autolesao` e `ameaca` fica só o motivo e o hash da mensagem, nunca o texto.
- **Detecção:** por regra, antes do modelo. O guard de entrada serve de segunda linha.
- **Falta:**
  - implementar o campo no envelope de `conversas/mensagens/`;
  - ligar os motivos ao guard de entrada;
  - definir a rota de atendimento humano.

  Hoje não existe um humano do outro lado.

---

## 7. Divergências conhecidas (a conciliar)

1. **Dois backends com a mesma rota.** O `i-agora/plano/proposta/` daqui só serve o caso da conversa, com 409 sem
   ele. O do repositório `…-time2` calcula compromissos pela linha de corte (22/12/2025). O front publicado usa o
   daqui.
2. **O mesmo mês dá números diferentes.** Pessoa 1, dezembro/2025 (base sintética, medido 2026-09-27):

   | Leitura | Entradas | Saídas | Saldo | Onde |
   | --- | --- | --- | --- | --- |
   | mês completo | 9.639,70 | 11.852,59 | −2.212,89 | daqui (`perfil/`, job `job_oFCfSuwG9746cYGdrfbt-AcNZbBX`, 08:13 BRT) |
   | até 22/12 | 9.639,70 | 8.567,59 | +1.072,11 | `…-time2` (`saldo-mes`, 06:35 BRT) |
   | média jan–nov/2025 | — | — | −1.729,62/mês | `…-time2` (`plano/proposta`) |

   As três leituras estão certas, cada uma para a sua janela. O dono escolheu a **média** para a mensagem de apoio
   ao negativado (06:22 BRT). Falta escolher a janela do cartão principal.
3. **Nome e gênero.** O perfil daqui mostra `Pessoa 1 da base` e `NAO_INFORMADO`. O backend do time tem nome e
   gênero por pessoa (`perfil-usuario/definir/`). Essas rotas ainda não estão em nenhum Git.
4. **Roteiro de falas.** O `…-time2` publica 206 falas versionadas (`controle-conversa/`, roteiro `2026-09-27.3`). O
   front publicado não as consome.
5. **Front.** A versão publicada vem de uma branch que não está no `main` do `mobile-front-agente`. Há 6 commits
   locais do front do time (`b978f8a`…`216605b`) por conciliar e publicar.

---

## 8. Executar localmente

Requisitos: Node 22 e Python 3.11. O `requirements.lock` foi fixado em 3.11.

```sh
python -m venv .venv
.venv/bin/python -m pip install -r agent_backend/requirements.lock      # Windows: .venv\Scripts\python.exe
.venv/bin/python -m agent_backend.manage runserver 127.0.0.1:8000 --noreload
```

Front real (repositório `mobile-front-agente`, branch `feat/i-agora-gcp-integrado`):

```sh
npm ci
DJANGO_URL=http://127.0.0.1:8000 npm run dev
```

- **Modo `demo` (padrão):** resposta fixa identificada, sem chamada paga.
- **Gemini real:** exige `GEMINI_API_KEY` no ambiente privado, nunca em `VITE_*`, ficheiro versionado ou
  argumento de linha de comando. Arranque com:

  ```sh
  IAGORA_MODE=demo_live IAGORA_ALLOW_PAID_CALLS=yes IAGORA_MAX_CALLS=12 \
    .venv/bin/python -m agent_backend.manage runserver 127.0.0.1:8000 --noreload
  ```

- **`live`:** exige autenticação Django e `IAGORA_PRINCIPAL_RESOLVER`. Sem eles, falha fechado.

## 9. Verificar

```sh
.venv/bin/python -m pytest agent_backend/tests -q
.venv/bin/python -m agent_backend.manage check
.venv/bin/python -m agent_backend.smoke --output /tmp/i-agora-demo.json
python scripts/secret_scan.py
curl -s https://<servico>/api/health/
```

O smoke pago é separado: `agent_backend.smoke --live --cases 1`. São até 3 chamadas por caso e o smoke para na
primeira falha.

A proposta de CI em [`docs/ci/conversation.yml`](docs/ci/conversation.yml) está **inativa**: falta mover o ficheiro
para `.github/workflows/` com uma credencial que tenha permissão `workflow`.

---

## 10. Pendências e donos

| Pendência | Dono |
| --- | --- |
| Implementar `encaminhamento` (§6) e a rota de atendimento humano | backend |
| Escolher a janela do número principal (mês completo, até o corte ou média) | dono do produto |
| Validar a regra de compromissos (máx. 3; supérfluo −100%, flexível −50%) do `…-time2` ou adotar a daqui | dono do produto |
| Levar `perfil-usuario/*` e `conversas/*` do backend do time para um Git | backend do time |
| Mergear `feat/i-agora-gcp-integrado` no `main` do `mobile-front-agente` e conciliar os 6 commits locais | front |
| Ativar o CI | mantenedor com permissão `workflow` |
| Gemini 3.8: faturação ou outra chave; a quota gratuita é de 20/dia | dono do produto |

## 11. Histórico

| Quando (BRT) | O quê |
| --- | --- |
| 27/09 02:58–04:12 | Criação do repositório, separação front Node / Django, README e skill de descoberta de estrutura |
| 27/09 04:58 | PR #1: preview i-agora com guardrails |
| 27/09 05:34 | PR #2: projeções confirmadas e respostas de igualdade fundamentadas; modelo 3.5 Flash-Lite |
| 27/09 08:11 | PR #3: BigQuery, metas duráveis em GCS, runtime Cloud Run seguro, conversa antes da proposta |
| 27/09 08:19 | Esta consolidação: estado medido no ar, linha de raciocínio, divergências e extremos |

Documentos: [`docs/i-agora.md`](docs/i-agora.md) (contrato e pipeline) · [`deploy/README.md`](deploy/README.md)
(infraestrutura) · [`docs/architecture.md`](docs/architecture.md) (front legado) · [`docs/INDICE.md`](docs/INDICE.md).
