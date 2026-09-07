import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getAniosLectivos({ signal } = {}) {
  return extractList(await apiGet("/v1/anios-lectivos", { signal }));
}

export function createAnioLectivo(anio, nombre) {
  const numericYear = Number(anio);
  return apiPost("/v1/anios-lectivos", {
    anio: numericYear,
    nombre: nombre.trim(),
  });
}

export function updateAnioLectivo(idAnioLectivo, anio, nombre) {
  const numericYear = Number(anio);
  return apiPut(`/v1/anios-lectivos/${idAnioLectivo}`, {
    anio: numericYear,
    nombre: nombre.trim(),
  });
}
