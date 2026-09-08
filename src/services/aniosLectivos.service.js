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
