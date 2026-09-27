import type { Person } from '../types';

export const PEOPLE_KEY = 'i-agora-pessoas-v1';
export const PEOPLE_LIMIT = 1000;

// Person 0 is the persona drawn in the i.agora prototype; every later one is calculated.
export const MARIA: Person = {
  id:0, nome:'Maria', primeiroNome:'Maria', genero:'F',
  plan:{ income:5000, expenses:5380, deliveryCurrent:600, deliveryTarget:350, shoppingCurrent:450, shoppingTarget:250, otherCut:130, reserveTarget:200, selected:[] },
};

// Names from the archived demo generator (src/archive/2026-09-27/data/mockCustomers.ts).
export const NOMES_F = ['Ana','Beatriz','Camila','Daniela','Eduarda','Fernanda','Gabriela','Helena','Isabela','Juliana','Larissa','Mariana','Natália','Patrícia','Rafaela','Sofia','Tatiane','Vanessa','Yasmin','Carolina'];
export const NOMES_M = ['Alexandre','Bruno','Carlos','Diego','Eduardo','Felipe','Gabriel','Henrique','Igor','João','Lucas','Mateus','Nicolas','Otávio','Paulo','Rafael','Rodrigo','Thiago','Vinícius','Vitor'];
export const SOBRENOMES = ['Silva','Santos','Oliveira','Souza','Rodrigues','Ferreira','Alves','Pereira','Lima','Gomes','Costa','Ribeiro','Martins','Carvalho','Almeida','Lopes','Soares','Fernandes','Vieira','Barbosa'];
