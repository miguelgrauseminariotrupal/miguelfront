import { CalendarDays, Check, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { useMemo, useState } from "react";

const periods = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
];

const exampleStudents = [
  { id: "demo-1", name: "Ana Torres", initials: "AT" },
  { id: "demo-2", name: "Diego Ramos", initials: "DR" },
  { id: "demo-3", name: "Lucía Medina", initials: "LM" },
  { id: "demo-4", name: "Mateo Flores", initials: "MF" },
];

const formatDate = (date) => new Intl.DateTimeFormat("es-PE", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
}).format(date);

export default function AttendanceWorkspace({ selection }) {
  const [period, setPeriod] = useState("dia");
  const [attendance, setAttendance] = useState({ "demo-1": "present", "demo-2": "absent" });
  const today = useMemo(() => new Date(), []);
  const filtersComplete = Boolean(selection?.anio && selection?.nivel && selection?.grado && selection?.seccion);

  const setStudentStatus = (studentId, status) => {
    setAttendance((current) => ({ ...current, [studentId]: status }));
  };

  return (
    <section className="attendance-workspace">
      <div className="demo-notice">
        <span>Vista de ejemplo</span>
        <p>{filtersComplete ? "Los datos mostrados son demostrativos." : "Completa los filtros para cargar información real cuando las APIs estén disponibles."}</p>
      </div>

      <div className="attendance-toolbar">
        <div className="attendance-date"><span>Fecha</span><strong>{formatDate(today)}</strong></div>
        <div className="attendance-period" aria-label="Periodo de asistencia">
          {periods.map((item) => <button key={item.id} type="button" className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}
        </div>
      </div>

      <div className="attendance-navigation">
        <button type="button" aria-label="Periodo anterior"><ChevronLeft size={19} /></button>
        <span>{period === "dia" ? "Hoy" : period === "semana" ? "Esta semana" : "Este mes"}</span>
        <button type="button" aria-label="Periodo siguiente"><ChevronRight size={19} /></button>
      </div>

      <div className="student-list-heading">
        <div><Users size={19} /><h3>Estudiantes matriculados</h3></div>
        <span>{exampleStudents.length} estudiantes</span>
      </div>

      <div className="student-attendance-list">
        {exampleStudents.map((student) => (
          <article className="student-attendance-row" key={student.id}>
            <div className="student-identity"><span className="student-avatar">{student.initials}</span><div><strong>{student.name}</strong><small>Estudiante de ejemplo</small></div></div>
            <div className="student-status" aria-label={`Asistencia de ${student.name}`}>
              <button type="button" className={attendance[student.id] === "present" ? "is-selected is-present" : ""} aria-pressed={attendance[student.id] === "present"} onClick={() => setStudentStatus(student.id, "present")}><Check size={16} /><span>Asistió</span></button>
              <button type="button" className={attendance[student.id] === "absent" ? "is-selected is-absent" : ""} aria-pressed={attendance[student.id] === "absent"} onClick={() => setStudentStatus(student.id, "absent")}><X size={16} /><span>No asistió</span></button>
            </div>
          </article>
        ))}
      </div>

      <button className="attendance-save" type="button" disabled><CalendarDays size={17} />Guardar asistencia</button>
      <p className="attendance-demo-caption">El guardado se habilitará cuando exista el endpoint de asistencia.</p>
    </section>
  );
}
