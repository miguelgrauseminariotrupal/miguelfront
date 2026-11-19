const CONTEXT_MARKER = '<!-- miguel-request-context:v1 -->';
const RESPONSE_GUIDANCE = 'EXCEPCIÓN: si el mensaje del usuario es solo un saludo (por ejemplo "Hola") o pregunta qué puedes hacer, ignora el resto de este contexto: salúdalo, preséntate y muestra tus funciones, sin pedir bimestre, competencias ni otros datos y sin llamar herramientas. Si la consulta contiene una orden clara, atiéndela directamente: no antepongas un saludo de presentación, un menú ni una lista de capacidades. Presenta las opciones únicamente si el usuario pide ayuda, pregunta qué puedes hacer o no expresa una solicitud concreta. Pregunta solo por información imprescindible que no esté disponible en el contexto o el historial.';

export function withAgentRequestContext(message, selection) {
  const context = [RESPONSE_GUIDANCE,
    'Formato de todas las respuestas y comentarios: usa Markdown claro y ordenado, con párrafos breves separados por una línea en blanco. Separa cada área o tema con un encabezado y una línea en blanco antes de su lista. Escribe cada competencia u opción en su propia línea de una lista numerada; conserva una numeración continua entre áreas para que el usuario pueda elegir sin ambigüedad. Nunca juntes varias competencias en un párrafo. Para seleccionar competencias de un reporte, indica que debe elegir de 1 a 3 y permite responder con sus números. Usa viñetas para observaciones y pasos numerados para instrucciones; tablas solo cuando ayuden a comparar datos.'];
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
