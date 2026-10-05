import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Award, BookOpen, ChevronRight, ClipboardCheck, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import AcademicFilters from "../academic/AcademicFilters";
import { getMatriculas } from "../../services/matriculas.service";
import { getMatriculaCursos } from "../../services/matriculaCursos.service";
import { getProgramacionCursos } from "../../services/programacionCursos.service";
import { getCursos } from "../../services/cursos.service";
import { getBimestres, getNotasMatriculaCurso, getValoresEvaluacion } from "../../services/notas.service";
import { summarizeGrades } from "../../utils/gradeDashboard";

async function mapLimited(items, task, signal) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, async () => {
    while (cursor < items.length && !signal.aborted) { const index = cursor++; results[index] = await task(items[index]); }
  }));
  return results;
}

function Metric({ icon: Icon, label, value, detail, tone = "total" }) {
  return <article className={`attendance-kpi attendance-kpi--${tone}`}><span className="attendance-kpi__icon"><Icon size={20} /></span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></article>;
}

export default function GradesDashboard() {
  const [selection, setSelection] = useState({ anio: "", nivel: "", grado: "", seccion: "" });
  const onSelection = useCallback((value) => setSelection(value), []);
  const [data, setData] = useState({ periods: [], scale: [], courses: [], records: [], students: 0 });
  const [period, setPeriod] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setError(""); setData({ periods: [], scale: [], courses: [], records: [], students: 0 }); setCourse(""); setPeriod("");
    if (!selection.anio) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    async function load() {
      const [enrollments, assignments, programs, courses, periods, scale] = await Promise.all([
        getMatriculas({ id_anio_lectivo: selection.anio, ...(selection.nivel ? { id_nivel: selection.nivel } : {}), ...(selection.grado ? { id_grado: selection.grado } : {}), ...(selection.seccion ? { id_seccion: selection.seccion } : {}), estado: true, signal }),
        getMatriculaCursos({ estado: true, signal }), getProgramacionCursos({ estado: true, signal }),
        getCursos(selection.anio, { estado: true, signal }), getBimestres(selection.anio, { signal }), getValoresEvaluacion({ signal }),
      ]);
      const enrollmentMap = new Map(enrollments.map((item) => [String(item.id_matricula), item]));
      const programMap = new Map(programs.map((item) => [String(item.id_programacion_curso), item]));
      const courseIds = new Set(courses.map((item) => String(item.id_curso)));
      const uniquePairs = new Map();
      for (const assignment of assignments) {
        const enrollment = enrollmentMap.get(String(assignment.id_matricula));
        const program = programMap.get(String(assignment.id_programacion_curso));
        if (enrollment && program && courseIds.has(String(program.id_curso))) uniquePairs.set(`${enrollment.id_matricula}-${program.id_curso}`, { ...enrollment, id_curso: program.id_curso });
      }
      const records = await mapLimited([...uniquePairs.values()], async (item) => ({ ...await getNotasMatriculaCurso({ id_matricula: item.id_matricula, id_curso: item.id_curso, signal }), id_estudiante: item.id_estudiante, id_curso: item.id_curso }), signal);
      if (signal.aborted) return;
      const sortedPeriods = [...periods].sort((a, b) => a.numero - b.numero);
      setData({ periods: sortedPeriods, scale, courses: courses.filter((item) => [...uniquePairs.values()].some((pair) => String(pair.id_curso) === String(item.id_curso))), records, students: new Set(enrollments.map((item) => String(item.id_estudiante))).size });
      setPeriod(String(sortedPeriods[0]?.id_bimestre || "annual"));
    }
    load().catch((err) => { if (!signal.aborted) { setError(err.message || "No se pudieron cargar las calificaciones."); controller.abort(); setLoading(false); } }).finally(() => { if (!signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selection, refresh]);

  const records = useMemo(() => data.records.filter((item) => !course || String(item.id_curso) === course), [data.records, course]);
  const metrics = useMemo(() => summarizeGrades(records, period, data.scale), [records, period, data.scale]);
  const comparison = useMemo(() => [...data.periods.map((item) => ({ id: String(item.id_bimestre), name: item.nombre, ...summarizeGrades(records, item.id_bimestre, data.scale) })), { id: "annual", name: "Notas finales del año", ...summarizeGrades(records, "annual", data.scale) }], [records, data.periods, data.scale]);
  const totalStudents = course ? new Set(records.map((item) => String(item.id_estudiante))).size : data.students;
  const annual = period === "annual";

  return <section className="daily-dashboard grades-dashboard" aria-labelledby="evaluations-dashboard-title">
    <div className="daily-dashboard__heading"><div><span>Rendimiento académico</span><h3 id="evaluations-dashboard-title">Dashboard de calificaciones</h3></div><button className="grades-refresh" onClick={() => setRefresh((value) => value + 1)} disabled={loading || !selection.anio}><RefreshCw size={16} />Actualizar</button></div>
    <AcademicFilters onSelectionChange={onSelection} />
    {!selection.anio ? <div className="dashboard-state"><ClipboardCheck size={24} /><p>Selecciona un año lectivo para consultar las calificaciones.</p></div> : loading ? <div className="dashboard-state" role="status"><span className="dashboard-loader" /><p>Preparando indicadores de calificaciones...</p></div> : error ? <div className="dashboard-state is-error" role="alert"><AlertCircle size={24} /><p>{error}</p><button onClick={() => setRefresh((value) => value + 1)}>Reintentar</button></div> : <>
      <div className="grades-controls"><label>Periodo<select value={period} onChange={(event) => setPeriod(event.target.value)}>{data.periods.map((item) => <option key={item.id_bimestre} value={item.id_bimestre}>{item.nombre}</option>)}<option value="annual">Consolidado anual</option></select></label><label>Curso<select value={course} onChange={(event) => setCourse(event.target.value)}><option value="">Todos los cursos</option>{data.courses.map((item) => <option key={item.id_curso} value={item.id_curso}>{item.nombre}</option>)}</select></label></div>
      <p className="grades-explanation">{annual ? "El consolidado utiliza las notas finales registradas por competencia. La comparación reúne los resultados de cada bimestre." : "Los niveles de logro corresponden a las notas de competencias del bimestre seleccionado."}</p>
      {!metrics.hasGrades ? <div className="dashboard-state grades-empty"><ClipboardCheck size={28} /><p>Aún no se registraron calificaciones</p><small>{annual ? "Todavía no hay notas finales para esta selección. Puedes consultar los bimestres en la comparación anual." : "Para el bimestre y los filtros seleccionados."}</small></div> : <>
        <div className="attendance-kpis"><Metric icon={Users} label="Alumnos con calificaciones" value={`${metrics.students} / ${totalStudents}`} detail="Alumnos únicos con alguna nota" /><Metric icon={ClipboardCheck} label="Cobertura de competencias" value={`${metrics.coverage}%`} detail={`${metrics.registered} de ${metrics.expected} notas registradas`} /><Metric icon={Award} label="Logro esperado o destacado" value={`${metrics.achieved}%`} detail="AD y A sobre competencias calificadas" tone="present" /><Metric icon={BookOpen} label="Alumnos que requieren apoyo" value={metrics.support} detail="Con al menos una competencia en B o C" tone="late" /></div>
        <div className="grades-panels"><article className="attendance-coverage"><div className="attendance-panel-title"><div><span>Distribución de logros</span><strong>{metrics.registered} competencias calificadas</strong></div></div><div className="grades-distribution">{Object.entries(metrics.distribution).map(([code, count]) => { const percentage = metrics.registered ? Math.round(count / metrics.registered * 100) : 0; return <div key={code}><span className={`evaluation-grade evaluation-grade--${code.toLowerCase()}`}>{code}</span><div className="grades-bar" role="progressbar" aria-label={`Nivel ${code}`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><span className={`grade-color--${code.toLowerCase()}`} style={{ width: `${percentage}%` }} /></div><strong>{count} <small>({percentage}%)</small></strong></div>; })}</div><p className="grades-explanation">AD: destacado · A: esperado · B: en proceso · C: en inicio.</p></article><article className="attendance-coverage"><div className="attendance-panel-title"><div><span>Estado del registro</span><strong>{annual ? "Cierre del año" : "Avance del bimestre"}</strong></div></div><dl className="grades-register"><div><dt>Competencias con nota</dt><dd>{metrics.registered}</dd></div><div><dt>Competencias pendientes</dt><dd>{metrics.expected - metrics.registered}</dd></div>{!annual && <div><dt>Capacidades con nota</dt><dd>{metrics.capacities}</dd></div>}<div><dt>Alumnos sin calificaciones</dt><dd>{Math.max(0, totalStudents - metrics.students)}</dd></div></dl></article></div>
      </>}
      <article className="grades-comparison"><div className="attendance-panel-title"><div><span>Comparación del año seleccionado</span><strong>Bimestres y consolidado anual</strong></div></div><div className="grades-table-scroll"><table><thead><tr><th>Periodo</th><th>Alumnos con notas</th><th>Cobertura</th><th>AD / A</th><th>B / C</th><th>Logro AD + A</th></tr></thead><tbody>{comparison.map((row) => <tr key={row.id} className={period === row.id ? "is-selected" : ""}><th><button onClick={() => setPeriod(row.id)}>{row.name}</button></th>{row.hasGrades ? <><td>{row.students} / {totalStudents}</td><td>{row.coverage}%</td><td>{row.distribution.AD || 0} / {row.distribution.A || 0}</td><td>{row.distribution.B || 0} / {row.distribution.C || 0}</td><td>{row.achieved}%</td></> : <td colSpan={5}>Aún no se registraron calificaciones</td>}</tr>)}</tbody></table></div><p className="grades-explanation">Cada competencia calificada cuenta una vez por alumno y curso. Las notas finales se muestran tal como fueron registradas.</p></article>
      <div className="dashboard-register-link"><Link to="/evaluaciones/calificaciones">Ver calificaciones por alumno<ChevronRight size={17} /></Link></div>
    </>}
  </section>;
}
