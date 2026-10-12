export function sectionEnrollments(enrollments, selection) {
  return selection?.seccion ? enrollments.filter(item => String(item.id_seccion) === String(selection.seccion)) : enrollments;
}

export function sectionPrompt(text, selection) {
  if (!selection?.seccion) return text;
  return `${text}\n\nContexto de mi sección asignada: ${selection.label || ""}. Año lectivo ID ${selection.anio}, nivel ID ${selection.nivel}, grado ID ${selection.grado}, sección ID ${selection.seccion}. Usa esta sección para la consulta.`;
}
