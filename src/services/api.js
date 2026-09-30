const OPENAPI_SERVER_URL = "https://fqidwaafiojvcamzmilu.supabase.co/functions/v1";
const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
const API_URL = configuredUrl
  ? configuredUrl.endsWith("/functions") ? `${configuredUrl}/v1` : configuredUrl
  : OPENAPI_SERVER_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const JWT_FUTURE_RELOAD_KEY = "miguel_jwt_future_reload";
const JWT_FUTURE_RELOAD_COOLDOWN = 30000;

function reloadOnFutureJwtError(message) {
  if (!/jwt\s+issued\s+(?:at|in)(?:\s+the)?\s+future/i.test(message)) return false;

  const lastReload = Number(sessionStorage.getItem(JWT_FUTURE_RELOAD_KEY) || 0);
  if (Date.now() - lastReload < JWT_FUTURE_RELOAD_COOLDOWN) return false;

  sessionStorage.setItem(JWT_FUTURE_RELOAD_KEY, String(Date.now()));
  window.location.reload();
  return true;
}

export class ApiError extends Error {
  constructor(message, { status = null, cause = null, details = null } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { method = "GET", params = {}, body, signal } = {}) {
  const normalizedPath = path.startsWith("/v1/") ? path.slice(3) : path;
  const url = new URL(`${API_URL}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(API_KEY ? { apikey: API_KEY } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("No se pudo conectar con el servidor.", { cause: error });
  }

  if (!response.ok) {
    let backendMessage = "";
    let rawResponse = "";
    try {
      rawResponse = (await response.text()).trim();
      if (rawResponse) {
        try {
          const errorBody = JSON.parse(rawResponse);
          const candidate = errorBody?.message || errorBody?.error || errorBody?.detalle || errorBody?.detail;
          backendMessage = typeof candidate === "string" ? candidate : candidate ? JSON.stringify(candidate) : rawResponse;
        } catch {
          backendMessage = rawResponse;
        }
      }
    } catch {
      // El backend puede responder sin cuerpo o con contenido que no sea JSON.
    }
    if (reloadOnFutureJwtError(`${backendMessage} ${rawResponse}`)) {
      return new Promise(() => {});
    }
    const message = backendMessage
      ? `Error HTTP ${response.status}: ${backendMessage}`
      : `El servidor respondió con un error HTTP ${response.status} sin indicar el motivo.`;
    const details = {
      method,
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      requestId: response.headers.get("sb-request-id") || response.headers.get("x-request-id") || "No proporcionado",
      response: rawResponse || "Respuesta vacía",
      payload: body ?? null,
    };
    console.error("API request failed", details);
    throw new ApiError(message, { status: response.status, details });
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError("El servidor devolvió una respuesta que no es JSON válido.", { cause: error });
  }
}

export function apiGet(path, options) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options) {
  return apiRequest(path, { ...options, method: "POST", body });
}

export function apiPut(path, body, options) {
  return apiRequest(path, { ...options, method: "PUT", body });
}

export function extractList(response) {
  if (Array.isArray(response)) return response;
  const candidates = [response?.data, response?.content, response?.items];
  const list = candidates.find(Array.isArray);
  if (list) return list;
  throw new ApiError("La respuesta del servidor no contiene una lista reconocible.");
}
