// Cliente de las edge functions académicas (ver openapi.yaml del backend).

const BASE_URL = process.env.ACADEMICO_API_URL;

type Query = Record<string, string | number | boolean | undefined>;

export async function academico(path: string, query: Query = {}) {
  if (!BASE_URL) return { error: 'Falta ACADEMICO_API_URL en el servidor' };

  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/${path}`);
  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) url.searchParams.set(clave, String(valor));
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const cuerpo = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        error: cuerpo?.error ?? `La API respondió ${res.status}`,
        status: res.status,
      };
    }
    return cuerpo;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo llamar a la API' };
  }
}
