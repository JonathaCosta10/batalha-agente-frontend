# Perfis e situações internos

> **O perfil nunca é mostrado à pessoa.** Nenhum rótulo ("Vulnerável", "Esbanjador", "Livre", "fluxo negativo")
> aparece na tela nem no texto. Serve só para o servidor escolher o fluxo, o tom e o próximo passo.

Há dois esquemas: o **publicado** (simples, mês fechado) e o do **`-32`** (segmento T3 × situação da média).
Convenções de caminho: [README](README.md#dois-códigos-uma-convenção).

---

## 1. Publicado (este repositório)

### Janela e campos
- Fonte: `batalha-time-02-lxof.hackathon_dados.extrato_sintetico`, tabela fixa ([`planning/bigquery.py:11`](../../agent_backend/planning/bigquery.py)).
- Mapeamento: `id_usuario`, `anomes`, `tipo` (E/S), `vlr`, `nom_cate_macro` ([`planning/bq_mapping.json`](../../agent_backend/planning/bq_mapping.json)).
  Valores positivos nos dois sentidos: a direção vem de `tipo`, nunca do sinal.
- Janela: **o último mês encerrado** da pessoa (`period = MAX(period)` com `period < mês corrente`,
  [`bigquery.py:86-99`](../../agent_backend/planning/bigquery.py)). Na base atual é **dezembro/2025 completo**.
  Não há linha de corte em 22/12 nem média jan–nov.
- Pessoa: por índice na lista ordenada de `id_usuario` (1 a 1.000, [`bigquery.py:71-83`](../../agent_backend/planning/bigquery.py)).
  Alias `Pessoa N da base`, gênero `NAO_INFORMADO` ([`domain.py:74-76`](../../agent_backend/planning/domain.py)).

### Regra ([`planning/domain.py:77`](../../agent_backend/planning/domain.py))

| Situação | Condição |
| --- | --- |
| `fluxo_negativo` | saídas > entradas |
| `fluxo_equilibrado` | saídas = entradas |
| `sobra_observada` | entradas > saídas |

- `arrears`, `debt`, `recurringIncome` ficam `None`: **fluxo negativo não prova dívida** e entradas não são renda
  recorrente ([`domain.py:80`](../../agent_backend/planning/domain.py), [`planning/http.py:117`](../../agent_backend/planning/http.py)).
- Categorias: `Delivery` + `Restaurantes` + "alimentação fora" somam o grupo *delivery*; "lojas e sites", "compras"
  somam *shopping* ([`domain.py:69-70`](../../agent_backend/planning/domain.py)).

### Onde a situação é usada
- Vai ao modelo em `context.financial_profile.situation` ([`planning/http.py:117`](../../agent_backend/planning/http.py)),
  junto com os fatos `BQ:*` com período e origem.
- Vai também na resposta de `GET i-agora/perfil/` (campo `situation`) para o front decidir a UI. **O front não a
  deve desenhar como rótulo.**
- **Tom:** não há tom por perfil no publicado. O tom é único ("sem julgamento nem pressão comercial",
  [`prompts/system.liquid`](../../agent_backend/conversation/prompts/system.liquid)).
- Teste: `test_plans.py::test_segmentation_is_explicit_situation_not_gender_or_credit`.

---

## 2. `-32` (fora de git)

Cinco sinais formam o caminho da conversa. Tudo é determinístico; o modelo só redige sobre uma mensagem-base.

### 2.1 Janela
- Meses completos antes do corte: **jan–nov/2025** (`-32: apps/context_agent_datadriven/pastas_raiz/estudos/i_agora/t3.py:8-9`).
- Linha de corte **2025-12-22** (`-32: desafio_itau/settings.py:108`, `DATA_CORTE`). Dezembro/2025 é parcial e fica
  fora da média. `mes_referencia` = 202511 (`-32: interacao_dados.py:156-160`).

### 2.2 Segmento T3 (`classificar_t3`, `-32: t3.py:96-108`)

```
sobra = entradas − saídas            (médias mensais da janela)
taxa  = sobra ÷ entradas
Livre       taxa ≥ 15%
Esbanjador  taxa < 15%, mas (sobra + discricionário) ÷ entradas ≥ 15%
Vulnerável  o resto, e quem não tem entrada
NAO_MEDIDO  sem dado (fonte falhou ou pessoa fora da base)
```

- Limiar 0,15: regra `t3.limiar_surplus` em `-32: desafio_itau/politica/operacional-v1.json` (lida em `t3.py:24`);
  repetido como `limiar_livre_pct: 15.0` em `-32: apps/conversas/interacao.py:177`.
- Mapa de 21 macros em essencial / compromisso / discricionário / não classificado: `-32: t3.py:39-61`.
- `NAO_MEDIDO`: `-32: interacao_cenarios.py:66`.

### 2.3 Situação da média (`-32: interacao_dados.py:228-244`)

| Situação | Condição |
| --- | --- |
| `EQUILIBRIO` | \|saldo médio\| < 1% das entradas (`situacao.equilibrio`, `limiar_pct` 1.0, `:167-179`) |
| `SOBROU` | saldo médio > 0 |
| `FALTOU` | saldo médio < 0 |
| `NAO_MEDIDO` | sem dados |

Regra do dono (27/09 06:22 BRT): o mês isolado **não** decide; o mês mais recente é só informativo (`:196`).

### 2.4 `negativado_na_media`
`"NAO_MEDIDO" if surplus is None else surplus < 0` (`-32: services/usuario_real.py:282`), servido em
`usuario-real/<indice>/saldo-mes/`. Liga o aviso `home.aviso_negativado` e a fala `bot.apoio_negativado` logo
depois de `bot.intro`.

### 2.5 Estado da proposta (`corte_seguro_ate_surplus_15`, `-32: services/plano_proposta.py`)
```
necessário = max(0, 15% × entradas − sobra)
OK                 cortes cobrem o necessário
LIVRE_SEM_CORTE    necessário = 0; reserva = min(sobra, 20% das entradas)
CORTE_INSUFICIENTE margens não cobrem → renegociar
```
No máximo 3 compromissos, só subcategorias discricionárias; Nível 1 corta 100%, Nível 2 corta 50%, Nível 3 não
corta (`:24-27`, estados `:195-199`).

### 2.6 Tom por perfil (`PERFIS_DE_RESPOSTA`, `-32: t3.py:113-138`)

| Perfil | Tom | Exclamações | Precisa usar uma de | Nunca | Proposta típica |
| --- | --- | --- | --- | --- | --- |
| Vulnerável | acolhedor e protetor | 0 | vamos, juntos, passo, organizar, proteger | novo empréstimo, novo crédito, aproveite, urgente, garantido, sem risco | `CORTE_INSUFICIENTE` |
| Esbanjador | direto e encorajador | ≤ 1 | reduzir, cortar, ajustar, meta, limite | irresponsável, descontrole, culpa, garantido, sem risco | `OK` |
| Livre | consultivo | ≤ 1 | reserva, investir, aplicar, planejar, objetivo | rentabilidade garantida, sem risco, garantido, lucro certo | `LIVRE_SEM_CORTE` |
| `NAO_MEDIDO` | acolhedor e neutro | 0 | — | afirmar sobra ou falta; zero no lugar de ausente | fluxo `aguardar_dados` / `organizar_orcamento` |

Quando a fala do roteiro não traz um termo exigido, entra a frase de `COMPLEMENTO_TOM` (`-32: apps/conversas/interacao.py:427-429`).
Exemplo medido: pessoa 1 → Vulnerável, FALTOU, −R$ 1.729,62/mês · `saldo-mes` do `…-time2` · 27/09 06:53 BRT.

### 2.7 Os 16 fluxos (segmento × situação)
Ficheiro `-32: apps/conversas/fluxos_comportamento.json`, versão `2026-09-27.2`; seleção em
`-32: interacao_cenarios.py:61-73`.

| Fluxo | Próximo passo |
| --- | --- |
| `VUL-FALTOU` | renegociar_compromissos |
| `VUL-SOBROU` | usar_sobra_para_organizar_compromissos |
| `VUL-EQUILIBRIO` | organizar_compromissos |
| `ESB-FALTOU`, `ESB-SOBROU`, `ESB-EQUILIBRIO` | limitar_maior_desejo |
| `LIV-SOBROU`, `LIV-EQUILIBRIO` | formar_reserva |
| `LIV-FALTOU` | planejar_reserva_para_meses_atipicos |
| `NM-FALTOU`, `NM-SOBROU`, `NM-EQUILIBRIO` | organizar_orcamento |
| `VUL-`, `ESB-`, `LIV-`, `NM-NAO_MEDIDO` (4) | aguardar_dados |

### 2.8 Exposição
O envelope de `conversas/interacao/` **traz** `perfil_t3`, `fluxo.segmento`, `dados.perfil_t3` e `T3:<seg>` em
`regras_aplicadas` (`-32: apps/conversas/interacao.py:170-177, 460, 630-633`), para auditoria. O front **não** os
pode desenhar. **Não existe** guard que reprove um texto do modelo que escreva o rótulo para a pessoa (pendência).

---

## 3. Notebook (simulação, não é código)

`i_agora_checkpoint.ipynb` (Colab, fora de Git) segmenta **50.000 clientes gerados com `np.random`** em Endividado
(saldo < 0) 42,2% · Vulnerável (sobra positiva < 15%) 23,4% · Saudável/Investidor (sobra ≥ 15%) 34,5%, sobre os 12
meses. O corte de 15% coincide com o `-32`; os grupos e a janela **não**. "Vulnerável" no notebook ≠ Vulnerável
no `-32`; o equivalente a "Endividado" no `-32` é `negativado_na_media`. Vale o código.
