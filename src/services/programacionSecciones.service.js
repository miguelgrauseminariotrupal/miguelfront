import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getProgramacionSecciones(filters = {}) {
  const { id_seccion, id_docente_responsable, estado_completado, signal } = filters;
  const records = extractList(await apiGet("/programacion-secciones", { params: { id_seccion, id_docente_responsable, estado_completado }, signal }));
  return records.map((record) => ({
    ...record,
    estado_completado: record.estado_completado ?? record.estadoCompletado ?? false,
  }));
}
export function getProgramacionSeccion(id, { signal } = {}) { return apiGet(`/programacion-secciones/${id}`, { signal }); }
export function createProgramacionSeccion(idSeccion, idDocenteResponsable, estadoCompletado = false) { return apiPost("/programacion-secciones", { id_seccion: Number(idSeccion), id_docente_responsable: Number(idDocenteResponsable), estado_completado: Boolean(estadoCompletado) }); }
export function updateProgramacionSeccion(id, idSeccion, idDocenteResponsable, estadoCompletado = false) { return apiPut(`/programacion-secciones/${id}`, { id_seccion: Number(idSeccion), id_docente_responsable: Number(idDocenteResponsable), estado_completado: Boolean(estadoCompletado) }); }
