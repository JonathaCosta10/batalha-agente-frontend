# Handoff — i.agora / batalha-agentes (2026-09-27)

Documento de passagem. Diz onde está cada coisa, o que está feito, o que falta e de quem depende cada passo.
Números com selo (valor · fonte · data); o que não foi medido diz NAO_MEDIDO.

## 1. Onde está cada coisa

| O quê | Onde | Estado |
|---|---|---|
| Repo oficial da entrega | `JonathaCosta10/agente-app-mobile` | `main` 04357b9 (PR#3) |
| Backend no ar | PR#4 (91f9344, Henrique), aberto | byte-igual à imagem da revisão viva |
| Front | **`src/` deste repositório**, branch `feat/front-consolidado-2026-09-27` (só local, push por autorizar): `47ee715` importado com a história | no ar continua o `1f66e6a` (revisão `i-agora-00006-22d`) até novo deploy |
| Serviço | Cloud Run `i-agora`, us-central1, revisão `i-agora-00006-22d` 100% | deploy só com dono + Henrique (D-8) |
| Docs desta entrega | branch `docs/entrega-consolidada-2026-09-27` | ver §3 |
| Páginas públicas A e B | claude.ai/artifact/98dNfUXcSrCzcudqDwpTcX (A v13) · claude.ai/artifact/Su18p6bHUYKcGKgfSvd4Qz (B v14) | mesmo ficheiro; fonte em `docs/artefatos/paginas/` |
| `mobile-front-agente` | todos os branches (`main`, `feat/i-agora-gcp-integrado` do Henrique, `feat/timer-primeira-consulta`) | **arquivado por inteiro**; histórico |
| Front anterior deste repo | `archive/front-legado/` (`de7ff9d` + `5f4fd75`) | arquivado |
| Docs do backend -32 | `docs/backend-32/` (cópia datada; fonte fora de git) | leitura |
| Limitações do protótipo | [LIMITACOES.md](LIMITACOES.md) | resumo no "i" do app |

## 2. Documentos de referência (neste repo)

- `docs/conclusao-da-entrega.md` — feito / falta / secções futuras; catálogo de 41 parâmetros funcionais de comportamento (4 nunca ajustáveis).
- `docs/fluxo-de-merge.md` — citado aqui, mas **não existe em nenhum branch** (NAO_ENCONTRADO a 27/09 10:54 BRT); o passo 6 (front para `src/`, legado para `archive/`) foi feito pela descrição do pedido.
- `docs/ambientes/` — 19 variáveis de ambiente, provedores em CI/CD e Docker.
- `docs/regras-de-negocio/` — comportamentos manipuláveis, perfil e registo da sessão.
- `docs/artefatos/` — template como verdade + guard `tests/test_artefatos_padrao.py` (13/13 OK, 2026-09-27 10:15 BRT).
- Backend: [backend-32/rota-integrada-batalha-agentes-backend.md](backend-32/rota-integrada-batalha-agentes-backend.md) e [backend-32/contrato-api-frontend.md](backend-32/contrato-api-frontend.md) §5.2–5.5 (cópia datada do -32, ainda fora de git).
- [LIMITACOES.md](LIMITACOES.md) — limitações declaradas, P2+ (§6) e o que não foi medido.

## 3. Branches publicados (push autorizado pelo dono a 2026-09-27 10:19 BRT)

| Repo | Branch | Commits |
|---|---|---|
| agente-app-mobile | `docs/entrega-consolidada-2026-09-27` | c0a71c7, c7477fc, 054d662, 10b6eb3 + este handoff |
| mobile-front-agente | `main` | até ba9af91 (rodapé honesto sobre dados) |
| mobile-front-agente | `feat/timer-primeira-consulta` | 51bec4b (timer) + 47ee715 (erro de abertura, ver §4) — **histórico**: importado para `src/` |
| mobile-front-agente | `feat/i-agora-gcp-integrado` (Henrique) | 1f66e6a no ar, de7ff9d — **histórico** |
| agente-app-mobile | `feat/front-consolidado-2026-09-27` | **só local, push NÃO autorizado**: front em `src/`, docs consolidadas |

Nenhum destes branches foi integrado em `main` do repo oficial nem publicado no Cloud Run. Desde 27/09 10:54 BRT o front vive
em `src/` deste repositório; o `mobile-front-agente` fica arquivado por inteiro.

Nota: a cópia de trabalho de `agente-app-mobile` tem edições não commitadas de outra sessão
(`agent_backend/planning/*`, testes, `test_session_pick.py` — sorteio de cliente). Não são deste handoff; não fazer stage delas.

## 4. Último pedido: apresentação do erro de abertura

Antes: quando o perfil não chegava, o front injetava como **fala do bot** o texto
"Ainda não recebi os dados para apontar um ajuste com segurança…" (`src/services/backend.ts:4`, usado em
`usePlanConversation.ts:25`). Parecia resposta do agente e o chat ficava aberto sem dados.

Correção no branch `feat/timer-primeira-consulta`: estado de erro distinto (não é mensagem do bot), botão
"Tentar de novo", chat bloqueado até haver perfil; mapeador central `erro_api.acao_cliente → estado de tela`
(`reiniciar_sessao`, `nao_repetir`, `enviar_como_nova`, `aguardar` com contagem); nunca "Failed to fetch" nem tela vazia;
identidade neutra ("Olá" + código curto, texto final NAO_DEFINIDO pelo dono) no lugar de "Pessoa N da base".
Resultado de testes/lint/build: ver §7.

## 5. O que falta — por ordem e dono

1. **Henrique** põe em git o que só está local (backend -32: 128 ficheiros fora de git).
2. **Dono** abre PR de `feat/timer-primeira-consulta` e de `docs/entrega-consolidada-2026-09-27`; publicar o front
   antes ou junto do backend com o contrato novo do `person` (P0: nunca saudação vazia nem "null").
3. **Dono + Henrique** fazem merge do PR#4 em `main`.
4. **Dono** decide o I7: em que repo entram as rotas da -32 (recomendação: `agente-app-mobile`).
5. **Front**: ~~importar o front para `agente-app-mobile`~~ (feito, `feat/front-consolidado-2026-09-27`); F1/F2; migrar `chat()` para `conversas/interacao/` (D-3, depende do I7); tratar os estados de `contrato` hoje ignorados.
6. **Dono** fixa o texto da saudação neutra.
7. Deploy por digest — só dono + Henrique (D-8).

## 6. P2+ reportado ao dono (não fechado nesta entrega)

- Histórico perdido no recarregar; F5 em Acompanhe volta à abertura; botão Voltar do navegador sai da app.
- "Testar próximo perfil" escondido sob a navegação; Escape não fecha sheets; reset sem confirmação e sem indicador.
- Input sem limite de tamanho.
- Resposta do modelo que terminou em hindi e esquecimento do objetivo após "Ajustar valores" — lado do backend/prompt.
- Plano guardado em GCS sem expiração (51 objetos, medido 2026-09-27).

## 7. Validação desta passagem

- Guard do template: 13/13 OK (unittest, 2026-09-27 10:15 BRT).
- Correção do erro de abertura: commit 47ee715 em `feat/timer-primeira-consulta` (`mobile-front-agente`).
  Testes 25/25 (`node --import tsx --test`), lint `tsc --noEmit` OK, build OK (relatado pelo agente) — 2026-09-27 10:22 BRT.
  Mapeador único `src/services/errorScreen.ts` (`telaDeErro`); nenhum erro entra no histórico do chat.
  Aceita o contrato novo do `person` do backend (d9, ainda sem commit): `nome/primeiroNome/genero` a `null`,
  `idUsuario` + `rotulo` ("Cliente " + 8 caracteres do id), `perfil/` 503 `perfil_indisponivel` → erro legível com
  "Tentar de novo". Compatível com o formato antigo, por isso o front pode ser publicado antes do backend.
  Prints: `erro-abertura-*.png` (12) no scratchpad da sessão; script Playwright `09-erro-abertura.mjs`.
- Consolidação do front (27/09 10:54 BRT), branch `feat/front-consolidado-2026-09-27`: `npm ci` OK; `tsc --noEmit` OK;
  `npm run build` OK; `npm test` 34/34; guard 13/13; `pytest agent_backend/tests` 106 passam, 2 falham (WinError 32,
  conhecidas); `docker build` NAO_MEDIDO (sem Docker). Protótipo ponta a ponta em `:8011`/`:3011`: ver
  [LIMITACOES.md](LIMITACOES.md) e o README §5.

