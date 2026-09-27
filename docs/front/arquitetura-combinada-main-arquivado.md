# Arquitetura combinada e apresentação da proposta (histórico do main arquivado)

> **Origem:** `mobile-front-agente` `main` `5e4f9bc` (`docs/integracao/pontos-de-conexao.md` e `docs/integracao/contrato-api-i-agora.md` §3.4.1), trazido a 2026-09-27 10:50 BRT.
> **Não descreve o `src/` atual.** Descreve o front do `main` arquivado (`planApi.ts`/`balanceApi.ts`, `ref` = índice).
> O `src/` deste repositório é o `47ee715`: identidade pela sessão assinada, e o único identificador que o front
> pode nomear é o `idUsuario` (UUID); índice posicional ou `person.id` nunca (o backend responde 400). As linhas
> "por `ref` = índice" e `usuario-real/<indice>/` abaixo ficam **só como histórico**.
> O inventário das falas e as pendências do mesmo `main` já estão em
> [../regras-de-negocio/falas-e-roteiro.md](../regras-de-negocio/falas-e-roteiro.md) (versão de `274f5f1`, a mais recente).

## 1. Arquitetura combinada com o backend (2026-09-27, 06:20–06:30 BRT, sessões backend-25 e backend-32)

- **Um só Django**, em `DJANGO_URL`. A porta 8001 é o arranque local e não está fechada como definitiva.
- **Front → Django → Gemini.** O front nunca chama o modelo e nunca vê a chave.
  - Modelo da conversa: `gemini-3.5-flash-lite`, com `gemini-flash-latest` como alternativa.
  - Quota gratuita: 20 pedidos/dia por modelo. Um 429 no Gemini chega ao front como 503, e a tela mostra "indisponível".

| Campo da tela | Rota (dono) | Estado |
| :--- | :--- | :--- |
| Pessoa / nome / gênero | `perfil-usuario/definir/` (32) → `sessao_id` + `usuario.indice` | estável; **fora de git** |
| Chat livre | `conversas/sessao/` + `conversas/mensagens/` (32), header `X-Sessao-Id`, nunca no corpo | estável; **fora de git** |
| Compromissos | `i-agora/plano/proposta/` (25), por `ref` = índice | **ligado**; regra ainda não validada pelo dono |
| Saldo da home | `usuario-real/<indice>/saldo-mes/` (25) | **decisão do dono**: `saldo` (dez até 22/12) ou `media_mensal.surplus_mensal` |
| Textos fixos | `controle-conversa/` (25) | existe; não ligado |
| Telas guiadas / avaliações | `conversas/interacao/`, `avaliacoes/resumo/` (32) | em construção: não ligar |

- **Erros.**
  - 404 nas rotas da 32: chamar `definir/` de novo.
  - 503: mostrar "indisponível", nunca um número.
- **As rotas da 25 não usam `sessao_id`.**

## 2. Contrato de apresentação da proposta (pedido do dono, 2026-09-27)

A rota real (backend `docs/controle-da-conversa.md` §5a) já devolve `data_corte` (linha de corte), `compromissos[]`,
`totais` e `selos`. Para o rodapé e o raciocínio mostrados no painel, o backend passa a enviar **também** o bloco
`apresentacao` (opcional; enquanto não vier, o front monta o mesmo texto em `src/services/planApi.ts` (do main arquivado) a partir dos
campos que já existem):

```ts
apresentacao?: {
  chave: 'subcategoria';                 // campo que preenche o [CHAVE] do texto (grafia de nom_cate_micro)
  linha_de_corte: string;                // = data_corte, ex. '2025-12-22'
  base: { inicio: 'AAAA-MM'; fim: 'AAAA-MM'; meses: number };   // meses completos antes do mês do corte
  raciocinio: string[];                  // 1-3 frases: renda, saldo, necessário p/ 15%, ordem dos cortes
  rodape: string;                        // frase única do selo, ver abaixo
}
compromissos[].raciocinio?: string;      // por que este compromisso: média, lançamentos, nível e % de corte
compromissos[].ate_linha_de_corte?: number | 'NAO_MEDIDO';   // gasto do mês do corte até o dia do corte (pedido, ver abaixo)
```

**O que se pode dizer sobre janeiro.** Nada de janeiro está medido: a base termina na linha de corte
(22/12/2025). Os valores são **médias mensais de jan a nov/2025** (11 meses completos); dezembro, até dia 22, existe
na base mas não entra na média. Por isso o texto não chama isto de "projeção" nem de "estimativa de janeiro": é um
**limite para janeiro calculado sobre os registros até 22/12/2025**.

Rodapé que o front monta hoje (e que o backend pode substituir por `apresentacao.rodape`):

> Com base nos seus registros até 22/12/2025 (média de jan/2025 a nov/2025, 11 meses completos). O mês da linha de
> corte não entra na média. Regra corte_seguro_ate_surplus_15 · fonte batalha-time-02-lxof.hackathon_dados.extrato_sintetico · medido em 2026-09-27T06:00:38-03:00.

Raciocínio por compromisso (idem, `compromissos[].raciocinio`):

> Média de R$ 346,89/mês em 15 lançamentos (jan/2025 a nov/2025) · Nível 1 (supérfluo): pausa total.

**Pedido em aberto ao backend:** `ate_linha_de_corte` = quanto a pessoa já gastou naquela subcategoria de
01/12 até 22/12/2025. Com isso o painel pode dizer "em dezembro, até dia 22, você já registrou R$ X" (dado real, não
projeção). Sem esse campo o front não mostra nada de dezembro.
