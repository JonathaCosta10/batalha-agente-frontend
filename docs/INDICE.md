# Documentação

## Entrega
- [README](../README.md): resumo da estrutura única (27/09 09:30), com:
  - produto e estado medido;
  - arquitetura e frameworks;
  - estrutura do repositório;
  - telas e respetiva validação;
  - testes e estratégia;
  - execução local e deploy;
  - mapa da documentação, backend do time e pendências.
- [Entrega consolidada das 09:16](archive/2026-09-27/README-entrega-0916.md), com o detalhe que o README atual
  resume:
  - fluxograma de atendimento, contrato, guardrails e extremos;
  - estudos e divergências;
  - repositórios.

## Regras de negócio
- [Índice e como mudar uma regra com segurança](regras-de-negocio/README.md) (inclui regra → teste).
- [Perfis e situações](regras-de-negocio/perfis-e-situacoes.md): situação publicada, segmento T3 do `-32`, janela, tom.
- [Fluxo de atendimento](regras-de-negocio/fluxo-de-atendimento.md): estados do plano, turno de conversa, etapas
  guiadas, guardas, `proximas_acoes`, encaminhamento e extremos.
- [Interações manipuláveis](regras-de-negocio/interacoes-manipulaveis.md): falas, limiares, modelo, quotas, tempos,
  memória e variáveis de ambiente, com ficheiro:linha.
- [Memória de conversas](regras-de-negocio/memoria-de-conversas.md): EXISTE / PARCIAL / PLANEJADO / NAO_MEDIDO.
- [Falas e roteiro](regras-de-negocio/falas-e-roteiro.md): inventário das 188 falas do front, pendências da
  integração e o formato pedido ao backend.
- [Perfil "Pessoa 1 da base" e registro da sessão](regras-de-negocio/perfil-e-registro-da-sessao.md): causa raiz
  (índice 1 fixo), sessão anónima, cookies e flags, GCS sem expiração, observação ao vivo das 09:35 BRT,
  comparação com o `-32` e correção recomendada.

## Artefatos publicados
- [Artefatos (páginas claude.ai)](artefatos/README.md): template como fonte da verdade, registo das páginas
  ([`paginas.json`](artefatos/paginas.json)), como criar uma página, guard `tests/test_artefatos_padrao.py`,
  fluxo de publicação e o caso do "delta sensível" de 27/09.

## Handoff
- [Front, sessão d2 (27/09 10:20)](handoff/2026-09-27-front-sessao-d2.md): onde está o código, P0/P1 fechados, P2+ por dono, git por decidir.

## Cobranças abertas
- [Identidade do usuário sempre errada](cobrancas/2026-09-27-identidade-do-usuario.md) (27/09 10:10, ao backend): "Pessoa 1 da base" fixa; pedido de sorteio inicial e identificação única por `usuarios_verdade.csv` (nome e gênero configurados).

## Técnica
- [Validação front ↔ back por localhost](validacao-front-back.md): **atual (27/09 12:31 BRT)** — backend único `../backend` na `:8000`, sequência `definir/` (UUID) → `sessao/` → `X-Sessao-Id` → perfil → abertura → mensagens → plano, 503 do chat por provedor; histórico do `agent_backend` (09:47 BRT) abaixo.
- [Skill integracao-front-back](../skills/integracao-front-back/SKILL.md) (versionada, fora de `.claude/`): subir o ambiente, validar ponta a ponta com `scripts/validar_chat_ponta_a_ponta.py`, classificar 503 por `conversas/status/`, armadilhas. Nota 100 no avaliador (`relatorios/skills/mapa-2026-09-27T1249.md`).
- [Interface](interface/README.md): qual front é o layout certo (`feat/i-agora-gcp-integrado`), como subi-lo
  localmente, o que foi observado no navegador, os ajustes de 27/09 e os pontos em aberto.
- [Contrato e pipeline i-agora 1.0](i-agora.md).
- [Rota integrada do batalha-agentes — parte front](rota-integrada-batalha-agentes-front.md): cada chamada do front
  publicado (`1f66e6a`) e do arquivado, fluxos em sequência, mapa `contrato.estado` → tela e divergências D1–D13/DF.
  Par: [backend-32/rota-integrada-batalha-agentes-backend.md](backend-32/rota-integrada-batalha-agentes-backend.md) (cópia; fonte fora de git).
- [Ambientes e provedores](ambientes/README.md): quem fala com quem por ambiente,
  [variáveis de ambiente](ambientes/variaveis-de-ambiente.md), [provedores](ambientes/provedores.md),
  [Docker](ambientes/docker.md) e [CI/CD](ambientes/ci-cd.md).
- [Deploy Cloud Run](../deploy/README.md): build, operação e rollback.
- [Front](front/INDICE.md): [arquitetura](front/architecture.md), [contrato de API do front](front/integracao/contrato-api-i-agora.md),
  [pontos de conexão](front/integracao/pontos-de-conexao.md), normas [BCB](front/bcb-8/), [arquitetura combinada (histórico do main arquivado)](front/arquitetura-combinada-main-arquivado.md) (vindos de `mobile-front-agente`).
- [Backend -32: rotas e contratos](backend-32/INDICE.md) (cópia datada; a fonte está fora de git).
- [Limitações do protótipo](LIMITACOES.md).
- [Arquitetura do front legado](archive/2026-09-27/architecture-front-legado.md) (arquivada; código em `../archive/2026-09-27/src-front-legado/`).
- [Proposta de CI](ci/conversation.yml) (inativa).
- [Mapa de estrutura dos repositórios](../relatorios/estrutura/) (27/09 04:11).
- [Evidências de execução](../agent_backend/evidence/).

## Arquivo
- [Índice do arquivo](archive/INDICE.md).
- [README da consolidação das 08:19](archive/2026-09-27/README-consolidacao-0819.md) (`8d360b3`).
- [README antes da consolidação](archive/2026-09-27/README-antes-da-consolidacao.md) (`2f7fae2`).
- [Versão anterior do README](archive/2026-09-27/README-anterior.md).

## Fora deste repositório
- `mobile-front-agente`: **arquivado por inteiro** (todos os branches, incluindo `feat/i-agora-gcp-integrado` do Henrique). O `src/` deste repositório é o `47ee715` (branch `feat/timer-primeira-consulta`), importado com a história a 2026-09-27; o `src/` anterior (`de7ff9d` + `5f4fd75`) está em `../archive/front-legado/`.
- Backend do time: `desafio-itau-batalha-de-agentes-time2` (sessão 25) e a cópia de trabalho `-32`, fora de git
  (fluxos de conversação, desenho de respostas, controle da conversa, estudos T3, fluxo executado).
