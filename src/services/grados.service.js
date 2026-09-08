import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getGrados(idNivel, { estado, signal } = {}) {
  if (!idNivel) return [];
  return extractList(await apiGet("/grados", { params: { id_nivel: idNivel, estado }, signal }));
}

export function createGrado(idNivel, nombre) {
  return apiPost("/grados", { id_nivel: Number(idNivel), nombre: nombre.trim() });
}

export function updateGrado(idGrado, idNivel, nombre) {
  // La colección Postman define el PUT con "grado" en singular.
  return apiPut(`/grados/${idGrado}`, { id_nivel: Number(idNivel), nombre: nombre.trim() });
}

export function getGrado(id, { signal } = {}) { return apiGet(`/grados/${id}`, { signal }); }
