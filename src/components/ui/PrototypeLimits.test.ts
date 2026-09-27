import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LIMITS, PrototypeLimits } from './PrototypeLimits';

const all=LIMITS.items.join(' ');

test('limitations: title, date and every statement the owner asked for',()=>{
  assert.equal(LIMITS.title,'Protótipo — limitações');
  assert.match(LIMITS.updatedAt,/^\d{2}\/\d{2}\/\d{4}$/);
  for(const [what,re] of [
    ['perfil sintético do evento (BigQuery), sorteado por sessão, não é cliente real',/sintético.*BigQuery.*sorteado por sessão.*Não é um cliente real/],
    ['só leitura de entradas, saídas e categorias, enviadas ao Gemini',/entradas, saídas e categorias.*só leitura.*Gemini/],
    ['nada é movimentado nem contratado',/Nada é movimentado nem contratado/],
    ['não é recomendação de investimento',/Não é recomendação de investimento/],
    ['sessão expira e histórico não sobrevive a reload',/sessão expira.*histórico.*não sobrevive/],
    ['nome e gênero não mostrados',/nome e o gênero .*não são mostrados/],
  ] as const) assert.match(all,re,what);
});

test('closed: only the "i" button; open: the sheet with the title, date and all items',()=>{
  const closed=renderToStaticMarkup(createElement(PrototypeLimits));
  assert.ok(closed.includes('button-prototype-limits'));assert.ok(!closed.includes('sheet-prototype-limits'));
  const open=renderToStaticMarkup(createElement(PrototypeLimits,{initialOpen:true}));
  assert.ok(open.includes(LIMITS.title));assert.ok(open.includes(`Atualizado em ${LIMITS.updatedAt}`));
  for(const t of LIMITS.items)assert.ok(open.includes(t.replace(/&/g,'&amp;')),t);
});
