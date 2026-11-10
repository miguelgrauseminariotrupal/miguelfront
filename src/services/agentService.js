import { DefaultChatTransport } from 'ai';
import { recoverExpiredSession } from './sessionRecovery.js';
import { withAgentRequestContext, withoutAgentRequestContext } from '../utils/agentRequestContext.js';

const defaultEndpoint = 'https://fqidwaafiojvcamzmilu.supabase.co/functions/v1/chat';
export const agentEndpoint = import.meta.env.VITE_AGENT_API_URL?.trim() || defaultEndpoint;
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const createAgentTransport = (assignedSelection) => new DefaultChatTransport({
  api: agentEndpoint,
  headers: apiKey ? { apikey: apiKey } : {},
  // El servidor mantiene el historial; los reintentos conservan el id del mensaje.
  prepareSendMessagesRequest: ({ id, messages }) => {
    const message = messages.findLast((item) => item.role === 'user');
    if (!message) throw new Error('No hay una consulta para enviar al agente.');
    return { body: { id, message: withAgentRequestContext(message, assignedSelection) } };
  },
  fetch: async (url, options) => {
    let accessToken;
    try { accessToken = JSON.parse(sessionStorage.getItem("miguel_session"))?.access_token; } catch { /* Sin sesión. */ }
    const headers = new Headers(options?.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      if (recoverExpiredSession({ status: response.status, message: JSON.stringify(body), accessToken })) return new Promise(() => {});
      throw new Error(body?.error || 'No se pudo conectar con Agente Miguel.');
    }
    return response;
  },
});

async function getChatHistory(id, { signal } = {}) {
  const url = new URL(agentEndpoint, window.location.origin);
  if (id) url.searchParams.set("id", id);
  let accessToken;
  try { accessToken = JSON.parse(sessionStorage.getItem("miguel_session"))?.access_token; } catch { /* Sin sesión. */ }
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json", ...(apiKey ? { apikey: apiKey } : {}), ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (recoverExpiredSession({ status: response.status, message: JSON.stringify(body), accessToken })) return new Promise(() => {});
    throw new Error(body?.error || body?.message || "No se pudo cargar el historial del chat.");
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("El servidor devolvió un historial inválido.");
  return id ? data.map(withoutAgentRequestContext) : data;
}
export const listChatConversations = options => getChatHistory(null, options);
export const getChatMessages = (id, options) => getChatHistory(id, options);
