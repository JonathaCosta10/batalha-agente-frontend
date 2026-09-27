import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Screen3Communication } from './Screen3Communication';
import { Screen2Chat } from './Screen2Chat';
import { getCustomerById } from '../../data/mockCustomers';

const noop = () => {};
test('chat identifies prototype and exposes labelled bounded input, never mock customer advice', () => {
  const html = renderToStaticMarkup(<Screen3Communication customer={getCustomerById(42)} onBackToChat={noop} onRestart={noop} onNextCustomer={noop} />);
  assert(html.includes('i-agora'));
  assert(html.includes('não é um canal oficial'));
  assert(html.includes('aria-label="Mensagem para o i-agora"'));
  assert(html.includes('maxLength="2000"'));
  assert(!html.includes('Como seu especialista Itaú'));
  assert(!html.includes('Sessão Protegida'));
});

test('welcome does not diagnose finances before conversation', () => {
  const html = renderToStaticMarkup(<Screen2Chat customer={getCustomerById(42)} onBack={noop} onTriggerCommunication={noop} isChaveAtiva={true} onToggleChave={noop} />);
  assert(!html.includes('seu dinheiro está concentrado no presente'));
  assert(html.includes('Nenhuma análise financeira foi realizada'));
});
