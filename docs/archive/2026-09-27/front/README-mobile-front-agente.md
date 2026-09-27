# i-agora — front integrado

React/Vite, preservando as telas do protótipo: início → conversa → compromissos → Acompanhe.

## Execução

```sh
npm ci
DJANGO_URL=http://127.0.0.1:8000 npm run dev
npm run lint
npm run build
node --import tsx --test src/services/backend.test.ts
```

O backend desta integração está em `JonathaCosta10/agente-app-mobile`, módulos `agent_backend/planning` e `deploy`. No Cloud Run, o build deste front e o Django são servidos na mesma origem; nenhuma chave fica no JavaScript.

## Fluxo implementado

- Abertura proativa calculada no servidor: período real, comparação de saídas/entradas e uma pergunta específica sobre a categoria observada. Não usa diagnóstico genérico nem pergunta ampla de navegação. O agente recebe essa mesma abertura no histórico para entender respostas curtas.

- `services/backend.ts`: bootstrap com cookie assinado, CSRF, perfil, abertura, conversa Gemini, proposta, confirmação idempotente, estado e reinício.
- `hooks/usePlanConversation.ts`: usa o servidor como verdade. Não carrega a antiga persona Maria, respostas por palavras-chave ou planos de localStorage.
- O perfil vem do BigQuery **sintético** do evento. Nome exibido é um alias, não identidade real. Situação de fluxo não é personalidade, dívida ou score de crédito.
- Abrir o chat mantém o perfil atual. **Testar próximo perfil** troca explicitamente a pessoa da base, sem sobrescrever seu plano anterior.
- Conversa antes de proposta: objetivo pessoal, contexto/limites, ação viável e valor mensal escolhido são cruzados com a base. Só então aparece um caso para revisão; não há formulário antecipado nem atalho "Topo o desafio". Ajustes voltam à conversa. Confirmar uma simulação **não** cria um caso nem salva um objetivo.
- **Aprovar e salvar minha meta** grava exatamente o caso apresentado no servidor. A página **Acompanhe** usa o plano confirmado; recarregar a página recupera esse plano.
- Falha de fonte permanece erro visível; não é substituída por zero nem por valores fictícios locais.
- O card PNG continua local e sem valores financeiros.

## Limites explícitos

É um MVP público de hackathon com base sintética, não banco nem canal oficial do Itaú. Persistência é vinculada ao cookie deste navegador (30 dias), sem login bancário ou sincronização entre dispositivos. Conversa é temporária; objetivos sobrevivem a reinício/deploy. O período mostrado é histórico da base; metas não prometem resultado no primeiro mês. Progresso aparece **não medido**, não como evolução inventada.

Pix, pagamentos, contratação e outros atalhos bancários ficam fora do escopo. O estilo e imagens do protótipo foram mantidos; foram acrescentados avisos de fonte/erro e controles de metas para a integração funcionar.

`planApi.ts` preserva uma fachada compatível com o consumidor antigo, agora com sessão/CSRF e metas escolhidas. O contrato anterior com `ref: person.id+1`, corte automático para 15% e fallback de exemplo não é o runtime publicado. A versão de origem foi conciliada até `63f5c6f`; documentos anteriores em `docs/integracao/` são referência histórica, não contrato executável desta versão.

Detalhes do backend, infraestrutura e limites: `agente-app-mobile/deploy/README.md`.
