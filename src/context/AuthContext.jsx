import { createContext, useContext, useMemo, useState } from "react";

const AUTH_KEY = "miguel_authenticated";
const ROLE_KEY = "miguel_role";
const AuthContext = createContext(null);

const users = {
  admin: { password: "admin", role: "admin" },
  asistencia: { password: "123", role: "asistencia" },
};

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => sessionStorage.getItem(ROLE_KEY));
  const isAuthenticated = sessionStorage.getItem(AUTH_KEY) === "true" && Boolean(role);
  const value = useMemo(() => ({
    isAuthenticated,
    role,
    login(username, password) {
      const account = users[username.trim().toLowerCase()];
      if (!account || account.password !== password) return null;
      sessionStorage.setItem(AUTH_KEY, "true");
      sessionStorage.setItem(ROLE_KEY, account.role);
      setRole(account.role);
      return account.role;
    },
    logout() {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      setRole(null);
    },
  }), [isAuthenticated, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
