import { Search, UserPlus, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAlumnos } from "../../services/alumnos.service";
import { createMatricula, getMatriculas, updateMatricula } from "../../services/matriculas.service";

const fullName = (student = {}) => [student.nombres, student.apellido_paterno, student.apellido_materno].filter(Boolean).join(" ");
const matches = (student, query) => [fullName(student), student.dni].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(query);

export default function EnrollmentWorkspace({ selection }) {
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const sectionId = selection?.seccion;

  const load = useCallback(async (signal) => {
    if (!sectionId) { setStudents([]); setEnrollments([]); return; }
    setLoading(true); setFeedback({ type: "", message: "" });
    try {
      const [studentList, enrollmentList] = await Promise.all([
        getAlumnos({ estado: true, signal }),
        getMatriculas({ signal }),
      ]);
      setStudents(studentList);
      setEnrollments(enrollmentList);
    } catch (error) {
      if (error.name !== "AbortError") setFeedback({ type: "error", message: error.message || "No se pudo cargar la matrícula." });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    const controller = new AbortController();
    setQuery(""); setAdding(false);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const studentById = useMemo(() => new Map(students.map((student) => [String(student.id_estudiante), student])), [students]);
  const activeEnrollments = useMemo(() => enrollments.filter((item) => item.estado !== false && String(item.id_seccion) === String(sectionId)), [enrollments, sectionId]);
  const activeStudentIds = useMemo(() => new Set(enrollments.filter((item) => item.estado !== false).map((item) => String(item.id_estudiante))), [enrollments]);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const availableStudents = students.filter((student) => !activeStudentIds.has(String(student.id_estudiante)) && (!normalizedQuery || matches(student, normalizedQuery)));

  const enroll = async (student) => {
    setWorkingId(`add-${student.id_estudiante}`); setFeedback({ type: "", message: "" });
    try {
      const previous = enrollments.find((item) => String(item.id_estudiante) === String(student.id_estudiante) && String(item.id_seccion) === String(sectionId));
      if (previous) await updateMatricula(previous.id_matricula, { estado: true });
      else await createMatricula({ id_seccion: sectionId, id_estudiante: student.id_estudiante });
      await load();
      setFeedback({ type: "success", message: `${fullName(student)} fue matriculado correctamente.` });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "No se pudo matricular al estudiante." });
    } finally { setWorkingId(""); }
  };

  if (!sectionId) return <section className="enrollment-workspace"><div className="demo-notice"><span>Selecciona una sección</span><p>Completa los filtros para administrar sus matrículas.</p></div></section>;

  return <section className="enrollment-workspace">
    <div className="enrollment-heading"><div><Users size={20} /><h3>Alumnos matriculados</h3></div><div className="enrollment-heading__actions"><span>{activeEnrollments.length} estudiantes</span><button className="enrollment-add" type="button" onClick={() => { setAdding((value) => !value); setQuery(""); }}>{adding ? <X size={16} /> : <UserPlus size={16} />}{adding ? "Cerrar" : "Agregar alumno"}</button></div></div>
    {feedback.message && <p className={`parameter-feedback is-${feedback.type}`} role="status">{feedback.message}</p>}
    {loading && <p className="parameter-empty">Cargando matrículas...</p>}
    {!loading && <div className={`enrollment-grid ${adding ? "is-adding" : ""}`}>
      <div className="enrollment-card">
        <h4>Matriculados en la sección</h4>
        {!activeEnrollments.length && <p className="parameter-empty">Esta sección aún no tiene alumnos matriculados.</p>}
        <div className="enrollment-list">{activeEnrollments.map((enrollment) => {
          const student = studentById.get(String(enrollment.id_estudiante));
          return <article key={enrollment.id_matricula}><div><strong>{fullName(student) || `Estudiante ${enrollment.id_estudiante}`}</strong><small>{student?.dni ? `DNI ${student.dni}` : `Matrícula #${enrollment.id_matricula}`}</small></div></article>;
        })}</div>
      </div>
      {adding && <div className="enrollment-card">
        <h4>Agregar alumno</h4>
        <label className="enrollment-search"><Search size={17} /><span className="sr-only">Buscar alumno</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o DNI" /></label>
        {!availableStudents.length && <p className="parameter-empty">No hay alumnos disponibles para matricular.</p>}
        <div className="enrollment-list enrollment-list--available">{availableStudents.map((student) => <article key={student.id_estudiante}><div><strong>{fullName(student)}</strong><small>{student.dni ? `DNI ${student.dni}` : "Sin DNI"}</small></div><button className="enrollment-add" type="button" disabled={Boolean(workingId)} onClick={() => enroll(student)}><UserPlus size={16} />{workingId === `add-${student.id_estudiante}` ? "Agregando..." : "Matricular"}</button></article>)}</div>
      </div>}
    </div>}
  </section>;
}
