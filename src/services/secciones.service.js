import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getSecciones(idGrado, { estado, signal } = {}) {
  if (!idGrado) return [];
  return extractList(await apiGet("/secciones", { params: { id_grado: idGrado, estado }, signal }));
}
export function getSeccion(id, { signal } = {}) { return apiGet(`/secciones/${id}`, { signal }); }

export function createSeccion(idGrado, nombre) {
  return apiPost("/secciones", { id_grado: Number(idGrado), nombre: nombre.trim() });
}

export function updateSeccion(idSeccion, idGrado, nombre, estado = true) {
  return apiPut(`/secciones/${idSeccion}`, { id_grado: Number(idGrado), nombre: nombre.trim(), estado: Boolean(estado) });
}
