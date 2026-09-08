import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getDocentes } from "../../services/docentes.service";
import { getProgramacionCursos } from "../../services/programacionCursos.service";
import { createProgramacionSeccion, getProgramacionSecciones, updateProgramacionSeccion } from "../../services/programacionSecciones.service";
import CourseAssignmentPanel from "./CourseAssignmentPanel";
import TeacherSelector, { teacherFullName } from "./TeacherSelector";

export default function ResponsibleTeacherSection({ classRecord, onUpdated }) {
  const [teachers, setTeachers] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  useEffect(() => { getDocentes().then(setTeachers).catch(() => setFeedback({ type: "error", message: "No se pudieron cargar los docentes." })); }, []);
  const currentTeacher = classRecord?.docente_responsable || classRecord?.docente || teachers.find((item) => String(item.id_docente) === String(classRecord?.id_docente_responsable));
  const hasCurrentTeacher = Boolean(classRecord?.id_docente_responsable || currentTeacher?.id_docente);
  const assign = async (selected) => {
    setFeedback({ type: "", message: "" });
    try {
      if (classRecord.id_programacion_seccion) {
        const assignedCourses = await getProgramacionCursos({ id_programacion_seccion: classRecord.id_programacion_seccion, estado: true });
        await updateProgramacionSeccion(classRecord.id_programacion_seccion, classRecord.id_seccion, selected.id_docente, assignedCourses.length > 0);
      } else {
        await createProgramacionSeccion(classRecord.id_seccion, selected.id_docente, false);
      }
      const records = await getProgramacionSecciones();
      const updated = records.find((item) => String(item.id_seccion) === String(classRecord.id_seccion));
      onUpdated?.({ ...classRecord, ...updated, docente_responsable: selected, id_docente_responsable: selected.id_docente });
      setFeedback({ type: "success", message: hasCurrentTeacher ? "Docente responsable actualizado correctamente." : "Docente responsable asignado correctamente." });
      setPickerOpen(false);
    } catch (error) { setFeedback({ type: "error", message: error?.message || "No se pudo asignar el docente responsable." }); }
  };
  return <>
    <section className="responsible-teacher-card">
      <div className="responsible-teacher-card__heading"><div><span>Detalle de clase</span><h3>Docente responsable</h3></div><UserRound size={24} /></div>
      {classRecord?.academic_context && <p className="class-academic-path">{[classRecord.academic_context.anio?.anio, classRecord.academic_context.nivel?.nombre, classRecord.academic_context.grado?.nombre, classRecord.academic_context.seccion?.nombre].filter(Boolean).join(" - ")}</p>}
      {hasCurrentTeacher ? <div className="current-teacher"><small>Docente responsable actual</small><strong>{teacherFullName(currentTeacher) || "Cargando docente..."}</strong></div> : <p className="responsible-teacher-empty">No hay un docente responsable asignado.</p>}
      {!pickerOpen && <button className="teacher-primary-action" type="button" onClick={() => { setPickerOpen(true); setFeedback({ type: "", message: "" }); }}>{hasCurrentTeacher ? "Cambiar docente responsable" : "Asignar docente"}</button>}
      {pickerOpen && <TeacherSelector onCancel={() => setPickerOpen(false)} onConfirm={assign} />}
      {feedback.message && <p className={`parameter-feedback is-${feedback.type}`}>{feedback.message}</p>}
    </section>
    {!coursesOpen && <button className="assign-courses-button" type="button" onClick={() => setCoursesOpen(true)}>Asignar cursos a clase</button>}
    {coursesOpen && <CourseAssignmentPanel classRecord={classRecord} onClose={() => setCoursesOpen(false)} />}
  </>;
}
