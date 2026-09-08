import { apiGet, apiPost, apiPut, extractList } from "./api";
export async function getCursos(idAnioLectivo, { estado, signal } = {}) {
  if (!idAnioLectivo) return [];
  return extractList(await apiGet("/cursos", { params: { id_anio_lectivo: idAnioLectivo, estado }, signal }));
}
export function getCurso(id, { signal } = {}) { return apiGet(`/cursos/${id}`, { signal }); }
export function createCurso(idAnioLectivo, nombre) { return apiPost("/cursos", { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim() }); }
export function updateCurso(idCurso, idAnioLectivo, nombre, estado = true) { return apiPut(`/cursos/${idCurso}`, { id_anio_lectivo: Number(idAnioLectivo), nombre: nombre.trim(), estado: Boolean(estado) }); }
