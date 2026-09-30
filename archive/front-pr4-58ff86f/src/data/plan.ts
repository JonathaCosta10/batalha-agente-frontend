import type { Category } from '../types';

export const STORAGE_KEY = 'i-agora-maria-janeiro-2026-v4';
export const CATEGORY_ORDER: Category[] = ['delivery', 'shopping', 'other', 'reserve'];
export const PHRASE_PRIORITY: Category[] = ['delivery', 'shopping', 'reserve', 'other'];
export const LABELS: Record<Category,string> = {
  delivery:'Delivery e refeições fora', shopping:'Lojas e sites',
  reserve:'Reserva para imprevistos', other:'Outros gastos flexíveis'
};
export const PHRASES: Record<Category,string[]> = {
  delivery:['Meu delivery vai sentir saudade. Meus planos vão agradecer.','Hoje eu escolhi cozinhar novos planos.','Menos pedidos. Mais espaço para o que importa.'],
  shopping:['Dei um tempo no “eu mereço”. Tô investindo no “eu quero realizar”.','Minha lista de desejos agora tem prioridades.','Compro com calma. Planejo com carinho.'],
  reserve:['Plot twist: este mês, os imprevistos vão me encontrar mais preparada.','Um pouquinho de hoje cuida do meu amanhã.','O futuro ganhou um cantinho no meu mês.'],
  other:['Pequenas escolhas abrem espaço para grandes planos.','Meu mês, minhas escolhas, meu ritmo.','Cada ajuste conta uma história nova.']
};
