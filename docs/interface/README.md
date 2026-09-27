# Interface: layout de referência e observação visual

> **Atualização 2026-09-27 10:50 BRT:** o `src/` deste repositório passou a ser o `47ee715` (`1f66e6a` + timer + erro de abertura); o `src/` de `de7ff9d` descrito abaixo está em `archive/front-legado/`. Os caminhos `../frontend-agent-conversacional` abaixo são históricos.

Este documento regista **qual front é o layout correto**, como o subir localmente e o que foi observado no
navegador. Só entra aqui o que foi medido; o resto está marcado `NAO_MEDIDO`.

> Observado a 2026-09-27 entre as 09:05 e as 09:13 BRT, no Chrome, com o Django harness local em modo `demo`
> (`127.0.0.1:8000`). O layout de referência é o commit `1f66e6a` do front.

## 1. Qual é o layout certo

| Origem | O que é | Uso |
|---|---|---|
| `../frontend-agent-conversacional`, branch **`feat/i-agora-gcp-integrado`** (`1f66e6a`, 08:47) | Front publicado. A revisão `i-agora-00006-22d` do Cloud Run foi compilada deste commit (correspondência inferida pelo título e pelos horários, sem comparar os bundles; ver o README desse repositório) | **Padrão de layout.** Qualquer ajuste visual toma-o como referência |
| `../frontend-agent-conversacional`, branch `main` | Mesmo repositório, arquivado; difere do branch acima em 30 ficheiros de `src/` | Não usar como referência |
| Antigo `src/` deste repositório (`App.tsx` → `Screen3Communication`; `DemoApp.tsx` → 3 telas sintéticas) | Chat mínimo e layout legado sintético | **Arquivado** a 27/09 09:30 em `archive/2026-09-27/src-front-legado/`. O `src/` passou a ser o front publicado |

**Erro de layout observado.** O `npm run dev` deste repositório abre o chat mínimo do `src/` (barra "Ambiente
de teste · i-agora" e o botão "Ver layout legado sintético"), não as telas Meu Itaú, i.ai e Acompanhe. A
causa é que o front publicado vive noutro repositório e só entra aqui já compilado, em `front_dist/`
(`deploy/Dockerfile:8`).

## 2. Subir o layout certo localmente

O `main` do repositório do front é o checkout local. Para não o alterar, o branch publicado é **extraído** para
uma pasta temporária:

```bash
git -C ../frontend-agent-conversacional archive origin/feat/i-agora-gcp-integrado | tar -x -C <pasta>
cd <pasta> && npm ci
node node_modules/vite/bin/vite.js --port=3000 --host=127.0.0.1 --strictPort
```

O Django corre deste repositório: `.venv/Scripts/python.exe -m agent_backend.manage runserver 127.0.0.1:8000 --noreload`.
O proxy do front aponta para `DJANGO_URL` (padrão `http://127.0.0.1:8000`).

**A porta do front tem de estar em `IAGORA_DEV_ORIGINS`** (padrão: `:3000`). Com outra porta, o
`POST /i-agora/sessao/abertura/` devolve **403 de CSRF**, e o chat mostra "A conversa requer autenticação e
autorização" e "Ainda não recebi os dados…". Isto foi medido às 09:12 com o front em `:3001`. Regras e exemplo em
[ambientes/variaveis-de-ambiente.md](../ambientes/variaveis-de-ambiente.md#origem-do-front--csrf-no-harness-local-2026-09-27).

## 3. O que o layout certo mostra (medido)

| Tela | Pedidos à API | Estado visual observado |
|---|---|---|
| **Meu Itaú** (Início) | `GET conversas/sessao/` 200; `GET i-agora/perfil/` 200 | Faixa "Hackathon · Base sintética do BigQuery · Dezembro / 2025"; cabeçalho laranja "Olá, …"; atalhos Pix, Pagar, Cartão virtual, Planejar janeiro; "Visão da conta" com fluxo **−R$ 2.212,89**, entradas R$ 9.639,70 e saídas R$ 11.852,59 (pessoa 1, selo `extrato_sintetico`, jobId BigQuery); botão ia.i; barra inferior |
| **Conversa i.ai** | `POST i-agora/sessao/abertura/` 201 (em `:3000`) | Cabeçalho "i.ai com …" e "Reiniciar"; "Que bom ter você aqui, …!"; carrossel de 2 cards ("O seu momento", "Por que o i.agora existe"); composer |

Os valores da Visão da conta são dados sintéticos do BigQuery com selo (fonte, `measuredAt`, `jobId`), e não
são números publicados.

## 4. Ajustes feitos a 2026-09-27 (branch `feat/i-agora-gcp-integrado`, worktree `../frontend-publicado-wt`)

| Pedido | Mudança | Prova |
|---|---|---|
| Retirar a faixa "Hackathon · Base sintética do BigQuery · …" | Removida de `src/App.tsx` | No navegador, o texto não aparece em nenhum estado |
| Carregamento do perfil com espera personalizada e completo | `usePlanConversation.ts` ganhou `PROFILE_LOADING` com `minVisibleMs` 800, `slowAfterMs` 4000 e `retryDelaysMs` [1500, 3000]. O perfil só é aplicado se `isCompleteProfile` passar; 5xx, falhas de rede e payload incompleto são repetidos; 4xx não. A abertura do chat espera o carregamento em vez de colidir com a guarda `busy`. O `ProfileLoader`, esqueleto com a forma da Home, mostra "Carregando seu perfil…" e, depois de 4 s, "Consultando a base de dados…" (`prefers-reduced-motion` respeitado) | `src/services/loading.test.ts` (inclui casos negativos); no navegador, esqueleto e depois a Home completa |
| Botão de refresh só quando a autenticação falha | "Atualizar" (`data-testid=button-refresh-auth`) só aparece com 401/403. Os outros erros mostram a mensagem sem botão, depois das tentativas automáticas | 401 simulado na abertura → botão → clique → esqueleto → Home sem alerta |

## 5. Pontos visuais ainda em aberto (observados, não corrigidos)

1. **Primeiro pedido lento.** O primeiro `GET i-agora/perfil/` levou **10,2 s**, porque vai ao BigQuery sem
   cache; os seguintes levaram 9 ms. O tempo continua o mesmo, mas agora é coberto pelo `ProfileLoader`.
2. **Nome.** O backend devolve `primeiroNome` = `"Pessoa 1 da base"`, o nome completo. O cabeçalho mostra
   "Olá, Pessoa 1 da base" e o chat mostra "Que bom ter você aqui, Pessoa 1 da base!".
3. **Mensagem de dados no chat.** Mesmo com a abertura em 201, a primeira bolha diz "Ainda não recebi os dados
   para apontar um ajuste com segurança". A causa é que o front (`backend.ts:3`, `openingReply`) lê
   `state.opening.message`, mas o backend deste repositório não produz esse campo (nenhuma ocorrência de
   `opening` em `agent_backend/planning/`). É uma lacuna de **backend**, fora do âmbito visual.
4. **Molduras.** O front ocupa uma coluna central de cerca de 280 px em janela de 1975 px, com o fundo cinza à
   volta. Isto foi observado com `devicePixelRatio` de 0,9375; o comportamento em telemóvel real é `NAO_MEDIDO`.

## 6. Layout legado (hoje em `archive/2026-09-27/src-front-legado/`), para referência

Mapeamento de código feito às 09:09. As linhas citadas são do commit `d02b9e1`.

- `App.tsx:18-21` abre direto `Screen3Communication` com `ConversationController`. O botão "Ver layout legado
  sintético" carrega `DemoApp` sob demanda (`App.tsx:6,17`).
- `DemoApp.tsx` inclui:
  - Home → chat → comunicação;
  - o seletor de cliente 1–1000;
  - o modo "Duas Dinâmicas";
  - um esqueleto de 600 ms (`DemoApp.tsx:43-48`);
  - a moldura `AndroidFrame`, de 412×840 px.
- Os tokens estão inline, sem `@theme`: laranja `#EC7000`, navy `#001E62` e fundo `#F5F6F8`. `src/index.css`
  contém só `@import "tailwindcss";`.
- `motion` está em `package.json`, mas não é importado em `src/`.
- Há props sem uso: `AndroidFrame` `onNavigateHome` e `onNavigateBack` (`:16-17`), e `Screen3Communication`
  `onNextCustomer`.
- O [architecture.md](../architecture.md) está **desatualizado**:
  - diz que `App.tsx` guarda `activeScreen` (isso está em `DemoApp.tsx`);
  - diz que a Tela 3 não faz fetch (usa `ConversationController`);
  - fala de um botão "Chamar Gemini", que não existe.
  
  Corrigi-lo fica para quem mantém esse documento.

## 7. Capturas

Não há capturas versionadas. As capturas desta observação ficaram só na máquina local e não entram no Git.
