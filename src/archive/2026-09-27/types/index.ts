export type Gender = 'F' | 'M';

export type IndexCutoffLevel = 'ALTA_PROPENSAO' | 'MEDIA_PROPENSAO' | 'BAIXA_PROPENSAO';

export interface Customer {
  id: number;
  nome: string;
  primeiroNome: string;
  genero: Gender;
  scoreComportamental: number; // 0 to 1000
  indiceCorte: IndexCutoffLevel;
  segmento: 'Itaú Varejo' | 'Itaú Uniclass' | 'Itaú Personnalité';
  saldoEstimado: number;
  limiteCartao: number;
  diretrizComportamental: string;
  tempoRelacionamentoMeses: number;
  chavePix: string;
  contaNumero: string;
  agencia: string;
}

export interface ChatVariable1 {
  genero: Gender;
  variavelNome: string;
  chaveInteracaoTelaIAI: 'ON' | 'OFF';
  modoAtivo: 'NEUTRO' | 'FEMININO' | 'MASCULINO';
  saudacao: string; // "Que bom ter você aqui, [Nome]!"
  texto1Neutro: {
    tag: 'TEXTO_1[NEUTRO]';
    paragrafo1: string;
    paragrafo2: string;
    textoCompleto: string;
  };
  texto2Masculino: {
    tag: 'TEXTO_2[MASCULINO]';
    paragrafo1: string;
    paragrafo2: string;
    textoCompleto: string;
  };
  texto3Feminino: {
    tag: 'TEXTO_3[FEMININO]';
    paragrafo1: string;
    paragrafo2: string;
    textoCompleto: string;
  };
  textoAtivo: string;
  tagAtiva: 'TEXTO_1[NEUTRO]' | 'TEXTO_2[MASCULINO]' | 'TEXTO_3[FEMININO]';
  tituloAbordagem: string;
  botaoProximo: string; // "E agora?"
}

export interface SpreadsheetProductItem {
  codigo: string;
  produto: string;
  categoria: string;
  taxaOuRetorno: string;
  carenciaPrazo: string;
  scoreMinimo: number;
  publicoAlvo: string;
  beneficioChave: string;
  scorePropensaoCliente: number;
  statusElegibilidade: 'Pré-Aprovado' | 'Em Análise';
  afinidadeF: number;
  afinidadeM: number;
}

export interface AgentContext {
  score: number;
  nivel: 'ALTO' | 'MEDIO' | 'BAIXO';
  indiceCode: string;
  temperaturaAgente: number;
  focoEstrategico: string;
  tomComunicacao: string;
  gatilhoAcao: string;
  promptContextualizacao: string;
}

export interface Template3Response {
  templateId: string;
  cliente: {
    id: number;
    nome: string;
    genero: Gender;
    scoreComportamental: number;
    segmento: string;
  };
  contextoAgente: AgentContext;
  planilhaFixa: SpreadsheetProductItem[];
  resumoExecutivo: string;
}

export type ScreenType = 'home' | 'chat' | 'communication';
