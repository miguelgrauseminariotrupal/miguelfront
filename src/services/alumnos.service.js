import { apiGet, apiPost, apiPut, extractList } from "./api";

const clean = (value) => value?.trim() || null;

export async function getAlumnos({ estado, q, signal } = {}) {
  return extractList(await apiGet("/estudiantes", { params: { estado, q }, signal }));
}
export function getAlumno(id, { signal } = {}) { return apiGet(`/estudiantes/${id}`, { signal }); }
export function createAlumno(value) { return apiPost("/estudiantes", { nombres: value.nombres.trim(), apellido_paterno: clean(value.apellido_paterno), apellido_materno: clean(value.apellido_materno), fecha_nacimiento: value.fecha_nacimiento || null, dni: clean(value.dni) }); }
export function updateAlumno(id, value) { return apiPut(`/estudiantes/${id}`, { nombres: value.nombres.trim(), apellido_paterno: clean(value.apellido_paterno), apellido_materno: clean(value.apellido_materno), dni: clean(value.dni), fecha_nacimiento: value.fecha_nacimiento || null, estado: Boolean(value.estado) }); }
