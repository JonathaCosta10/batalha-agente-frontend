# Falas e roteiro

Inventário das falas fixas do front publicado e o pedido para que o backend as entregue **como variáveis**.
Trazido do repositório arquivado `mobile-front-agente` (pasta local `frontend-agent-conversacional`,
`docs/integracao/falas-fixas.md` e `docs/integracao/pendencias.md`, commit `274f5f1`) e adaptado a esta entrega.

> **Caminhos do inventário.** A coluna "onde no front" refere-se ao `src/` do `main` arquivado de
> `mobile-front-agente` (`274f5f1`). Desde 2026-09-27 o `src/` deste repositório é o `47ee715`: os ficheiros
> são os mesmos na maioria, mas as linhas podem não coincidir (reconferir antes de usar um número de linha).

## 1. Estado do roteiro

| Fonte | Versão | Falas | Selo |
| --- | --- | --- | --- |
| Inventário do front | — | 188 | `falas-fixas.md` · repositório arquivado · 27/09 |
| `…-time2` (sessão 25), `GET /api/v1/context-agent/controle-conversa/` | `2026-09-27.3` | 206 | `main` = `7f6a7c0` · 27/09 08:19 BRT |
| `-32` (fora de git), `apps/context_agent_datadriven/conversa/roteiro.json` | `2026-09-27.4` | 211, 14 estágios, inclui `extremo.*` | cópia de trabalho · lida 27/09 |
| Runtime publicado (este repositório) | — | **não consome** roteiro; usa `FALLBACKS` (`agent_backend/conversation/service.py:21-31`) e textos montados em código | — |

Falas já registadas no backend antes do inventário: `bot.apoio_negativado`, `home.aviso_negativado`,
`bot.humano_negativado` (marcadas **JÁ REGISTRADA** nas tabelas).

**Riscos conhecidos das falas fixas** (não passam por todos os guards do modelo):
- `bot.apoio_negativado` sugere trocar dívida cara por opção mais barata; o texto do modelo é proibido de oferecer
  produto (guard `politica.produto` no `-32`). Decisão do dono.
- `extremo.flerte` tem um emoji; o modelo é proibido de usar emoji. As falas `extremo.*` estão `PROVISORIO`.
- A frase do card sobre a reserva termina em "…mais preparada" (feminino) e aparece a personas masculinas.

## 2. Pedido ao backend: falas como variáveis

`GET /api/v1/context-agent/controle-conversa/` devolve cada fala como `{id, estagio, texto, variaveis[], versao_roteiro}`
(formato completo no fim deste documento). O front só substitui `{variavel}`; a cópia local vira contingência,
registada como `NAO_MEDIDO`, nunca em silêncio. Números (`{saldo}`, `{valor_liberado}`, `{reserva}`, `{meta}`,
`{corte}`, `{falta_apos_cortes}`) vêm de rota com selo, nunca de cálculo local.

## 3. Pendências da integração (adaptado de `pendencias.md`, estado de 27/09 06:35 BRT)

| # | Pendência | Dono | Estado |
| --- | --- | --- | --- |
| A1 | Que número mostra o cartão "Visão da conta" (dezembro até 22/12: +R$ 1.072,11; média jan–nov: −R$ 1.729,62/mês; hoje valor local sem selo) | dono do produto | aberto |
| A2 | Validar a regra `corte_seguro_ate_surplus_15` (máx. 3; Nível 1 100%, Nível 2 50%) | dono do produto | ligada, não validada |
| A3 | Modelo do chat: `gemini-3.8-flash` deu 429 (20/dia grátis) | dono do produto | aberto |
| A4 | Repositório final do backend (este, `…-time2` ou `-32`) | dono do produto | aberto; rotas do `-32` fora de git |
| B1 | **Entregar todas as falas como variáveis** em `controle-conversa/` (inclui B2: frase "reserva de 15% da renda" deve vir em `apresentacao`) | backend 25 | publicado `2026-09-27.3` no `…-time2`; front não liga |
| B3 | `conversas/interacao/` e `avaliacoes/resumo/` | backend 32 | `interacao/` pronta no `-32`; `avaliacoes/resumo/` aberto |
| B4 | Rotas `perfil-usuario/*` e `conversas/*` em git | backend 32 | depende de A4 |
| C1 | Ligar `controle-conversa/` no front, mantendo a contingência local | front | espera B1 ligado |
| C2 | Ligar `perfil-usuario/definir/` e `conversas/*` (nome e gênero reais) | front | espera o dono |
| C3 | Trocar o cartão "Visão da conta" pelo saldo medido, com selo | front | espera A1 |
| C5 | Testar a contingência com o backend desligado | front | **NAO_MEDIDO** |
| C8 | Acompanhe usa texto local mesmo com proposta do backend (números diferentes do painel) | front | corrigir |
| C9 | Período `JANEIRO / 2026` fixo no PNG | front | espera B1 |
| C10 | Frase do card só no feminino | front / backend | espera B1 (variável de gênero) |
| C12 | Ligar `conversas/interacao/` às etapas: tela por `etapa`, botões de `proximas_acoes`, nunca desenhar `perfil_t3`; tratar `encaminhamento` | front | espera o dono |

Com o arquivamento do front, estas pendências passam a ser da entrega única (ver README §16).

---

## 4. Inventário das falas fixas do front

**Convenções.**
- `texto exato` é copiado do código: `\n\n` separa parágrafos e `*...*` marca ênfase (o `InviteCopy` transforma isso em `<em>`). Onde o código interpola, aparece `{variavel}`.
- **(valor local — deve vir de rota com selo)** marca texto com número calculado no front, sem medição do backend.
- Caminhos relativos a `src/`. Fora do escopo: `src/archive/` e `i-agora-codigo/`.
- `data/people.ts` (`MARIA`, `NOMES_F`, `NOMES_M`, `SOBRENOMES`) são listas de nomes sintéticos, não falas. Só entram aqui como a variável `{nome}`.

---

### 4.1 Início (home)

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `home.saudacao` | `Olá, {nome}` | nome | components/home/HomeHeader.tsx:17 | cabeçalho laranja da home |
| `home.subsaudacao` | `Organizar suas finanças pode ser tão simples quanto bater um papo. Confira por onde começar.` | — | components/home/HomeHeader.tsx:17 | abaixo da saudação |
| `home.botao_conferir` | `Conferir` | — | components/home/HomeHeader.tsx:18 | botão do cabeçalho (abre conversa) |
| `home.rotulo_conta` | `Conta pessoal` | — | data/profile.ts:1 (HomeHeader.tsx:10) | abaixo do nome, no topo |
| `home.aria_buscar` | `Buscar` | — | components/home/HomeHeader.tsx:12 | aria-label do ícone de busca |
| `home.aria_avisos` | `Informações do plano` | — | components/home/HomeHeader.tsx:13 | aria-label do sino (abre toast `toast.avisos`) |
| `home.aria_abrir_conversa` | `Abrir conversa` | — | components/home/HomeHeader.tsx:14 | aria-label do ícone de chat |
| `home.titulo_conta` | `Meu Itaú` | — | components/home/AccountHeading.tsx:6 | título da área da conta |
| `home.alt_marca_itau` | `Itaú` | — | components/home/AccountHeading.tsx:6 | alt do logo |
| `home.aria_mostrar_saldo` | `Mostrar saldo` | — | components/home/AccountHeading.tsx:7 | aria do olho, saldo oculto |
| `home.aria_ocultar_saldo` | `Ocultar saldo` | — | components/home/AccountHeading.tsx:7 | aria do olho, saldo visível |
| `home.conta_corrente` | `Conta corrente` | — | components/home/CurrentAccountLink.tsx:5 (HomeScreen.tsx:25 usa como título de folha) | link abaixo dos atalhos |
| `saldo.aria` | `Saldo do mês de dezembro de 2025` | — | components/home/BalanceCard.tsx:9 | aria-label do cartão de saldo |
| `saldo.eyebrow` | `VISÃO DA CONTA` | — | components/home/BalanceCard.tsx:10 | cartão de saldo |
| `saldo.periodo` | `Dezembro/25` | — | data/profile.ts:2 (BalanceCard.tsx:10) | pílula do cartão de saldo |
| `saldo.titulo` | `Saldo do mês` | — | components/home/BalanceCard.tsx:11 | cartão de saldo |
| `saldo.valor` | `{saldo}` (sinal real `−R$`) | saldo | components/home/BalanceCard.tsx:11 | valor principal **(valor local — deve vir de rota com selo)** |
| `saldo.entradas` | `Entradas` + `{entradas}` | entradas | components/home/BalanceCard.tsx:12 | linha do cartão **(valor local — deve vir de rota com selo)** |
| `saldo.saidas` | `Saídas` + `{saidas}` | saidas | components/home/BalanceCard.tsx:12 | linha do cartão **(valor local — deve vir de rota com selo)** |
| `saldo.oculto` | `••••••` | — | data/profile.ts:4 | valores com o olho fechado |
| `home.acompanhe` | `Acompanhe` | — | components/home/FollowCard.tsx:5 | cartão "i.agora Acompanhe", só com plano confirmado |
| `home.alt_marca_iagora` | `i.agora` | — | components/home/FollowCard.tsx:5 | alt do logo no cartão Acompanhe |
| `home.aviso_plano` | título `Um espaço para planejar` + corpo `Os valores vêm dos seus registros até agora. Você decide quais compromissos assumir para janeiro.` | — | components/home/PlanNotice.tsx:5 | aviso na home, saldo não negativo |
| `home.aviso_negativado` **JÁ REGISTRADA** | título `Este mês talvez você precise de um apoio` + corpo `Seu saldo está no negativo. Converse com a i.ai: dá para trocar juros altos por uma opção mais barata e unir suas dívidas com a ajuda de um humano.` | — | components/home/PlanNotice.tsx:4 | aviso na home quando `isNegative` |
| `home.recomecar` | `Recomeçar planejamento` | — | components/home/HomeScreen.tsx:29 | link no fim da home (abre folha de reset) |
| `home.aria_fab` | `Abrir conversa com i.ai` | — | components/home/AssistantFab.tsx:4 | aria-label do botão flutuante |
| `home.fab_selo` | `beta` | — | components/home/AssistantFab.tsx:4 | selo no botão flutuante (aria-hidden) |

### 4.2 Conversa — cabeçalho e estágio `intro`

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `chat.titulo` | `i.ai com {nome}` | nome | components/chat/ChatHeader.tsx:8 | cabeçalho do chat |
| `chat.subtitulo` | `Uma conversa para o seu momento` | — | components/chat/ChatHeader.tsx:8 | cabeçalho do chat |
| `chat.reiniciar` | `Reiniciar` | — | components/chat/ChatHeader.tsx:9 | botão do cabeçalho |
| `chat.aria_reiniciar` | `Recomeçar conversa e voltar ao início` | — | components/chat/ChatHeader.tsx:9 | aria do botão Reiniciar |
| `chat.aria_fechar` | `Fechar conversa` | — | components/chat/ChatHeader.tsx:6 | aria da seta voltar |
| `chat.divisor` | `Seu espaço de planejamento` | — | components/chat/ChatScreen.tsx:22 | topo do histórico |
| `bot.intro` | `Que bom ter você aqui, {nome}!` | nome | data/conversation.ts:9 (IntroBlock.tsx:8) | 1ª bolha, sempre |
| `bot.apoio_negativado` **JÁ REGISTRADA** | `{nome}, percebemos que {leitura}. Talvez este mês você precise de um apoio.\n\nSabia que pode estar economizando com a gente? Os juros do limite da conta e do rotativo do cartão estão entre os mais altos, e trocar essa dívida por uma opção mais barata já faz diferença.\n\n*Converse com um humano:* vamos unir suas dívidas, as daqui e as de outros lugares, e fazer do jeito que sempre foi, feito pra você.` | nome, leitura | data/conversation.ts:16 (personService.ts:41, IntroBlock.tsx:9) | 2ª bolha, só se `isNegative` |
| `bot.apoio_negativado.leitura_medida` | `nos {meses} meses completos até a linha de corte, você gastou mais do que recebeu: {saldo_mensal_medio} por mês, em média` | meses, saldo_mensal_medio | services/personService.ts:42 | preenche `{leitura}` quando `saldo-mes` respondeu (número da rota, formatado no front) |
| `bot.apoio_negativado.leitura_local` | `dezembro fechou no negativo: {saldo}` | saldo | services/personService.ts:43 | preenche `{leitura}` sem medição **(valor local — deve vir de rota com selo)** |
| `intro.card1.rotulo` | `O SEU MOMENTO` | — | data/conversation.ts:30 | carrossel, card 1 |
| `intro.card1.titulo` | `O próximo passo começa agora.` | — | data/conversation.ts:30 | carrossel, card 1 |
| `intro.card1.corpo` | `Hoje, seu dinheiro está concentrado no presente. Pequenas mudanças podem abrir espaço para imprevistos e planos futuros.` | — | data/conversation.ts:30 | carrossel, card 1 |
| `intro.card2.rotulo` | `POR QUE O I.AGORA EXISTE` | — | data/conversation.ts:31 | carrossel, card 2 |
| `intro.card2.titulo` | `Do saldo às suas escolhas.` | — | data/conversation.ts:31 | carrossel, card 2 |
| `intro.card2.corpo` | `O i.agora existe para transformar números em uma conversa simples: entender seu momento, escolher prioridades e planejar compromissos possíveis, no seu ritmo.` | — | data/conversation.ts:31 | carrossel, card 2 |
| `intro.carrossel_dica` | `Arraste para explorar` | — | components/chat/IntroCarousel.tsx:73 | abaixo do carrossel |
| `intro.aria_carrossel` | `Conheça o i.agora` | — | components/chat/IntroCarousel.tsx:35 | aria da seção |
| `intro.aria_trilho` | `Cards de apresentação. Arraste para o lado ou use as setas do teclado.` | — | components/chat/IntroCarousel.tsx:40 | aria do trilho |
| `intro.aria_slide` | `{n} de {total}` | n, total | components/chat/IntroCarousel.tsx:65 | aria de cada card |
| `intro.aria_progresso` | `Card {n} de {total}` | n, total | components/chat/IntroCarousel.tsx:74 | aria dos pontos |
| `intro.aria_ver_card` | `Ver card {n} de {total}` | n, total | components/chat/IntroCarousel.tsx:76 | aria de cada ponto |
| `intro.aria_agora` | `Começar planejamento com i.agora` | — | components/chat/stages/AgoraTrigger.tsx:5 | botão i.agora (estágio `intro`) |

### 4.3 Conversa — estágio `invite`

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `bot.convite` | `Agora vamos transformar essa oportunidade em um plano.\n\nVamos usar a regra *50-30-20* como referência para organizar seu orçamento e entender como seus gastos podem se distribuir entre necessidades, desejos e futuro.\n\nE tem mais: a partir do seu comportamento financeiro, vamos mostrar *o que os seus registros até agora dizem sobre o caminho até esse cenário* e quais escolhas podem acelerar essa mudança.\n\n*Topa o desafio de descobrir o seu caminho para uma vida financeira mais equilibrada?*` | — | data/conversation.ts:4 (usePlanConversation.ts:46, MessageItem.tsx:10) | depois do toque no botão i.agora |
| `bot.convite_anterior` | `Vamos escolher pequenas mudanças que caibam na sua rotina em janeiro?` | — | data/conversation.ts:5 (conversationService.ts:6) | só reconhece conversas salvas antigas, que são reexibidas com `bot.convite` |
| `user.topo_desafio` | `Topo o desafio` | — | data/conversation.ts:20 (StageActions.tsx:19, usePlanConversation.ts:51) | botão do estágio `invite` e bolha do usuário |

### 4.4 Conversa — estágio `confirm` (compromissos)

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `bot.confirm` | `Confira os compromissos para janeiro de 2026, calculados sobre os seus registros até agora:` | — | data/conversation.ts:7 (usePlanConversation.ts:57) | depois de "Topo o desafio" |
| `painel.eyebrow` | `JANEIRO / 2026` | — | data/profile.ts:3 (CommitmentsPanel.tsx:13, SharePreview.tsx:9, PlanSheet.tsx:30) | painel, prévia do card e folha do plano |
| `painel.titulo` | `Seus compromissos` | — | components/chat/stages/CommitmentsPanel.tsx:13 | painel `confirm` |
| `painel.resumo` | `{valor_liberado}` + `em gastos planejados a menos; {reserva} dessa disponibilidade será separada para reserva. Não são duas entradas.` | valor_liberado, reserva | components/chat/stages/CommitmentsPanel.tsx:15 | painel `confirm`. Sem proposta, os números são **(valor local — deve vir de rota com selo)** |
| `painel.corte_insuficiente` | `Ainda faltam {falta_apos_cortes} por mês para chegar à reserva de 15% da renda.` | falta_apos_cortes | components/chat/stages/CommitmentsPanel.tsx:16 | proposta com `estado=CORTE_INSUFICIENTE` |
| `painel.livre_sem_corte` | `Seus gastos já deixam folga: nenhum corte necessário.` | — | components/chat/stages/CommitmentsPanel.tsx:17 | proposta com `estado=LIVRE_SEM_CORTE` |
| `painel.aviso_proposta` | `Limites para janeiro, calculados sobre o que já foi registrado: não é previsão de janeiro. Só serão registrados se você confirmar.` | — | components/chat/stages/CommitmentsPanel.tsx:20 | com proposta do backend |
| `painel.aviso_exemplo` | `Estimativas para janeiro, não gastos já realizados. Só serão registradas se você confirmar.` | — | components/chat/stages/CommitmentsPanel.tsx:21 | sem proposta |
| `painel.selo_backend_indisponivel` | `Valores de exemplo: backend indisponível (NAO_MEDIDO).` | — | components/chat/stages/CommitmentsPanel.tsx:24 | proposta falhou (`null`) |
| `painel.selo_exemplo` | `Valores de exemplo (NAO_MEDIDO).` | — | components/chat/stages/CommitmentsPanel.tsx:24 | proposta ainda não pedida (`undefined`) |
| `compromisso.delivery` | `Limitar delivery a {meta} em janeiro.` | meta | services/planService.ts:29 | item da lista sem proposta; sempre no Acompanhe **(valor local — deve vir de rota com selo)** |
| `compromisso.shopping` | `Limitar compras por impulso a {meta} em janeiro.` | meta | services/planService.ts:30 | idem **(valor local — deve vir de rota com selo)** |
| `compromisso.other` | `Reduzir {corte} em outros gastos flexíveis em janeiro.` | corte | services/planService.ts:31 | idem **(valor local — deve vir de rota com selo)** |
| `compromisso.reserve` | `Separar {reserva} para imprevistos em janeiro.` | reserva | services/planService.ts:32 | idem **(valor local — deve vir de rota com selo)** |
| `proposta.raciocinio_renda` | `Renda média de {inflow_mensal}/mês e saldo médio de {surplus_mensal}/mês ({periodo}).` | inflow_mensal, surplus_mensal, periodo | services/planApi.ts:55 | parágrafo do painel quando a rota não manda `apresentacao.raciocinio` |
| `proposta.raciocinio_meta15` | `Para guardar 15% da renda faltam {necessario_para_surplus_15}/mês: cortamos primeiro o supérfluo, depois o flexível, até 3 compromissos.` | necessario_para_surplus_15 | services/planApi.ts:56 | idem |
| `proposta.item_raciocinio` | `Média de {gasto_atual}/mês em {lancamentos} lançamentos ({periodo}) · {regra_nivel}.` | gasto_atual, lancamentos, periodo, regra_nivel | services/planApi.ts:63 | legenda do item quando falta `compromissos[].raciocinio` |
| `proposta.item_ate_corte` | ` Em dezembro, até {dd/mm}: {ate_linha_de_corte} registrados.` | dd/mm, ate_linha_de_corte | services/planApi.ts:64 | anexado à legenda quando `ate_linha_de_corte` é número |
| `proposta.nivel1` | `Nível 1 (supérfluo): pausa total` | — | services/planApi.ts:23 | `{regra_nivel}` para nível 1 |
| `proposta.nivel2` | `Nível 2 (flexível): redução de 50%` | — | services/planApi.ts:23 | `{regra_nivel}` para nível 2 |
| `proposta.periodo_nao_medido` | `período NAO_MEDIDO` | — | services/planApi.ts:52 | `{periodo}` sem base medida (o normal é `{mes}/{ano} a {mes}/{ano}`, com os meses `jan`…`dez` de planApi.ts:18) |
| `proposta.rodape` | `Com base nos seus registros até {dd/mm/aaaa} (média de {periodo}, {meses} meses completos). O mês da linha de corte não entra na média. Regra {regra} · fonte {fonte} · medido em {medido_em}.` | dd/mm/aaaa, periodo, meses, regra, fonte, medido_em | services/planApi.ts:71-72 | selo do painel (CommitmentsPanel.tsx:23) quando falta `apresentacao.rodape` |
| `user.assumir` | `Assumir meus compromissos` | — | data/conversation.ts:20 (CommitmentsPanel.tsx:25, usePlanConversation.ts:61) | botão do painel e bolha do usuário |
| `user.ajustar` | `Ajustar valores` | — | data/conversation.ts:20 (CommitmentsPanel.tsx:26, usePlanConversation.ts:63) | botão do painel e bolha do usuário |
| `bot.adjust` | `Ainda não consigo ajustar os valores pela conversa. Você pode seguir com os compromissos apresentados.` | — | data/conversation.ts:11 | depois de "Ajustar valores" |

### 4.5 Conversa — estágio `card`

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `bot.card` | `O primeiro passo já tem nome: uma escolha sua. Preparei um card para marcar esse momento, sem mostrar seus valores pessoais.` | — | data/conversation.ts:8 (usePlanConversation.ts:61) | depois de "Assumir meus compromissos" |
| `card.titulo` | `Um novo passo merece ser lembrado.` | — | components/chat/stages/CardPanel.tsx:10 | painel `card` |
| `card.aviso` | `Este card não mostra seu saldo, sua renda nem os valores do plano.` | — | components/chat/stages/CardPanel.tsx:10 | painel `card` |
| `card.salvar` | `Salvar imagem` | — | components/chat/stages/CardPanel.tsx:12 | botão principal |
| `card.preparando` | `Preparando imagem...` | — | components/chat/stages/CardPanel.tsx:12 | botão principal durante a exportação |
| `card.baixar` | `Baixar PNG` | — | components/chat/stages/CardPanel.tsx:13 | botão secundário |
| `card.outra_frase` | `Gerar outra frase` | — | components/chat/stages/CardPanel.tsx:14 | botão secundário |
| `card.voltar_sem_salvar` | `Voltar ao início sem salvar a imagem` | — | components/chat/stages/CardPanel.tsx:15 | botão discreto |
| `card.aria_previa` | `Prévia do card: {frase} Pequenas mudanças. Mais equilíbrio. Qual vai ser seu próximo passo?` | frase | components/chat/SharePreview.tsx:8 | aria-label da prévia |
| `card.alt_itau` / `card.alt_iagora` | `Itaú` / `i.agora` | — | components/chat/SharePreview.tsx:9 | alt das marcas na prévia |

A prévia (SharePreview.tsx:9) repete `painel.eyebrow`, `card.frase.*`, `card.tagline` e `card.convite`. Esses três últimos estão na secção 9.

### 4.6 Conversa — estágio `finish`

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `user.salvar_imagem` | `Salvar imagem` | — | data/conversation.ts:20 (usePlanConversation.ts:64) | bolha do usuário depois de exportar |
| `bot.finish` | `Primeiro passo dado, {nome}! Seus compromissos de janeiro já estão organizados.` | nome | data/conversation.ts:10 | depois de exportar o card |
| `fim.titulo` | `Seu plano está pronto.` | — | components/chat/stages/FinishPanel.tsx:7 | painel `finish` |
| `fim.texto` | `Você pode acompanhar seus compromissos na página inicial e voltar a esta conversa quando quiser.` | — | components/chat/stages/FinishPanel.tsx:7 | painel `finish` |
| `fim.voltar` | `Voltar ao início` | — | components/chat/stages/FinishPanel.tsx:8 | botão do painel `finish` |

### 4.7 Texto livre e respostas

Quem escolhe a resposta é `replyTo` (services/conversationService.ts:8-13), por palavra-chave: `saldo`, depois `ajust`/`valor`, depois `humano`/`atendimento`, e em último caso o fallback.

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `bot.saldo` | `O saldo registrado de dezembro é {saldo}. Planejar janeiro não altera esse histórico. Use os controles da conversa para revisar seus compromissos.` | saldo | data/conversation.ts:13 (conversationService.ts:10) | texto contém "saldo" **(valor local — deve vir de rota com selo)** |
| `bot.valores` | `Ainda não consigo ajustar os valores pela conversa. Os compromissos apresentados são limites para janeiro, calculados sobre os seus registros.` | — | data/conversation.ts:14 (conversationService.ts:11) | texto contém "ajust" ou "valor" |
| `bot.humano` | `Não consigo iniciar um atendimento por aqui. Você pode continuar o planejamento ou voltar ao início.` | — | data/conversation.ts:17 (conversationService.ts:12) | "humano"/"atendimento", saldo não negativo |
| `bot.humano_negativado` **JÁ REGISTRADA** | `Ainda não consigo te transferir daqui. Fale com um especialista pelo atendimento do app para trocar juros altos e unir suas dívidas; enquanto isso, seguimos com o seu plano.` | — | data/conversation.ts:18 (conversationService.ts:12) | "humano"/"atendimento", `isNegative` |
| `bot.fallback` | `Entendi, {nome}. Podemos continuar o planejamento de janeiro e voltar aos seus compromissos quando quiser.` | nome | data/conversation.ts:12 (conversationService.ts:13) | qualquer outro texto |
| `composer.placeholder` | `Escreva uma mensagem...` | — | components/chat/ChatComposer.tsx:12 | caixa de texto |
| `composer.aria` | `Escreva uma mensagem` | — | components/chat/ChatComposer.tsx:12 | aria da caixa de texto |
| `composer.aria_enviar` | `Enviar mensagem` | — | components/chat/ChatComposer.tsx:13 | aria do botão enviar |
| `composer.rodape` | `Planejamento para janeiro · sem acesso aos dados da conta` | — | components/chat/ChatComposer.tsx:15 | abaixo da caixa de texto |
| `chat.aria_digitando` | `i.ai está digitando` | — | components/chat/TypingIndicator.tsx:4 | indicador de digitação |

### 4.8 Acompanhe (follow-up)

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `acomp.alt_cabecalho` | `i.agora Acompanhe` | — | components/follow-up/FollowUpScreen.tsx:18 | alt da imagem do topo |
| `acomp.kicker` | `Janeiro / 2026` | — | components/follow-up/FollowUpScreen.tsx:24 | topo da tela |
| `acomp.voltar` | `Início` | — | components/follow-up/FollowUpScreen.tsx:25 | botão voltar |
| `acomp.aria_voltar` | `Voltar ao início` | — | components/follow-up/FollowUpScreen.tsx:25 | aria do botão voltar |
| `acomp.titulo` | `Acompanhe seu janeiro` | — | components/follow-up/FollowUpScreen.tsx:27 | h1 |
| `acomp.subtitulo` | `Os compromissos que você assumiu na conversa, em um só lugar.` | — | components/follow-up/FollowUpScreen.tsx:28 | abaixo do h1 |
| `acomp.progresso_rotulo` | `ACOMPANHAMENTO COM I.AI` | — | components/follow-up/FollowUpProgress.tsx:6 | bloco de progresso |
| `acomp.progresso_titulo` | `Seu plano, em evolução` | — | components/follow-up/FollowUpProgress.tsx:6 | bloco de progresso |
| `acomp.progresso_texto` | `A i.ai vai acompanhar seus compromissos ao longo de janeiro.` | — | components/follow-up/FollowUpProgress.tsx:9 | bloco de progresso |
| `acomp.progresso_nota` | `As atualizações sobre o seu plano aparecerão aqui.` | — | components/follow-up/FollowUpProgress.tsx:10 | bloco de progresso |
| `acomp.secao_titulo` | `Seus compromissos` | — | components/follow-up/FollowUpScreen.tsx:35 | cabeçalho da lista |
| `acomp.secao_texto` | `O que você combinou para janeiro.` | — | components/follow-up/FollowUpScreen.tsx:35 | cabeçalho da lista |
| `acomp.contagem_1` | `{n} compromisso` | n | components/follow-up/FollowUpScreen.tsx:36 | contador, n = 1 |
| `acomp.contagem_n` | `{n} compromissos` | n | components/follow-up/FollowUpScreen.tsx:36 | contador, n ≠ 1 |
| `acomp.aria_lista` | `Compromissos confirmados para janeiro de 2026` | — | components/follow-up/FollowUpScreen.tsx:39 | aria da lista |
| `acomp.vazio_titulo` | `Ainda não há compromissos confirmados.` | — | components/follow-up/FollowUpScreen.tsx:42 | lista vazia |
| `acomp.vazio_texto` | `Converse com a i.ai para escolher o que faz sentido para seu janeiro.` | — | components/follow-up/FollowUpScreen.tsx:43 | lista vazia |
| `categoria.delivery` | `Delivery e refeições fora` | — | data/plan.ts:7 (FollowUpItem.tsx:13) | nome do item |
| `categoria.shopping` | `Compras por impulso` | — | data/plan.ts:7 | nome do item |
| `categoria.reserve` | `Reserva para imprevistos` | — | data/plan.ts:8 | nome do item |
| `categoria.other` | `Outros gastos flexíveis` | — | data/plan.ts:8 | nome do item |
| `acomp.retomar_titulo` | `Quer retomar a conversa?` | — | components/follow-up/FollowUpCompanion.tsx:6 | rodapé da tela |
| `acomp.retomar_texto` | `Seu planejamento continua no chat.` | — | components/follow-up/FollowUpCompanion.tsx:6 | rodapé da tela |
| `acomp.aria_retomar` | `Abrir conversa com i.ai` | — | components/follow-up/FollowUpCompanion.tsx:7 | aria do botão (texto igual a `home.aria_fab`) |

**Achado.** O detalhe de cada item (FollowUpItem.tsx:15) usa sempre `compromisso.*` com valores locais, **mesmo quando a proposta do backend existe**. O painel `confirm` usa `proposal.itens[].texto`. As duas telas podem mostrar números diferentes para o mesmo compromisso.

### 4.9 Card PNG (canvas) e compartilhamento

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `png.periodo` | `JANEIRO / 2026` | — | services/exportCardService.ts:31 | topo do PNG (escrito direto no código, não usa `PLAN_PERIOD`) |
| `png.simbolo` | `↗` | — | services/exportCardService.ts:33 (SharePreview.tsx:9) | símbolo grande do PNG e da prévia |
| `card.tagline` | `Pequenas mudanças. Mais equilíbrio.` | — | services/exportCardService.ts:36 (SharePreview.tsx:9) | PNG e prévia |
| `card.convite` | `Qual vai ser seu próximo passo?` | — | services/exportCardService.ts:38 (SharePreview.tsx:9) | PNG e prévia |
| `png.titulo_compartilhar` | `Meu próximo passo` | — | services/exportCardService.ts:60 | título no `navigator.share` |
| `png.arquivo` | `meu-proximo-passo-janeiro-2026.png` | — | services/exportCardService.ts:5 | nome do arquivo baixado ou compartilhado |
| `card.frase.delivery.0` | `Meu delivery vai sentir saudade. Meus planos vão agradecer.` | — | data/plan.ts:11 | frase do card, 1ª categoria por `PHRASE_PRIORITY` = delivery |
| `card.frase.delivery.1` | `Hoje eu escolhi cozinhar novos planos.` | — | data/plan.ts:11 | "Gerar outra frase" |
| `card.frase.delivery.2` | `Menos pedidos. Mais espaço para o que importa.` | — | data/plan.ts:11 | idem |
| `card.frase.shopping.0` | `Dei um tempo no “eu mereço”. Tô investindo no “eu quero realizar”.` | — | data/plan.ts:12 | categoria principal = shopping |
| `card.frase.shopping.1` | `Minha lista de desejos agora tem prioridades.` | — | data/plan.ts:12 | idem |
| `card.frase.shopping.2` | `Compro com calma. Planejo com carinho.` | — | data/plan.ts:12 | idem |
| `card.frase.reserve.0` | `Plot twist: este mês, os imprevistos vão me encontrar mais preparada.` | — | data/plan.ts:13 | categoria principal = reserve (flexão só no feminino, mesmo com `genero:'M'`) |
| `card.frase.reserve.1` | `Um pouquinho de hoje cuida do meu amanhã.` | — | data/plan.ts:13 | idem |
| `card.frase.reserve.2` | `O futuro ganhou um cantinho no meu mês.` | — | data/plan.ts:13 | idem |
| `card.frase.other.0` | `Pequenas escolhas abrem espaço para grandes planos.` | — | data/plan.ts:14 | categoria principal = other / fallback |
| `card.frase.other.1` | `Meu mês, minhas escolhas, meu ritmo.` | — | data/plan.ts:14 | idem |
| `card.frase.other.2` | `Cada ajuste conta uma história nova.` | — | data/plan.ts:14 | idem |

### 4.10 Folhas (bottom sheets)

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `folha.aria_fechar` | `Fechar` | — | components/ui/ModalSheet.tsx:8 | botão X de toda folha |
| `folha.reset.aria` | `Recomeçar planejamento` | — | components/sheets/PlanSheet.tsx:18 | aria-label da folha de reset |
| `folha.eyebrow` | `SEU PLANO` | — | components/sheets/PlanSheet.tsx:21, :26 | folhas de reset e de área não conectada |
| `folha.reset.titulo` | `Começar de novo?` | — | components/sheets/PlanSheet.tsx:21 | folha de reset |
| `folha.reset.texto` | `Isso apaga a conversa e os compromissos salvos neste navegador. Os valores de dezembro continuam como ponto de partida.` | — | components/sheets/PlanSheet.tsx:22 | folha de reset |
| `folha.reset.confirmar` | `Recomeçar planejamento` | — | components/sheets/PlanSheet.tsx:23 | botão da folha de reset |
| `folha.reset.manter` | `Manter meu plano` | — | components/sheets/PlanSheet.tsx:24 | botão da folha de reset |
| `folha.info.titulo` | `{secao}` | secao | components/sheets/PlanSheet.tsx:26 | h2 = rótulo tocado (nav, atalho, `Busca`, `Conta corrente`) |
| `folha.info.texto` | `Esta área ainda não está conectada a uma conta bancária. Para continuar, converse com a i.ai sobre seu planejamento de janeiro.` | — | components/sheets/PlanSheet.tsx:27 | área não conectada |
| `folha.conversar` | `Conversar com i.ai` | — | components/sheets/PlanSheet.tsx:28, :38 | botão das folhas de área não conectada e plano vazio |
| `folha.plano.titulo` | `Meus compromissos financeiros` | — | components/sheets/PlanSheet.tsx:18, :30 | folha do plano confirmado (também é o aria-label padrão) |
| `folha.plano.texto` | `Este é o plano que você confirmou. O saldo de dezembro permanece {saldo}.` | saldo | components/sheets/PlanSheet.tsx:31 | folha do plano confirmado **(valor local — deve vir de rota com selo)** |
| `folha.plano.resumo` | `{valor_liberado}` + `de redução planejada nos gastos · reserva prevista: {reserva}` | valor_liberado, reserva | components/sheets/PlanSheet.tsx:33 | folha do plano confirmado. Sem proposta, os números são **(valor local — deve vir de rota com selo)** |
| `folha.plano.ver_card` | `Ver card no chat` | — | components/sheets/PlanSheet.tsx:34 | botão |
| `folha.plano.ver_conversa` | `Ver conversa` | — | components/sheets/PlanSheet.tsx:35 | botão |
| `folha.vazio.titulo` | `Ainda não há compromissos` | — | components/sheets/PlanSheet.tsx:37 | folha sem plano confirmado |
| `folha.vazio.texto` | `Converse com a i.ai para criar seu card.` | — | components/sheets/PlanSheet.tsx:37 | folha sem plano confirmado |

Hoje a folha de plano confirmado e a folha vazia não são abertas por nenhum caminho de `App.tsx` (`info` vem sempre preenchido). Estão listadas porque existem no código.

### 4.11 Toasts

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `toast.avisos` | `Seu plano fica salvo neste navegador. Os valores são calculados sobre os seus registros até agora.` | — | data/conversation.ts:22 (App.tsx:63) | toque no sino da home |
| `toast.compartilhado` | `Compartilhamento concluído.` | — | data/conversation.ts:23 (useCardExport.ts:14) | `navigator.share` concluiu |
| `toast.baixado` | `Download iniciado. Se quiser salvar em Fotos, abra a imagem baixada e use a opção de salvar do aparelho.` | — | data/conversation.ts:24 (useCardExport.ts:14) | PNG baixado |
| `toast.cancelado` | `Compartilhamento cancelado. Seu plano continua salvo; tente novamente quando quiser.` | — | data/conversation.ts:25 (useCardExport.ts:17) | usuário cancelou o share (`AbortError`) |
| `toast.falha_exportar` | `Não foi possível exportar o card. Tente novamente.` | — | data/conversation.ts:26 (useCardExport.ts:18) | erro que não é `Error` |
| `toast.reiniciado` | `Planejamento reiniciado.` | — | data/conversation.ts:27 (App.tsx:49) | depois de reiniciar |
| `toast.erro_marca` | `Não foi possível carregar a marca do card.` | — | services/exportCardService.ts:10 | falha ao carregar o logo; o toast mostra `error.message` |
| `toast.erro_navegador` | `Este navegador não oferece exportação de imagem.` | — | services/exportCardService.ts:26 | canvas sem contexto 2D |
| `toast.erro_png` | `Não foi possível gerar o PNG.` | — | services/exportCardService.ts:43 | `toBlob` devolveu null |

### 4.12 Navegação e atalhos

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `nav.inicio` | `Início` | — | data/navigation.ts:3 | barra inferior |
| `nav.extrato` | `Extrato` | — | data/navigation.ts:5 | barra inferior (abre folha "área não conectada") |
| `nav.pagamentos` | `Pagamentos` | — | data/navigation.ts:5 | idem |
| `nav.pra_voce` | `Pra você` | — | data/navigation.ts:5 | idem |
| `nav.menu` | `Menu` | — | data/navigation.ts:5 | idem |
| `nav.aria` | `Navegação principal` | — | components/home/BottomNav.tsx:5 | aria da barra inferior |
| `atalho.pix` | rótulo `Pix e transferir`, exibido `Pix e` / `transferir` | — | data/navigation.ts:7 | grade de atalhos (rótulo vira título da folha) |
| `atalho.pagar` | rótulo `Pagamentos`, exibido `Pagar` | — | data/navigation.ts:8 | idem |
| `atalho.cartoes` | rótulo `Cartões`, exibido `Cartão` / `virtual` | — | data/navigation.ts:9 | idem |
| `atalho.planejar` | rótulo `Planejar`, exibido `Planejar` / `janeiro` | — | data/navigation.ts:4, :10 | idem (abre a conversa) |
| `atalho.aria` | `Acesso rápido` | — | components/home/ShortcutGrid.tsx:7 | aria da grade |
| `atalho.busca` | `Busca` | — | components/home/HomeScreen.tsx:21 | título da folha aberta pela lupa |

### 4.13 Outros (erro e documento)

| id proposto | texto exato | variáveis | onde no front | quando aparece |
|---|---|---|---|---|
| `erro.titulo` | `Algo deu errado` | — | components/ui/ErrorBoundary.tsx:23 | erro de renderização |
| `erro.texto` | `Esta parte do app encontrou um erro.` | — | components/ui/ErrorBoundary.tsx:24 | idem |
| `erro.tentar` | `Tentar de novo` | — | components/ui/ErrorBoundary.tsx:26 | idem |
| `doc.titulo` | `i.agora — acompanhe seu janeiro` | — | index.html:6, :8 | aba do navegador e og:title |
| `doc.descricao` | `Organize seus compromissos de janeiro com a i.ai e acompanhe a evolução do seu plano.` | — | index.html:7, :9 | meta description e og:description |

Os textos da secção 4.13 carregam antes do React ou fora do fluxo, por isso não podem vir do `controle-conversa/`. Ficam no inventário para o roteiro ser a fonte de verdade, mas o front mantém a cópia fixa.

---

## 5. Formato pedido ao backend

O `GET /api/v1/context-agent/controle-conversa/` devolve cada fala assim:

```json
{
  "versao_roteiro": "2026-09-27.2",
  "falas": [
    {
      "id": "bot.intro",
      "estagio": "intro",
      "texto": "Que bom ter você aqui, {nome}!",
      "variaveis": ["nome"],
      "versao_roteiro": "2026-09-27.2"
    }
  ]
}
```

- `estagio` é um de: `home`, `intro`, `invite`, `confirm`, `card`, `finish`, `livre`, `acompanhe`, `folha`, `toast`, `png`, `nav`, `global`.
- O front troca cada `{variavel}` pelo valor dele e mantém `\n\n` e `*ênfase*` como estão. Uma variável em `variaveis[]` que o front não tem vira `NAO_MEDIDO` visível e fica no log. Nunca vira texto vazio.
- Números (`{saldo}`, `{valor_liberado}`, `{reserva}`, `{meta}`, `{corte}`, `{falta_apos_cortes}` e os demais) devem vir de uma rota com selo (valor · fonte · data), nunca do cálculo local. As linhas marcadas **(valor local — deve vir de rota com selo)** são as que hoje violam isso.
- **Fallback.** A cópia local (os arquivos citados acima) só é usada quando `controle-conversa/` falha: erro HTTP, timeout, JSON inválido ou `id` ausente. Nesse caso o front registra no log `controle-conversa NAO_MEDIDO` com o motivo e os `id`s que caíram no fallback. Nunca faz isso em silêncio.
