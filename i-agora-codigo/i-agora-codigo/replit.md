# i.agora — protótipo

Protótipo mobile-first de uma experiência Itaú fictícia: saldo, conversa com i.ai, compromissos de janeiro e card compartilhável.

## Run & Operate

- Workflow `artifacts/i-agora-prototipo: web` — execute o protótipo no preview.
- `pnpm --filter @workspace/i-agora-prototipo run typecheck` — verifica os tipos do front-end.
- Nenhuma chave, banco de dados ou API é necessária para o protótipo.

## Stack

- React, TypeScript e Vite no workspace pnpm.
- Estado da conversa e compromissos confirmados em `localStorage`; exportação de PNG pelo Canvas do navegador.

## Where things live

- `artifacts/i-agora-prototipo/src/App.tsx` — fluxo, telas e componentes conversacionais.
- `artifacts/i-agora-prototipo/src/lib/plan.ts` — dados fictícios, regras de cálculo e roteiro editável.
- `artifacts/i-agora-prototipo/src/lib/export-card.ts` — geração do PNG 1080 × 1920 e compartilhamento/download.
- `artifacts/i-agora-prototipo/public/brand/` — cópias dos assets de marca e ícones usados no app.

## Architecture decisions

- O `.fig` enviado não continha uma tela de chat. A interface de conversa é uma interpretação compatível com os componentes da biblioteca independente, não uma reprodução fiel do chat do banco.
- O saldo de dezembro é histórico e imutável nesta demonstração; valores revisados servem somente ao planejamento fictício de janeiro.
- Confirmar o plano registra compromissos antes de compartilhar ou baixar o card; reduções de gastos e reserva não são contabilizadas como entradas distintas.

## Product

Uma experiência navegável do saldo ao planejamento por chat, confirmação de compromissos, card exportável e acompanhamento da distribuição dos valores planejados.

## User preferences

- Tudo o que aparece ao usuário deve permanecer em português do Brasil e o produto continua front-end somente enquanto não houver novo pedido.

## Gotchas

- Preserve proporções e pixels do PNG de `i.agora` fornecido pelo usuário. A biblioteca de estudo não é material oficial Itaú.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- The study-library design system extracted from Figma is documented in `docs/figma-itau-reference.md`; tokens, component inventory, screenshots, and approximate icon SVGs are linked there. It is not the official Itaú design system.
- User-provided logo references and reusable brand assets are in `assets/brand/README.md`. Use `assets/brand/i-agora.png` as the canonical user-supplied wordmark (not the old generated SVG), and reuse `assets/brand/estrelinha.svg` as an independent asset.
- A composição da tela inicial de saldo + ia.i veio da foto `attached_assets/image_1790482556341.png`: topo laranja, atalhos, conta/saldo integrados e controle flutuante discreto. Use a paleta **Claro** extraída da biblioteca para as superfícies, em vez do azul-claro visível na foto; a referência tem baixa resolução.
- A conversa segue a composição da segunda foto `attached_assets/image_1790482668885.png`: texto inicial aberto, sugestões leves, formulários compactos e campo inferior. As cores seguem a mesma paleta **Claro**, sem degradês; áudio e gráfico na foto não ampliam o escopo funcional.
