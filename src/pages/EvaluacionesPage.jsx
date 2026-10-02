import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Save, Search, ShieldCheck } from "lucide-react";
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

const SCALE = ["AD", "A", "B", "C"];
const SCORE_VALUE = { C: 1, B: 2, A: 3, AD: 4 };
const VALUE_SCORE = { 1: "C", 2: "B", 3: "A", 4: "AD" };

function average(grades) {
  const values = grades.filter((grade) => SCORE_VALUE[grade]).map((grade) => SCORE_VALUE[grade]);
  if (!values.length) return "—";
  const value = values.reduce((sum, item) => sum + item, 0) / values.length;
  return VALUE_SCORE[Math.max(1, Math.min(4, Math.floor(value + 0.5)))];
}
function fullName(person = {}) { return [person.nombres, person.apellido_paterno, person.apellido_materno].filter(Boolean).join(" "); }
function Grade({ value }) { return <span className={`evaluation-grade evaluation-grade--${String(value).toLowerCase()}`}>{value}</span>; }
function readRecord(key) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }

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
  const [scores, setScores] = useState({});
  const [open, setOpen] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedRevision, setSavedRevision] = useState(0);

  const selectedCourse = courses.find((item) => String(item.id_curso) === String(courseId));
  const teacher = teachers.find((item) => String(item.id_docente) === String(selectedCourse?.id_docente));
  const student = students.find((item) => String(item.id_estudiante) === String(studentId));
  const keys = useMemo(() => competencies.flatMap((competency) => competency.capacities.map((capacity) => `capacity-${capacity.id_capacidad}`)), [competencies]);
  const completed = keys.filter((key) => scores[key]).length;
  const total = keys.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const capacityLevel = (capacity) => scores[`capacity-${capacity.id_capacidad}`] || "—";
  const suggestedLevel = (competency) => average(competency.capacities.map(capacityLevel));
  const competencyLevel = (competency) => scores[`level-${competency.id_competencia}`] || suggestedLevel(competency);
  const finalAverage = average(competencies.map(competencyLevel));
  const storageKey = (id = studentId) => `evaluation-local-v2-${selection.seccion}-${courseId}-b${bimester}-${id}`;
  const finalKey = (id = studentId) => `evaluation-final-v2-${selection.seccion}-${courseId}-b${bimester}-${id}`;

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
      setCourses(programmedGroups.flat().map((program) => ({ ...catalog.get(String(program.id_curso)), ...program })).filter((item) => item.id_curso));
      setEnrollments(sectionEnrollments); setTeachers(teacherList); setAllStudents(studentList);
    }).catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [selection.seccion, selection.anio]);

  useEffect(() => {
    setStudents([]); setStudentId(""); setCompetencies([]); setScores({}); setOpen([]); setError("");
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
      const roster = allStudents.filter((item) => studentIds.has(String(item.id_estudiante))).sort((a, b) => fullName(a).localeCompare(fullName(b), "es"));
      setCompetencies(configured); setOpen(configured[0] ? [String(configured[0].id_competencia)] : []); setStudents(roster); setStudentId(roster[0] ? String(roster[0].id_estudiante) : "");
    }).catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [courseId, bimester, selectedCourse?.id_programacion_curso, enrollments, allStudents]);

  useEffect(() => {
    if (!studentId || !courseId || !bimester) return;
    setScores(readRecord(storageKey()));
    setFinalized(localStorage.getItem(finalKey()) === "true");
    setMessage("");
  }, [studentId, courseId, bimester, selection.seccion]);

  function persist(nextScores, silent = false) {
    localStorage.setItem(storageKey(), JSON.stringify(nextScores)); setSavedRevision((value) => value + 1);
    if (!silent) setMessage("Registro guardado en este dispositivo.");
  }
  function updateScore(key, value) { if (!finalized) setScores((current) => { const next = { ...current, [key]: value }; persist(next, true); setMessage(""); return next; }); }
  function finalize() { persist(scores, true); localStorage.setItem(finalKey(), "true"); setConfirming(false); setFinalized(true); setSavedRevision((value) => value + 1); setMessage("Calificaciones registradas correctamente."); }
  function studentState(id) {
    const saved = readRecord(storageKey(id));
    const count = keys.filter((key) => saved[key]).length;
    const isFinal = localStorage.getItem(finalKey(id)) === "true";
    return { count, status: isFinal ? "Completo" : count ? "En progreso" : "Pendiente", final: isFinal };
  }
  function moveStudent(offset) { const next = students.findIndex((item) => String(item.id_estudiante) === String(studentId)) + offset; if (students[next]) setStudentId(String(students[next].id_estudiante)); }
  const visibleStudents = students.filter((item) => fullName(item).toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));
  const groupCompleted = students.filter((item) => studentState(item.id_estudiante).final).length;
  const studentIndex = students.findIndex((item) => String(item.id_estudiante) === String(studentId));
  const academicError = Object.values(academicErrors).find(Boolean);

  return <main className="page-content evaluation-page">
    <div className="page-heading"><h2>Registro de calificaciones</h2><p>Evalúa por competencias y capacidades configuradas en el plan de evaluación.</p></div>
    <section className="evaluation-setup evaluation-setup--api" aria-label="Datos de evaluación">
      <label>Año lectivo<select value={selection.anio} disabled={academicLoading.anios} onChange={(e) => selectAnio(e.target.value)}><option value="">Seleccionar</option>{lists.anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></label>
      <label>Nivel<select value={selection.nivel} disabled={!selection.anio || academicLoading.niveles} onChange={(e) => selectNivel(e.target.value)}><option value="">Seleccionar</option>{lists.niveles.map((item) => <option key={item.id_nivel} value={item.id_nivel}>{item.nombre}</option>)}</select></label>
      <label>Grado<select value={selection.grado} disabled={!selection.nivel || academicLoading.grados} onChange={(e) => selectGrado(e.target.value)}><option value="">Seleccionar</option>{lists.grados.map((item) => <option key={item.id_grado} value={item.id_grado}>{item.nombre}</option>)}</select></label>
      <label>Sección<select value={selection.seccion} disabled={!selection.grado || academicLoading.secciones} onChange={(e) => selectSeccion(e.target.value)}><option value="">Seleccionar</option>{lists.secciones.map((item) => <option key={item.id_seccion} value={item.id_seccion}>{item.nombre}</option>)}</select></label>
      <label>Curso<select value={courseId} disabled={!selection.seccion || busy} onChange={(e) => { setCourseId(e.target.value); setBimester(""); }}><option value="">{busy ? "Cargando..." : "Seleccionar curso"}</option>{courses.map((item) => <option key={item.id_programacion_curso} value={item.id_curso}>{item.nombre}</option>)}</select></label>
      <label>Bimestre<select value={bimester} disabled={!selectedCourse} onChange={(e) => setBimester(e.target.value)}><option value="">Seleccionar bimestre</option><option value="1">1.er bimestre</option><option value="2">2.º bimestre</option><option value="3">3.er bimestre</option><option value="4">4.º bimestre</option></select></label>
      {selectedCourse && <div className="evaluation-teacher"><span>Docente responsable</span><strong>{teacher ? fullName(teacher) : "Sin docente asignado"}</strong></div>}
    </section>
    {(error || academicError) && <p className="parameter-feedback is-error">{error || academicError}</p>}
    {!selectedCourse ? <section className="evaluation-welcome"><span><ChevronRight size={20} /></span><div><strong>Completa la selección académica</strong><p>Los cursos programados para la sección aparecerán automáticamente.</p></div></section> : !bimester ? <section className="evaluation-welcome"><span><ChevronRight size={20} /></span><div><strong>Selecciona un bimestre</strong><p>Alumnos, competencias y capacidades se habilitarán para el periodo elegido.</p></div></section> : busy ? <section className="evaluation-welcome"><div><strong>Cargando registro...</strong><p>Consultando alumnos, competencias y capacidades.</p></div></section> : !competencies.length ? <section className="evaluation-welcome"><div><strong>Este curso no tiene competencias configuradas</strong><p>Regístralas primero desde Plan de evaluación.</p></div></section> : !students.length ? <section className="evaluation-welcome"><div><strong>No hay alumnos asignados a este curso</strong><p>Genera la asignación desde Matrícula → Asignar cursos.</p></div></section> : <>
      <section className="evaluation-group-progress"><span>Avance del aula</span><strong>{groupCompleted} de {students.length} alumnos completados</strong><div><span style={{ width: `${students.length ? Math.round(groupCompleted / students.length * 100) : 0}%` }} /></div></section>
      <div className="evaluation-workspace"><aside className="student-roster"><div className="student-roster__heading"><div><strong>Alumnos</strong><span>{students.length} matriculados en el curso</span></div><span>{groupCompleted}/{students.length}</span></div><label className="student-roster__search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alumno" /></label><div className="student-roster__list">{visibleStudents.map((item) => { const name = fullName(item); const state = studentState(item.id_estudiante); return <button className={String(studentId) === String(item.id_estudiante) ? "is-active" : ""} onClick={() => setStudentId(String(item.id_estudiante))} key={item.id_estudiante}><span className="student-roster__avatar">{name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span><span><strong>{name}</strong><small className={state.final ? "is-complete" : state.count ? "is-progress" : ""}>{state.status}{state.count > 0 && !state.final ? ` · ${state.count}/${total}` : ""}</small></span>{state.final ? <CheckCircle2 size={16} /> : <span className="student-roster__number">{students.indexOf(item) + 1}</span>}</button>; })}</div></aside>
      <div className="evaluation-student-panel" data-revision={savedRevision}><section className="evaluation-toolbar"><div className="evaluation-current-student"><span>Alumno {studentIndex + 1} de {students.length}</span><strong>{fullName(student)}</strong><div><button disabled={studentIndex <= 0} onClick={() => moveStudent(-1)} aria-label="Alumno anterior"><ChevronLeft size={16} /></button><button disabled={studentIndex >= students.length - 1} onClick={() => moveStudent(1)} aria-label="Alumno siguiente"><ChevronRight size={16} /></button></div></div><div className="evaluation-progress"><div><span>Avance</span><strong>{completed} de {total} capacidades</strong></div><div className="evaluation-progress__track"><span style={{ width: `${percentage}%` }} /></div><small>{percentage}% completado</small></div><div className="evaluation-result"><span>Resultado final</span><Grade value={finalAverage} /></div></section>
      <div className="evaluation-hint"><span>Escala</span>{SCALE.map((item) => <Grade key={item} value={item} />)}<small>El nivel sugerido prioriza el valor mayor en caso de empate y puede ser ajustado por el docente.</small></div>
      <section className="competency-list">{competencies.map((competency, index) => { const id = String(competency.id_competencia); const isOpen = open.includes(id); const complete = competency.capacities.every((capacity) => scores[`capacity-${capacity.id_capacidad}`]); return <article className={`competency-card ${isOpen ? "is-open" : ""}`} key={id}><div className="competency-card__heading" role="button" tabIndex={0} onClick={() => setOpen((current) => isOpen ? current.filter((item) => item !== id) : [...current, id])} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) event.currentTarget.click(); }}><span className="competency-card__number">{index + 1}</span><span><small>{competency.codigo || `Competencia ${index + 1}`}</small><strong>{competency.descripcion}</strong></span>{complete && <span className="competency-complete"><Check size={13} /> Completa</span>}<label className="competency-achievement" onClick={(event) => event.stopPropagation()}><small>Nivel de logro <em>Sugerido: {suggestedLevel(competency)}</em></small><select disabled={finalized || suggestedLevel(competency) === "—"} value={competencyLevel(competency) === "—" ? "" : competencyLevel(competency)} onChange={(event) => updateScore(`level-${id}`, event.target.value)}><option value="" disabled>—</option>{SCALE.map((value) => <option key={value}>{value}</option>)}</select></label>{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>{isOpen && <div className="capacity-table"><div className="capacity-table__head"><span>Capacidad</span><span>Calificación</span></div>{competency.capacities.map((capacity, capacityIndex) => { const key = `capacity-${capacity.id_capacidad}`; return <div className="capacity-row" key={capacity.id_capacidad}><div><small>Capacidad {capacityIndex + 1}</small><strong>{capacity.descripcion}</strong></div><div className="score-options">{SCALE.map((value) => <button disabled={finalized} aria-label={`${capacity.descripcion}: ${value}`} className={scores[key] === value ? "is-selected" : ""} onClick={() => updateScore(key, value)} key={value}>{value}</button>)}</div></div>; })}<label className="competency-conclusion"><span>Conclusión descriptiva <small>Opcional</small></span><textarea disabled={finalized} value={scores[`comment-${id}`] || ""} onChange={(event) => updateScore(`comment-${id}`, event.target.value)} placeholder="Escribe una observación sobre el desempeño del alumno en esta competencia..." maxLength={500} /><small>{(scores[`comment-${id}`] || "").length}/500</small></label></div>}</article>; })}</section>
      <footer className="evaluation-actions"><div>{message && <p className={finalized ? "is-success" : ""}><CheckCircle2 size={16} />{message}</p>}<small>Las notas se guardan localmente hasta habilitar el API de calificaciones.</small></div><button onClick={() => persist(scores)} disabled={finalized}><Save size={16} />Guardar ahora</button><button className="evaluation-finish" disabled={!total || completed !== total || finalized} onClick={() => setConfirming(true)}><ShieldCheck size={16} />{finalized ? "Registro completado" : "Completar alumno"}</button></footer></div></div>
    </>}
    {confirming && <div className="evaluation-modal" role="dialog" aria-modal="true"><div><span className="evaluation-modal__icon"><ShieldCheck size={23} /></span><h3>¿Confirmar calificaciones?</h3><p>Verificamos que registraste las {total} capacidades de {fullName(student)}. El resultado final es <strong>{finalAverage}</strong>.</p><div><button onClick={() => setConfirming(false)}>Volver a revisar</button><button onClick={finalize}>Sí, guardar y completar</button></div></div></div>}
  </main>;
}
