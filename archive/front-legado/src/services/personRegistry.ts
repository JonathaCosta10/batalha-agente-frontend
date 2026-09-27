import { PEOPLE_KEY } from '../data/people';
import type { Person, PersonRecord } from '../types';

export function listRegistered(): PersonRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(PEOPLE_KEY)||'[]') as unknown;
    return Array.isArray(value) ? value as PersonRecord[] : [];
  } catch { return []; }
}

// The next opening gets the next person in the sequence: 0 (Maria), 1, 2, ...
export const nextPersonId = () => listRegistered().length;

// One record per opening of the conversation from the home screen.
export function registerOpening(person:Person) {
  const record: PersonRecord = { id:person.id, nome:person.nome??"", abertoEm:new Date().toISOString() };
  try { localStorage.setItem(PEOPLE_KEY, JSON.stringify([...listRegistered(), record])); } catch { /* Storage can be unavailable in private mode. */ }
}
