import type { NavItem, Shortcut } from '../types';

export const HOME_TAB = 'Início';
export const PLANNING_ACTION = 'Planejar';
export const NAV_ITEMS: NavItem[] = [{label:HOME_TAB,icon:'inicio.svg'},{label:'Extrato',icon:'extrato.svg'},{label:'Pagamentos',icon:'transferir.svg'},{label:'Pra você',icon:'presente.svg'},{label:'Menu',icon:'menu.svg'}];
export const SHORTCUTS: Shortcut[] = [
  { label:'Pix e transferir', lines:['Pix e','transferir'], icon:'pix.svg', testId:'button-shortcut-pix' },
  { label:'Pagamentos', lines:['Pagar'], icon:'transferir.svg', testId:'button-shortcut-pay' },
  { label:'Cartões', lines:['Cartão','virtual'], icon:'cartao.svg', testId:'button-shortcut-cards' },
  { label:PLANNING_ACTION, lines:['Planejar','janeiro'], icon:null, testId:'button-shortcut-planning' },
];
