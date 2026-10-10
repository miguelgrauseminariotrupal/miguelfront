import { DefaultChatTransport } from 'ai';

const defaultEndpoint = 'https://fqidwaafiojvcamzmilu.supabase.co/functions/v1/chat';
export const agentEndpoint = import.meta.env.VITE_AGENT_API_URL?.trim() || defaultEndpoint;
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const agentTransport = new DefaultChatTransport({
  api: agentEndpoint,
  headers: apiKey ? { apikey: apiKey } : {},
  // El servidor mantiene el historial; los reintentos conservan el id del mensaje.
  prepareSendMessagesRequest: ({ id, messages }) => {
    const message = messages.findLast((item) => item.role === 'user');
    if (!message) throw new Error('No hay una consulta para enviar al agente.');
    return { body: { id, message } };
  },
  fetch: async (url, options) => {
    let accessToken;
    try { accessToken = JSON.parse(sessionStorage.getItem("miguel_session"))?.access_token; } catch { /* Sin sesión. */ }
    const headers = new Headers(options?.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'No se pudo conectar con Agente Miguel.');
    }
    return response;
  },
});
