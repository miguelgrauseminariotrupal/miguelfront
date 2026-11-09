const RECOVERY_KEY = "miguel_token_reload_attempted";
let navigating = false;

export function resetSessionRecovery() {
  sessionStorage.removeItem(RECOVERY_KEY);
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
    window.location.replace("/login");
  }
  return true;
}
