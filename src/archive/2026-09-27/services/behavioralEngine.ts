import {
  Customer,
  ChatVariable1,
  SpreadsheetProductItem,
  Template3Response,
  AgentContext,
} from '../types';

export const RAW_PLANILHA_FIXA: Omit<
  SpreadsheetProductItem,
  'scorePropensaoCliente' | 'statusElegibilidade'
>[] = [
  {
    codigo: 'ITAU-INV-01',
    produto: 'CDB Itaú Personalizado Pós-Fixado',
    categoria: 'Investimentos',
    taxaOuRetorno: '104% a 112% do CDI',
    carenciaPrazo: 'Liquidez Diária ou 360 dias',
    scoreMinimo: 400,
    publicoAlvo: 'Geral com reserva ou objetivo de rentabilidade',
    beneficioChave: 'Garantia FGC e rentabilidade progressiva com aportes programados',
    afinidadeF: 92,
    afinidadeM: 88,
  },
  {
    codigo: 'ITAU-CRED-02',
    produto: 'Crédito Sob Medida com Taxa Bonificada',
    categoria: 'Crédito & Fluxo',
    taxaOuRetorno: 'A partir de 1,19% a.m.',
    carenciaPrazo: 'Até 90 dias para 1ª parcela',
    scoreMinimo: 300,
    publicoAlvo: 'Otimização de capital de giro pessoal e consolidação',
    beneficioChave: 'Sem cobrança de TAC e contratação 100% digital com liberação imediata via Pix',
    afinidadeF: 85,
    afinidadeM: 90,
  },
  {
    codigo: 'ITAU-CARD-03',
    produto: 'Cartão Itaú Carbon Platinum / Black',
    categoria: 'Meios de Pagamento',
    taxaOuRetorno: 'Pontos Átomos (até 2,5 pts/$) ou Cashback de 1,5%',
    carenciaPrazo: 'Anuidade 100% isenta por volume de gastos',
    scoreMinimo: 600,
    publicoAlvo: 'Alta transacionalidade e viagens',
    beneficioChave: 'Acesso a salas VIP, tag de pedágio sem mensalidade e seguros de viagem',
    afinidadeF: 94,
    afinidadeM: 91,
  },
  {
    codigo: 'ITAU-PREV-04',
    produto: 'Previdência & Planejamento Sucessório',
    categoria: 'Previdência & Futuro',
    taxaOuRetorno: 'Taxa zero de custódia e carregamento de entrada',
    carenciaPrazo: 'Planos PGBL / VGBL a partir de R$ 100/mês',
    scoreMinimo: 500,
    publicoAlvo: 'Planejamento de longo prazo e eficiência tributária',
    beneficioChave: 'Dedução de até 12% da renda bruta tributável no IRPF anual',
    afinidadeF: 89,
    afinidadeM: 82,
  },
  {
    codigo: 'ITAU-PROT-05',
    produto: 'Seguro Vida & Proteção Integrada',
    categoria: 'Seguros',
    taxaOuRetorno: 'Prêmio a partir de R$ 19,90/mês',
    carenciaPrazo: 'Vigência imediata após confirmação',
    scoreMinimo: 200,
    publicoAlvo: 'Proteção de renda familiar e cobertura em vida',
    beneficioChave: 'Assistência funeral familiar, telemedicina Einstein 24h e sorteios mensais',
    afinidadeF: 96,
    afinidadeM: 84,
  },
];

export function calculateAgentContext(customer: Customer): AgentContext {
  const score = customer.scoreComportamental;
  const genero = customer.genero;
  const nome = customer.nome;

  let nivel: 'ALTO' | 'MEDIO' | 'BAIXO';
  let indiceCode: string;
  let temperaturaAgente: number;
  let focoEstrategico: string;
  let tomComunicacao: string;
  let gatilhoAcao: string;

  if (score >= 750) {
    nivel = 'ALTO';
    indiceCode = 'CTX-750-ALPHA';
    temperaturaAgente = 0.3;
    focoEstrategico = 'Retenção de valor, diversificação patrimonial e produtos de alto padrão';
    tomComunicacao = 'Executivo, consultivo, seguro e proativo';
    gatilhoAcao = 'Apresentar condições exclusivas de alocação e benefícios de cartão black';
  } else if (score >= 450) {
    nivel = 'MEDIO';
    indiceCode = 'CTX-450-BETA';
    temperaturaAgente = 0.5;
    focoEstrategico = 'Crescimento sustentável, proteção familiar e consolidação de fluxo de caixa';
    tomComunicacao = 'Colaborativo, estruturado, orientador e encorajador';
    gatilhoAcao = 'Oferecer simulações comparativas e otimização de limites';
  } else {
    nivel = 'BAIXO';
    indiceCode = 'CTX-150-GAMMA';
    temperaturaAgente = 0.2;
    focoEstrategico = 'Educação financeira, regularização, controle de custos e reserva simples';
    tomComunicacao = 'Acolhedor, didático, transparente e sem termos técnicos complexos';
    gatilhoAcao = 'Apresentar alternativas de alívio orçamentário e início de reserva segura';
  }

  const promptContextualizacao = `[SISTEMA: AGENTE ITAÚ BATALHA DE AGENTES TIME 2]
INDICE_CORTE: ${indiceCode} | NIVEL_PROPENSAO: ${nivel} (Score: ${score}/1000)
CLIENTE_ID: ${customer.id} | NOME: ${nome} | GENERO: ${genero}
DIRETRIZ_COMPORTAMENTAL: ${customer.diretrizComportamental}
FOCO_ESTRATEGICO: ${focoEstrategico}
TOM_VOZ: ${tomComunicacao}
GATILHO_OPERACIONAL: ${gatilhoAcao}
GUARDRAIL: Manter tom alinhado ao score comportamental e respeitar normas regulatórias Bacen/CVM.`;

  return {
    score,
    nivel,
    indiceCode,
    temperaturaAgente,
    focoEstrategico,
    tomComunicacao,
    gatilhoAcao,
    promptContextualizacao,
  };
}

export function generateChatVariable1(
  customer: Customer,
  isChaveAtiva: boolean = true
): ChatVariable1 {
  const isFemale = customer.genero === 'F';
  const primeiroNome = customer.primeiroNome;

  const saudacao = `Que bom ter você aqui, ${primeiroNome}!`;

  const paragrafoComum1 =
    'Hoje, seu dinheiro está concentrado no presente, deixando pouco espaço para imprevistos e planos futuros.';
  const paragrafoComum2 =
    'Pequenas mudanças podem trazer mais equilíbrio. Você já sabe onde está, chegou a hora de decidir seu próximo passo.';

  const textoCompleto = `${paragrafoComum1}\n\n${paragrafoComum2}`;

  const texto1Neutro = {
    tag: 'TEXTO_1[NEUTRO]' as const,
    paragrafo1: paragrafoComum1,
    paragrafo2: paragrafoComum2,
    textoCompleto,
  };

  const texto2Masculino = {
    tag: 'TEXTO_2[MASCULINO]' as const,
    paragrafo1: paragrafoComum1,
    paragrafo2: paragrafoComum2,
    textoCompleto,
  };

  const texto3Feminino = {
    tag: 'TEXTO_3[FEMININO]' as const,
    paragrafo1: paragrafoComum1,
    paragrafo2: paragrafoComum2,
    textoCompleto,
  };

  // CHAVE ON-OFF:
  // Se Chave ON (Padrão): Liga o modo 'Neutro' como template ativo universal (ex: Maria e João)
  // Se Chave OFF: Segue a variante de gênero (TEXTO_3 para F, TEXTO_2 para M)
  const chaveInteracaoTelaIAI = isChaveAtiva ? 'ON' : 'OFF';
  const modoAtivo = isChaveAtiva ? 'NEUTRO' : (isFemale ? 'FEMININO' : 'MASCULINO');
  
  const tagAtiva = isChaveAtiva
    ? 'TEXTO_1[NEUTRO]'
    : isFemale
    ? 'TEXTO_3[FEMININO]'
    : 'TEXTO_2[MASCULINO]';

  const textoAtivo = textoCompleto;
  const tituloAbordagem = isChaveAtiva
    ? 'Auditoria Itaú · Modo Neutro Universal'
    : isFemale
    ? 'Auditoria Personalizada · Perfil Feminino'
    : 'Auditoria Personalizada · Perfil Masculino';

  return {
    genero: customer.genero,
    variavelNome: primeiroNome,
    chaveInteracaoTelaIAI,
    modoAtivo,
    saudacao,
    texto1Neutro,
    texto2Masculino,
    texto3Feminino,
    textoAtivo,
    tagAtiva,
    tituloAbordagem,
    botaoProximo: 'E agora?',
  };
}

export function generateTemplate3Response(customer: Customer): Template3Response {
  const contextoAgente = calculateAgentContext(customer);
  const isFemale = customer.genero === 'F';
  const score = customer.scoreComportamental;

  const planilhaFixa: SpreadsheetProductItem[] = RAW_PLANILHA_FIXA.map((item) => {
    const baseAffinity = isFemale ? item.afinidadeF : item.afinidadeM;
    const scoreFactor = Math.min(1.0, score / 1000);
    const scorePropensaoCliente = Math.round(baseAffinity * (0.6 + 0.4 * scoreFactor));
    const statusElegibilidade: 'Pré-Aprovado' | 'Em Análise' =
      score >= item.scoreMinimo ? 'Pré-Aprovado' : 'Em Análise';

    return {
      ...item,
      scorePropensaoCliente,
      statusElegibilidade,
    };
  }).sort((a, b) => b.scorePropensaoCliente - a.scorePropensaoCliente);

  const resumoExecutivo = `Interface de comunicação gerada para ${customer.nome} (ID #${customer.id}, Gênero: ${customer.genero}). Ponto de índice: ${contextoAgente.indiceCode} (${score}/1000). Postura do agente: ${contextoAgente.tomComunicacao}.`;

  return {
    templateId: 'TEMPLATE_3_FIXED_SPREADSHEET',
    cliente: {
      id: customer.id,
      nome: customer.nome,
      genero: customer.genero,
      scoreComportamental: score,
      segmento: customer.segmento,
    },
    contextoAgente,
    planilhaFixa,
    resumoExecutivo,
  };
}
