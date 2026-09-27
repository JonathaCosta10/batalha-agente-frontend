# Handoff — front `agente-app-mobile`, sessão `agente-app-mobile-d2` (27/09, 09:04–10:20 BRT)

> Fecho da sessão depois de resolver P0 e P1 do lado do front, como o dono pediu às 10:10 (recado recebido
> via `f7`). Tudo o que está abaixo foi medido nesta sessão, salvo quando está marcado `NAO_MEDIDO`.

## 1. Onde está o código

| Ref | Estado |
|---|---|
| Branch `docs/entrega-consolidada-2026-09-27` | tem todo o trabalho desta sessão |
| `main` local | **avançada às 10:22 BRT por fast-forward para `5f4fd75`** (8 commits à frente de `origin/main`) |
| `origin` | **sem push** desde `2fe71fb`. O push só acontece com autorização explícita do dono |
| `docs/consolidacao-2026-09-27` | já contido na `main`; não há nada a juntar |

Commits desta fase, do mais antigo para o mais recente:
- `64aff8a`: validação front × back;
- `85c9f9e`, `878362a` e `93dcef1`: cobrança de identidade;
- `290b823`: edição da f7 na página de artefatos;
- o commit de P0/P1 do front descrito na §2.

Há ainda `054d662`, o guard dos artefatos, que entrou neste branch por outra sessão.

**Não commitado de propósito:**
- `agent_backend/planning/*`, `agent_backend/tests/*` e `test_session_pick.py`: são o trabalho em curso da
  sessão `backend-agente-conversacional-d9` (sorteio do `id_usuario`);
- os 4 JSON de `agent_backend/conversation/knowledge/`: só mudaram os fins de linha.

## 2. P0/P1 fechados no front

| Problema | Correção | Prova |
|---|---|---|
| "Pessoa N da base" aparecia como nome (Home, avatar, chat) | `src/services/identity.ts` com `cleanName` e `greeting`. Um alias gerado, "Cliente", vazio ou null passam a dar "Olá", avatar com ícone e o rótulo "Seu perfil". `BOT.intro`, `finish` e `fallback` sem nome | `src/services/identity.test.ts`, com prova negativa sobre 7 valores maus |
| Perfil de recurso com nome inventado ("Cliente da base") | `usePlanConversation.ts`: `nome` e `primeiroNome` vazios | mesmo teste |
| Gênero `NAO_INFORMADO` mostrado como dado | nenhum componente ativo mostra `genero` (confirmado por grep em `src/`, fora de `archive/`) | leitura de código |
| Falha do backend sem código ou ilegível | `backend.ts` `describeError`: texto legível com `(código: X)`, em que X vem de `erro_api.codigo`, de `codigo` ou de `http_<status>`. Tokens de máquina como `perfil_indisponivel` nunca aparecem sozinhos | 3 testes |
| Página HTML de erro do proxy virava "Unexpected token <" | o JSON é lido com `catch`, e a falha passa a `ApiError` com o código `http_502` | teste |
| Rede em baixo ou timeout sem código | `ApiError` com status 0 e código `rede` ou `timeout`; entra nos reintentos do perfil | teste |

Suite do front: `npm test` com 13/13; `tsc --noEmit` sem erros; `vite build` OK (10:15 BRT).
**No navegador: `NAO_MEDIDO`.** Os ajustes não foram vistos no Chrome depois da mudança.

## 3. Serviços que ficaram a correr

- Django harness em `127.0.0.1:8000`, modo demo.
- Front unificado em `127.0.0.1:3000`.

Pare-os quando já não precisar deles.

## 4. P2+ que fica em aberto (por dono)

| # | Item | Dono |
|---|---|---|
| 1 | Sortear um `id_usuario` real, fazer o load por id e não mandar nome nem gênero inventados. [Cobrança](../cobrancas/2026-09-27-identidade-do-usuario.md). **Pronto no working tree às 10:13, segundo a `d9`, sem commit:** 105 testes passam e 3 falham (as mesmas 3 de antes); `nome`, `primeiroNome` e `genero` passam a `null`, com `idUsuario` e `rotulo` novos. O front já aceita `null` (tipo `Person` nulável, mostra "Olá"); a d9 pede que o front seja publicado antes do backend ou junto. Falta: commit da d9 e decidir se o `rotulo` ("Cliente " + 8 caracteres do id) aparece na Home | backend `d9`, dono |
| 2 | `state.opening` não é produzido; a primeira bolha diz sempre "Ainda não recebi os dados…" (E1) | backend |
| 3 | `plan.period` chega cru ("2026-01"); `totals` é ignorado; o selo não aparece na UI; `mode` não distingue demo de live (E3, E4, E5, E8) | front, P2 |
| 4 | `planApi.ts` é código morto; as rotas `acompanhamento/`, `rascunho/` e `POST proposta/` não têm consumidor (E9) | front e backend |
| 5 | Em live, cada mensagem retira o caso já proposto (`planning/http.py:114`, E10) | backend |
| 6 | Conversa com Gemini em local, confirmar, replay, progresso e acompanhamento 200: `NAO_MEDIDO` (não há `GEMINI_API_KEY` nesta máquina) | quem tiver a chave |
| 7 | O texto a mostrar no lugar do nome é `NAO_DEFINIDO` (proposta: "Olá" e o código curto do `id_usuario`) | dono |
| 8 | Deploy no Cloud Run: continua `1f66e6a`; a D-8 exige o dono e o Henrique | dono |
| 9 | `personService.calculatePerson` e `NOMES_F`/`NOMES_M` continuam em `src/` (só `balanceOf`/`signedBRL` estão em uso); podem ser arquivados | front, P2 |
| 10 | 1 teste do backend (`test_prompts` espera 'PENDENTE') falha desde `a2f7f96`, e 2 falham por WinError 32 no teardown do SQLite em Windows | backend |

## 4a. Fecho às 10:25 BRT (backend `d9` + dono)

- **Commit do backend `706565c`** (d9): o `id_usuario` é sorteado uma vez por sessão e é a chave do `person`
  (`idUsuario`).
  - GET `perfil/` devolve a mesma pessoa; só `abertura` com `next:true` sorteia outra; `DELETE plano/` mantém a pessoa.
  - Se o BigQuery falhar, a resposta é `503 {"erro":"perfil_indisponivel","motivo":…,"estado":"NAO_MEDIDO"}`. O front
    mostra "<motivo> (código: …)".
  - `nome`, `primeiroNome` e `genero` vêm `null`; `rotulo` e `alias` saíram (decisão do dono às 10:17, informada pela d9).
  - Suíte às 10:21: 105 passam e 3 falham (as mesmas 3 de antes).
- **Ordem do dono às 10:18 (a esta sessão):** "eu quero o nome a partir da resposta de um id randomico". Foi
  enviada à d9 e à f7. **Fechada às 10:22 por decisão do dono, informada pela d9:** o nome gerado pode ser usado,
  desde que tenha selo.
  - Commit `e4db09c` (d9): `person.nome` e `person.primeiroNome` vêm de `planning/nomes_por_id.json` (1000 ids,
    sha256 conferido) para o `id_usuario` sorteado.
  - O campo novo `person.nomeSelo` tem natureza `nome_gerado`; `genero` continua `null`.
  - Suíte: 105 passam e 3 falham (as mesmas 3 de antes).
  - O front mostra `primeiroNome` sem mudar código. O `nomeSelo` ainda não aparece na UI (P2).
- O dono pediu que o backend concentre o trabalho numa só sessão e faça o seu próprio handoff.
- **Push autorizado pelo dono às 10:18.** `main` e `docs/entrega-consolidada-2026-09-27` foram publicados.

## 5. Documentos para retomar

- [README](../../README.md) §1 e §10: estado e pendências.
- [Validação front × back](../validacao-front-back.md) e o script `scripts/validar_contrato_local.py`.
- [Cobrança de identidade](../cobrancas/2026-09-27-identidade-do-usuario.md).
- Caderno partilhado do i-agora: https://claude.ai/artifact/2gTPmFUE2P46XjApBs9hXU. É privado; tem de ser partilhado
  com acesso Contributor para o time escrever.
- Página de artefatos e guard: `docs/artefatos/README.md`, `tests/test_artefatos_padrao.py`.

## 6. Git, por decidir

A `main` local foi recusada às 10:12 pelo classificador; às 10:22, com o "pode fazer agora" do dono, avançou por fast-forward. O comando usado foi
este (falha se a `main` tiver mudado):

```
git -C "C:/Users/ACER/Desktop/hackton-1-itau/agente-app-mobile" push . HEAD:main
```

O push para o `origin` está pendente de autorização explícita do dono.
