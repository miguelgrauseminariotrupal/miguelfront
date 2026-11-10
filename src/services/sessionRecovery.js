const RECOVERY_KEY = "miguel_token_reload_attempted";
export const SESSION_RECOVERY_NOTICE_KEY = "miguel_session_expired";
export const SESSION_EXPIRED_EVENT = "miguel:session-expired";
let navigating = false;

export function resetSessionRecovery() {
  sessionStorage.removeItem(RECOVERY_KEY);
  sessionStorage.removeItem(SESSION_RECOVERY_NOTICE_KEY);
  navigating = false;
}

export function recoverExpiredSession({ status, message, accessToken }) {
  if (status !== 401 || !accessToken) return false;
  const text = String(message || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!/(?:token|jwt).*(?:invalid|vencid|expir)|(?:invalid|vencid|expir).*(?:token|jwt)/i.test(text)) return false;
  // Una respuesta antigua no debe cerrar la sesión de una cuenta recién autenticada.
  let current;
  try { current = JSON.parse(sessionStorage.getItem("miguel_session")); } catch { return false; }
  if (current?.access_token !== accessToken) return false;
  if (navigating) return true;
  navigating = true;
  if (!sessionStorage.getItem(RECOVERY_KEY)) {
    sessionStorage.setItem(RECOVERY_KEY, "1");
    window.location.reload();
  } else {
    // Recargar no renueva un token vencido. Pedir una nueva sesión si el error persiste.
    for (const key of ["miguel_session", "miguel_authenticated", "miguel_role", "miguel_agent_chats", RECOVERY_KEY]) sessionStorage.removeItem(key);
    sessionStorage.setItem(SESSION_RECOVERY_NOTICE_KEY, "1");
    // Cierra la sesión dentro de la app (el router lleva a /login sin recargar) y,
    // como respaldo, hace una navegación completa por si nadie atiende el evento.
    if (typeof window.dispatchEvent === "function" && typeof Event === "function") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    window.location.replace("/login");
  }
  return true;
}
