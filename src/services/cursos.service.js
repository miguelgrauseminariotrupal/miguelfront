import { apiGet, apiPost, apiPut, extractList } from "./api";
export async function getCursos(idAnioLectivo, { signal } = {}) {
  if (!idAnioLectivo) return [];
  return extractList(await apiGet("/v1/cursos", { params: { id_anio_lectivo: idAnioLectivo, d_anio_lectivo: idAnioLectivo }, signal }));
}
export function createCurso(idAnioLectivo, nombre) { return apiPost("/v1/cursos", { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim() }); }
export function updateCurso(idCurso, idAnioLectivo, nombre, estado = true) { return apiPut(`/v1/cursos/${idCurso}`, { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim(), estado: Boolean(estado) }); }
