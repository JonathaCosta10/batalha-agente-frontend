import type { IntroCard } from '../types';

export const TYPING_DELAY = 650;
export const INVITE_MESSAGE = 'Vamos olhar os dados do período e escolher um objetivo que faça sentido para você.\n\nVocê pode ajustar os limites no painel ou conversar para simular uma redução gradual. Qualquer prazo será uma hipótese calculada, não uma promessa.\n\nO plano só será registrado depois de você revisar e clicar em Assumir meus compromissos. Topa começar?';
export const PREVIOUS_INVITE_MESSAGE = 'Vamos escolher pequenas mudanças que caibam na sua rotina em janeiro?';
export const BOT = {
  confirm:'Confira os compromissos de exemplo para janeiro de 2026:',
  card:'O primeiro passo já tem nome: uma escolha sua. Preparei um card para marcar esse momento, sem mostrar seus valores pessoais.',
  // Sem nome (o servidor manda null): frase neutra, nunca um nome inventado.
  intro:(nome:string)=>nome?`Que bom ter você aqui, ${nome}!`:'Que bom ter você aqui!',
  finish:(nome:string)=>`Primeiro passo dado${nome?`, ${nome}`:''}! Seus compromissos de janeiro já estão organizados.`,
  adjust:'Ainda não consigo ajustar os valores pela conversa. Você pode seguir com os compromissos apresentados.',
  fallback:(nome:string)=>`Entendi${nome?`, ${nome}`:''}. Podemos continuar o planejamento de janeiro e voltar aos seus compromissos quando quiser.`,
  balance:(saldo:string)=>`O saldo registrado de dezembro é ${saldo}. Planejar janeiro não altera esse histórico. Use os controles da conversa para revisar suas estimativas.`,
  values:'Ainda não consigo ajustar os valores pela conversa. Os compromissos apresentados são estimativas para janeiro.',
  human:'Não consigo iniciar um atendimento por aqui. Você pode continuar o planejamento ou voltar ao início.',
};
export const USER = { challenge:'Topo o desafio', assume:'Assumir meus compromissos', saveImage:'Salvar imagem', adjust:'Ajustar valores' };
export const TOAST = {
  notices:'Seus objetivos confirmados ficam no servidor, vinculados à sessão deste navegador. Os valores são da base sintética do hackathon.',
  shared:'Compartilhamento concluído.',
  downloaded:'Download iniciado. Se quiser salvar em Fotos, abra a imagem baixada e use a opção de salvar do aparelho.',
  cancelled:'Compartilhamento cancelado. Seu plano continua salvo; tente novamente quando quiser.',
  exportFailed:'Não foi possível exportar o card. Tente novamente.',
  reset:'Planejamento reiniciado.',
};
export const INTRO_CARDS: IntroCard[] = [
  { label:'O SEU MOMENTO', title:'O próximo passo começa agora.', body:'Cada pessoa tem prioridades diferentes. Vamos observar os dados sem julgar hábitos e escolher um próximo passo possível.' },
  { label:'POR QUE O I.AGORA EXISTE', title:'Do saldo às suas escolhas.', body:'O i.agora existe para transformar números em uma conversa simples: entender seu momento, escolher prioridades e planejar compromissos possíveis, no seu ritmo.' },
];
