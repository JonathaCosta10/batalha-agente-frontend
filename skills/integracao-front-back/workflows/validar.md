# integ.validar

1. PLAN: ambiente de pé (rota `integ.subir`). Cada mensagem do chat pode gastar chamadas pagas ao Gemini: poucas perguntas.
2. GENERATE:
   `python scripts/validar_chat_ponta_a_ponta.py --pergunta "O que eu faço com as sobras?" --saida <scratchpad>/e2e.json`
   A ordem é a do `src/services/backend.ts`: `POST perfil-usuario/definir/ {"usuario": "<UUID>"}` →
   `GET conversas/sessao/?sessao_id=` (cookies `csrftoken` + `conversa_sessao`) → `X-Sessao-Id` em todo pedido →
   `GET i-agora/perfil/` → `POST i-agora/sessao/abertura/` → `POST conversas/mensagens/` → `GET i-agora/plano/`.
3. CRITIQUE: `node skills/integracao-front-back/tools/gate.mjs --evidencia <scratchpad>/e2e.json`.
   Degradações do front a reconhecer: `definir/` 404/405 → identidade por cookie (agent_backend); chat 404 com
   sessão → reabre a sessão uma vez e reenvia como conversa nova; `i-agora/perfil` 404 → modo só-chat.
4. REPAIR: 400 em `definir/` = índice em vez de UUID; 400 com acento = corpo mandado por curl no Git Bash.
5. VERIFY: relate com `templates/relato-e2e.md`. Testes do front: `npm test` e `npm run lint` (contagens com hora).
