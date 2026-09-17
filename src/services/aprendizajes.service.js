import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getAprendizajes(filters = {}) {
  const { signal, ...params } = filters;
  return extractList(await apiGet("/aprendizajes", { params, signal }));
}
export function createAprendizaje(value) { return apiPost("/aprendizajes", { nombre_aprendizaje: value.nombre_aprendizaje.trim(), ...(value.id_anio_lectivo ? { id_anio_lectivo: Number(value.id_anio_lectivo) } : {}), estado: value.estado !== false }); }
export function updateAprendizaje(id, value) { return apiPut(`/aprendizajes/${id}`, { nombre_aprendizaje: value.nombre_aprendizaje.trim(), id_anio_lectivo: value.id_anio_lectivo ? Number(value.id_anio_lectivo) : null, estado: value.estado !== false }); }
