import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getGrados(idNivel, { signal } = {}) {
  if (!idNivel) return [];
  return extractList(await apiGet("/v1/grados", { params: { id_nivel: idNivel }, signal }));
}

export function createGrado(idNivel, nombre) {
  return apiPost("/v1/grados", { id_nivel: Number(idNivel), nombre: nombre.trim() });
}

export function updateGrado(idGrado, idNivel, nombre) {
  // La colección Postman define el PUT con "grado" en singular.
  return apiPut(`/v1/grado/${idGrado}`, { id_nivel: Number(idNivel), nombre: nombre.trim() });
}
