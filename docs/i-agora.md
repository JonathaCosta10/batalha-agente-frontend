# Contrato e integração i-agora 1.0

## Fronteiras

POST `/api/v1/context-agent/conversas/mensagens/`:

```json
{"schema_version":"1.0","conversation_id":null,"client_message_id":"msg-001","message":"Quero organizar meu orçamento"}
```

`conversation_id` é opaco e pertence ao principal autenticado. `client_message_id`: 1–80 caracteres alfanuméricos, `_` ou `-`; mensagem 1–2.000 caracteres não vazios. Campos extras, incluindo `customer_id`, modelo, score, gênero ou prompt, são rejeitados. Valores relatados pelo usuário não se tornam dados bancários confirmados.

Resposta: `schema_version`, `conversation_id` (null em erros sem conversa), `message_id`, `request_id`, `status`, `reply`, `citations`. Status: `ok`, `needs_clarification`, `safe_redirect`, `unavailable`. Citações: id, url, excerpt, limitations e status da fonte, resolvidos no servidor. Texto é renderizado como texto, nunca HTML/Markdown executável.

HTTP: 400 protocolo; 401 autenticação/consentimento; 403 CSRF; 404 conversa inexistente/alheia; 409 reutilização conflitante; 429 limite; 503 dependência/validação indisponível. Recusa semântica segura usa 200/safe_redirect. Erros do SDK nunca chegam ao cliente. GET `sessao/` estabelece CSRF e, exclusivamente em demo local, cookie opaco assinado HttpOnly/SameSite Strict. Não autentica um cliente real.

## Pipeline e limites

Autorização atual → schema/minimização → classificação semântica → contexto → um LlmAgent ADK → regras determinísticas → revisor semântico → único ReleaseGate. Fallbacks são catálogo estático revisado e passam pelo gate determinístico; não dependem de um LLM indisponível. Cache também passa pelo gate. Sem streaming bruto, ferramentas de escrita, shell, SQL, busca aberta ou contratação.

Uma geração, sem auto-reparo/retry. Três chamadas no caminho normal; etapas negadas não geram rascunho nem leem contexto. Timeout total 45s; HTTP SDK 15s; UI 50s. Reenvio manual conserva o corpo/ID original. Cache liga principal + conversa original (incluindo null) + ID + hash do corpo. Timeout/cancelamento é resultado incerto e cacheado; não promete exactly-once no provedor.

Store em memória, um processo, TTL fixo 30 minutos, 100 conversas globais/5 por principal, 20 turnos por conversa, até 6 novos turnos/minuto por principal; últimos 8 itens de histórico sanitizado. Admissão simultânea retorna 429; cache não refaz chamadas. Limite de processo padrão 12 tentativas Gemini, máximo configurável 60. Reiniciar o processo reinicia os limites; não equivale a teto de billing persistente. Sem retenção em localStorage. Auditoria em buffer limitado: enums, não mensagens/identidades/segredos. SDK logging com payloads é suprimido no harness.

Sessões ADK são efêmeras por geração, só com histórico já liberado; descartam eventos rejeitados. A sessão conversacional pertence à aplicação, não ao modelo. Revisor recebe histórico minimizado como relato não confiável. Remoção de PII por padrões é defesa em profundidade, não DLP completa. Sem alegação de eliminar todo viés.

## Fontes e cálculos

`knowledge/indice.json` verifica hashes dos dois JSON normativos copiados. Hash não certifica autenticidade legal. RC8 é original; RC20 é modificadora com início declarado 2027-07-01. Antes disso é futura; a partir disso a base exige revalidação, sem consolidação automática. Data normativa é UTC do servidor, separada do período financeiro. A base institucional resume somente trechos parcialmente verificados do Código de Ética, revisão set/2024; temas pendentes não entram como evidência. Não homologado pelo Itaú.

`financial_summary` usa Decimal a partir de strings monetárias; não confunde fluxo, saldo, dívida, atraso nem entrada/renda. Fixture sintética do teste tem período 2025-12; o contexto padrão do HTTP não consulta banco e tem fatos financeiros vazios. Não foi conectado dataset do hackathon/BigQuery. Relatos do usuário não são oracle de cálculo; não se fazem cálculos financeiros livres no modelo.

## Integrar no Django existente

1. Disponibilizar `agent_backend` no PYTHONPATH do projeto (pacote namespace Python); conservar prompts/knowledge. Conciliar dependências com `requirements.lock` e rodar a suíte no ambiente do projeto, sem copiar o harness como deployment separado.
2. Incluir `path('api/v1/context-agent/conversas/', include('agent_backend.conversation.urls'))`.
3. Manter middleware de sessão/auth/CSRF do projeto. Aplicar `ReleaseMiddleware` ao prefixo, `CSRF_FAILURE_VIEW` com envelope e handlers de erro equivalentes. Produção: DEBUG false, TLS, Host/origin estritos; não copiar origens localhost.
4. Configurar `IAGORA_MODE='live'`, modelo/guard `gemini-3.5-flash-lite`, opt-in pago e budget. `IAGORA_PRINCIPAL_RESOLVER` é callable ou dotted path: recebe request com `user.is_authenticated`, revalida consentimento/acesso ATUAL e retorna identificador opaco ou None. Nunca usar `customer_id`, cabeçalhos arbitrários ou texto como principal. Revalidar antes de cache. Teste de revogação cobre esse seam, não prova o login do Django externo.
5. Antes de produção, substituir store/limites em memória por transações atômicas compartilhadas, retenção/expurgo, observabilidade sem payload e budget durável; implementar adapter financeiro autorizado com subject server-side. Não é aceitável executar este harness em múltiplos workers como se fosse persistência pronta.
6. Servir `/api` na mesma origem do front. Na troca de identidade/logout, resetar o controller; ao trocar fixture/conversa, cancelar e descartar respostas antigas. Não transportar o seletor demo para produção.

## Decisões verificadas e limitações

- Gemini 2.5 Flash-Lite retornou 404 “no longer available to new users” na conta de teste, embora apareça em list_models. Houve smoke anterior com 3.5 Flash-Lite e uma troca para 3.8 Flash. Após o 3.8 retornar 429 de cota gratuita, o responsável autorizou voltar explicitamente ao 3.5 Flash-Lite; smoke HTTP e conversa pelo preview público voltaram a responder. Nenhum fallback automático entre modelos.
- SDK google-genai 2.25.0 + response_schema/Pydantic enviava additional_properties rejeitado (400). Usa-se response_json_schema e validação Pydantic estrita local; teste do Runner verifica esse contrato.
- Documentação oficial: https://ai.google.dev/gemini-api/docs/latest-model.md ; https://ai.google.dev/gemini-api/docs/generate-content/thinking ; https://googleapis.github.io/python-genai/ ; https://google.github.io/adk-docs/ . 3.8 aceita LOW/MEDIUM/HIGH, não MINIMAL. Nenhuma afirmação de determinismo semântico.
- Guardrails podem produzir falsos positivos/negativos. Uma resposta liberada não certifica conformidade ou adequação financeira. Falhas preservadas nas evidências; cenários não executados não contam como aprovados.

## Plano de merge / hotspots

Rebase/fetch fresh antes de merge, não sobrescrever trabalho do colega. `src/App.tsx` agora é shell de conversa; o layout anterior foi preservado em `src/DemoApp.tsx`, disponível só em desenvolvimento. Hotspots contratuais: App/DemoApp, Screen3Communication, Screen2Chat e DjangoArchitectureDrawer. Preferir reconciliar mudanças visuais sobre o novo contrato tipado, sem restaurar keyword mocks/primeira-chamada. O inspector reutiliza a conversa, sem mostrar eventos internos ou métricas inventadas. Não alterar backend externo invisível. CI não usa chave e não aprova consumo/deploy/merge.
