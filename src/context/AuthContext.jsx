import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiPost } from "../services/api";
import { getUsuario } from "../services/usuarios.service";
const SESSION_KEY = "miguel_session";
const AuthContext = createContext(null);
function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return saved?.access_token && saved?.usuario ? saved : null;
  } catch { return null; }
}
const getRole = session => {
  const roles = Array.isArray(session?.roles) ? session.roles.filter(item => typeof item === "string").map(item => item.toUpperCase()) : [];
  if (roles.includes("ADMIN")) return "admin";
  if (roles.includes("DOCENTE")) return "docente";
  return null;
};
export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const role = session ? getRole(session) : null;
  const userId = session?.usuario?.id_usuario;
  const accessToken = session?.access_token;

  useEffect(() => {
    if (!userId || !accessToken) return;
    const controller = new AbortController();
    getUsuario(userId, { signal: controller.signal }).then(result => {
      const profile = result?.usuario || result?.data || result;
      if (controller.signal.aborted || String(profile?.id_usuario) !== String(userId)) return;
      const names = Object.fromEntries(["nombres", "apaterno", "amaterno"]
        .filter(key => Object.hasOwn(profile, key))
        .map(key => [key, profile[key]]));
      if (!Object.keys(names).length) return;
      setSession(current => {
        if (current?.access_token !== accessToken || String(current?.usuario?.id_usuario) !== String(userId)) return current;
        const updated = { ...current, usuario: { ...current.usuario, ...names } };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        return updated;
      });
    }).catch(() => { /* El nombre devuelto por login sigue disponible si falla la consulta. */ });
    return () => controller.abort();
  }, [userId, accessToken]);

  const userFullName = [session?.usuario?.nombres, session?.usuario?.apaterno, session?.usuario?.amaterno]
    .filter(value => typeof value === "string" && value.trim())
    .map(value => value.trim()).join(" ");
  const value = useMemo(() => ({
    isAuthenticated: Boolean(session && role), role,
    user: session?.usuario, docente: session?.docente,
    userFullName,
    async login(username, password) {
      const usuario = username.trim().toLowerCase();
      const correo = usuario.includes("@") ? usuario : `${usuario}@miguelgrau.com`;
      const result = await apiPost("/login", { usuario: correo, password });
      if (!result?.access_token || !result?.usuario) throw new Error("El servidor no devolvió una sesión válida.");
      if (!getRole(result)) throw new Error("Tu usuario no tiene un rol ADMIN o DOCENTE activo. Solicita al administrador que lo asigne.");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
      setSession(result);
      return getRole(result);
    },
    logout() {
      for (const key of [SESSION_KEY, "miguel_authenticated", "miguel_role", "miguel_agent_chats"]) sessionStorage.removeItem(key);
      setSession(null);
    },
  }), [session, role, userFullName]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
