import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getAsistencias(filters = {}) {
  const { signal, ...params } = filters;
  return extractList(await apiGet("/asistencias", { params, signal }));
}
export function getAsistencia(id, { signal } = {}) { return apiGet(`/asistencias/${id}`, { signal }); }
export function createAsistencia(value) { return apiPost("/asistencias", { id_matricula: Number(value.id_matricula), id_tipo_asistencia: Number(value.id_tipo_asistencia), fecha: value.fecha }); }
export function updateAsistencia(id, value) { return apiPut(`/asistencias/${id}`, { id_matricula: Number(value.id_matricula), id_tipo_asistencia: Number(value.id_tipo_asistencia), fecha: value.fecha }); }
