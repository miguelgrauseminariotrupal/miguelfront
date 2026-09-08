import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getTiposAsistencia({ estado, q, signal } = {}) {
  return extractList(await apiGet("/tipos-asistencia", { params: { estado, q }, signal }));
}
export function getTipoAsistencia(id, { signal } = {}) { return apiGet(`/tipos-asistencia/${id}`, { signal }); }
export function createTipoAsistencia(value) { return apiPost("/tipos-asistencia", { codigo: value.codigo.trim(), descripcion: value.descripcion.trim(), ...(value.estado === undefined ? {} : { estado: Boolean(value.estado) }) }); }
export function updateTipoAsistencia(id, value) { return apiPut(`/tipos-asistencia/${id}`, { ...(value.codigo === undefined ? {} : { codigo: value.codigo.trim() }), ...(value.descripcion === undefined ? {} : { descripcion: value.descripcion.trim() }), ...(value.estado === undefined ? {} : { estado: Boolean(value.estado) }) }); }
