const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, { method = "GET", params = {}, body, signal } = {}) {
  if (!API_URL) {
    throw new ApiError("Falta configurar VITE_API_URL en el archivo .env.");
  }

  const url = new URL(`${API_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("No se pudo conectar con el servidor.", { cause: error });
  }

  if (!response.ok) {
    let backendMessage = "";
    try {
      const errorBody = await response.json();
      backendMessage = errorBody?.message || errorBody?.error || errorBody?.detalle || errorBody?.detail || "";
    } catch {
      // El backend puede responder sin cuerpo o con contenido que no sea JSON.
    }
    const message = backendMessage
      ? `El servidor rechazó la solicitud: ${backendMessage}`
      : `El servidor respondió con un error HTTP ${response.status}.`;
    throw new ApiError(message, { status: response.status });
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
