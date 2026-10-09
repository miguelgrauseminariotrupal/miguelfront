import { createContext, useContext, useMemo, useState } from "react";
import { apiPost } from "../services/api";
const SESSION_KEY = "miguel_session";
const AuthContext = createContext(null);
function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return saved?.access_token && saved?.usuario ? saved : null;
  } catch { return null; }
}
const getRole = session => session?.roles?.some(item => item.toUpperCase() === "ADMIN") ? "admin" : "asistencia";
export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const role = session ? getRole(session) : null;
  const value = useMemo(() => ({
    isAuthenticated: Boolean(session), role,
    user: session?.usuario, docente: session?.docente,
    async login(username, password) {
      const usuario = username.trim().toLowerCase();
      const correo = usuario.includes("@") ? usuario : `${usuario}@miguelgrau.com`;
      const result = await apiPost("/login", { usuario: correo, password });
      if (!result?.access_token || !result?.usuario) throw new Error("El servidor no devolvió una sesión válida.");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
      setSession(result);
      return getRole(result);
    },
    logout() {
      for (const key of [SESSION_KEY, "miguel_authenticated", "miguel_role", "miguel_agent_chats"]) sessionStorage.removeItem(key);
      setSession(null);
    },
  }), [session, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
