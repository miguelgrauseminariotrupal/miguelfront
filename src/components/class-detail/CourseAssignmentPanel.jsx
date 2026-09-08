import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getCursos } from "../../services/cursos.service";
import { getDocentes } from "../../services/docentes.service";
import { createProgramacionCurso, getProgramacionCursos, updateProgramacionCurso } from "../../services/programacionCursos.service";
import { updateProgramacionSeccion } from "../../services/programacionSecciones.service";
import TeacherSelector, { teacherFullName } from "./TeacherSelector";

export default function CourseAssignmentPanel({ classRecord, onClose }) {
  const [rows, setRows] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const yearId = classRecord?.academic_context?.anio?.id_anio_lectivo;
    Promise.all([getCursos(yearId), getProgramacionCursos(), getDocentes()]).then(([courses, assignments, teachers]) => {
      const byTeacher = new Map(teachers.map((teacher) => [String(teacher.id_docente), teacher]));
      const existing = assignments.filter((item) => String(item.id_programacion_seccion) === String(classRecord.id_programacion_seccion));
      setRows(courses.map((course) => { const assignment = existing.find((item) => String(item.id_curso) === String(course.id_curso)); const defaultTeacher = classRecord.id_docente_responsable ? byTeacher.get(String(classRecord.id_docente_responsable)) : null; const teacher = assignment?.id_docente ? byTeacher.get(String(assignment.id_docente)) : defaultTeacher; return { course, assignment, selected: Boolean(assignment), teacher, defaultTeacher }; }));
    }).catch(() => setFeedback({ type: "error", message: "No se pudieron cargar los cursos de la clase." })).finally(() => setLoading(false));
  }, [classRecord]);

  const toggle = (courseId) => setRows((current) => current.map((row) => {
    if (row.course.id_curso !== courseId) return row;
    if (row.assignment && row.selected) { setFeedback({ type: "error", message: "El backend no permite quitar una asignación ya guardada." }); return row; }
    return { ...row, selected: !row.selected, teacher: !row.selected ? (row.teacher || row.defaultTeacher) : null };
  }));
  const selectTeacher = async (teacher) => { setRows((current) => current.map((row) => row.course.id_curso === editingCourse ? { ...row, teacher } : row)); setEditingCourse(null); };
  const save = async () => {
    const selectedRows = rows.filter((row) => row.selected);
    if (selectedRows.some((row) => !row.teacher?.id_docente)) return setFeedback({ type: "error", message: "Todos los cursos seleccionados deben tener un docente." });
    if (!classRecord.id_programacion_seccion) return setFeedback({ type: "error", message: "La clase necesita una programación de sección antes de asignar cursos." });
    setSaving(true); setFeedback({ type: "", message: "" });
    try {
      await Promise.all(selectedRows.map((row) => row.assignment ? updateProgramacionCurso(row.assignment.id_programacion_curso, { ...row.assignment, id_docente: row.teacher.id_docente, estado: true }) : createProgramacionCurso(classRecord.id_programacion_seccion, row.course.id_curso, row.teacher.id_docente)));
      await updateProgramacionSeccion(
        classRecord.id_programacion_seccion,
        classRecord.id_seccion,
        classRecord.id_docente_responsable,
        selectedRows.length > 0,
      );
      setFeedback({ type: "success", message: "Cursos asignados correctamente." });
    } catch { setFeedback({ type: "error", message: "No se pudieron guardar las asignaciones de cursos." }); }
    finally { setSaving(false); }
  };

  return <section className="course-assignment-panel"><h3>Asignar cursos a clase</h3>{loading && <p className="parameter-empty">Cargando cursos...</p>}{!loading && <div className="parameter-table-wrap"><table className="parameter-table"><thead><tr><th>Seleccionar</th><th>Curso</th><th>Docente asignado</th><th>Acción</th></tr></thead><tbody>{rows.map((row) => <tr key={row.course.id_curso}><td><input type="checkbox" checked={row.selected} onChange={() => toggle(row.course.id_curso)} /></td><td>{row.course.nombre}</td><td>{row.selected ? (teacherFullName(row.teacher) || "Sin docente") : "—"}</td><td><button type="button" disabled={!row.selected} onClick={() => setEditingCourse(row.course.id_curso)}><Pencil size={15} />{row.teacher ? "Cambiar docente" : "Asignar docente"}</button></td></tr>)}</tbody></table></div>}
    {editingCourse && <TeacherSelector onCancel={() => setEditingCourse(null)} onConfirm={selectTeacher} />}
    {feedback.message && <p className={`parameter-feedback is-${feedback.type}`}>{feedback.message}</p>}
    <div className="teacher-picker__actions"><button type="button" className="parameter-cancel" onClick={onClose}>Cancelar</button><button type="button" className="parameter-save" disabled={loading || saving} onClick={save}>{saving ? "Guardando..." : "Guardar asignación"}</button></div>
  </section>;
}
