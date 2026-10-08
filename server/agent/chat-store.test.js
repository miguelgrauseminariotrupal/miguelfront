import assert from 'node:assert/strict';
import test from 'node:test';
import { createChatStore, getMockUserId } from './chat-store.js';

const userId = '00000000-0000-0000-0000-000000000001';
const conversationId = '00000000-0000-0000-0000-000000000002';

test('mock user is validated and persistence stays optional', () => {
  const old = { ...process.env };
  try {
    process.env.USUARIO_MOCK_ID = userId;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(getMockUserId(), userId);
    assert.equal(createChatStore(), null);
    process.env.USUARIO_MOCK_ID = 'invalid';
    assert.throws(getMockUserId, /UUID/);
  } finally { process.env = old; }
});

test('Supabase persistence assigns the server mock user and saves message parts', async () => {
  const old = { ...process.env };
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    process.env.USUARIO_MOCK_ID = userId;
    process.env.SUPABASE_URL = 'https://example.invalid';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      assert.equal(options.headers.Authorization, 'Bearer test-service');
      return options.method === 'GET' ? Response.json([{ id: conversationId }]) : new Response(null, { status: 204 });
    };
    const store = createChatStore();
    await store.ensureConversation(conversationId, 'Consulta académica', 'test-model');
    await store.saveMessages(conversationId, [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hola' }] }]);
    assert.equal(JSON.parse(calls[0].options.body).usuario_id, userId);
    assert.equal(calls[1].url.searchParams.get('usuario_id'), `eq.${userId}`);
    assert.deepEqual(JSON.parse(calls[2].options.body), [{
      id: `${conversationId}:msg-1`, conversacion_id: conversationId,
      rol: 'user', partes: [{ type: 'text', text: 'Hola' }],
    }]);
    globalThis.fetch = async (url, options) => options.method === 'GET' ? Response.json([]) : new Response(null, { status: 204 });
    await assert.rejects(store.ensureConversation(conversationId, 'Otra', 'test-model'), /no pertenece/);
    globalThis.fetch = async () => Response.json({ error: 'permission denied' }, { status: 403 });
    await assert.rejects(store.saveMessages(conversationId, [{ id: 'msg-2', role: 'user', parts: [] }]), /Supabase/);
  } finally {
    process.env = old;
    globalThis.fetch = originalFetch;
  }
});
