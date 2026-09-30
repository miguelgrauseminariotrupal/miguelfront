import { AlertCircle, Bot, CalendarCheck, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, UserMinus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AcademicFilters from "../components/academic/AcademicFilters";
import { getAsistencias } from "../services/asistencias.service";
import { getMatriculas } from "../services/matriculas.service";
import { getTiposAsistencia } from "../services/tiposAsistencia.service";

const localDateValue = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const normalizedCode = (value) => String(value || "").trim().toUpperCase();
const codeMatches = (code, values) => values.some((value) => code === value || (value.length > 1 && code.includes(value)));
const statusTone = (code) => {
  const normalized = normalizedCode(code);
  if (codeMatches(normalized, ["A", "PRESENTE", "ASISTIO", "ASISTIÓ"])) return "present";
  if (codeMatches(normalized, ["F", "FALTA", "AUSENTE"])) return "absent";
  if (codeMatches(normalized, ["T", "TARDANZA", "TARDE"])) return "late";
  if (codeMatches(normalized, ["J", "JUSTIFICADA", "JUSTIFICADO"])) return "justified";
  return "default";
};

function DashboardCard({ icon: Icon, label, value, tone, detail }) {
  return <article className={`attendance-kpi attendance-kpi--${tone}`}>
    <span className="attendance-kpi__icon"><Icon size={20} /></span>
    <span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span>
  </article>;
}

export default function InicioPage() {
  const [selectedIndicator, setSelectedIndicator] = useState("");
  const [selection, setSelection] = useState({ anio: "", nivel: "", grado: "", seccion: "" });
  const [selectedDate, setSelectedDate] = useState(() => localDateValue());
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceTypes, setAttendanceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSelection = useCallback((nextSelection) => setSelection(nextSelection), []);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedIndicator !== "daily-attendance" || !selection.anio) {
      setEnrollments([]);
      setAttendance([]);
      setError("");
      return () => controller.abort();
    }

    setLoading(true);
    setError("");
    const filters = {
      id_anio_lectivo: selection.anio,
      ...(selection.nivel ? { id_nivel: selection.nivel } : {}),
      ...(selection.grado ? { id_grado: selection.grado } : {}),
      ...(selection.seccion ? { id_seccion: selection.seccion } : {}),
      estado: true,
      signal: controller.signal,
    };

    Promise.all([
      getMatriculas(filters),
      getAsistencias({ fecha: selectedDate, signal: controller.signal }),
      getTiposAsistencia({ estado: true, signal: controller.signal }),
    ])
      .then(([enrollmentRecords, attendanceRecords, typeRecords]) => {
        const enrollmentIds = new Set(enrollmentRecords.map((item) => String(item.id_matricula)));
        setEnrollments(enrollmentRecords);
        setAttendance(attendanceRecords.filter((item) => enrollmentIds.has(String(item.id_matricula))));
        setAttendanceTypes(typeRecords);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "No se pudo cargar el resumen de asistencia.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [selectedIndicator, selection, selectedDate]);

  const metrics = useMemo(() => {
    const typeById = new Map(attendanceTypes.map((type) => [String(type.id_tipo_asistencia), type]));
    const countTone = (tone) => attendance.reduce((total, record) => total + (statusTone(typeById.get(String(record.id_tipo_asistencia))?.codigo) === tone ? 1 : 0), 0);
    const total = enrollments.length;
    const registered = new Set(attendance.map((item) => String(item.id_matricula))).size;
    return {
      total,
      registered,
      pending: Math.max(total - registered, 0),
      present: countTone("present"),
      absent: countTone("absent"),
      late: countTone("late"),
      justified: countTone("justified"),
    };
  }, [attendance, attendanceTypes, enrollments]);

  const formattedDate = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
  }, [selectedDate]);

  const coverageRows = [
    { label: "Registraron asistencia", value: metrics.registered, tone: "recorded" },
    { label: "Asistencias", value: metrics.present, tone: "present" },
    { label: "Faltas", value: metrics.absent, tone: "absent" },
    { label: "Tardanzas", value: metrics.late, tone: "late" },
    { label: "Justificados", value: metrics.justified, tone: "justified" },
  ].map((item) => ({ ...item, percentage: metrics.total ? Math.min(Math.round((item.value / metrics.total) * 100), 100) : 0 }));

  return <main className="page-content home-page">
    <header className="dashboard-welcome">
      <span>Centro de información</span>
      <h1>Todo lo importante, en un solo lugar</h1>
      <p>Selecciona una opción para consultar indicadores y conocer el estado de la gestión académica.</p>
    </header>

    <section className="dashboard-options" aria-label="Opciones del panel">
      <button type="button" className={selectedIndicator === "daily-attendance" ? "is-selected" : ""} onClick={() => setSelectedIndicator("daily-attendance")}>
        <span className="dashboard-option__icon dashboard-option__icon--attendance"><CalendarCheck size={24} /></span>
        <span><strong>Dashboard Asistencia</strong><small>Revisa registros, faltas, tardanzas y asistencia diaria.</small></span>
        <ChevronRight size={19} />
      </button>
      <button type="button" className={selectedIndicator === "evaluations" ? "is-selected" : ""} onClick={() => setSelectedIndicator("evaluations")}>
        <span className="dashboard-option__icon dashboard-option__icon--evaluations"><ClipboardCheck size={24} /></span>
        <span><strong>Dashboard Evaluaciones</strong><small>Consulta el progreso y rendimiento académico.</small></span>
        <ChevronRight size={19} />
      </button>
      <button type="button" className={selectedIndicator === "miguel" ? "is-selected" : ""} onClick={() => setSelectedIndicator("miguel")}>
        <span className="dashboard-option__icon dashboard-option__icon--miguel"><Bot size={24} /></span>
        <span><strong>Hola, soy Miguel</strong><small>Consúltame para descubrir más indicadores.</small></span>
        <ChevronRight size={19} />
      </button>
    </section>

    {selectedIndicator === "daily-attendance" && <section className="daily-dashboard" aria-labelledby="daily-dashboard-title">
      <div className="daily-dashboard__heading">
        <div><span>Panel de asistencia</span><h3 id="daily-dashboard-title">{formattedDate}</h3></div>
        <label><span>Fecha</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value || localDateValue())} /></label>
      </div>
      <AcademicFilters onSelectionChange={handleSelection} />

      {!selection.anio && <div className="dashboard-state"><CalendarCheck size={24} /><p>Selecciona un año lectivo para cargar el resumen.</p></div>}
      {selection.anio && loading && <div className="dashboard-state" role="status"><span className="dashboard-loader" /><p>Calculando indicadores del día...</p></div>}
      {selection.anio && !loading && error && <div className="dashboard-state is-error" role="alert"><AlertCircle size={24} /><p>{error}</p></div>}

      {selection.anio && !loading && !error && <>
        <div className="attendance-kpis">
          <DashboardCard icon={Users} label="Matriculados" value={metrics.total} tone="total" detail="Estudiantes activos" />
          <DashboardCard icon={CheckCircle2} label="Presentes" value={metrics.present} tone="present" detail="Registros del día" />
          <DashboardCard icon={UserMinus} label="Faltas" value={metrics.absent} tone="absent" detail="Ausencias registradas" />
          <DashboardCard icon={Clock3} label="Tardanzas" value={metrics.late} tone="late" detail="Llegadas tarde" />
        </div>

        <div className="attendance-dashboard-grid">
          <article className="attendance-coverage">
            <div className="attendance-panel-title"><div><span>Cobertura del registro</span><strong>Indicadores sobre {metrics.total} matriculados</strong></div><b>{metrics.registered} registraron</b></div>
            <div className="attendance-coverage__rows">
              {coverageRows.map((row) => <div className={`attendance-coverage__row attendance-coverage__row--${row.tone}`} key={row.tone}>
                <div><span>{row.label}</span><strong>{row.value} de {metrics.total} <small>({row.percentage}%)</small></strong></div>
                <div className="attendance-coverage__track" role="progressbar" aria-label={`${row.label}: ${row.percentage}%`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={row.percentage}><span style={{ width: `${row.percentage}%` }} /></div>
              </div>)}
            </div>
            <div className="attendance-coverage__legend"><span><i className="is-pending" />{metrics.pending} estudiantes aún no tienen registro</span></div>
          </article>

        </div>

        {!metrics.total && <p className="dashboard-empty">No hay matrículas activas para los filtros seleccionados.</p>}
        <div className="dashboard-register-link"><Link to="/asistencia"><CalendarCheck size={17} />Ir al registro de asistencia<ChevronRight size={17} /></Link></div>
      </>}
    </section>}

    {selectedIndicator === "evaluations" && <section className="home-option-card" aria-labelledby="evaluations-dashboard-title">
      <span className="home-option-card__icon"><ClipboardCheck size={24} /></span>
      <div><h2 id="evaluations-dashboard-title">Dashboard Evaluaciones</h2><p>Los indicadores de evaluaciones estarán disponibles cuando la API publique los endpoints de calificaciones.</p></div>
      <Link to="/evaluaciones/calificaciones">Ir a calificaciones<ChevronRight size={17} /></Link>
    </section>}

    {selectedIndicator === "miguel" && <section className="home-option-card" aria-labelledby="miguel-dashboard-title">
      <span className="home-option-card__icon"><Bot size={24} /></span>
      <div><h2 id="miguel-dashboard-title">Hola, soy Miguel</h2><p>Consúltame para obtener más indicadores e información sobre la gestión académica.</p></div>
      <Link to="/agente-miguel">Consultar a Miguel<ChevronRight size={17} /></Link>
    </section>}
  </main>;
}
