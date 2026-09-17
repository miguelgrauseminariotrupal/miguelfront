import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getCompetencias(filters = {}) {
  const { signal, ...params } = filters;
  return extractList(await apiGet("/competencias", { params, signal }));
}
export function createCompetencia(value) { return apiPost("/competencias", { id_curso: Number(value.id_curso), descripcion: value.descripcion.trim(), ...(value.codigo?.trim() ? { codigo: value.codigo.trim() } : {}), ...(value.id_aprendizaje ? { id_aprendizaje: Number(value.id_aprendizaje) } : {}), ...(value.tipo?.trim() ? { tipo: value.tipo.trim() } : {}), estado: value.estado !== false }); }
export function updateCompetencia(id, value) { return apiPut(`/competencias/${id}`, { id_curso: Number(value.id_curso), descripcion: value.descripcion.trim(), codigo: value.codigo?.trim() || null, id_aprendizaje: value.id_aprendizaje ? Number(value.id_aprendizaje) : null, tipo: value.tipo?.trim() || null, estado: value.estado !== false }); }
