import { apiGet, apiPost, apiPut, extractList } from "./api";

export async function getUsuarios({ estado, signal } = {}) { return extractList(await apiGet("/usuarios", { params: { estado }, signal })); }
export function getUsuario(id, { signal } = {}) { return apiGet(`/usuarios/${id}`, { signal }); }
export function createUsuario(value) { return apiPost("/usuarios", { usuario: value.usuario.trim(), correo: value.correo.trim(), password: value.password, ...(value.estado === undefined ? {} : { estado: Boolean(value.estado) }) }); }
export function updateUsuario(id, value) { return apiPut(`/usuarios/${id}`, { ...(value.usuario === undefined ? {} : { usuario: value.usuario.trim() }), ...(value.correo === undefined ? {} : { correo: value.correo.trim() }), ...(value.password ? { password: value.password } : {}), ...(value.estado === undefined ? {} : { estado: Boolean(value.estado) }) }); }
