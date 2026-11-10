import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { withAgentRequestContext, withoutAgentRequestContext } from '../utils/agentRequestContext.js';

function client(fetch) {
  const source = readFileSync(new URL("./agentService.js", import.meta.url), "utf8");
  const history = source.slice(source.indexOf("async function getChatHistory")).replaceAll("export const", "var");
  const context = { URL, fetch, withoutAgentRequestContext, recoverExpiredSession: () => false, agentEndpoint: "https://example.test/chat", apiKey: "public-key", window: { location: { origin: "https://app.test" } }, sessionStorage: { getItem: () => JSON.stringify({ access_token: "user-token" }) } };
  vm.createContext(context);
  vm.runInContext(history, context);
  return context;
}

test("history requests use authenticated chat endpoint and preserve message parts", async () => {
  const calls = [];
  const messages = [{ id: "m", role: "assistant", parts: [{ type: "text", text: "Respuesta" }] }];
  const api = client(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => url.searchParams.has("id") ? messages : [{ id: "conversation", titulo: "Consulta" }] };
  });
  const signal = new AbortController().signal;
  assert.equal((await api.listChatConversations({ signal }))[0].titulo, "Consulta");
  assert.equal(calls[0].url.search, "");
  assert.equal(calls[0].options.headers.Authorization, "Bearer user-token");
  assert.equal(calls[0].options.headers.apikey, "public-key");
  assert.equal(calls[0].options.signal, signal);
  assert.deepEqual([...await api.getChatMessages("conversation", { signal })], messages);
  assert.equal(calls[1].url.searchParams.get("id"), "conversation");
});

test("history failures and invalid payloads are surfaced", async () => {
  const denied = client(async () => ({ ok: false, json: async () => ({ error: "No autorizado" }) }));
  await assert.rejects(denied.listChatConversations(), /No autorizado/);
  const invalid = client(async () => ({ ok: true, json: async () => ({ unexpected: [] }) }));
  await assert.rejects(invalid.listChatConversations(), /historial inválido/);
});

test('recovered user messages show the original request without interface instructions', async () => {
  const original = {id:'user-1',role:'user',parts:[{type:'text',text:'Genera un reporte de asistencia'}]};
  const sent = withAgentRequestContext(original,{anio:'1',nivel:'1',grado:'1',seccion:'1',year:2026,label:'Aula de prueba'});
  const api = client(async () => ({ok:true,json:async () => [sent]}));
  assert.deepEqual([...await api.getChatMessages('conversation')],[original]);
});
