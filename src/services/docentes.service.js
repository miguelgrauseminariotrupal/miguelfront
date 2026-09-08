import { apiGet, apiPost, apiPut, extractList } from "./api";

const clean = (value) => value?.trim() || null;
const flag = (value) => value === true || value === "true";

export async function getDocentes({ estado, id_usuario, q, signal } = {}) { return extractList(await apiGet("/docentes", { params: { estado, id_usuario, q }, signal })); }
export function getDocente(id, { signal } = {}) { return apiGet(`/docentes/${id}`, { signal }); }
export function createDocente(value) { return apiPost("/docentes", { nombres: value.nombres.trim(), apellido_paterno: clean(value.apellido_paterno), apellido_materno: clean(value.apellido_materno), correo: clean(value.correo), dni: clean(value.dni), telefono: clean(value.telefono), indUsuario: flag(value.indUsuario), ...(value.id_usuario ? { id_usuario: Number(value.id_usuario) } : {}) }); }
export function updateDocente(id, value) { return apiPut(`/docentes/${id}`, { ...(value.id_usuario ? { id_usuario: Number(value.id_usuario) } : {}), nombres: value.nombres.trim(), apellido_paterno: clean(value.apellido_paterno), apellido_materno: clean(value.apellido_materno), dni: clean(value.dni), telefono: clean(value.telefono), correo: clean(value.correo), estado: flag(value.estado) }); }
