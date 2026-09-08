import { CalendarDays, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAlumno } from "../../services/alumnos.service";
import { getMatriculas } from "../../services/matriculas.service";
import { getTiposAsistencia } from "../../services/tiposAsistencia.service";

const periods = [{ id: "dia", label: "Día" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }];
const formatDate = (date) => new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
const fullName = (student) => [student.nombres, student.apellido_paterno, student.apellido_materno].filter(Boolean).join(" ");
const initials = (student) => [student.nombres, student.apellido_paterno].filter(Boolean).map((part) => part.trim().charAt(0)).join("").toUpperCase();
const typeTone = (code) => ({ A: "present", J: "justified", F: "absent", T: "late" }[code?.toUpperCase()] || "default");

export default function AttendanceWorkspace({ selection }) {
  const [period, setPeriod] = useState("dia");
  const [students, setStudents] = useState([]);
  const [attendanceTypes, setAttendanceTypes] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = useMemo(() => new Date(), []);
  const sectionId = selection?.seccion;
  const filtersComplete = Boolean(selection?.anio && selection?.nivel && selection?.grado && sectionId);

  useEffect(() => {
    const controller = new AbortController();
    getTiposAsistencia({ estado: true, signal: controller.signal })
      .then(setAttendanceTypes)
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message || "No se pudieron cargar los tipos de asistencia."); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStudents([]); setAttendance({}); setError("");
    if (!sectionId) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    getMatriculas({ id_seccion: sectionId, estado: true, signal: controller.signal })
      .then(async (enrollments) => {
        const uniqueStudentIds = [...new Set(enrollments.map((item) => item.id_estudiante).filter(Boolean))];
        const studentRecords = await Promise.all(uniqueStudentIds.map((id) => getAlumno(id, { signal: controller.signal })));
        const enrollmentByStudent = new Map(enrollments.map((item) => [String(item.id_estudiante), item]));
        setStudents(studentRecords.map((student) => ({ ...student, enrollment: enrollmentByStudent.get(String(student.id_estudiante)) })));
      })
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message || "No se pudieron cargar los estudiantes matriculados."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [sectionId]);

  const setStudentStatus = (studentId, typeId) => setAttendance((current) => ({ ...current, [studentId]: typeId }));

  return <section className="attendance-workspace">
    {!filtersComplete && <div className="demo-notice"><span>Selecciona una sección</span><p>Completa los filtros académicos para cargar los estudiantes matriculados.</p></div>}
    <div className="attendance-toolbar"><div className="attendance-date"><span>Fecha</span><strong>{formatDate(today)}</strong></div><div className="attendance-period" aria-label="Periodo de asistencia">{periods.map((item) => <button key={item.id} type="button" className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div></div>
    <div className="attendance-navigation"><button type="button" aria-label="Periodo anterior"><ChevronLeft size={19} /></button><span>{period === "dia" ? "Hoy" : period === "semana" ? "Esta semana" : "Este mes"}</span><button type="button" aria-label="Periodo siguiente"><ChevronRight size={19} /></button></div>
    <div className="student-list-heading"><div><Users size={19} /><h3>Estudiantes matriculados</h3></div><span>{loading ? "Cargando..." : `${students.length} estudiantes`}</span></div>
    <div className="student-attendance-list">
      {loading && <p className="parameter-empty">Cargando matrículas y estudiantes...</p>}
      {!loading && error && <p className="parameter-feedback is-error" role="alert">{error}</p>}
      {!loading && !error && filtersComplete && students.length === 0 && <p className="parameter-empty">No hay estudiantes matriculados en esta sección.</p>}
      {!loading && !error && students.map((student) => {
        const studentId = String(student.id_estudiante); const name = fullName(student) || `Estudiante ${student.id_estudiante}`;
        return <article className="student-attendance-row" key={studentId}>
          <div className="student-identity"><span className="student-avatar">{initials(student) || "E"}</span><div><strong>{name}</strong><small>{student.dni ? `DNI ${student.dni}` : `Matrícula #${student.enrollment?.id_matricula}`}</small></div></div>
          <div className="student-status" aria-label={`Asistencia de ${name}`}>{attendanceTypes.map((type) => {
            const selected = String(attendance[studentId]) === String(type.id_tipo_asistencia);
            return <button type="button" key={type.id_tipo_asistencia} className={`attendance-type attendance-type--${typeTone(type.codigo)}${selected ? " is-selected" : ""}`} aria-label={type.descripcion} aria-pressed={selected} title={type.descripcion} onClick={() => setStudentStatus(studentId, type.id_tipo_asistencia)}><span className="attendance-type__code">{type.codigo}</span><span className="attendance-type__label">{type.descripcion}</span></button>;
          })}</div>
        </article>;
      })}
    </div>
    <button className="attendance-save" type="button" disabled><CalendarDays size={17} />Guardar asistencia</button>
    <p className="attendance-demo-caption">Selecciona un tipo de asistencia para cada estudiante.</p>
  </section>;
}
