import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getNiveles(idAnioLectivo, { estado, signal } = {}) {
  if (!idAnioLectivo) return [];
  return extractList(await apiGet("/niveles", { params: { id_anio_lectivo: idAnioLectivo, estado }, signal }));
}

export function createNivel(idAnioLectivo, nombre) {
  return apiPost("/niveles", { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim() });
}

export function updateNivel(idNivel, idAnioLectivo, nombre) {
  return apiPut(`/niveles/${idNivel}`, { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim() });
}

export function getNivel(id, { signal } = {}) { return apiGet(`/niveles/${id}`, { signal }); }
