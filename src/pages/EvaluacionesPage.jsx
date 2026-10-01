import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Save, Search, ShieldCheck } from "lucide-react";

const SCALE = ["AD", "A", "B", "C"];
const SCORE_VALUE = { C: 1, B: 2, A: 3, AD: 4 };
const VALUE_SCORE = { 1: "C", 2: "B", 3: "A", 4: "AD" };
const COURSES = { matematica: ["Matemática", "Ana Lucía Torres"], comunicacion: ["Comunicación", "Carlos Mendoza Ruiz"], ciencia: ["Ciencia y Tecnología", "María Elena Rojas"] };
const STUDENTS = ["Valentina Ramos Pérez", "Mateo Flores Díaz", "Luciana Castro Vega", "Sebastián Huamán Soto", "Camila Vargas León", "Thiago Quispe Ríos", "Alessia Medina Cruz", "Nicolás Salazar Peña"];
const COMPETENCIES = [
  { id: "c1", name: "Resuelve problemas de cantidad", capacities: ["Traduce cantidades a expresiones numéricas", "Comunica su comprensión sobre los números", "Usa estrategias de estimación y cálculo", "Argumenta afirmaciones sobre relaciones numéricas"] },
  { id: "c2", name: "Resuelve problemas de regularidad, equivalencia y cambio", capacities: ["Traduce datos a expresiones algebraicas", "Comunica su comprensión de relaciones algebraicas", "Usa estrategias para encontrar reglas generales", "Argumenta afirmaciones sobre equivalencias"] },
  { id: "c3", name: "Resuelve problemas de forma, movimiento y localización", capacities: ["Modela objetos con formas geométricas", "Comunica su comprensión sobre formas", "Usa estrategias para orientarse en el espacio", "Argumenta afirmaciones sobre relaciones geométricas"] },
];

function average(grades) {
  const values = grades.filter(Boolean).map((grade) => SCORE_VALUE[grade]);
  if (!values.length) return "—";
  const value = values.reduce((sum, item) => sum + item, 0) / values.length;
  return VALUE_SCORE[Math.max(1, Math.min(4, Math.ceil(value - 0.5)))];
}
function Grade({ value }) { return <span className={`evaluation-grade evaluation-grade--${String(value).toLowerCase()}`}>{value}</span>; }

export default function EvaluacionesPage() {
  const [grade, setGrade] = useState("5A");
  const [course, setCourse] = useState("");
  const [student, setStudent] = useState(STUDENTS[0]);
  const [scores, setScores] = useState({});
  const [open, setOpen] = useState(["c1"]);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [search, setSearch] = useState("");
  const [savedRevision, setSavedRevision] = useState(0);
  const keys = useMemo(() => COMPETENCIES.flatMap((competency) => competency.capacities.map((_, capacity) => `${competency.id}-${capacity}`)), []);
  const completed = keys.filter((key) => scores[key]).length;
  const total = keys.length;
  const percentage = Math.round((completed / total) * 100);
  const capacityAverage = (competencyId, capacity) => scores[`${competencyId}-${capacity}`] || "—";
  const competencyAverage = (competency) => average(competency.capacities.map((_, capacity) => capacityAverage(competency.id, capacity)).filter((value) => value !== "—"));
  const finalAverage = average(COMPETENCIES.map(competencyAverage).filter((value) => value !== "—"));

  useEffect(() => {
    if (!course) return;
    const saved = localStorage.getItem(`evaluation-demo-${grade}-${course}-${student}`);
    setScores(saved ? JSON.parse(saved) : {});
    setFinalized(localStorage.getItem(`evaluation-final-${grade}-${course}-${student}`) === "true");
    setMessage("");
  }, [course, grade, student]);

  function persist(nextScores, silent = false) {
    localStorage.setItem(`evaluation-demo-${grade}-${course}-${student}`, JSON.stringify(nextScores));
    setSavedRevision((value) => value + 1);
    if (!silent) setMessage("Borrador guardado en este dispositivo.");
  }
  function saveDraft() { persist(scores); }
  function finalize() { persist(scores, true); localStorage.setItem(`evaluation-final-${grade}-${course}-${student}`, "true"); setConfirming(false); setFinalized(true); setMessage("Calificaciones registradas correctamente."); }
  function selectScore(key, value) { if (!finalized) { setScores((current) => { const next = { ...current, [key]: value }; persist(next, true); return next; }); setMessage(""); } }
  function updateConclusion(competencyId, value) { if (!finalized) setScores((current) => { const next = { ...current, [`comment-${competencyId}`]: value }; persist(next, true); return next; }); }
  function studentState(name) {
    const saved = JSON.parse(localStorage.getItem(`evaluation-demo-${grade}-${course}-${name}`) || "{}");
    const count = keys.filter((key) => saved[key]).length;
    const isFinal = localStorage.getItem(`evaluation-final-${grade}-${course}-${name}`) === "true";
    return { count, status: isFinal ? "Completo" : count ? "En progreso" : "Pendiente", final: isFinal };
  }
  function moveStudent(offset) {
    const next = STUDENTS.indexOf(student) + offset;
    if (next >= 0 && next < STUDENTS.length) setStudent(STUDENTS[next]);
  }
  const visibleStudents = STUDENTS.filter((name) => name.toLowerCase().includes(search.toLowerCase()));
  const groupCompleted = STUDENTS.filter((name) => studentState(name).final).length;

  return <main className="page-content evaluation-page">
    <div className="page-heading"><h2>Registro de calificaciones</h2><p>Evalúa por competencias y capacidades.</p></div>
    <section className="evaluation-setup" aria-label="Datos de evaluación">
      <label>Grado y sección<select value={grade} onChange={(e) => setGrade(e.target.value)}><option value="5A">5.º A — Primaria</option><option value="5B">5.º B — Primaria</option><option value="6A">6.º A — Primaria</option></select></label>
      <label>Curso<select value={course} onChange={(e) => setCourse(e.target.value)}><option value="">Selecciona un curso</option>{Object.entries(COURSES).map(([id, item]) => <option key={id} value={id}>{item[0]}</option>)}</select></label>
      {course && <div className="evaluation-teacher"><span>Docente responsable</span><strong>{COURSES[course][1]}</strong></div>}
    </section>
    {!course ? <section className="evaluation-welcome"><span><ChevronRight size={20} /></span><div><strong>Selecciona un curso para comenzar</strong><p>Las competencias y capacidades aparecerán aquí.</p></div></section> : <>
      <section className="evaluation-group-progress"><span>Avance del aula</span><strong>{groupCompleted} de {STUDENTS.length} alumnos completados</strong><div><span style={{ width: `${Math.round(groupCompleted / STUDENTS.length * 100)}%` }} /></div></section>
      <div className="evaluation-workspace">
      <aside className="student-roster">
        <div className="student-roster__heading"><div><strong>Alumnos</strong><span>{STUDENTS.length} matriculados</span></div><span>{groupCompleted}/{STUDENTS.length}</span></div>
        <label className="student-roster__search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alumno" /></label>
        <div className="student-roster__list">{visibleStudents.map((name, index) => { const state = studentState(name); return <button className={student === name ? "is-active" : ""} onClick={() => setStudent(name)} key={name}><span className="student-roster__avatar">{name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span><span><strong>{name}</strong><small className={state.final ? "is-complete" : state.count ? "is-progress" : ""}>{state.status}{state.count > 0 && !state.final ? ` · ${state.count}/${total}` : ""}</small></span>{state.final ? <CheckCircle2 size={16} /> : <span className="student-roster__number">{STUDENTS.indexOf(name) + 1}</span>}</button>; })}</div>
      </aside>
      <div className="evaluation-student-panel" data-revision={savedRevision}>
      <section className="evaluation-toolbar">
        <div className="evaluation-current-student"><span>Alumno {STUDENTS.indexOf(student) + 1} de {STUDENTS.length}</span><strong>{student}</strong><div><button disabled={STUDENTS.indexOf(student) === 0} onClick={() => moveStudent(-1)} aria-label="Alumno anterior"><ChevronLeft size={16} /></button><button disabled={STUDENTS.indexOf(student) === STUDENTS.length - 1} onClick={() => moveStudent(1)} aria-label="Alumno siguiente"><ChevronRight size={16} /></button></div></div>
        <div className="evaluation-progress"><div><span>Avance</span><strong>{completed} de {total} notas</strong></div><div className="evaluation-progress__track"><span style={{ width: `${percentage}%` }} /></div><small>{percentage}% completado</small></div>
        <div className="evaluation-result"><span>Resultado final</span><Grade value={finalAverage} /></div>
      </section>
      <div className="evaluation-hint"><span>Escala</span>{SCALE.map((item) => <Grade key={item} value={item} />)}<small>El promedio prioriza la calificación inferior en caso de empate.</small></div>
      <section className="competency-list">{COMPETENCIES.map((competency, index) => {
        const isOpen = open.includes(competency.id);
        const complete = competency.capacities.every((_, capacity) => scores[`${competency.id}-${capacity}`]);
        return <article className={`competency-card ${isOpen ? "is-open" : ""}`} key={competency.id}>
          <button className="competency-card__heading" onClick={() => setOpen((current) => isOpen ? current.filter((id) => id !== competency.id) : [...current, competency.id])}><span className="competency-card__number">{index + 1}</span><span><small>Competencia {index + 1}</small><strong>{competency.name}</strong></span>{complete && <span className="competency-complete"><Check size={13} /> Completa</span>}<span className="competency-achievement"><small>Nivel de logro</small><Grade value={competencyAverage(competency)} /></span>{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button>
          {isOpen && <div className="capacity-table"><div className="capacity-table__head"><span>Capacidad</span><span>Calificación</span></div>{competency.capacities.map((capacity, capacityIndex) => { const key = `${competency.id}-${capacityIndex}`; return <div className="capacity-row" key={capacity}><div><small>Capacidad {capacityIndex + 1}</small><strong>{capacity}</strong></div><div className="score-options">{SCALE.map((value) => <button disabled={finalized} aria-label={`${capacity}: ${value}`} className={scores[key] === value ? "is-selected" : ""} onClick={() => selectScore(key, value)} key={value}>{value}</button>)}</div></div>; })}<label className="competency-conclusion"><span>Conclusión descriptiva <small>Opcional</small></span><textarea disabled={finalized} value={scores[`comment-${competency.id}`] || ""} onChange={(event) => updateConclusion(competency.id, event.target.value)} placeholder="Escribe una observación sobre el desempeño del alumno en esta competencia..." maxLength={500} /><small>{(scores[`comment-${competency.id}`] || "").length}/500</small></label></div>}
        </article>;
      })}</section>
      <footer className="evaluation-actions"><div>{message && <p className={finalized ? "is-success" : ""}><CheckCircle2 size={16} />{message}</p>}<small>Los cambios se guardan automáticamente.</small></div><button onClick={saveDraft} disabled={finalized}><Save size={16} />Guardar ahora</button><button className="evaluation-finish" disabled={completed !== total || finalized} onClick={() => setConfirming(true)}><ShieldCheck size={16} />{finalized ? "Registro completado" : "Completar alumno"}</button></footer>
      </div></div>
    </>}
    {confirming && <div className="evaluation-modal" role="dialog" aria-modal="true"><div><span className="evaluation-modal__icon"><ShieldCheck size={23} /></span><h3>¿Confirmar calificaciones?</h3><p>Verificamos que registraste las {total} notas. El resultado final es <strong>{finalAverage}</strong>. Confirma que las calificaciones son correctas.</p><div><button onClick={() => setConfirming(false)}>Volver a revisar</button><button onClick={finalize}>Sí, guardar y completar</button></div></div></div>}
  </main>;
}
