import assert from 'node:assert/strict';
import test from 'node:test';
import { handleChat } from './chat.js';
import { tools } from './tools.js';

test('rejects missing credentials, invalid JSON, roles and message parts', async () => {
  const old = { ...process.env };
  try {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const request = (body) => new Request('http://localhost/api/chat', { method: 'POST', body });
    assert.equal((await handleChat(request('{}'))).status, 503);
    process.env.GEMINI_API_KEY = 'test-only';
    process.env.ACADEMICO_API_URL = 'https://example.invalid';
    assert.equal((await handleChat(request('{'))).status, 400);
    assert.equal((await handleChat(request(JSON.stringify({ messages: [{ role: 'system', parts: [] }] })))).status, 400);
    assert.equal((await handleChat(request(JSON.stringify({ messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 42 }] }] })))).status, 400);
    assert.equal((await handleChat(new Request('http://localhost/api/chat'))).status, 405);
  } finally {
    process.env = old;
  }
});

test('academic tools forward filters and API key, and report API failures', async () => {
  const originalFetch = globalThis.fetch;
  const old = { ...process.env };
  try {
    process.env.ACADEMICO_API_URL = 'https://example.invalid/functions/v1';
    process.env.SUPABASE_ANON_KEY = 'test-anon';
    globalThis.fetch = async (url, options) => {
      assert.equal(url.pathname, '/functions/v1/matriculas');
      assert.equal(url.searchParams.get('id_seccion'), '2');
      assert.equal(url.searchParams.get('estado'), 'false');
      assert.equal(url.searchParams.has('q'), false);
      assert.equal(options.headers.apikey, 'test-anon');
      return Response.json([{ id_matricula: 7 }]);
    };
    assert.deepEqual(await tools.listar_matriculas.execute({ id_seccion: 2, estado: false }), [{ id_matricula: 7 }]);
    globalThis.fetch = async () => Response.json({ error: 'No autorizado' }, { status: 401 });
    assert.deepEqual(await tools.listar_niveles.execute({}), { error: 'No autorizado' });
    globalThis.fetch = async () => { throw new Error('network'); };
    assert.deepEqual(await tools.listar_cursos.execute({}), { error: 'No se pudo consultar la API académica' });
  } finally {
    globalThis.fetch = originalFetch;
    process.env = old;
  }
});
