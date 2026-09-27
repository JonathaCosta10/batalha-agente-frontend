import test from 'node:test';
import assert from 'node:assert/strict';
import {NOMES_F,NOMES_M} from '../data/people';
import {BOT} from '../data/conversation';
import {displayName,greetingFor,labelFromId,personFromServer} from './identity';

const invented=[...NOMES_F,...NOMES_M,'Maria'];
const base={id:1,plan:{} as never};
const shownOf=(p:ReturnType<typeof personFromServer>)=>[displayName(p),greetingFor(p),BOT.intro(p.primeiroNome),BOT.finish(p.primeiroNome)].join(' | ');

test('null name/gender from the server: no invented name, no "null", no empty greeting',()=>{
 for(const raw of [{...base,nome:null,primeiroNome:null,genero:null},{...base,nome:'null',primeiroNome:'null'},{...base},{...base,nome:'Pessoa 1 da base',primeiroNome:'Pessoa 1 da base',genero:'NAO_INFORMADO'}]){
  const p=personFromServer(raw as never);
  assert.equal(p.nome,'');assert.equal(p.primeiroNome,'');assert.equal(p.genero,'NAO_INFORMADO');
  const shown=shownOf(p);
  for(const n of invented)assert.ok(!new RegExp(`\\b${n}\\b`).test(shown),`inventou "${n}": ${shown}`);
  assert.ok(!/null|undefined|da base/.test(shown),shown);
  assert.equal(greetingFor(p),'Olá');assert.ok(greetingFor(p).trim().length>0);
  assert.equal(BOT.intro(p.primeiroNome),'Que bom ter você aqui!');
 }
});

test('new contract: rotulo is the neutral identity; idUsuario alone gives the same label',()=>{
 const p=personFromServer({...base,nome:null,primeiroNome:null,genero:null,idUsuario:'00108ccd-699c-453a-a9f9-a66aad6e03e5',rotulo:'Cliente 00108ccd'} as never);
 assert.equal(displayName(p),'Cliente 00108ccd');assert.equal(greetingFor(p),'Olá, Cliente 00108ccd');
 assert.ok(!/null/.test(shownOf(p)));
 const q=personFromServer({...base,nome:null,id_usuario:'00108ccd-699c-453a-a9f9-a66aad6e03e5'} as never);
 assert.equal(greetingFor(q),'Olá, Cliente 00108ccd');
 assert.equal(labelFromId(''),null);assert.equal(labelFromId(null),null);
});

const SEAL={natureza:'nome_gerado',fonte:'backend-agente-conversacional/data/usuarios_verdade.csv',medido_em:'2026-09-27T05:26:06-03:00'};
const ID='00108ccd-699c-453a-a9f9-a66aad6e03e5';

test('name is shown only with the nome_gerado seal from the server; gender never',()=>{
 const p=personFromServer({...base,idUsuario:ID,nome:'Joana Prado',primeiroNome:'Joana',genero:'F',nomeSelo:SEAL} as never);
 assert.equal(greetingFor(p),'Olá, Joana');assert.equal(p.nome,'Joana Prado');assert.equal(p.idUsuario,ID);
 assert.equal(p.genero,'NAO_INFORMADO');
 // Negative proof: the same name without the seal (or with another natureza) never reaches the screen.
 // -32 contract: nome_origem = "nome_gerado" is the same seal.
 assert.equal(greetingFor(personFromServer({...base,idUsuario:ID,nome:'Joana Prado',nome_origem:'nome_gerado'} as never)),'Olá, Joana');
 assert.equal(personFromServer({...base,idUsuario:ID,nome:'Joana Prado',nome_origem:'csv'} as never).primeiroNome,'');
 for(const nomeSelo of [undefined,null,{natureza:'dado_do_cliente'},'nome_gerado']){
  const q=personFromServer({...base,idUsuario:ID,nome:'Joana Prado',primeiroNome:'Joana',genero:'F',nomeSelo} as never);
  assert.equal(q.primeiroNome,'');assert.ok(!shownOf(q).includes('Joana'),shownOf(q));
  assert.equal(greetingFor(q),'Olá, Cliente 00108ccd');assert.equal(q.genero,'NAO_INFORMADO');
 }
});

test('gender is never rendered: F/M from the server do not change any text',()=>{
 const f=personFromServer({...base,idUsuario:ID,nome:'Ana',nomeSelo:SEAL,genero:'F'} as never);
 const m=personFromServer({...base,idUsuario:ID,nome:'Ana',nomeSelo:SEAL,genero:'M'} as never);
 assert.equal(shownOf(f),shownOf(m));
 assert.ok(!/\b(F|M|feminino|masculino|bem-vinda|bem-vindo|Sra\.?|Sr\.)\b/i.test(shownOf(f)),shownOf(f));
});
