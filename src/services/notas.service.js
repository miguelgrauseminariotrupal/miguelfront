import { apiGet, apiPost, extractList } from "./api";

export async function getBimestres(idAnio, { signal } = {}) {
  return extractList(await apiGet("/bimestres", { params: { id_anio_lectivo: idAnio, estado: true }, signal }));
}

export async function getValoresEvaluacion({ signal } = {}) {
  return extractList(await apiGet("/valores-evaluacion", { params: { estado: true }, signal }));
}

export function getNotasBimestre({ id_matricula, id_curso, id_bimestre, signal }) {
  return apiGet("/notas-bimestre", { params: { id_matricula, id_curso, id_bimestre }, signal });
}

export function getNotasFinales({ id_matricula, id_curso, signal }) {
  return apiGet("/notas-finales", { params: { id_matricula, id_curso }, signal });
}

export function generarPlantillasNotas(idAnio) {
  return apiPost("/generar-plantillas-notas", { id_anio: Number(idAnio) });
}
