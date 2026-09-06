import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getNiveles(idAnioLectivo, { signal } = {}) {
  if (!idAnioLectivo) return [];
  return extractList(await apiGet("/v1/niveles", { params: { id_anio_lectivo: idAnioLectivo }, signal }));
}

export function createNivel(idAnioLectivo, nombre) {
  return apiPost("/v1/niveles", { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim() });
}

export function updateNivel(idNivel, idAnioLectivo, nombre) {
  return apiPut(`/v1/niveles/${idNivel}`, { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim() });
}
