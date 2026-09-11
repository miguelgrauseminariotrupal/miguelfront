import { CalendarDays, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAlumno } from "../../services/alumnos.service";
import { createAsistencia, getAsistencias, updateAsistencia } from "../../services/asistencias.service";
import { getMatriculas } from "../../services/matriculas.service";
import { getTiposAsistencia } from "../../services/tiposAsistencia.service";

const formatDate = (date) => new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
const fullName = (student) => [student.nombres, student.apellido_paterno, student.apellido_materno].filter(Boolean).join(" ");
const initials = (student) => [student.nombres, student.apellido_paterno].filter(Boolean).map((part) => part.trim().charAt(0)).join("").toUpperCase();
const typeTone = (code) => ({ A: "present", J: "justified", F: "absent", T: "late" }[code?.toUpperCase()] || "default");
const dateValue = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const dateFromValue = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function AttendanceWorkspace({ selection }) {
  const [students, setStudents] = useState([]);
  const [attendanceTypes, setAttendanceTypes] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [savedAttendance, setSavedAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const today = useMemo(() => new Date(), []);
  const todayDate = useMemo(() => dateValue(today), [today]);
  const [selectedDate, setSelectedDate] = useState(todayDate);
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
    setStudents([]); setAttendance({}); setSavedAttendance({}); setError(""); setFeedback("");
    if (!sectionId) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    getMatriculas({ id_seccion: sectionId, estado: true, signal: controller.signal })
      .then(async (enrollments) => {
        const uniqueStudentIds = [...new Set(enrollments.map((item) => item.id_estudiante).filter(Boolean))];
        const [studentRecords, dailyAttendance] = await Promise.all([
          Promise.all(uniqueStudentIds.map((id) => getAlumno(id, { signal: controller.signal }))),
          getAsistencias({ fecha: selectedDate, signal: controller.signal }),
        ]);
        const enrollmentByStudent = new Map(enrollments.map((item) => [String(item.id_estudiante), item]));
        setStudents(studentRecords.map((student) => ({ ...student, enrollment: enrollmentByStudent.get(String(student.id_estudiante)) })));
        const enrollmentIds = new Set(enrollments.map((item) => String(item.id_matricula)));
        const records = Object.fromEntries(dailyAttendance.filter((item) => enrollmentIds.has(String(item.id_matricula))).map((item) => [String(item.id_matricula), item]));
        setSavedAttendance(records);
        setAttendance(Object.fromEntries(enrollments.map((item) => [String(item.id_estudiante), records[String(item.id_matricula)]?.id_tipo_asistencia]).filter(([, typeId]) => typeId != null)));
      })
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message || "No se pudieron cargar los estudiantes matriculados."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [sectionId, selectedDate]);

  const moveDate = (days) => {
    const nextDate = dateFromValue(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(dateValue(nextDate));
  };

  const setStudentStatus = (studentId, typeId) => setAttendance((current) => ({ ...current, [studentId]: typeId }));

  const saveAttendance = async () => {
    if (!students.length) return;
    if (students.some((student) => !attendance[String(student.id_estudiante)])) {
      setFeedback("Selecciona un tipo de asistencia para todos los estudiantes.");
      return;
    }
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const results = await Promise.all(students.map((student) => {
        const enrollmentId = student.enrollment.id_matricula;
        const payload = {
          id_matricula: enrollmentId,
          id_tipo_asistencia: attendance[String(student.id_estudiante)],
          fecha: selectedDate,
        };
        const existing = savedAttendance[String(enrollmentId)];
        return existing ? updateAsistencia(existing.id_asistencia, payload) : createAsistencia(payload);
      }));
      setSavedAttendance(Object.fromEntries(results.map((item) => [String(item.id_matricula), item])));
      setFeedback("Asistencia guardada correctamente.");
    } catch (requestError) {
      setError(requestError.message || "No se pudo guardar la asistencia.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="attendance-workspace">
    {!filtersComplete && <div className="demo-notice"><span>Selecciona una sección</span><p>Completa los filtros académicos para cargar los estudiantes matriculados.</p></div>}
    <div className="attendance-toolbar">
      <div className="attendance-date"><span>Asistencia del día</span><strong>{formatDate(dateFromValue(selectedDate))}</strong></div>
      <label className="attendance-date-picker"><span>Seleccionar fecha</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value || todayDate)} /></label>
    </div>
    <div className="attendance-navigation"><button type="button" aria-label="Día anterior" onClick={() => moveDate(-1)}><ChevronLeft size={19} /></button><span>{selectedDate === todayDate ? "Hoy" : formatDate(dateFromValue(selectedDate))}</span><button type="button" aria-label="Día siguiente" onClick={() => moveDate(1)}><ChevronRight size={19} /></button></div>
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
    {feedback && <p className={`parameter-feedback ${feedback.includes("correctamente") ? "is-success" : "is-error"}`} role="status">{feedback}</p>}
    <button className="attendance-save" type="button" disabled={loading || saving || students.length === 0} onClick={saveAttendance}><CalendarDays size={17} />{saving ? "Guardando..." : "Guardar asistencia"}</button>
    <p className="attendance-demo-caption">Mostrando la asistencia correspondiente al {selectedDate}. Al cambiar la fecha se cargan sus registros guardados.</p>
  </section>;
}
