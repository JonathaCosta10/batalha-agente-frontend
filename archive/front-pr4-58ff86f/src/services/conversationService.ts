import { BOT, INVITE_MESSAGE, PREVIOUS_INVITE_MESSAGE } from '../data/conversation';
import type { Author, Message, Person } from '../types';
import { balanceOf, signedBRL } from './personService';

export const createMessage = (text:string, by:Author='bot'): Message => ({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,by,text});
export const isInvite = (m:Message) => m.by==='bot' && (m.text===INVITE_MESSAGE || m.text===PREVIOUS_INVITE_MESSAGE);

export function replyTo(query:string, person:Person): string {
  const normalized=query.toLocaleLowerCase('pt-BR');
  if(normalized.includes('saldo')) return BOT.balance(signedBRL(balanceOf(person)));
  if(normalized.includes('ajust')||normalized.includes('valor')) return BOT.values;
  if(normalized.includes('humano')||normalized.includes('atendimento')) return BOT.human;
  return BOT.fallback(person.primeiroNome);
}
