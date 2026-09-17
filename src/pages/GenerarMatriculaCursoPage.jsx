import { Play, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAniosLectivos } from "../services/aniosLectivos.service";
import { getNiveles } from "../services/niveles.service";
import { getGrados } from "../services/grados.service";
import { getSecciones } from "../services/secciones.service";
import { getCursos } from "../services/cursos.service";
import { getMatriculas } from "../services/matriculas.service";
import { getProgramacionSecciones } from "../services/programacionSecciones.service";
import { getProgramacionCursos } from "../services/programacionCursos.service";
import { generarMatriculaCursos, getMatriculaCursos } from "../services/matriculaCursos.service";

export default function GenerarMatriculaCursoPage() {
  const [anios, setAnios] = useState([]), [niveles, setNiveles] = useState([]);
  const [selection, setSelection] = useState({ anio: "", nivel: "" });
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(false), [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, percent: 0 });
  const cancelRequested = useRef(false);
  const allowNavigation = useRef(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  useEffect(() => { getAniosLectivos({ estado: true }).then(setAnios).catch((e) => setFeedback({ type: "error", text: e.message })); }, []);
  useEffect(() => {
    if (!generating) return undefined;
    const guardClick = (event) => {
      const interactive = event.target.closest("a[href], button");
      if (!interactive || interactive.closest(".generation-card, .process-warning-modal")) return;
      if (allowNavigation.current) { allowNavigation.current = false; return; }
      event.preventDefault(); event.stopPropagation();
      document.querySelector(".process-warning-modal")?.remove();
      const overlay = document.createElement("div");
      overlay.className = "process-warning-modal";
      overlay.innerHTML = `<div class="process-warning-modal__card" role="alertdialog" aria-modal="true" aria-labelledby="process-warning-title"><div class="process-warning-modal__icon">!</div><h3 id="process-warning-title">Proceso en curso</h3><p>La generación de matrículas todavía no ha terminado. Si sales ahora, se cancelarán los registros pendientes.</p><div><button type="button" class="process-warning-stay">Continuar esperando</button><button type="button" class="process-warning-leave">Sí, salir</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector(".process-warning-stay").addEventListener("click", () => overlay.remove());
      overlay.querySelector(".process-warning-leave").addEventListener("click", () => { cancelRequested.current = true; allowNavigation.current = true; overlay.remove(); interactive.click(); });
      overlay.querySelector(".process-warning-stay").focus();
    };
    const guardUnload = (event) => { cancelRequested.current = true; event.preventDefault(); event.returnValue = ""; };
    document.addEventListener("click", guardClick, true);
    window.addEventListener("beforeunload", guardUnload);
    return () => { document.removeEventListener("click", guardClick, true); window.removeEventListener("beforeunload", guardUnload); document.querySelector(".process-warning-modal")?.remove(); };
  }, [generating]);
  const year = useMemo(() => anios.find((x) => String(x.id_anio_lectivo) === String(selection.anio)), [anios, selection.anio]);
  const level = useMemo(() => niveles.find((x) => String(x.id_nivel) === String(selection.nivel)), [niveles, selection.nivel]);
  const selectYear = async (id) => {
    setSelection({ anio: id, nivel: "" }); setRows([]); setProgress({ processed: 0, total: 0, percent: 0 }); setFeedback({ type: "", text: "" });
    try { setNiveles(id ? await getNiveles(id, { estado: true }) : []); } catch (e) { setFeedback({ type: "error", text: e.message }); }
  };
  const structure = async () => {
    const grados = await getGrados(selection.nivel, { estado: true });
    const groups = await Promise.all(grados.map((x) => getSecciones(x.id_grado, { estado: true })));
    return { grados, secciones: groups.flat() };
  };
  const loadSummary = async () => {
    if (!selection.anio || !selection.nivel) return;
    setLoading(true);
    try {
      const { grados, secciones } = await structure(), sectionIds = new Set(secciones.map((x) => String(x.id_seccion)));
      const [allPrograms, cursos, matriculasCurso, allProgramCourses] = await Promise.all([getProgramacionSecciones(), getCursos(selection.anio, { estado: true }), getMatriculaCursos({ estado: true }), getProgramacionCursos({ estado: true })]);
      const programs = allPrograms.filter((x) => sectionIds.has(String(x.id_seccion))), programIds = new Set(programs.map((x) => String(x.id_programacion_seccion)));
      const counts = matriculasCurso.reduce((m, x) => m.set(String(x.id_programacion_curso), (m.get(String(x.id_programacion_curso)) || 0) + 1), new Map());
      const gradoMap = new Map(grados.map((x) => [String(x.id_grado), x])), sectionMap = new Map(secciones.map((x) => [String(x.id_seccion), x])), programMap = new Map(programs.map((x) => [String(x.id_programacion_seccion), x])), courseMap = new Map(cursos.map((x) => [String(x.id_curso), x]));
      setRows(allProgramCourses.filter((x) => programIds.has(String(x.id_programacion_seccion)) && counts.has(String(x.id_programacion_curso))).map((x) => {
        const program = programMap.get(String(x.id_programacion_seccion)), section = sectionMap.get(String(program?.id_seccion)), grado = gradoMap.get(String(section?.id_grado));
        return { id: x.id_programacion_curso, anio: year?.anio, nivel: level?.nombre, grado: grado?.nombre, seccion: section?.nombre, curso: courseMap.get(String(x.id_curso))?.nombre || `Curso ${x.id_curso}`, alumnos: counts.get(String(x.id_programacion_curso)) };
      }).sort((a, b) => `${a.grado}${a.seccion}${a.curso}`.localeCompare(`${b.grado}${b.seccion}${b.curso}`, "es")));
    } catch (e) { setFeedback({ type: "error", text: e.message }); } finally { setLoading(false); }
  };
  const generate = async () => {
    cancelRequested.current = false; setGenerating(true); setProgress({ processed: 0, total: 0, percent: 0 }); setFeedback({ type: "", text: "" });
    try {
      const matriculas = await getMatriculas({ id_anio_lectivo: selection.anio, id_nivel: selection.nivel, estado: true });
      setProgress({ processed: 0, total: matriculas.length, percent: matriculas.length ? 0 : 100 });
      let creados = 0, existentes = 0; const sinProgramacion = new Set();
      for (let index = 0; index < matriculas.length; index += 1) { if (cancelRequested.current) break; const result = await generarMatriculaCursos(matriculas[index].id_matricula); if (cancelRequested.current) break; creados += Number(result.registros_creados || 0); existentes += Number(result.registros_ya_existian || 0); (result.secciones_sin_programacion || []).forEach((id) => sinProgramacion.add(id)); const processed = index + 1; setProgress({ processed, total: matriculas.length, percent: Math.round((processed / matriculas.length) * 100) }); }
      if (cancelRequested.current) return;
      setFeedback({ type: "success", text: `Proceso terminado: ${matriculas.length} matrículas procesadas, ${creados} registros creados y ${existentes} ya existentes.${sinProgramacion.size ? ` ${sinProgramacion.size} secciones no tienen programación.` : ""}` });
      await loadSummary();
    } catch (e) { setFeedback({ type: "error", text: e.message }); } finally { setGenerating(false); }
  };
  return <main className="page-content generation-page"><div className="page-heading"><h2>Generar Matrícula - Curso</h2><p>Genera los cursos de todas las matrículas activas de un año y nivel</p></div><section className="generation-card"><div className="parameter-form generation-filters"><div><label>Año lectivo</label><select value={selection.anio} onChange={(e) => selectYear(e.target.value)}><option value="">Selecciona un año</option>{anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</select></div><div><label>Nivel</label><select value={selection.nivel} disabled={!selection.anio || generating} onChange={(e) => { setSelection((s) => ({ ...s, nivel: e.target.value })); setRows([]); setProgress({ processed: 0, total: 0, percent: 0 }); }}><option value="">Selecciona un nivel</option>{niveles.map((x) => <option key={x.id_nivel} value={x.id_nivel}>{x.nombre}</option>)}</select></div><button className="parameter-save" type="button" disabled={generating || !selection.nivel} onClick={generate}><Play size={16} />{generating ? "Generando..." : "Generar todo"}</button><button className="parameter-cancel" type="button" disabled={loading || generating || !selection.nivel} onClick={loadSummary}><RefreshCw size={16} />Ver resumen</button></div>{(generating || progress.percent > 0) && <div className="generation-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress.percent}><div className="generation-progress__heading"><span>{generating ? "Generando matrículas por curso..." : "Proceso completado"}</span><strong>{progress.percent}%</strong></div><div className="generation-progress__track"><span style={{ width: `${progress.percent}%` }} /></div><small>{progress.total ? `${progress.processed} de ${progress.total} matrículas procesadas` : "Preparando registros..."}</small></div>}{feedback.text && <p className={`parameter-feedback is-${feedback.type}`}>{feedback.text}</p>}<div className="parameter-table-wrap"><table className="parameter-table"><thead><tr><th>Año</th><th>Nivel</th><th>Grado</th><th>Sección</th><th>Curso</th><th>Matrículas generadas</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.anio}</td><td>{row.nivel}</td><td>{row.grado}</td><td>{row.seccion}</td><td>{row.curso}</td><td>{row.alumnos}</td></tr>)}</tbody></table>{loading && <p className="parameter-empty">Cargando resumen...</p>}{!loading && !rows.length && <p className="parameter-empty">Selecciona año y nivel para generar o consultar el resumen.</p>}</div></section></main>;
}
