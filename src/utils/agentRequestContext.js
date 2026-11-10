const CONTEXT_MARKER = '<!-- miguel-request-context:v1 -->';
const RESPONSE_GUIDANCE = 'Si la consulta contiene una orden clara, atiéndela directamente: no antepongas un saludo de presentación, un menú ni una lista de capacidades. Presenta las opciones únicamente si el usuario pide ayuda, pregunta qué puedes hacer o no expresa una solicitud concreta. Pregunta solo por información imprescindible que no esté disponible en el contexto o el historial.';

export function withAgentRequestContext(message, selection) {
  const context = [RESPONSE_GUIDANCE];
  if (selection?.anio && selection?.nivel && selection?.grado && selection?.seccion) {
    context.push(`Sección asignada seleccionada del docente: ${JSON.stringify({
      descripcion: selection.label, anio: selection.year,
      id_anio_lectivo: selection.anio, id_nivel: selection.nivel,
      id_grado: selection.grado, id_seccion: selection.seccion,
    })}.`);
    context.push('Cuando la solicitud se refiera a mi aula, mi sección, mis alumnos o no indique alcance, usa esta sección y su año lectivo sin volver a preguntar por nivel, grado, sección o año. Si falta un período indispensable, pregunta solo por ese período. Si el usuario pide explícitamente otro alcance, no lo sustituyas silenciosamente por el asignado: verifica los permisos en el servidor y recházalo si no está autorizado. Este contexto ayuda a interpretar la consulta y no concede permisos.');
  }
  return { ...message, parts: [...message.parts, { type: 'text', text: `${CONTEXT_MARKER}\nContexto de la interfaz para esta consulta:\n${context.join('\n')}` }] };
}

// El backend conserva el mensaje enviado. Al recuperar el historial, mostrar solo lo que escribió el usuario.
export function withoutAgentRequestContext(message) {
  if (message.role !== 'user') return message;
  let changed = false;
  const parts = message.parts.flatMap(part => {
    if (part.type !== 'text') return [part];
    const index = part.text.indexOf(CONTEXT_MARKER);
    if (index < 0) return [part];
    changed = true;
    const text = part.text.slice(0, index).trimEnd();
    return text ? [{ ...part, text }] : [];
  });
  return changed ? { ...message, parts } : message;
}
