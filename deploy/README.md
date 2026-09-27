# MVP integrado — Cloud Run

## Componentes

- Projeto `batalha-time-02-lxof`, Cloud Run `i-agora`, região `us-central1`.
- Front: `src/` deste repositório (desde 2026-09-27: `47ee715` de `JonathaCosta10/mobile-front-agente`, importado com a história; antes, cópia de `de7ff9d`, hoje em `archive/front-legado/`), compilado com `npm run build` para `/app/front_dist`.
- Backend: Django + ADK/Gemini `gemini-3.5-flash-lite`; entrada e saída verificadas; cálculos Decimal.
- Dados: consulta real a `batalha-time-02-lxof.hackathon_dados.extrato_sintetico`. A tabela contém dados sintéticos do evento, não contas bancárias reais.
- Objetivos: objetos privados no bucket `iagora-state-951291470271`. SQLite por sessão é materializado temporariamente, transacionado e enviado com `ifGenerationMatch`; não se monta SQLite em GCS/FUSE. Conflito retorna 409. Objetivos e idempotência sobrevivem a novas instâncias.
- Firestore não é utilizado: bloqueado pela política organizacional do projeto.
- Secret Manager: `i-agora-gemini` e `i-agora-signing`, versão 1. Nenhuma credencial pessoal ADC no container/imagem.
- Identidade: service account preexistente `squad-agent-sa`. As permissões herdadas do hackathon são amplas (incluem BigQuery admin); esta implementação não as ampliou. Aplicação só executa SQL parametrizado de leitura contra tabela fixa. Não representa IAM mínimo de produção.

## Mapeamento e segmentação

`bq_mapping.json` mapeia colunas verificadas: `id_usuario`, `anomes`, `tipo` E/S, `vlr`, `nom_cate_macro`. Valores são positivos em ambas as direções; não usar sinal para inferir débito. Consulta usa último mês encerrado disponível por pessoa, máximo de 100 MB por consulta, dry run, parâmetros, cache de 15 minutos e falha fechada em truncamento/direção desconhecida.

Situação explicável: saídas > entradas → `fluxo_negativo`; iguais → `fluxo_equilibrado`; entradas > saídas → `sobra_observada`. Não infere gênero, propensão, crédito, saúde, religião ou personalidade. Fluxo negativo não comprova dívida. Entradas não são tratadas automaticamente como renda recorrente.

Grupo delivery/refeições = Delivery + Restaurantes (explicitamente rotulado); lojas/sites = categoria correspondente. Outras reduções não podem duplicar esses grupos. Nenhum corte ou percentual de reserva é imposto. Hipóteses de redução composta 5%/8% são usadas só em simulação confirmada, não como política Itaú ou promessa.

## Contrato efetivamente publicado

Prefixo `/api/v1/context-agent/`:
- GET `conversas/sessao/`: cookie assinado HttpOnly, SameSite Strict e token CSRF.
- POST `conversas/mensagens/`: schema 1.0 original, sem identidade informada pelo browser.
- GET `i-agora/perfil/`; POST `i-agora/sessao/abertura/` com `{next?:boolean}`.
- GET/DELETE/PATCH `i-agora/plano/`; POST `i-agora/plano/proposta/`; PATCH `i-agora/plano/rascunho/`.
- POST `i-agora/plano/proposta/` apenas lê um caso conversacional pronto; sem ele retorna 409. DELETE nessa rota retira o caso para continuar a conversa. PATCH de rascunho é recusado: ajustes são conversacionais. Reset apaga também histórico/projeções pendentes da sessão no agente.
- POST `i-agora/plano/confirmar/`: `{version,plan,clientRequestId}`; replay idêntico não duplica, plano obsoleto conflita, base observada não pode ser alterada. Exige caso produzido após diálogo e plano idêntico ao apresentado; não permite pular a conversa enviando apenas números.
- GET `i-agora/acompanhamento/`: somente objetivos confirmados; progresso `NAO_MEDIDO` até existirem novos movimentos comparáveis.
- GET `/api/health/`: release, hospedagem, modelo e tipo de armazenamento, sem segredos.

## Build e operação

Compile o front e copie apenas `dist/` para `front_dist/` em uma pasta de release junto de `agent_backend/`, `deploy/` e `deploy/Dockerfile` como `Dockerfile`. Exclua `.env`, ADC, chaves, `.git`, caches, testes e evidências da imagem. Cloud Build publica no Artifact Registry `agentes/i-agora`; Cloud Run usa **digest**, não tag mutável.

Configuração: 1 vCPU, 1 GiB, zero instâncias mínimas, máximo 1, concorrência 4; único worker preserva isolamento do histórico em memória. `IAGORA_HOSTS` contém domínios exatos; CSRF restrito à mesma origem; CSP, HSTS, no-store em APIs e proteção contra traversal. Runtime público é habilitado **somente para esta base sintética**.

Limites: 6 mensagens/minuto por sessão, 20 turnos/conversa, 900 tentativas Gemini/dia persistidas em GCS (falhas contam; reinício não zera), até 100 MB por query. Não são teto financeiro global do projeto nem reserva de quota do provedor. Sem retry/fallback de modelo silencioso.

Cookies duram 30 dias; planos são recuperados nesse navegador. Histórico conversacional é temporário e não é login bancário. Sem evolução fabricada, Pix, transferência, oferta ou acesso a conta real. API pública permanece um piloto limitado, não homologação de segurança bancária.

## Verificação

`python -m pytest agent_backend/tests -q`; `python scripts/secret_scan.py`; no front `npm run lint`, `npm run build`, `node --import tsx --test src/services/backend.test.ts`.

Além da suíte determinística, executar conversa real → confirmação da simulação → gravação explícita → Acompanhe → refresh → nova revisão mantendo objetivo; testar sessão diferente, CSRF ausente/origem inválida, replay, base adulterada e erros de fonte. Registrar o digest e a revisão exatos. Para rollback, direcionar tráfego à revisão Cloud Run anterior; o estado privado permanece separado da imagem.
