# Biblioteca de estudo Itaú — extração do design system

**Fonte:** [arquivo no Figma](https://www.figma.com/design/ISsm9UXQTnRUwfKqnNoBWX/), complementado pela exportação `.fig` fornecida pelo usuário em `attached_assets/`. A conexão do Figma mostrava inicialmente só a capa; a leitura da exportação confirmou o catálogo abaixo. O arquivo original permanece intacto.

**Natureza da fonte:** biblioteca independente de estudo, **não** o design system oficial do Itaú. Cores, medidas, ícones e composições são aproximações das referências; Open Sans substitui a fonte proprietária. A capa identifica a versão como `0.1 · setembro de 2026`.

## O que foi recuperado

- **15 páginas** no arquivo: 12 páginas de conteúdo, uma página interna de variáveis/estilos e duas páginas divisórias.
- **61 variáveis** em três coleções: 13 cores primitivas, 20 cores semânticas e 28 medidas (12 espaços, 8 raios e 8 tamanhos de fonte).
- **10 estilos de texto** com família, peso, corpo, entrelinha e espaçamento entre letras.
- **52 componentes do tipo símbolo**, dos quais 20 ícones vetoriais e 32 símbolos nas outras 14 famílias (incluindo variantes).
- **2 composições demonstrativas** na página `11 Exemplos`: “Acesso e atalhos” e “Resumo de pagamentos”, montadas com instâncias e dados fictícios.
- **12 capturas das páginas** e **20 SVGs de ícones** salvos em [`references/itau/`](./references/itau/README.md). Os IDs dos componentes e suas propriedades estão em [`figma-itau-components.json`](./figma-itau-components.json).

Os dados estruturados de variáveis e tipografia estão em [`figma-itau-design-system.tokens.json`](./figma-itau-design-system.tokens.json). Seus aliases preservam a ligação entre cor semântica e cor primitiva; para CSS, a sintaxe declarada pela fonte usa `var(--surface-canvas)`, `var(--space-16)` etc.

## Páginas e conteúdo

| Página | Frame | Conteúdo |
| --- | --- | --- |
| `00 Capa` | `3:15` | Escopo, quantidades, proveniência e alerta de contraste |
| `01 Como usar` | `4:110` | Uso de instâncias, edição, referências e limites |
| `02 Fundamentos` | `4:2` | Cores, amostras tipográficas, espaçamentos e cantos |
| `03 Ícones` | `5:2` | Os 20 ícones em grade de 24 pt |
| `04 Botões` | `5:110` | Primário/contorno, compacto/regular e botão de ícone |
| `05 Identificação` | `5:128` | Avatar e badges |
| `06 Atalhos e cartões` | `6:2` | Três formatos de atalho e duas superfícies de cartão |
| `07 Listas` | `7:2` | Linhas simples, de valor e descritivas |
| `08 Navegação` | `8:2` | Abas, itens e cinco estados da navegação inferior |
| `09 Avisos` | `8:243` | Aviso informativo e estado vazio |
| `10 Cabeçalhos` | `9:2` | Barra de topo e cabeçalho de conta |
| `11 Exemplos` | `11:2` | Duas composições de referência |

As outras páginas são `Internal Only Canvas` (variáveis e estilos), `— Componentes —` e `— Utilidades —` (divisórias).

## Valores fundamentais

| Papel | Alias | Valor resolvido |
| --- | --- | --- |
| Ação principal | `surface/brand` → `orange/500` | `#ff6200` |
| Destaques/ícones | `icon/accent` → `blue/500` | `#1428f5` |
| Fundo do app | `surface/canvas` → `neutral/50` | `#f1f2f4` |
| Cartões | `surface/card` → `neutral/0` | `#ffffff` |
| Texto principal | `text/primary` → `neutral/950` | `#111111` |
| Texto secundário | `text/secondary` → `neutral/600` | `#505154` |
| Divisores | `border/default` → `neutral/200` | `#d1d2d4` |
| Contador de atenção | `surface/badge-warning` → `yellow/400` | `#ffd23f` |

Há apenas o modo de cor **Claro**; nenhum tema escuro foi encontrado. As demais cores, aliases e medidas estão no JSON completo.

Os dez estilos usam **Open Sans**, sem letter-spacing (valor 0% no Figma):

| Estilo | Peso | Corpo/entrelinha |
| --- | ---: | ---: |
| Display | 700 | 32/40 px |
| Titulo/L | 700 | 24/32 px |
| Titulo/M | 600 | 20/28 px |
| Titulo/S | 600 | 18/24 px |
| Corpo/L | 400 | 18/26 px |
| Corpo/M | 400 | 16/24 px |
| Corpo/S | 400 | 14/20 px |
| Rotulo/M | 600 | 16/24 px |
| Rotulo/S | 600 | 14/20 px |
| Legenda | 400 | 12/16 px |

O espaçamento vai de `0` a `64` pt; os raios incluem `8` (botões), `12` (seleção da navegação), `16` (cartões e atalhos), `20–24` (painéis) e `999` (avatar/contador), conforme a documentação da fonte. A largura de referência das telas móveis foi normalizada para **393 pt**.

## Famílias de componentes

| Família | Variantes | Propriedades editáveis |
| --- | --- | --- |
| Button | Primário/Contorno × Compacto/Regular | Rótulo, Estilo, Tamanho |
| IconButton | único | Ícone |
| Avatar | único | Iniciais |
| Badge | Informativo, Neutro, Atenção, Seleção | Texto, Tipo |
| Shortcut | Compacto, Médio, Largo | Rótulo, Ícone, Formato |
| ContentCard | Preenchido, Contorno | Título, Descrição, Destaque, Superfície |
| ListItem | Simples, Valor, Descrição | Título, Complemento, Ícone, Mostrar seta, Conteúdo |
| Tab | selecionado/não selecionado | Rótulo, Selecionado |
| BottomNavItem | selecionado/não selecionado | Rótulo, Ícone, Selecionado |
| BottomNavigation | ativo em Início, Extrato, Pagamentos, Pra você ou Menu | Ativo |
| Notice | único | Ícone, Título, Descrição |
| EmptyState | único | Ícone, Mensagem |
| TopBar | Voltar, Ações | Título, Tipo |
| AccountHeader | único | Saudação, Conta |

Mais 20 símbolos `Icon/*` completam os 52. A biblioteca diz que os ícones são desenhos vetoriais **aproximados**, em grade de 24 pt e traço de 1,7 pt; seus SVGs estão em `references/itau/icons/`.

## Cuidados ao usar como base

- **Acessibilidade:** a capa declara contraste de `7,08:1` para texto secundário/fundo e `3,00:1` para branco/laranja. O botão laranja corresponde à referência visual, mas **texto pequeno branco sobre `#ff6200` precisa de revisão antes de uso em produção**. O IconButton exige nome acessível na implementação; área de toque indicada: pelo menos 44 pt.
- **Estados não documentados:** pressionado, desabilitado e carregando nos botões; formulários, teclado, modal, erro de campo e tema escuro. Não inferir esses estados como se viessem da fonte.
- **Material ausente:** a fonte menciona cinco capturas de referência (Extrato, Pagamentos, Pra você, acesso inicial e planos odontológicos), mas os arquivos dessas capturas **não estão dentro da exportação `.fig`**; a pasta `images/` do pacote está vazia. As 12 imagens locais são capturas **das páginas da biblioteca**, não dessas cinco fotografias de referência.
- **Fonte e marca:** o arquivo não inclui a fonte proprietária nem ativos oficiais do banco. O estado vazio usa um ícone substituto, não a ilustração original. Não apresentar a biblioteca como oficial.
- **Reutilização no Figma:** os componentes estão no arquivo local. A documentação da fonte diz que a publicação como biblioteca de equipe depende do próprio Figma; esta extração não faz essa publicação.

Esta extração fornece os valores, catálogo, referências visuais e ícones para iniciar **um projeto novo**. Ainda não define o produto ou implementa um aplicativo.

## Elementos de marca enviados depois

O usuário também forneceu uma imagem com os logotipos Itaú e `ia.i`, além de uma imagem posterior com o logotipo final `i.agora`. Os recortes, a estrelinha como SVG/PNG independente e o **PNG final de `i.agora` enviado pelo usuário** estão em [`assets/brand/`](../assets/brand/README.md). Esses elementos não faziam parte do `.fig` extraído; mantenha a proveniência separada ao usá-los.