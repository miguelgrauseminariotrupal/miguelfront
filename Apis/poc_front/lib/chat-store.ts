// Persistencia en las tablas test_* de Supabase. Solo se usa en el servidor,
// con service_role (PoC sin login: todo se guarda a nombre de un usuario mock).

import { createClient } from '@supabase/supabase-js';
import type { UIMessage } from 'ai';

const USUARIO_MOCK_ID =
  process.env.USUARIO_MOCK_ID ?? '00000000-0000-0000-0000-000000000001';

const MAX_MENSAJES_CONTEXTO = 30;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esIdValido = (id: string) => UUID_RE.test(id);

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export const textoDe = (m: UIMessage) =>
  m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');

export async function asegurarConversacion(
  id: string,
  titulo: string,
  modelo: string,
) {
  const { error } = await db()
    .from('test_conversaciones')
    .upsert(
      {
        id,
        usuario_id: USUARIO_MOCK_ID,
        titulo: titulo.slice(0, 80) || 'Nueva conversación',
        modelo,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function guardarMensaje(conversacionId: string, m: UIMessage) {
  const { error } = await db().from('test_mensajes').upsert({
    id: m.id,
    conversacion_id: conversacionId,
    rol: m.role,
    partes: m.parts,
  });
  if (error) throw new Error(error.message);
}

export async function cargarMensajes(
  conversacionId: string,
  limite = MAX_MENSAJES_CONTEXTO,
): Promise<UIMessage[]> {
  const { data, error } = await db()
    .from('test_mensajes')
    .select('id, rol, partes')
    .eq('conversacion_id', conversacionId)
    .order('secuencia', { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .reverse()
    .map((f) => ({ id: f.id, role: f.rol, parts: f.partes }));
}

export async function listarConversaciones() {
  const { data, error } = await db()
    .from('test_conversaciones')
    .select('id, titulo, actualizado_en')
    .eq('usuario_id', USUARIO_MOCK_ID)
    .eq('archivada', false)
    .order('actualizado_en', { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data ?? [];
}

