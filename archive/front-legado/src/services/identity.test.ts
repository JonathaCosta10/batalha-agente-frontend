import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanName, greeting } from './identity';
import { Backend, ApiError, describeError } from './backend';
import { BOT } from '../data/conversation';

test('real first name is shown as sent', () => {
  assert.equal(cleanName('Maria'), 'Maria');
  assert.equal(greeting('Maria'), 'Olá, Maria');
  assert.equal(BOT.intro('Maria'), 'Que bom ter você aqui, Maria!');
});

test('negative: generated alias, placeholder, empty and null never reach the screen', () => {
  for (const bad of ['Pessoa 1 da base', 'Pessoa 734 DA BASE', 'Cliente', '  ', '', null, undefined]) {
    assert.equal(cleanName(bad), '', String(bad));
    assert.equal(greeting(bad), 'Olá');
    assert.equal(BOT.intro(bad as string), 'Que bom ter você aqui!');
    assert.ok(!BOT.fallback(bad as string).includes('da base'));
  }
});

test('error text carries the backend code (i-agora codigo and conversas erro_api)', () => {
  assert.deepEqual(describeError({ erro: 'Sessão não autorizada. Reabra a conversa.', codigo: 'auth' }, 401),
    { code: 'auth', text: 'Sessão não autorizada. Reabra a conversa. (código: auth)' });
  assert.equal(describeError({ erro_api: { codigo: 429, mensagem: 'Cota do provedor esgotada.' } }, 503).code, '429');
  const token = describeError({ erro: 'perfil_indisponivel', motivo: 'BigQuery sem autorização ADC.', codigo: 'source' }, 503);
  assert.equal(token.text, 'BigQuery sem autorização ADC. (código: source)');
});

test('negative: machine token alone or empty body still yields readable text with http code', () => {
  const e = describeError({ erro: 'perfil_indisponivel' }, 502);
  assert.equal(e.text, 'O servidor não conseguiu responder. (código: http_502)');
});

test('network failure and HTML error page become ApiError with a code, not a parse error', async () => {
  const down = new Backend(async () => { throw new TypeError('Failed to fetch'); }, () => '');
  await assert.rejects(down.profile(), (e: unknown) => e instanceof ApiError && e.status === 0 && e.code === 'rede');
  const html = new Backend(async () => new Response('<html>Bad Gateway</html>', { status: 502 }), () => '');
  await assert.rejects(html.profile(), (e: unknown) => e instanceof ApiError && e.code === 'http_502' && /código: http_502/.test(e.message));
});
