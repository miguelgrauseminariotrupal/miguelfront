import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getMatriculaCursos(filters = {}) {
  const { signal, ...params } = filters;
  return extractList(await apiGet("/matricula-cursos", { params, signal }));
}
export function createMatriculaCurso(value) { return apiPost("/matricula-cursos", { id_matricula: Number(value.id_matricula), id_programacion_curso: Number(value.id_programacion_curso), estado: value.estado !== false }); }
export function updateMatriculaCurso(id, value) { return apiPut(`/matricula-cursos/${id}`, value); }
export function generarMatriculaCursos(idMatricula) { return apiPost("/matricula-cursos/generar", idMatricula ? { id_matricula: Number(idMatricula) } : {}); }
