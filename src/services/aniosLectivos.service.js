import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getAniosLectivos({ estado, signal } = {}) {
  return extractList(await apiGet("/anios-lectivos", { params: { estado }, signal }));
}

export function getAnioLectivo(id, { signal } = {}) { return apiGet(`/anios-lectivos/${id}`, { signal }); }

export function createAnioLectivo(anio, nombre) {
  const numericYear = Number(anio);
  return apiPost("/anios-lectivos", {
    anio: numericYear,
    nombre: nombre.trim(),
  });
}

export function updateAnioLectivo(idAnioLectivo, anio, nombre) {
  const numericYear = Number(anio);
  void nombre;
  return apiPut(`/anios-lectivos/${idAnioLectivo}`, {
    anio: numericYear,
  });
}

export function duplicateAnioLectivo({
  idAnioOrigen,
  idAnioDestino,
  incluirEstructura,
  incluirCursos,
  incluirCurriculo,
  incluirProgramacionSecciones,
  incluirProgramacionCursos,
}) {
  return apiPost("/duplicar-anio", {
    id_anio_origen: Number(idAnioOrigen),
    id_anio_destino: Number(idAnioDestino),
    incluir_estructura: incluirEstructura,
    incluir_cursos: incluirCursos,
    incluir_curriculo: incluirCurriculo,
    incluir_programacion_secciones: incluirProgramacionSecciones,
    incluir_programacion_cursos: incluirProgramacionCursos,
  });
}
