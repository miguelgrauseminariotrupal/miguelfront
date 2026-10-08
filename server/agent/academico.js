export async function academico(path, query = {}) {
  const base = process.env.ACADEMICO_API_URL || process.env.VITE_API_URL;
  if (!base) return { error: 'Falta ACADEMICO_API_URL en el servidor' };
  const url = new URL(`${base.replace(/\/$/, '')}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  try {
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const response = await fetch(url, {
      headers: key ? { apikey: key } : {},
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    return response.ok ? body : { error: body?.error || body?.message || `Error HTTP ${response.status}` };
  } catch {
    return { error: 'No se pudo consultar la API académica' };
  }
}
