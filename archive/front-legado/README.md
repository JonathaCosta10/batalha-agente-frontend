# Front legado (arquivado a 2026-09-27)

O que está aqui é o `src/` (e o `vite.config.ts`) que este repositório tinha antes da consolidação do front:

- base: `mobile-front-agente`, branch `feat/i-agora-gcp-integrado`, commit `de7ff9d` (Henrique), importado por cópia em `2fe71fb`;
- mais a correção local `5f4fd75` (identidade sem nada inventado, erros legíveis com código).

**Não é o front no ar.** A revisão Cloud Run `i-agora-00006-22d` serve o front `1f66e6a`. O `src/` atual deste
repositório é o `47ee715` (`feat/timer-primeira-consulta`), que é `1f66e6a` + cronômetro da primeira consulta
(`51bec4b`) + abertura ausente como estado de erro (mapeador `erro_api`). Foi importado por merge de subárvore,
com a história preservada (ver `git log -- src/`).

Nada foi apagado: arquivado para referência. Não é compilado (o `tsconfig.json` só inclui `src/`).
