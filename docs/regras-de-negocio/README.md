# Regras de negócio do i.agora

Documentos internos que mapeiam **comportamentos** e **interações manipuláveis** no recorte da entrega. Cada regra
diz onde vive no código, em que repositório, e que teste a cobre.

| Documento | Conteúdo |
| --- | --- |
| [perfis-e-situacoes.md](perfis-e-situacoes.md) | Como a situação/perfil interno é derivado, campos, limiares, janela de dados, tom por perfil |
| [fluxo-de-atendimento.md](fluxo-de-atendimento.md) | Etapas e transições, o que o modelo recebe, guardas, `proximas_acoes`, encaminhamento |
| [interacoes-manipulaveis.md](interacoes-manipulaveis.md) | Tabela de todos os botões de ajuste (limiares, modelo, quotas, tempos, memória, variáveis de ambiente) |
| [memoria-de-conversas.md](memoria-de-conversas.md) | O que a conversa lembra: EXISTE / PARCIAL / PLANEJADO / NAO_MEDIDO |
| [falas-e-roteiro.md](falas-e-roteiro.md) | Inventário das 188 falas fixas do front e o pedido de roteiro como variáveis |
| [perfil-e-registro-da-sessao.md](perfil-e-registro-da-sessao.md) | Por que todo visitante vê a "Pessoa 1 da base", o registro anónimo da sessão, cookies, GCS sem expiração e a correção recomendada |

Páginas publicadas como artefato e o guard do padrão: [../artefatos/README.md](../artefatos/README.md).

## Dois códigos, uma convenção

| Rótulo | Repositório | Estado |
| --- | --- | --- |
| **publicado** | este (`agente-app-mobile`): `agent_backend/`, `deploy/` | no ar (Cloud Run `i-agora-00004-zhd`, `main` = `04357b9`) |
| **`-32`** | cópia de trabalho `backend-agente-conversacional/` (sessão 32 do backend do time) | **fora de git**, sem hash; lido em 27/09/2026 |

Caminhos sem prefixo são deste repositório. Caminhos com `-32:` são relativos à raiz de
`backend-agente-conversacional/`. Os números de linha valem para o estado lido em 27/09/2026; o `-32` pode ter
mudado depois, porque não tem histórico.

## Como mudar uma regra com segurança

1. **Localize** a regra em [interacoes-manipulaveis.md](interacoes-manipulaveis.md): ficheiro, linha, repositório.
2. **Confirme em que código ela vale.** Muitas regras (perfil T3, 15%, cortes, extremos, sessão de 4 h) existem só
   no `-32` e **não** estão no ar. Mudá-las não muda o serviço publicado.
3. **Leia o teste que a cobre** (tabela abaixo). Se não houver teste, escreva primeiro um caso que *tem de
   reprovar* com o valor antigo e passar com o novo (prova negativa).
4. **Mude num só sítio.** Limiares repetidos em mais de um ficheiro (ex.: 15% em `t3.py` e `interacao.py` no `-32`)
   mudam juntos, ou a regra passa a divergir de si mesma.
5. **Corra a suíte:** `python -m pytest agent_backend/tests -q` aqui; `python -m unittest discover -s tests` no `-32`.
6. **Textos:** qualquer fala nova passa por `safe_text` ([`conversation/rules.py:24`](../../agent_backend/conversation/rules.py))
   e pelo guard de saída. Falas fixas do roteiro do `-32` **não** passam por todos os guards (ver
   [fluxo-de-atendimento.md](fluxo-de-atendimento.md)).
7. **Nunca** exponha o perfil à pessoa nem troque um dado ausente por zero.
8. Registe a mudança no README principal (§17 Histórico) e, se muda número publicado, com selo.

## Regra → teste

### Publicado (`agent_backend/tests/`)

| Regra | Teste |
| --- | --- |
| Situação observada é explícita, sem gênero nem crédito | `test_plans.py::test_segmentation_is_explicit_situation_not_gender_or_credit` |
| Confirmação persiste, repete sem duplicar, isola por pessoa | `test_plans.py::test_plan_confirmation_persists_replays_and_isolates` |
| Base observada não pode ser alterada pelo browser | `test_plans.py::test_confirm_rejects_client_change_of_observed_baseline` |
| Proposta só depois de conversa; atalho não cria caso | `test_natural_dialogue.py::test_open_and_proposal_shortcut_never_create_case`, `test_confirm_requires_case_not_just_numbers` |
| Caso preso às falas reais (`source_refs`) | `test_natural_dialogue.py::test_source_refs_preserve_actual_words_instead_of_model_paraphrase`, `test_case_grounded_in_iterative_dialogue_and_source` |
| Caso só sai depois dos dois guards | `test_natural_dialogue.py::test_case_only_released_after_dialogue_and_both_guards` |
| Projeção exige confirmação; taxas 5%/8% | `test_projection.py` (7 testes) |
| Guard reprovado não liberta rascunho; deny não gera | `test_guards_sessions.py::test_guard_schema_failure_does_not_release_draft`, `test_deny_does_not_generate_or_read_context` |
| Evidência desconhecida reprova | `test_guards_sessions.py::test_unknown_evidence_rejects_draft` |
| Timeout e limite de sessão; expiração limpa cache | `test_guards_sessions.py::test_timeout_is_cached_and_total_session_is_bounded`, `test_expiration_purges_cache_and_conversation_together` |
| 6 mensagens/min por pessoa | `test_privacy.py::test_rate_limit_and_approved_trace_are_bounded_per_principal` |
| Minimização antes de qualquer chamada | `test_service.py::test_sensitive_input_is_minimized_before_any_provider_stage` |
| Texto inseguro reprovado mesmo se o guard aprovar | `test_service.py::test_deterministic_output_rejects_unsafe_draft_even_if_semantic_allows` |
| Modelo por omissão `gemini-3.5-flash-lite` | `test_model_choice.py::test_requested_flash_lite_is_default_for_agent_and_guards` |
| Orçamento de chamadas antes do provedor; orçamento diário persiste | `test_gateway.py::test_budget_admission_before_provider_construction`, `test_integrated_planning.py::test_persistent_budget_survives_runtime_reset` |
| BigQuery com dry run e parâmetros | `test_integrated_planning.py::test_bq_query_enforces_dry_run_and_parameters` |
| Igualdade salarial respondida com fonte | `test_fairness.py` |
| Prompts estáticos e estritos | `test_prompts.py` |

### `-32` (`tests/`, fora de git)

| Regra | Teste |
| --- | --- |
| Segmento T3 e tom | `test_t3_guard_i_agora.py` |
| Situação da média e `negativado_na_media` | `test_conversas_interacao.py`, `test_usuario_real.py`, `test_controle_conversa.py` |
| 16 fluxos e cenários do texto livre | `test_conversas_interacao_cenarios.py` |
| Guards `coerencia.sentido` e `alucinacao.periodo` | `test_conversas_interacao.py` |
| Extremos | `test_conversas_extremos.py`, `test_controle_conversa.py` |
| Proposta `corte_seguro_ate_surplus_15` | `test_plano_proposta.py`, `test_consultas_i_agora.py`, `test_conversas_interacao.py` |
| Roteiro de falas | `test_controle_conversa.py` |
| `perfil-usuario/definir/` | `test_perfil_usuario.py`, `test_conversas_http.py` |
| Memória e limites do serviço | `test_conversas_service.py`, `test_conversas_http.py` |
| **Sem teste** | `_guard_entrada`, `INTERACAO_GUARD_ENTRADA_MODELO`, `SESSAO_SEGUNDOS` |
