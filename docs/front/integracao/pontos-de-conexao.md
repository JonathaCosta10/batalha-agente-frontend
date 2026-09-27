# Pontos de conexão com o backend

Cada linha abaixo é um lugar **único** do código onde hoje a resposta é local e onde a chamada ao backend
vai entrar. Os componentes não mudam: a troca acontece em `services/` (a chamada) e em `hooks/` (a reação).
Shapes JSON/TS, erros e decisões: [contrato-api-i-agora.md](contrato-api-i-agora.md). Rotas marcadas
**proposta** ainda não existem no backend.

Base: `/api/v1/context-agent/` via proxy do Vite (`vite.config.ts`) → `DJANGO_URL` ou `http://127.0.0.1:8000`.
Hoje o Django local está na **8001** (a 8000 é de outro projeto): `DJANGO_URL=http://127.0.0.1:8001 npm run dev`.

| # | Momento na tela | Ponto no código (hoje local) | Chamada | Estado |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Abrir a conversa a partir do início | `App.tsx` `startChat` → `services/personService.ts` `calculatePerson` + `services/personRegistry.ts` `registerOpening` | `POST perfil-usuario/definir/` `{"usuario":"<indice>"}` → `{sessao_id, usuario:{codigo, pessoa, genero, indice}}` (índice 1 = Maria, `00108ccd-…`; nomes/gênero do CSV do backend substituem `people.ts`). Depois `POST perfil-usuario/pergunta/` `{sessao_id, pergunta}`; **404 = sessão expirou → chamar `definir/` de novo** | **existe** (backend-32, aviso de 2026-09-27); `i-agora/sessao/abertura/` (§3.10) fica como alternativa |
| 2 | Tela inicial (nome, saldo, entradas, saídas) | `Saved.person` + `personService.balanceOf` | `GET i-agora/perfil/` | proposta (§3.2) |
| 3 | Recarregar a página / retomar | `services/storageService.ts` `safeLoad` / `persist` | `GET i-agora/plano/` (servidor como verdade, localStorage como cache — D5) | proposta (§3.3) |
| 4 | Convite 50-30-20 | `hooks/usePlanConversation.ts` `enterAgora` (texto fixo `data/conversation.ts`) | `i-agora/roteiro/` opcional (D8) | proposta (§3.9) |
| 5 | "Topo o desafio" → compromissos | `usePlanConversation.startCommitments` + `planService.calculations/commitments` | `POST i-agora/plano/proposta/` `{ref: person.id+1}` → `compromissos[].subcategoria` (grafia de `nom_cate_micro`), `texto`, `totais.valor_liberado/reserva/falta_apos_cortes`, `selos`. Regra `corte_seguro_ate_surplus_15` (backend `docs/controle-da-conversa.md` §5a). Falha/503 → `draft.proposal = null` e o painel diz "Valores de exemplo: backend indisponível (NAO_MEDIDO)" | **ligado** (`services/planApi.ts`; testado 2026-09-27 com ref 1 = Maria via proxy → 8001) |
| 6 | "Assumir meus compromissos" | `usePlanConversation.assumeCommitments` | `POST i-agora/plano/confirmar/` com `Idempotency-Key` estável por clique | proposta (§3.5) |
| 7 | "Ajustar valores" | `usePlanConversation.adjustValues` (hoje recusa) | `PATCH i-agora/plano/` ou manter recusa (D11) | proposta (§3.6) |
| 8 | Texto livre no chat | `services/conversationService.ts` `replyTo` | `GET conversas/sessao/?sessao_id=<id>` (ou header `X-Sessao-Id`; grava cookies `csrftoken` + `conversa_sessao`; envelope 1.0 + `usuario`) → `POST conversas/mensagens/` com cookie + `X-CSRFToken`, **sem** `sessao_id` no corpo (schema estrito → 400). 404 = chamar `perfil-usuario/definir/` de novo; 503 = provedor falhou ou guard reprovou → contingência local. Respostas trazem `dados {estado: MEDIDO\|NAO_MEDIDO\|OFF, selo}`: mostrar o selo, e com `NAO_MEDIDO` nunca mostrar zero. Contrato: backend `docs/contrato-api-frontend.md` §5.2 | **existe** (backend-32, 2026-09-27 05:51 BRT, testado só no backend; CSRF via proxy do Vite sem teste ponta a ponta) |
| 9 | "Reiniciar" / "Recomeçar planejamento" | `usePlanConversation.reset` | `DELETE i-agora/plano/` | proposta (§3.7) |
| 10 | Tela "Acompanhe" | `components/follow-up/FollowUpScreen.tsx` (lê `saved.confirmed`) | `GET i-agora/acompanhamento/` (progresso: D9) | proposta (§3.8) |
| — | Card PNG | `services/exportCardService.ts` | nenhuma: continua local, não expõe valores | fica no front |
| — | Saúde do backend | — | `GET status-harness/` (existe) | existe |

## Reação padrão da tela (vale para todas as linhas)

1. **Esperando:** a bolha "digitando" (`TypingIndicator`) já existe; enquanto a chamada corre, ela fica
   visível e os botões da etapa ficam fora da tela, como hoje nos 650 ms de `TYPING_DELAY`.
2. **Sucesso:** a mensagem do bot e a etapa (`Stage`) vêm da resposta; o `Saved` é gravado como cache.
3. **Erro ou tempo esgotado** (proposta 10 s, D10): usar o texto/valor local atual como contingência,
   mostrar um aviso no `Toast` e **não** avançar etapas que gravam no servidor (confirmar, apagar).
4. **Repetição:** "Assumir meus compromissos" reenviado com a mesma `Idempotency-Key` não cria outro plano.

## Como implementar uma conexão

1. Criar a função `fetch` em `src/services/` (ex.: `planApi.ts`), com o tipo de `src/types/`.
2. Trocar a chamada local no hook indicado na tabela; manter a função local como contingência.
3. Não mudar componentes; se precisar de estado novo (ex.: erro), expor pelo hook.
4. Atualizar esta tabela (coluna Estado) e o contrato.
