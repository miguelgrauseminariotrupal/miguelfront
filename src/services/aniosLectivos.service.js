import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getAniosLectivos({ signal } = {}) {
  return extractList(await apiGet("/v1/anios-lectivos", { signal }));
}

export function createAnioLectivo(anio) {
  const numericYear = Number(anio);
  return apiPost("/v1/anios-lectivos", {
    anio: numericYear,
    nombre: String(numericYear),
  });
}

export function updateAnioLectivo(idAnioLectivo, anio) {
  const numericYear = Number(anio);
  return apiPut(`/v1/anios-lectivos/${idAnioLectivo}`, {
    anio: numericYear,
    nombre: String(numericYear),
  });
}
