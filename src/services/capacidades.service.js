import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getCapacidades(filters = {}) {
  const { signal, ...params } = filters;
  return extractList(await apiGet("/capacidades", { params, signal }));
}
export function createCapacidad(value) { return apiPost("/capacidades", { descripcion: value.descripcion.trim(), ...(value.id_competencia ? { id_competencia: Number(value.id_competencia) } : {}), estado: value.estado !== false }); }
export function updateCapacidad(id, value) { return apiPut(`/capacidades/${id}`, { descripcion: value.descripcion.trim(), id_competencia: value.id_competencia ? Number(value.id_competencia) : null, estado: value.estado !== false }); }
