import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getProgramacionCursos(filters = {}) {
  const { id_programacion_seccion, id_curso, id_docente, estado, signal } = filters;
  return extractList(await apiGet("/programacion-cursos", { params: { id_programacion_seccion, id_curso, id_docente, estado }, signal }));
}
export function getProgramacionCurso(id, { signal } = {}) { return apiGet(`/programacion-cursos/${id}`, { signal }); }
export function createProgramacionCurso(idProgramacionSeccion, idCurso, idDocente) { return apiPost("/programacion-cursos", { id_programacion_seccion: Number(idProgramacionSeccion), id_curso: Number(idCurso), id_docente: Number(idDocente) }); }
export function updateProgramacionCurso(id, value) { return apiPut(`/programacion-cursos/${id}`, { id_programacion_seccion: Number(value.id_programacion_seccion), id_curso: Number(value.id_curso), id_docente: Number(value.id_docente), estado: Boolean(value.estado) }); }
