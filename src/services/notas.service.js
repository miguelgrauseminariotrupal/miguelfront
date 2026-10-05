import { apiGet, apiPost, extractList } from "./api";

export async function getBimestres(idAnio, { signal } = {}) {
  return extractList(await apiGet("/bimestres", { params: { id_anio_lectivo: idAnio, estado: true }, signal }));
}

export async function getValoresEvaluacion({ signal } = {}) {
  return extractList(await apiGet("/valores-evaluacion", { params: { estado: true }, signal }));
}

export function getNotasMatriculaCurso({ id_matricula, id_curso, signal }) {
  return apiGet("/notas-matricula-curso", { params: { id_matricula, id_curso }, signal });
}

export function generarPlantillasNotas(idAnio) {
  return apiPost("/generar-plantillas-notas", { id_anio: Number(idAnio) });
}
