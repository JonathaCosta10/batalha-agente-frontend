# Arquivo do código

Nada se exclui: o que sai de uso vem para `archive/<AAAA-MM-DD>/`, com uma linha aqui.

| Origem | Destino | Motivo | Referência |
| --- | --- | --- | --- |
| `src/` (front legado: chat mínimo `App.tsx` + 3 telas sintéticas `DemoApp.tsx`) | `2026-09-27/src-front-legado/` | O front publicado (`mobile-front-agente`, branch `feat/i-agora-gcp-integrado`, `de7ff9d`) passou a ser o `src/` deste repositório; o legado não era o layout no ar | Consolidação de 2026-09-27 09:30 BRT, [docs/interface/README.md](../docs/interface/README.md) |
| `src/` e `vite.config.ts` (`de7ff9d` + `5f4fd75`) | `front-legado/` | O front `47ee715` (`1f66e6a` no ar + timer + erro de abertura) passou a ser o `src/`, importado com a história (merge de subárvore) | 2026-09-27 10:50 BRT, [front-legado/README.md](front-legado/README.md) |
| `index.html` do front legado | `2026-09-27/index-front-legado.html` | Substituído pelo `index.html` do front publicado | Idem |
