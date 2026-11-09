export function sectionEnrollments(enrollments, selection) {
  return selection?.seccion ? enrollments.filter(item => String(item.id_seccion) === String(selection.seccion)) : enrollments;
}
