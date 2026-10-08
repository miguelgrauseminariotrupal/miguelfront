export function chatErrorMessage(error) {
  const cause = error?.lastError || error;
  const status = cause?.statusCode;
  const message = String(cause?.message || '');
  if (status === 404) return 'El modelo configurado no está disponible. Revisa CHAT_MODEL en el servidor.';
  if (status === 429) return 'Gemini alcanzó el límite de uso o cuota. Revisa la cuota de tu cuenta e intenta más tarde.';
  if (status === 401 || status === 403 || /API key not valid|API_KEY_INVALID/i.test(message)) {
    return 'Gemini rechazó el acceso. Revisa GEMINI_API_KEY y los permisos de la cuenta.';
  }
  if (/Cannot connect to API|fetch failed/i.test(message)) {
    return 'El servidor no pudo conectar con Gemini. Revisa su acceso a internet e intenta nuevamente.';
  }
  if (message.includes('Supabase')) return 'No se pudo guardar la respuesta en Supabase. Revisa la configuración del historial.';
  return 'No se pudo completar la respuesta. Intenta nuevamente.';
}
