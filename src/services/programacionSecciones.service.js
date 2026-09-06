import { apiGet, apiPost, apiPut, extractList } from "./api";
export async function getProgramacionSecciones({ signal } = {}) { return extractList(await apiGet("/v1/programacion-secciones", { signal })); }
export function createProgramacionSeccion(idSeccion, idDocente) { return apiPost("/v1/programacion-secciones", { id_seccion: Number(idSeccion), id_docente_responsable: Number(idDocente) }); }
export function updateProgramacionSeccion(id, idSeccion, idDocente, estado = true) { return apiPut(`/v1/programacion-secciones/${id}`, { id_seccion: Number(idSeccion), id_docente_responsable: Number(idDocente), estado: Boolean(estado) }); }
