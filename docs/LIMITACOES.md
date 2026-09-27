# Limitações do protótipo

Atualizado em 2026-09-27 10:50 BRT. O resumo aparece no app, no "i" fixo que abre a folha **Protótipo — limitações**
(`src/components/ui/PrototypeLimits.tsx`, teste `PrototypeLimits.test.ts`). Mudar lá = mudar aqui.

## 1. Declaradas na tela

1. O perfil é **sintético**, da base do evento (`batalha-time-02-lxof.hackathon_dados.extrato_sintetico`, BigQuery),
   **sorteado por sessão** (`id_usuario` guardado na sessão assinada). Não é um cliente real.
2. Lemos **entradas, saídas e categorias** de gasto em modo **só leitura**. No modo com IA (`demo_live` com
   `IAGORA_ALLOW_PAID_CALLS=yes`) o servidor envia-as ao **Gemini** (Google). No modo `demo` (padrão local) a resposta
   do chat é fixa e diz que não foi gerada por IA (medido a 27/09 10:50, `conversas/mensagens/` 200 pelo proxy do Vite).
3. **Nada é movimentado nem contratado**: nenhum Pix, pagamento, transferência ou produto.
4. **Não é recomendação de investimento.**
5. A **sessão expira**: a conversa no servidor dura 30 min (`ttl=1800`, `agent_backend/conversation/service.py:37`;
   cookie da conversa `Max-Age=1800` no harness local). O **histórico do chat não sobrevive** a recarregar a página
   (as mensagens vivem só no estado do React).
6. **Nome e gênero não são mostrados**: aparece "Olá, Cliente <8 caracteres do id>". Exceção decidida pelo dono
   (2026-09-27 10:22 BRT): o nome **gerado** para o `id_usuario` aparece quando o servidor o manda com o selo
   `nomeSelo.natureza = "nome_gerado"` (ou `nome_origem = "nome_gerado"` no -32). O gênero nunca aparece.

## 2. Problemas conhecidos (P2+, de [HANDOFF.md §6](HANDOFF.md))

- Histórico perdido no recarregar; F5 em Acompanhe volta à abertura; botão Voltar do navegador sai da app.
- "Testar próximo perfil" escondido sob a navegação; Escape não fecha sheets; reset sem confirmação e sem indicador.
- Input sem limite de tamanho.
- Resposta do modelo que terminou em hindi e esquecimento do objetivo após "Ajustar valores" (backend/prompt).
- Plano guardado em GCS sem expiração (51 objetos, medido 2026-09-27).

## 3. Achados desta consolidação (27/09 10:54 BRT)

- **Resposta fixa do modo demo.** Com `IAGORA_MODE=demo` (padrão do harness local) o backend responde ao chat com o
  texto fixo "Demonstração local: …" (`agent_backend/conversation/service.py`, `gateway is None`). O front marca essa
  bolha com o selo **"Resposta fixa de demonstração — Gemini desligado neste servidor"** (`src/services/demoReply.ts`),
  para não parecer fala do agente.
- **Rota do chat.** O `chat()` chama `conversas/mensagens/`; a decisão D-3 fixa `conversas/interacao/` como rota
  única. `interacao/` é do -32 (fora de git): exige `X-Sessao-Id` de `perfil-usuario/definir/` (também só do -32) e
  não existe no `agent_backend`. Trocar agora deixaria o chat sempre em erro com o backend deste repositório.
  **Pendente da decisão I7.** O mapeador `telaDeErro` já cobre o corpo `erro_api` dessa rota (teste `idUsuario.test.ts`).
- **Estados do `contrato`** (`INDISPONIVEL`, `DADOS_INSUFICIENTES`, `IDENTIFICACAO`, …, §5.4 do contrato do -32): o
  `agent_backend` não os devolve; o front ainda não os trata. Pendente com a rota.
- **Sessão do -32.** `GET conversas/sessao/` do -32 responde 404 "Sessão não definida" antes de
  `perfil-usuario/definir/`; o front trata 404 como `reiniciar_sessao` (teste `errorScreen.test.ts`). O front não chama
  as rotas do -32 hoje.
- **Abertura.** Resolvida pelo `dbb253e` (`agent_backend/planning/opening.py`, `guided_opening`): o clique no botão
  ia.i faz `POST i-agora/sessao/abertura/ {"origem":"fab"}` → 201 com `state.opening` a citar os valores do perfil.

## 4. Não medido

- Conversa com Gemini real no protótipo local: `NAO_MEDIDO` (modo `demo`; chamadas pagas não autorizadas pelo dono).
- `docker build` da imagem: `NAO_MEDIDO` (Docker não instalado nesta máquina, 27/09 10:54 BRT).
- Telas compromissos, card, fim e Acompanhe no navegador: `NAO_MEDIDO` nesta passagem.
- Revisão no ar depois desta consolidação: `NAO_MEDIDO` (sem deploy).
