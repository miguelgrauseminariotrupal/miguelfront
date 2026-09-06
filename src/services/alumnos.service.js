import { apiGet, apiPost, apiPut, extractList } from "./api";
export async function getAlumnos({ signal } = {}) { return extractList(await apiGet("/v1/estudiantes", { signal })); }
export function createAlumno(value) { return apiPost("/v1/estudiantes", { nombres: value.nombres.trim(), apellido_paterno: value.apellido_paterno.trim(), apellido_materno: value.apellido_materno.trim(), fecha_nacimiento: value.fecha_nacimiento, dni: value.dni.trim() }); }
export function updateAlumno(id, value) { return apiPut(`/v1/estudiantes/${id}`, { nombres: value.nombres.trim(), apellido_paterno: value.apellido_paterno.trim(), apellido_materno: value.apellido_materno.trim(), dni: value.dni.trim(), fecha_nacimiento: value.fecha_nacimiento, estado: Boolean(value.estado) }); }
