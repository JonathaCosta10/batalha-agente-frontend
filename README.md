# i.agora — frontend e agente conversacional (Time 2)

Entrega do Time 2 na **Batalha de Agentes** (Itaú, 27/09/2026). O i.agora é um protótipo de
orientação e educação financeira em linguagem simples: a pessoa vê a sua situação do mês,
carrega em **«E agora?»** e recebe uma frase de abertura fundamentada nos seus dados, seguida
de uma conversa guiada que só propõe um compromisso depois de perceber o contexto.

Este repositório tem o **front** (Vite + React + TypeScript, moldura de telemóvel) e o
**agent_backend** (Python, o agente de conversa com guards). O backend Django que sorteia a
pessoa, abre a sessão e serve o chat em produção está em
[batalha-agente-backend](https://github.com/JonathaCosta10/batalha-agente-backend).

## Resultado e classificação estimada

O time **não ficou entre os vencedores** (venceram os times 3, 5 e 11). Num estudo posterior
que aplicou o mesmo formulário aos 11 times a partir do código publicado, o Time 2 ficou em
**6.º ou 7.º lugar**, conforme a leitura:

| Leitura | Pontuação | Posição |
|---|---|---|
| 1 — sete eixos com peso igual | 29 / 35 | 6.º |
| 2 — cinco eixos, sem segurança e processo | 60,7 / 80 | 7.º |

Empatou no topo em segurança e em processo. Perdeu pontos em dados, negócio, arquitetura e
engenharia. É uma estimativa pessoal do próprio time, não o resultado oficial do evento.

### O que separou o Time 2 dos vencedores

- **Dispersão**: 5 repositórios públicos, 1 privado e dois backends que só convergiram às
  11:42 do dia da entrega. Os vencedores tinham um repositório.
- **Canal do modelo**: Gemini por chave de API, que devolveu 429 e 404 durante a demo. Os
  vencedores usaram Vertex AI global com a service account do projeto, sem chave.
- **Sem modo degradado publicado**: sem modelo, a API respondia 503. Os vencedores tinham
  um roteiro sem LLM ou uma experiência guiada com zero tokens.
- **CI escrito mas desligado**; sem tools no agente; pitch em educação financeira em vez de
  uma dor em reais tirada da base.

## Arquitetura

```
telemóvel (src/)  ──HTTP──▶  backend Django (perfil-usuario/definir, sessao, interacao)
                              │
                              ├─ agente 1: identidade e perfil (sorteia 1 de 1000 pessoas, abre sessão de 4 h)
                              └─ agente 2: conversa «i.ai» (agent_backend/ e apps/conversas)
                                   input_guard ─▶ generate ─▶ guards determinísticos ─▶ output_guard
```

- **Dois agentes**, ambos sobre Gemini: o de identidade (sorteio por `id_usuario`, nome
  gerado com selo, sessão com `X-Sessao-Id`) e o de conversa, com prompts Liquid em
  `agent_backend/conversation/prompts/` e um router por etapa (guards em `gemini-3.1-flash-lite`,
  geração em `gemini-3.5-flash-lite`, reserva em `gemini-flash-latest`; 429 passa ao seguinte).
- **O LLM não faz contas.** Saldo, projeções e valores vêm do código (`agent_backend/planning/`)
  e um guard de números e de dados pessoais corre antes do `output_guard`.
- **Dados**: extrato sintético do desafio no BigQuery (`hackathon_dados.extrato_sintetico`),
  1000 utilizadores sintéticos; nomes gerados por semente fixa, não reais.
- **Referência normativa**: Resolução Conjunta BCB/CMN n.º 8/2023 (comunicação com o cliente),
  em `agent_backend/conversation/knowledge/`.

## Como correr

Front:

```
npm install
cp .env.example .env        # DJANGO_URL, IAGORA_DEV_ORIGINS; GEMINI_API_KEY só para o modo local
npm run dev                 # http://localhost:3000
npm test                    # testes de serviços e componentes (node --test)
npm run lint                # tsc --noEmit
```

Agente de conversa (Python 3.12):

```
cd agent_backend
pip install -r requirements.lock
python manage.py test        # pytest em agent_backend/tests/
python smoke.py              # chamada de fumo ao agente
```

Sem chave do Gemini o agente responde com o roteiro de contingência e o front mostra o selo
«modelo desligado».

## Pastas

| Pasta | O que é |
|---|---|
| `src/` | front: telas home, chat, follow-up, plano; serviços `backend.ts` e `personRegistry.ts` |
| `agent_backend/` | agente de conversa: `conversation/` (gateway, guards, prompts), `planning/` (contas, BigQuery, abertura guiada), `tests/`, `evidence/` |
| `deploy/` | Dockerfile, settings e middleware do Cloud Run usados na demo (serviço já removido) |
| `archive/front-pr4-58ff86f/` | front do PR#4, rejeitado no merge final por repor versões antigas; guardado como registo |
| `i-agora-codigo/`, `docs/references/` | design system e referências visuais |
| `skills/`, `scripts/`, `tests/` | skill de integração front-back, validação ponta a ponta, guard de artefatos |
| `CREDITOS.txt` | divisão medida do trabalho por autor e o registo do PR#4 |

## Autores

- **Jonatha Costa** — front, backend Django, identidade e sessão, integração, consolidação.
- **Henrique França Carvalho Soares** — runtime Cloud Run e BigQuery, módulo de conversa do
  `agent_backend` com testes, escolha do modelo, correções de valores e perguntas proativas.

Os detalhes medidos estão em `CREDITOS.txt`. Os serviços Cloud Run da demo foram removidos
depois do evento; o que resta aqui é o código, lido e consolidado a 30/09/2026.
