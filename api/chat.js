// Compatibilidad para clientes que todavia usan la ruta local.
export const maxDuration = 60;
export default {
  async fetch(request) {
    const endpoint = process.env.VITE_AGENT_API_URL || 'https://fqidwaafiojvcamzmilu.supabase.co/functions/v1/chat';
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (key) headers.set('apikey', key);
    try {
      const target = new URL(endpoint);
      target.search = new URL(request.url).search;
      return await fetch(target, {
        method: request.method,
        headers,
        ...(!['GET', 'HEAD'].includes(request.method) ? { body: await request.text() } : {}),
        signal: request.signal,
      });
    } catch {
      return Response.json({ error: 'No se pudo conectar con el backend del agente.' }, { status: 502 });
    }
  },
};
