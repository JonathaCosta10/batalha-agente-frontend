import test from 'node:test';
import assert from 'node:assert/strict';
import { ConversationController } from './conversationController';
import { ConversationApi } from './conversationApi';

const envelope = (reply = 'Resposta liberada', cid = 'conv-a') => ({
  schema_version: '1.0' as const, conversation_id: cid, message_id: 'srv-1',
  request_id: 'req-1', status: 'ok' as const, reply, citations: [],
});
const boot = async () => 'demo' as const;

test('late response after reset cannot enter new conversation', async () => {
  let resolve!: (v: any) => void;
  let signal!: AbortSignal;
  const controller = new ConversationController({ bootstrap: boot, send: async (_, s) => {
    signal = s;
    return new Promise(r => { resolve = r; });
  }});
  const pending = controller.send('Pergunta anterior');
  await new Promise(r => setTimeout(r, 0));
  controller.reset();
  resolve({ body: envelope('Resposta antiga'), httpStatus: 200 });
  await pending;
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().messages.length, 0);
  assert.equal(controller.getSnapshot().conversationId, null);
});

test('manual transport retry uses same message id/body without duplicate user bubble', async () => {
  const requests: any[] = [];
  const controller = new ConversationController({ bootstrap: boot, send: async (request) => {
    requests.push(request);
    if (requests.length === 1) throw new Error('raw internal failure');
    return { body: envelope(), httpStatus: 200 };
  }});
  await controller.send('Como começar?');
  assert(!controller.getSnapshot().error?.includes('raw internal'));
  await controller.retry();
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(controller.getSnapshot().messages.filter(m => m.role === 'user').length, 1);
  assert.equal(controller.getSnapshot().conversationId, 'conv-a');
});

test('default browser fetch keeps the global receiver', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async function () {
    assert.equal(this, globalThis);
    return new Response(JSON.stringify({ ...envelope(), mode: 'demo' }));
  };
  try {
    assert.equal(await new ConversationApi().bootstrap(new AbortController().signal), 'demo');
  } finally { globalThis.fetch = original; }
});

test('API sends only versioned contract, credentials and CSRF; rejects raw responses', async () => {
  const calls: any[] = [];
  const fakeFetch: typeof fetch = async (url, options) => {
    calls.push([url, options]);
    return new Response(JSON.stringify(calls.length === 1 ? { ...envelope(), mode: 'demo' } : { raw: 'SECRET' }), { status: 200 });
  };
  const api = new ConversationApi(fakeFetch, () => 'csrftoken=test-csrf');
  assert.equal(await api.bootstrap(new AbortController().signal), 'demo');
  const request = { schema_version: '1.0' as const, conversation_id: null, client_message_id: 'msg-1', message: 'Olá' };
  await assert.rejects(api.send(request, new AbortController().signal));
  assert.equal(calls[1][1].credentials, 'same-origin');
  assert.equal(calls[1][1].headers['X-CSRFToken'], 'test-csrf');
  assert.deepEqual(JSON.parse(calls[1][1].body), request);
});
