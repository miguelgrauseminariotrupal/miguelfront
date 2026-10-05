import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import useAcademicFilters from "../hooks/useAcademicFilters";
import { getCursos } from "../services/cursos.service";
import { getDocentes } from "../services/docentes.service";
import { getAlumnos } from "../services/alumnos.service";
import { getMatriculas } from "../services/matriculas.service";
import { getMatriculaCursos } from "../services/matriculaCursos.service";
import { getProgramacionSecciones } from "../services/programacionSecciones.service";
import { getProgramacionCursos } from "../services/programacionCursos.service";
import { getCompetencias } from "../services/competencias.service";
import { getCapacidades } from "../services/capacidades.service";
import { getBimestres, getValoresEvaluacion, getNotasMatriculaCurso, generarPlantillasNotas } from "../services/notas.service";

function fullName(person = {}) { return [person.nombres, person.apellido_paterno, person.apellido_materno].filter(Boolean).join(" "); }
function studentName(person = {}) { const surnames = [person.apellido_paterno, person.apellido_materno].filter(Boolean).join(" "); return [surnames, person.nombres].filter(Boolean).join(", ").toLocaleUpperCase("es"); }
function Grade({ value }) { return <span className={`evaluation-grade evaluation-grade--${String(value).toLowerCase()}`}>{value}</span>; }

export default function EvaluacionesPage() {
  const academic = useAcademicFilters();
  const { selection, lists, loading: academicLoading, errors: academicErrors, selectAnio, selectNivel, selectGrado, selectSeccion } = academic;
  const [courseId, setCourseId] = useState("");
  const [bimester, setBimester] = useState("");
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [scale, setScale] = useState([]);
  const [records, setRecords] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const finalized = true;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const scores = records[studentId] || {};

  const selectedCourse = courses.find((item) => String(item.id_programacion_curso) === String(courseId));
  const teacher = teachers.find((item) => String(item.id_docente) === String(selectedCourse?.id_docente));
  const student = students.find((item) => String(item.id_estudiante) === String(studentId));
  const keys = useMemo(() => bimester === "final" ? competencies.map((competency) => `level-${competency.id_competencia}`) : competencies.flatMap((competency) => competency.capacities.map((capacity) => `capacity-${capacity.id_capacidad}`)), [competencies, bimester]);
  const completed = keys.filter((key) => scores[key]).length;
  const total = keys.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const competencyLevel = (competency) => scores[`level-${competency.id_competencia}`] || "—";
  const suggestedLevel = competencyLevel;
  useEffect(() => {
    setPeriods([]); setScale([]); setBimester(""); setCatalogError("");
    if (!selection.anio) return;
    const controller = new AbortController();
    Promise.all([getBimestres(selection.anio, { signal: controller.signal }), getValoresEvaluacion({ signal: controller.signal })])
      .then(([items, values]) => { if (!controller.signal.aborted) { setPeriods(items.sort((a, b) => a.numero - b.numero)); setScale(values); } })
      .catch((err) => { if (err.name !== "AbortError") setCatalogError(err.message); });
    return () => controller.abort();
  }, [selection.anio]);

  useEffect(() => {
    setCourseId(""); setBimester(""); setCourses([]); setStudents([]); setStudentId(""); setCompetencies([]); setError("");
    if (!selection.seccion || !selection.anio) return;
    const controller = new AbortController();
    setBusy(true);
    Promise.all([
      getProgramacionSecciones({ id_seccion: selection.seccion, signal: controller.signal }),
      getMatriculas({ id_seccion: selection.seccion, estado: true, signal: controller.signal }),
      getCursos(selection.anio, { estado: true, signal: controller.signal }),
      getDocentes({ estado: true, signal: controller.signal }),
      getAlumnos({ estado: true, signal: controller.signal }),
    ]).then(async ([sectionPrograms, sectionEnrollments, courseCatalog, teacherList, studentList]) => {
      const programmedGroups = await Promise.all(sectionPrograms.map((program) => getProgramacionCursos({ id_programacion_seccion: program.id_programacion_seccion, estado: true, signal: controller.signal })));
      const catalog = new Map(courseCatalog.map((item) => [String(item.id_curso), item]));
      if (controller.signal.aborted) return;
      setCourses(programmedGroups.flat().map((program) => ({ ...catalog.get(String(program.id_curso)), ...program })).filter((item) => item.id_curso));
      setEnrollments(sectionEnrollments); setTeachers(teacherList); setAllStudents(studentList);
    }).catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [selection.seccion, selection.anio]);

  useEffect(() => {
    setStudents([]); setStudentId(""); setCompetencies([]); setRecords({}); setOpen([]); setError("");
    if (!selectedCourse || !bimester) return;
    const controller = new AbortController();
    setBusy(true);
    Promise.all([
      getCompetencias({ id_curso: selectedCourse.id_curso, estado: true, signal: controller.signal }),
      getMatriculaCursos({ id_programacion_curso: selectedCourse.id_programacion_curso, estado: true, signal: controller.signal }),
    ]).then(async ([competencyList, courseEnrollments]) => {
      const capacities = await Promise.all(competencyList.map((item) => getCapacidades({ id_competencia: item.id_competencia, estado: true, signal: controller.signal })));
      const configured = competencyList.map((item, index) => ({ ...item, capacities: capacities[index] }));
      const enrollmentIds = new Set(courseEnrollments.map((item) => String(item.id_matricula)));
      const eligible = enrollments.filter((item) => enrollmentIds.has(String(item.id_matricula)));
      const studentIds = new Set(eligible.map((item) => String(item.id_estudiante)));
      const roster = allStudents.filter((item) => studentIds.has(String(item.id_estudiante))).map((item) => ({ ...item, id_matricula: eligible.find((enrollment) => String(enrollment.id_estudiante) === String(item.id_estudiante))?.id_matricula })).sort((a, b) => ["apellido_paterno", "apellido_materno", "nombres"].reduce((order, field) => order || (a[field] || "").localeCompare(b[field] || "", "es", { sensitivity: "base" }), 0));
      if (controller.signal.aborted) return;
      setCompetencies(configured); setOpen(configured[0] ? [String(configured[0].id_competencia)] : []); setStudents(roster); setStudentId(roster[0] ? String(roster[0].id_estudiante) : "");
    }).catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [courseId, bimester, selectedCourse?.id_programacion_curso, enrollments, allStudents, scale, refresh]);

  useEffect(() => {
    if (busy || !student || !selectedCourse || !bimester || Object.hasOwn(records, studentId)) return;
    const controller = new AbortController();
    setError("");
    getNotasMatriculaCurso({ id_matricula: student.id_matricula, id_curso: selectedCourse.id_curso, signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        const values = {};
        const code = (note) => note?.valor?.codigo || scale.find((value) => note?.id_valor != null && String(value.id_valor) === String(note.id_valor))?.codigo || "";
        (response.competencias || []).forEach((competency) => {
          const period = competency.bimestres?.find((item) => String(item.id_bimestre) === String(bimester));
          const note = bimester === "final" ? competency.nota_final : period?.nota_bimestre;
          values[`level-${competency.id_competencia}`] = code(note);
          values[`comment-${competency.id_competencia}`] = note?.observacion || "";
          if (bimester !== "final") {
            (period?.capacidades || []).forEach((capacity) => {
              values[`capacity-${capacity.id_capacidad}`] = code(capacity.nota_bimestre);
            });
          }
        });
        setRecords((current) => ({ ...current, [studentId]: values }));
      })
      .catch((requestError) => { if (!controller.signal.aborted) setError(requestError.message); });
    return () => controller.abort();
  }, [busy, student, studentId, selectedCourse, bimester, scale, records]);

  async function generateTemplates() {
    setGenerating(true); setMessage(""); setError("");
    try {
      await generarPlantillasNotas(selection.anio);
      setMessage("Plantillas de evaluación preparadas para el año lectivo.");
      setRefresh((value) => value + 1);
    } catch (err) { setError(err.message); }
    finally { setGenerating(false); }
  }
  function studentState(id) {
    if (!Object.hasOwn(records, id)) return { count: 0, status: "Pendiente de consulta", final: false };
    const saved = records[id];
    const count = keys.filter((key) => saved[key]).length;
    const isFinal = total > 0 && count === total && competencies.every((item) => saved[`level-${item.id_competencia}`]);
    return { count, status: isFinal ? "Con notas" : count ? "Notas parciales" : "Sin notas", final: isFinal };
  }
  function moveStudent(offset) { const next = students.findIndex((item) => String(item.id_estudiante) === String(studentId)) + offset; if (students[next]) setStudentId(String(students[next].id_estudiante)); }
  const visibleStudents = students.filter((item) => fullName(item).toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));
  const groupCompleted = students.filter((item) => studentState(item.id_estudiante).final).length;
  const studentIndex = students.findIndex((item) => String(item.id_estudiante) === String(studentId));
  const academicError = Object.values(academicErrors).find(Boolean);

  return <main className="page-content evaluation-page">
    <div className="page-heading"><h2>Consulta de calificaciones</h2><p>Consulta las notas por bimestre y las notas finales de cada alumno.</p></div>
    <section className="evaluation-setup evaluation-setup--api" aria-label="Datos de evaluación">
      <label>Año lectivo<select value={selection.anio} disabled={academicLoading.anios} onChange={(e) => selectAnio(e.target.value)}><option value="">Seleccionar</option>{lists.anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></label>
      <label>Nivel<select value={selection.nivel} disabled={!selection.anio || academicLoading.niveles} onChange={(e) => selectNivel(e.target.value)}><option value="">Seleccionar</option>{lists.niveles.map((item) => <option key={item.id_nivel} value={item.id_nivel}>{item.nombre}</option>)}</select></label>
      <label>Grado<select value={selection.grado} disabled={!selection.nivel || academicLoading.grados} onChange={(e) => selectGrado(e.target.value)}><option value="">Seleccionar</option>{lists.grados.map((item) => <option key={item.id_grado} value={item.id_grado}>{item.nombre}</option>)}</select></label>
      <label>Sección<select value={selection.seccion} disabled={!selection.grado || academicLoading.secciones} onChange={(e) => selectSeccion(e.target.value)}><option value="">Seleccionar</option>{lists.secciones.map((item) => <option key={item.id_seccion} value={item.id_seccion}>{item.nombre}</option>)}</select></label>
      <label>Bimestre<select value={bimester} disabled={!selection.seccion || Boolean(catalogError)} onChange={(e) => setBimester(e.target.value)}><option value="">Seleccionar bimestre</option>{periods.map((period) => <option key={period.id_bimestre} value={period.id_bimestre}>{period.nombre}</option>)}<option value="final">Notas finales</option></select></label>
      <label>Curso<select value={courseId} disabled={!selection.seccion || busy} onChange={(e) => setCourseId(e.target.value)}><option value="">{busy ? "Cargando..." : "Seleccionar curso"}</option>{courses.map((item) => <option key={item.id_programacion_curso} value={item.id_programacion_curso}>{item.nombre}</option>)}</select></label>
      {selectedCourse && <div className="evaluation-teacher"><span>Docente responsable</span><strong>{teacher ? fullName(teacher) : "Sin docente asignado"}</strong></div>}
    </section>
    <section className="evaluation-actions"><div><small>Prepara los registros vacíos de evaluación del año seleccionado.</small>{message && <p>{message}</p>}</div><button disabled={!selection.anio || generating || busy || Boolean(catalogError) || academicLoading.anios} onClick={generateTemplates}>{generating ? "Preparando..." : "Generar plantillas de notas"}</button></section>
    {(error || catalogError || academicError) && <p className="parameter-feedback is-error">{error || catalogError || academicError}</p>}
    {!selectedCourse ? <section className="evaluation-welcome"><span><ChevronRight size={20} /></span><div><strong>Completa la selección académica</strong><p>Los cursos programados para la sección aparecerán automáticamente.</p></div></section> : !bimester ? <section className="evaluation-welcome"><span><ChevronRight size={20} /></span><div><strong>Selecciona un bimestre</strong><p>Alumnos, competencias y capacidades se habilitarán para el periodo elegido.</p></div></section> : busy ? <section className="evaluation-welcome"><div><strong>Cargando registro...</strong><p>Consultando alumnos, competencias y capacidades.</p></div></section> : !competencies.length ? <section className="evaluation-welcome"><div><strong>Este curso no tiene competencias configuradas</strong><p>Regístralas primero desde Plan de evaluación.</p></div></section> : !students.length ? <section className="evaluation-welcome"><div><strong>No hay alumnos asignados a este curso</strong><p>Genera la asignación desde Matrícula → Asignar cursos.</p></div></section> : <>
      <section className="evaluation-group-progress"><span>Avance de alumnos consultados</span><strong>{groupCompleted} de {students.length} alumnos con notas en {bimester === "final" ? "competencias" : "capacidades y competencias"}</strong><div><span style={{ width: `${students.length ? Math.round(groupCompleted / students.length * 100) : 0}%` }} /></div></section>
      <div className="evaluation-workspace"><aside className="student-roster"><div className="student-roster__heading"><div><strong>Alumnos</strong><span>{students.length} matriculados en el curso</span></div><span>{groupCompleted}/{students.length}</span></div><label className="student-roster__search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alumno" /></label><div className="student-roster__list">{visibleStudents.map((item) => { const name = studentName(item); const state = studentState(item.id_estudiante); return <button className={String(studentId) === String(item.id_estudiante) ? "is-active" : ""} onClick={() => setStudentId(String(item.id_estudiante))} key={item.id_estudiante}><span className="student-roster__avatar">{name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span><span><strong>{name}</strong><small className={state.final ? "is-complete" : state.count ? "is-progress" : ""}>{state.status}{state.count > 0 && !state.final ? ` · ${state.count}/${total}` : ""}</small></span>{state.final ? <CheckCircle2 size={16} /> : <span className="student-roster__number">{students.indexOf(item) + 1}</span>}</button>; })}</div></aside>
      <div className="evaluation-student-panel"><section className="evaluation-toolbar"><div className="evaluation-current-student"><span>Alumno {studentIndex + 1} de {students.length}</span><strong>{studentName(student)}</strong><div><button disabled={studentIndex <= 0} onClick={() => moveStudent(-1)} aria-label="Alumno anterior"><ChevronLeft size={16} /></button><button disabled={studentIndex >= students.length - 1} onClick={() => moveStudent(1)} aria-label="Alumno siguiente"><ChevronRight size={16} /></button></div></div><div className="evaluation-progress"><div><span>Avance</span><strong>{completed} de {total} {bimester === "final" ? "competencias" : "capacidades"}</strong></div><div className="evaluation-progress__track"><span style={{ width: `${percentage}%` }} /></div><small>{percentage}% completado</small></div><div className="evaluation-result"><span>Consulta</span><strong>{bimester === "final" ? "Notas finales" : periods.find((period) => String(period.id_bimestre) === String(bimester))?.nombre}</strong></div></section>
      <div className="evaluation-hint"><span>Escala</span>{scale.map((item) => item.codigo).map((item) => <Grade key={item} value={item} />)}<small>{Object.hasOwn(records, studentId) ? "Consulta de notas registradas en el servidor." : error ? "No se pudieron cargar las notas." : "Cargando notas del alumno..."}</small></div>
      <section className="competency-list">{competencies.map((competency, index) => { const id = String(competency.id_competencia); const isOpen = open.includes(id); const complete = Boolean(scores[`level-${competency.id_competencia}`]) && (bimester === "final" || competency.capacities.every((capacity) => scores[`capacity-${capacity.id_capacidad}`])); return <article className={`competency-card ${isOpen ? "is-open" : ""}`} key={id}><div className="competency-card__heading" role="button" tabIndex={0} onClick={() => setOpen((current) => isOpen ? current.filter((item) => item !== id) : [...current, id])} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) event.currentTarget.click(); }}><span className="competency-card__number">{index + 1}</span><span><small>{competency.codigo || `Competencia ${index + 1}`}</small><strong>{competency.descripcion}</strong></span>{complete && <span className="competency-complete"><Check size={13} /> Completa</span>}<label className="competency-achievement" onClick={(event) => event.stopPropagation()}><small>Nivel de logro <em>Registrado en el servidor</em></small><select disabled={finalized || suggestedLevel(competency) === "—"} value={competencyLevel(competency) === "—" ? "" : competencyLevel(competency)} ><option value="" disabled>—</option>{scale.map((item) => item.codigo).map((value) => <option key={value}>{value}</option>)}</select></label>{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>{isOpen && <div className="capacity-table">{bimester === "final" ? <p>Las notas finales se consultan por competencia.</p> : <><div className="capacity-table__head"><span>Capacidad</span><span>Calificación</span></div>{competency.capacities.map((capacity, capacityIndex) => { const key = `capacity-${capacity.id_capacidad}`; return <div className="capacity-row" key={capacity.id_capacidad}><div><small>Capacidad {capacityIndex + 1}</small><strong>{capacity.descripcion}</strong></div><div className="score-options">{scale.map((item) => item.codigo).map((value) => <button disabled={finalized} aria-label={`${capacity.descripcion}: ${value}`} className={scores[key] === value ? "is-selected" : ""}  key={value}>{value}</button>)}</div></div>; })}</>}<label className="competency-conclusion"><span>Conclusión descriptiva <small>Opcional</small></span><textarea disabled={finalized} value={scores[`comment-${id}`] || ""}  placeholder="Escribe una observación sobre el desempeño del alumno en esta competencia..." maxLength={500} /><small>{(scores[`comment-${id}`] || "").length}/500</small></label></div>}</article>; })}</section>
      <footer className="evaluation-actions"><small>Consulta de calificaciones almacenadas en el servidor.</small></footer></div></div>
    </>}

  </main>;
}
