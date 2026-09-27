# Cobrança ao backend: a pessoa consultada é sempre a mesma e a identidade mostrada é inventada

> Aberta a 2026-09-27 10:10 BRT pelo front (sessão `agente-app-mobile-d2`). **Revista às 10:16 BRT** por ordem
> do dono: "Não quero nada inventado; a seleção randômica é para selecionar o que vai no fluxo de solicitação na
> BigQuery para a base de dados consumir." A versão das 10:10 pedia nome e gênero do `usuarios_verdade.csv`, mas
> essas colunas são inventadas (`colunas_inventadas: [nome, genero]` no selo), por isso esse pedido fica **retirado**
> (ver §7).
> Estado: **ABERTA**. Fecha quando os critérios da §4 passarem com teste e com uma medição no navegador.

## 1. Sintoma (medido)

No fluxo normal, a Home e o chat mostram sempre a mesma pessoa, com um nome montado pelo código:

```
P
Pessoa 1 da base
Perfil sintético · hackathon

Olá, Pessoa 1 da base
```

- `GET /api/v1/i-agora/perfil/` devolve `nome` = `primeiroNome` = `"Pessoa 1 da base"` e `genero` = `"NAO_INFORMADO"`.
  Selo: medido às 09:47 BRT, modo demo, `agent_backend/evidence/contrato-local-2026-09-27T0947.json`
  (achado `primeiroNome_igual_nome`).
- Toda sessão nova consulta no BigQuery a mesma pessoa, a da posição 1.

## 2. Causa (lida no código, `agente-app-mobile` @ `64aff8a`)

| Onde | O que faz |
|---|---|
| `agent_backend/planning/http.py:56` | Sem plano ativo, `index = 1` fixo. Não há sorteio; só `next=true` soma 1 |
| `agent_backend/planning/bigquery.py:65-79` | Lista `SELECT DISTINCT id_usuario … ORDER BY ref LIMIT 1001` e escolhe pela **posição** |
| `agent_backend/planning/bigquery.py:105` | Inventa o texto `f'Pessoa {index} da base'` e devolve-o como `alias` |
| `agent_backend/planning/domain.py:73-75` | Usa esse texto como `nome` e `primeiroNome` e fixa `genero = 'NAO_INFORMADO'` |

A tabela `batalha-time-02-lxof.hackathon_dados.extrato_sintetico` **não tem** nome nem gênero. As colunas são
`id_usuario, anomesdia, anomes, tipo, descr, vlr, nom_cate_macro, nom_cate_micro, saldo_apos, parcela_atual,
parcela_total` (metadados lidos às 10:05 BRT, sem consulta paga). O único identificador real da pessoa é o
`id_usuario`.

## 3. Fluxo pedido

```
abertura sem plano ativo
  → 1 chamada de identificação ao BigQuery: sorteia UM id_usuario entre os que têm mês encerrado
  → grava o id_usuario no plano (não a posição)
  → load(id_usuario): consulta parametrizada por @customer = id_usuario
  → perfil/ devolve o que veio da base, sem campos inventados
```

## 4. Critérios de aceite

1. **Sorteio no servidor.** Numa sessão nova sem plano ativo, o servidor sorteia um `id_usuario` real da base
   para ser o `@customer` da consulta. O front não escolhe a pessoa.
2. **Uma única chamada de identificação**, com dry-run e o teto de 100 MB já existentes. A chamada devolve só o
   `id_usuario` sorteado, com selo (`jobId`, `measuredAt`), e esse id fica gravado no plano. As chamadas seguintes
   usam o mesmo id, sem voltar a sortear.
3. **`load()` por `id_usuario`**, e não pela posição numa lista ordenada.
4. **Nada inventado no contrato:**
   - `nome` e `primeiroNome` deixam de ter `"Pessoa N da base"`;
   - `genero` só aparece se vier de uma fonte real, e hoje não há nenhuma;
   - o que a base não tem vai como ausente/`null`, e o front mostra um estado neutro.
5. **`next=true`** sorteia outro `id_usuario` diferente do atual, pela mesma regra.
6. **Provas negativas nos testes:**
   - reprovar se a resposta contiver `"da base"`, ou qualquer nome ou gênero que não venha da tabela;
   - reprovar se duas aberturas seguidas de sessões novas forem forçadas sempre ao mesmo índice.

## 5. Decisões que o dono tem de registar

- `domain.py:73` já dizia "alias only, sem nome nem gênero fabricados", mas o próprio alias é um texto
  fabricado. A regra passa a ser **nenhum campo de identidade inventado**. Tem de ficar escrita em
  [perfis e situações](../regras-de-negocio/perfis-e-situacoes.md).
- **O que a Home e o chat mostram no lugar do nome: `NAO_DEFINIDO`.** A proposta do front é saudação neutra
  ("Olá") e o código curto do `id_usuario` no cartão de perfil. O dono confirma.

## 6. O que fica `NAO_MEDIDO`

- O custo em bytes da chamada de identificação sorteada. O `SELECT DISTINCT` atual processa cerca de 21,5 MB
  (`bytes_processados` no selo do `usuarios_verdade`, a mesma tabela), abaixo do teto.
- O comportamento no Cloud Run, que continua na revisão `1f66e6a`.

## 7. Retirado desta cobrança

- A versão das 10:10 pedia `nome` e `genero` de `backend-agente-conversacional/data/usuarios_verdade.csv`. O
  pedido está retirado porque o selo desse CSV declara as duas colunas como inventadas. O CSV continua
  válido **só** como catálogo de `id_usuario` com selo, e nunca como fonte de nome ou gênero.

## 8. Quem foi avisado e respostas

- 10:10 BRT: `backend-agente-conversacional-f7`, `backend-agente-conversacional-d9` e
  `frontend-agent-conversacional-f1`, com a versão original. A correção foi enviada às 10:16.
- 10:13 BRT, `f7`: **recusou fazer o conserto.** Os pontos da causa estão no `agente-app-mobile` e o dono não lhe
  pediu para editar esse repositório. Indicou `perfil_usuario.identificar()` e `POST perfil-usuario/definir/`, que
  servem nome e gênero do CSV. Com a revisão das 10:16, esse caminho já não atende ao pedido.
- 10:15 BRT, `d9`: **assumiu o conserto** e juntou-o ao pedido do dono das 10:03 (sorteio persistido por sessão até ao reset). Faz o trabalho no working tree do `agent_backend`, sem commit, push nem deploy. Às 10:16 recebeu a correção: sem nome nem gênero do CSV.
- **Quem faz o conserto:** a `d9`.
  que sessão o faz.
- Caderno partilhado do i-agora: entrada `i05` em Index context.
