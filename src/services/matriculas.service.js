import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getMatriculas(filters = {}) {
  const { signal, ...params } = filters;
  return extractList(await apiGet("/matriculas", { params, signal }));
}
export function getMatricula(id, { signal } = {}) { return apiGet(`/matriculas/${id}`, { signal }); }
export function createMatricula(value) { return apiPost("/matriculas", { id_seccion: Number(value.id_seccion), id_estudiante: Number(value.id_estudiante), ...(value.fecha_matricula ? { fecha_matricula: value.fecha_matricula } : {}), ...(value.estado === undefined ? {} : { estado: Boolean(value.estado) }) }); }
export function updateMatricula(id, value) { return apiPut(`/matriculas/${id}`, { ...(value.id_seccion ? { id_seccion: Number(value.id_seccion) } : {}), ...(value.id_estudiante ? { id_estudiante: Number(value.id_estudiante) } : {}), ...(value.fecha_matricula === undefined ? {} : { fecha_matricula: value.fecha_matricula || null }), ...(value.estado === undefined ? {} : { estado: Boolean(value.estado) }) }); }
