import { createContext, useContext, useMemo, useState } from "react";

const AUTH_KEY = "miguel_authenticated";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(AUTH_KEY) === "true");
  const value = useMemo(() => ({
    isAuthenticated,
    login() { sessionStorage.setItem(AUTH_KEY, "true"); setIsAuthenticated(true); },
    logout() { sessionStorage.removeItem(AUTH_KEY); setIsAuthenticated(false); },
  }), [isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
