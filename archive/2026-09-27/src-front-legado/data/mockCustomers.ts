import { Customer, Gender, IndexCutoffLevel } from '../types';

const NOMES_F = [
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela',
  'Helena', 'Isabela', 'Juliana', 'Larissa', 'Mariana', 'Natália', 'Patrícia',
  'Rafaela', 'Sofia', 'Tatiane', 'Vanessa', 'Yasmin', 'Carolina'
];

const NOMES_M = [
  'Alexandre', 'Bruno', 'Carlos', 'Diego', 'Eduardo', 'Felipe', 'Gabriel',
  'Henrique', 'Igor', 'João', 'Lucas', 'Mateus', 'Nicolas', 'Otávio',
  'Paulo', 'Rafael', 'Rodrigo', 'Thiago', 'Vinícius', 'Vitor'
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'
];

export function getCustomerById(id: number): Customer {
  const safeId = Math.min(1000, Math.max(1, id));
  // Regra de negócio: ID % 2 === 0 -> 'F', ID % 2 !== 0 -> 'M'
  const isFemale = safeId % 2 === 0;
  const genero: Gender = isFemale ? 'F' : 'M';

  const nomeBase = isFemale
    ? NOMES_F[Math.floor(safeId / 2) % NOMES_F.length]
    : NOMES_M[Math.floor((safeId - 1) / 2) % NOMES_M.length];

  const sobrenome = SOBRENOMES[(safeId * 7) % SOBRENOMES.length];
  const nomeCompleto = `${nomeBase} ${sobrenome}`;

  // Score determinístico de 0 a 1000 baseado no ID
  const baseScore = ((safeId * 37) % 850) + 150;
  const scoreComportamental = Math.min(1000, Math.max(120, baseScore));

  let indiceCorte: IndexCutoffLevel;
  let segmento: 'Itaú Varejo' | 'Itaú Uniclass' | 'Itaú Personnalité';
  let diretrizComportamental: string;

  if (scoreComportamental >= 750) {
    indiceCorte = 'ALTA_PROPENSAO';
    segmento = scoreComportamental > 850 ? 'Itaú Personnalité' : 'Itaú Uniclass';
    diretrizComportamental =
      'Abordagem consultiva, sofisticada e proativa. Enfatizar rentabilidade, benefícios exclusivos e assessoria especializada.';
  } else if (scoreComportamental >= 450) {
    indiceCorte = 'MEDIA_PROPENSAO';
    segmento = 'Itaú Uniclass';
    diretrizComportamental =
      'Abordagem equilibrada e orientada a metas. Foco em otimização de fluxo financeiro, seguros e planejamento estruturado.';
  } else {
    indiceCorte = 'BAIXA_PROPENSAO';
    segmento = 'Itaú Varejo';
    diretrizComportamental =
      'Abordagem didática, acolhedora e de alívio financeiro. Priorizar controle de gastos, microcrédito e reserva de emergência.';
  }

  const saldoEstimado = Math.round((1500.0 + ((scoreComportamental * 28.5) % 45000)) * 100) / 100;
  const limiteCartao = Math.round((2000.0 + ((scoreComportamental * 35.0) % 65000)) * 100) / 100;
  const tempoRelacionamentoMeses = 12 + ((safeId * 3) % 120);

  return {
    id: safeId,
    nome: nomeCompleto,
    primeiroNome: nomeBase,
    genero,
    scoreComportamental,
    indiceCorte,
    segmento,
    saldoEstimado,
    limiteCartao,
    diretrizComportamental,
    tempoRelacionamentoMeses,
    chavePix: `${nomeBase.toLowerCase()}.${sobrenome.toLowerCase()}@itau.com.br`,
    contaNumero: `${10000 + (safeId * 37) % 89999}-${safeId % 9}`,
    agencia: `0${100 + (safeId % 899)}`,
  };
}

export function getRandomCustomerId(): number {
  return Math.floor(Math.random() * 1000) + 1;
}
