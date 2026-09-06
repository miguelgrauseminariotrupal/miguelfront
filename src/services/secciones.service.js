import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getSecciones(idGrado, { signal } = {}) {
  if (!idGrado) return [];
  return extractList(await apiGet("/v1/secciones", { params: { id_grado: idGrado }, signal }));
}

export function createSeccion(idGrado, nombre) {
  return apiPost("/v1/secciones", { id_grado: Number(idGrado), nombre: nombre.trim() });
}

export function updateSeccion(idSeccion, idGrado, nombre, estado = true) {
  return apiPut(`/v1/secciones/${idSeccion}`, { id_grado: Number(idGrado), nombre: nombre.trim(), estado: Boolean(estado) });
}
