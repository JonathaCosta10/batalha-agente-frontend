---
name: integracao-front-back
description: Subir o backend Django na 8000 e o Vite na 3000, seguir a sequência de chamadas do front (definir, sessão, perfil, abertura, chat, plano), validar ponta a ponta e classificar 503 do chat como provedor ou determinístico.
triggers: [integracao front back, subir ambiente local, validar chat ponta a ponta, 503 no chat, definir usuario UUID, proxy vite 3000, X-Sessao-Id, conversas status]
allowed-tools: [Read, Bash]
state: candidata
version: 0.1.0
owner: repo
escopo: local
---

# Integração front ↔ back (i-agora)

Este kernel só roteia. Leia `manifest.yaml` e `routes/router.yaml`; o router escolhe UMA rota; carregue só o
que ela lista em `loads` e siga o workflow dela (PLAN, GENERATE, CRITIQUE, REPAIR, VERIFY).

Peças (2026-09-27): **um só backend**, o Django de `Nova pasta/backend` em `127.0.0.1:8000`; o front Vite em
`:3000` com proxy `/api/v1` → `DJANGO_URL` (padrão `http://127.0.0.1:8000`). O `agent_backend/` deste repo NÃO
sobe junto: seriam dois processos na `:8000`. O cliente é `src/services/backend.ts` (commit `c4a9ff3`).

Faz:

- sobe o ambiente local e confere que só um processo escuta na `:8000`;
- valida a sequência real do front com `scripts/validar_chat_ponta_a_ponta.py` (grava evidência JSON);
- classifica um 503 do chat lendo `GET conversas/status/` e julga a evidência com `tools/gate.mjs`.

Não faz, de propósito:

- decidir política de novas tentativas ou cota do Gemini: é do backend (`docs/backend-unico-2026-09-27.md` lá);
- ligar o Gemini pago sem autorização do dono, nem fazer deploy;
- inventar valores quando o perfil falha: o front entra em modo só-chat.

Invariantes:

1. `usuario` só em `definir/` e só como UUID; índice posicional dá 400 (guard `src/services/idUsuario.test.ts`).
2. `X-Sessao-Id` em todo pedido depois de `definir/`; CSRF do cookie `csrftoken` em todo POST.
3. Corpo com acento vai por Python/`fetch`, não por `curl` no Git Bash (chega fora de UTF-8 e dá 400).
4. Nada sob `.claude/` entra no Git; evidências com sessão não são versionadas.
5. `node skills/integracao-front-back/tools/gate.mjs` tem de acabar em `TUDO OK` antes de a skill mudar de estado.
