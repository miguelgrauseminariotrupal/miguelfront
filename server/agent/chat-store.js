const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isConversationId = (id) => typeof id === 'string' && UUID_RE.test(id);

export function getMockUserId() {
  const id = process.env.USUARIO_MOCK_ID?.trim();
  if (id && !UUID_RE.test(id)) throw new Error('USUARIO_MOCK_ID debe ser un UUID válido.');
  return id || null;
}

// La clave administrativa nunca se importa desde el frontend.
export function createChatStore() {
  const userId = getMockUserId();
  const base = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!userId || !base || !key) return null;

  async function request(table, query = {}, { method = 'GET', body, prefer } = {}) {
    const url = new URL(`${base.replace(/\/$/, '')}/rest/v1/${table}`);
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
    const response = await fetch(url, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('No se pudo guardar el historial en Supabase. Revisa las claves, el usuario y las tablas test_*.');
    return response.status === 204 ? null : response.json();
  }

  return {
    userId,
    async ensureConversation(id, title, model) {
      if (!isConversationId(id)) throw new Error('El id de conversación debe ser un UUID válido.');
      // No cambia el propietario ni el título de una conversación existente.
      await request('test_conversaciones', { on_conflict: 'id' }, {
        method: 'POST',
        body: { id, usuario_id: userId, titulo: title.slice(0, 80) || 'Nueva conversación', modelo: model },
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
      const rows = await request('test_conversaciones', {
        id: `eq.${id}`, usuario_id: `eq.${userId}`, select: 'id',
      });
      if (!rows?.length) throw new Error('La conversación no pertenece al USUARIO_MOCK_ID configurado.');
    },
    async saveMessages(conversationId, messages) {
      if (!messages.length) return;
      await request('test_mensajes', { on_conflict: 'id' }, {
        method: 'POST',
        body: messages.map((message) => ({
          // Evita colisiones entre ids de mensajes de conversaciones distintas.
          id: `${conversationId}:${message.id}`,
          conversacion_id: conversationId,
          rol: message.role,
          partes: message.parts,
        })),
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    },
  };
}
