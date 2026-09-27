import { BOT, USER } from '../data/conversation';
import { MARIA } from '../data/people';
import { STORAGE_KEY } from '../data/plan';
import type { Category, Saved } from '../types';
import { initialFor } from './personService';

export function persist(saved:Saved) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* Storage can be unavailable in private mode. */ }
}

// Loads the saved conversation, migrating histories written by earlier versions of the flow.
export function safeLoad(): Saved {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') as Saved | null;
    if(value && Array.isArray(value.messages) && value.draft && Array.isArray(value.draft.selected) && typeof value.stage === 'string') {
      const person=value.person?.plan ? value.person : MARIA;
      const messages=value.messages.map(m=>m.id==='intro'?{...m,text:BOT.intro(person.primeiroNome)}:m);
      const challengeIndex=messages.findIndex(m=>m.by==='user'&&m.text===USER.challenge);
      const cardIndex=messages.findIndex((m,i)=>i>challengeIndex&&m.by==='bot'&&(m.text.startsWith('O primeiro passo já tem nome:')||m.text.startsWith('Preparei um card para marcar esse momento')));
      const confirmationIndex=messages.findIndex((m,i)=>i>challengeIndex&&m.by==='bot'&&m.text.startsWith('Confira os compromissos de exemplo'));
      const retainedIndex=cardIndex>challengeIndex?cardIndex:confirmationIndex;
      const history=challengeIndex<0?messages:retainedIndex>challengeIndex
        ?[...messages.slice(0,challengeIndex+1),...messages.slice(retainedIndex)]
        :[...messages.slice(0,challengeIndex+1),{id:'confirm-migration',by:'bot' as const,text:BOT.confirm}];
      const needsConfirmation=['review','priorities','amounts'].includes(value.stage)||(value.stage==='card'&&!value.confirmed);
      const stage=needsConfirmation?'confirm':value.stage;
      const draft=stage==='confirm'&&!value.draft.selected.length
        ?{...value.draft,selected:['delivery' as Category]}:value.draft;
      return {
        person, stage, draft, messages:history,
        confirmed:value.confirmed??null,
        phraseIndex:Number.isInteger(value.phraseIndex)?value.phraseIndex:0,
      };
    }
  } catch { /* Ignore malformed or unavailable local storage. */ }
  return initialFor(MARIA);
}
