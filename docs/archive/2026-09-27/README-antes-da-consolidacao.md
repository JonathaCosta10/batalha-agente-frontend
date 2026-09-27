# i-agora — conversa com guardrails

## Runtime integrado atual

O MVP integrado usa o front **mobile-front-agente**, BigQuery real (base sintética do hackathon), objetivos persistidos e deploy **Cloud Run**. Contrato executável, infraestrutura e limites em [deploy/README.md](deploy/README.md). O front legado e instruções do harness abaixo são referências locais anteriores; não descrevem o runtime integrado. Em especial, o runtime atual salva objetivos após confirmação explícita e mantém o orçamento diário de chamadas fora do processo.

Protótipo de educação financeira contextual, não canal oficial do Itaú. Sem contratação, ofertas ou movimentação financeira.

O front React/Vite usa um contrato de conversa versionado. `agent_backend/` é um pacote Python integrável com harness Django local executável; não altera o Django externo.

## Testar agora, sem chamada paga

Requisitos: Node 22, Python 3.11. Na raiz:

```sh
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r agent_backend/requirements.lock
.venv/bin/python -m agent_backend.manage runserver 127.0.0.1:8000 --noreload
```

Em outro terminal:

```sh
npm run dev -- --host=127.0.0.1
```

No Windows, substitua `.venv/bin/python` por `.venv\Scripts\python.exe`.
O modo padrão `demo` retorna resposta fixa identificada, sem simular IA. O Vite encaminha `/api/v1/context-agent` ao harness. Não exponha diretamente esses servidores na internet.

“Ver layout legado sintético” preserva o desenho anterior e o seletor de fixtures também no preview compilado. Saldos, perfis, taxas e ofertas desse layout são fictícios e não entram na conversa. O chat e o inspetor utilizam o mesmo pipeline protegido; o preview começa pela conversa isolada.

## Gemini real

Modelo padrão: `gemini-3.5-flash-lite`, agente e guards, `thinking_level=LOW`, escolhido explicitamente após o limite de requisições do 3.8. Sem fallback silencioso, ferramentas ou retry automático. Após configurar `GEMINI_API_KEY` pelo ambiente privado/secret manager do servidor e autorizar consumo:

```sh
IAGORA_MODE=demo_live IAGORA_ALLOW_PAID_CALLS=yes IAGORA_MAX_CALLS=12 \
  .venv/bin/python -m agent_backend.manage runserver 127.0.0.1:8000 --noreload
```

Nunca use `VITE_*`, arquivo versionado ou argumento contendo a chave. `demo_live` usa cookie assinado local e somente mensagens sintéticas. `live` exige autenticação Django e `IAGORA_PRINCIPAL_RESOLVER`; sem isso falha fechado. Não há dados bancários reais. Billing/quota não são deduzidos da chave. O teto de tentativas é por processo e reinicia com ele.

Evidência 3.8: um caso passou pelas três etapas via HTTP; chamadas seguintes retornaram 503 do provedor. Avaliação live parcial, não homologação. Sem retries pagos para mascarar indisponibilidade.

## Verificar

```sh
npm test
npm run lint
npm run build
.venv/bin/python -m pytest agent_backend/tests -q
.venv/bin/python -m agent_backend.manage check
.venv/bin/python -m agent_backend.smoke --output /tmp/i-agora-demo.json
python3 scripts/secret_scan.py
```

Smoke pago separado: `.venv/bin/python -m agent_backend.smoke --live --cases 1 --output /tmp/i-agora-live.json`. Aceita `--key-file` apontando para arquivo privado 0600 fora do repo, nunca o conteúdo da chave. Até três chamadas por caso; interrompe na primeira falha. A proposta de CI em `docs/ci/conversation.yml` não usa credenciais nem faz chamadas pagas. Ela está INATIVA neste draft: a credencial de publicação não possui permissão `workflow`. Um mantenedor precisa revisar e mover o YAML para `.github/workflows/`, executar o CI no head exato e aprovar antes de merge. Testes locais não substituem esse gate.

## Projeção de gasto mensal e posicionamento

A conversa coleta objetivo, categoria, gasto mensal atual/alvo e mês de referência, uma pergunta por vez. Propostas estruturadas precisam corresponder a trechos informados pelo usuário e passam por confirmação explícita antes do motor Decimal. Cenários compostos de 5% e 8% são hipóteses, não regras do Itaú nem prazo para acumular patrimônio. O caso R$ 600 → R$ 350 retorna 11 e 7 meses; nenhum compromisso é salvo. Valores inválidos, alvo zero, objetivo já alcançado e isolamento/replay possuem testes.

A política institucional contesta premissas discriminatórias em vez de desviar para uma recusa genérica. O caso salarial de gênero possui resposta revisada, ligada ao Código de Ética de 2024 (pp. 10–11) e ainda verificada pelo guard de saída. Outros temas seguem análise contextual e fontes parciais; isso não certifica conformidade nem representa fala oficial do banco.

## Backend externo e colaboração

As referências recém-publicadas pelo colega ficam preservadas em [docs/architecture.md](docs/architecture.md) e no [backend separado](https://github.com/JonathaCosta10/desafio-itau-batalha-de-agentes-time2). Os contratos `primeira-chamada`, `enviar-mensagem`, migrações e leitura de `API_KEY_SECRECT`/`.secrets` pertencem àquele backend: este pacote não presume executá-los, e lê somente `GEMINI_API_KEY`. Não rodar os dois backends na mesma porta.

O contrato atual é `POST /api/v1/context-agent/conversas/mensagens/`; consulte [integração e limites](docs/i-agora.md). O inspector reutiliza esse mesmo pipeline, nunca publica resposta bruta. Os arquivos do colega foram preservados; a documentação anterior descreve o fluxo legado, não prova de integração com este agente. Relatórios em `agent_backend/evidence/` distinguem demo, fakes e modelo live usado. Nenhum merge/deploy de produção é realizado por este PR.
