import { apiGet, apiPost, apiPut, extractList } from "./api";
export async function getProgramacionCursos({ signal } = {}) { return extractList(await apiGet("/v1/programacion-cursos", { signal })); }
export function createProgramacionCurso(idProgramacionSeccion, idCurso, idDocente) { return apiPost("/v1/programacion-cursos", { id_programacion_seccion: Number(idProgramacionSeccion), id_curso: Number(idCurso), id_docente: Number(idDocente) }); }
export function updateProgramacionCurso(id, value) { return apiPut(`/v1/programacion-cursos/${id}`, { id_programacion_seccion: Number(value.id_programacion_seccion), id_curso: Number(value.id_curso), id_docente: Number(value.id_docente), estado: Boolean(value.estado) }); }
