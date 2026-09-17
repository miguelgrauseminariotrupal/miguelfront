import { Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConsolidatedView from "../components/evaluations/ConsolidatedView";
import ContextMenu from "../components/evaluations/ContextMenu";
import { getAniosLectivos } from "../services/aniosLectivos.service";
import { getCursos } from "../services/cursos.service";
import { createAprendizaje, getAprendizajes, updateAprendizaje } from "../services/aprendizajes.service";
import { createCompetencia, getCompetencias, updateCompetencia } from "../services/competencias.service";
import { createCapacidad, getCapacidades, updateCapacidad } from "../services/capacidades.service";

const tabs = [{ id: "consolidado", label: "Consolidado" }, { id: "aprendizajes", label: "Aprendizajes" }, { id: "competencias", label: "Competencias" }, { id: "capacidades", label: "Capacidades" }];
const blank = {
  aprendizajes: { id: "", nombre_aprendizaje: "", id_anio_lectivo: "", estado: true },
  competencias: { id: "", id_curso: "", codigo: "", descripcion: "", id_aprendizaje: "", tipo: "", estado: true },
  capacidades: { id: "", descripcion: "", id_competencia: "", estado: true },
};

export default function EvaluacionesConfiguracionPage() {
  const [tab, setTab] = useState("consolidado"), [mode, setMode] = useState("list");
  const [selected, setSelected] = useState({ year: "", aprendizaje: "", curso: "", competencia: "" });
  const [data, setData] = useState({ anios: [], aprendizajes: [], cursos: [], competencias: [], capacidades: [] });
  const [form, setForm] = useState(blank.aprendizajes), [query, setQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [anios, aprendizajes, competencias, capacidades] = await Promise.all([getAniosLectivos(), getAprendizajes(), getCompetencias(), getCapacidades()]);
      const groups = await Promise.all(anios.map((x) => getCursos(x.id_anio_lectivo)));
      setData({ anios, aprendizajes, cursos: groups.flat(), competencias, capacidades });
    } catch (error) { setFeedback({ type: "error", text: error.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const maps = useMemo(() => ({ years: new Map(data.anios.map((x) => [String(x.id_anio_lectivo), x])), learnings: new Map(data.aprendizajes.map((x) => [String(x.id_aprendizaje), x])), courses: new Map(data.cursos.map((x) => [String(x.id_curso), x])), competencies: new Map(data.competencias.map((x) => [String(x.id_competencia), x])) }), [data]);
  const yearLearnings = data.aprendizajes.filter((x) => !selected.year || String(x.id_anio_lectivo) === String(selected.year));
  const yearCourses = data.cursos.filter((x) => !selected.year || String(x.id_anio_lectivo) === String(selected.year));
  const contextCompetencies = data.competencias.filter((x) => String(x.id_aprendizaje) === String(selected.aprendizaje) && String(x.id_curso) === String(selected.curso));
  const contextCapacities = data.capacidades.filter((x) => String(x.id_competencia) === String(selected.competencia));
  const matches = (value) => !query.trim() || String(value || "").toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
  const matchesCourse = (name, value) => String(name || "").toLocaleLowerCase("es").includes(value.trim().toLocaleLowerCase("es"));

  const openCreate = (entity, context = selected) => {
    setTab(entity); setSelected(context); setMode("create"); setQuery(""); setCourseQuery(""); setFeedback({ type: "", text: "" });
    const nextCompetencyNumber = data.competencias.filter((item) => String(item.id_aprendizaje) === String(context.aprendizaje) && String(item.id_curso) === String(context.curso)).length + 1;
    setForm({ ...blank[entity], ...(entity === "aprendizajes" ? { id_anio_lectivo: context.year } : {}), ...(entity === "competencias" ? { id_aprendizaje: context.aprendizaje, id_curso: context.curso, codigo: `Competencia ${String(nextCompetencyNumber).padStart(2, "0")}` } : {}), ...(entity === "capacidades" ? { id_competencia: context.competencia } : {}) });
  };
  const openEdit = (entity, item, context = selected) => {
    setTab(entity); setSelected(context); setMode("edit"); setQuery(""); setFeedback({ type: "", text: "" });
    if (entity === "aprendizajes") setForm({ id: item.id_aprendizaje, nombre_aprendizaje: item.nombre_aprendizaje || "", id_anio_lectivo: item.id_anio_lectivo || context.year, estado: item.estado !== false });
    if (entity === "competencias") setForm({ id: item.id_competencia, id_curso: item.id_curso, codigo: item.codigo || "", descripcion: item.descripcion || "", id_aprendizaje: item.id_aprendizaje, tipo: item.tipo || "", estado: item.estado !== false });
    if (entity === "capacidades") setForm({ id: item.id_capacidad, descripcion: item.descripcion || "", id_competencia: item.id_competencia, estado: item.estado !== false });
  };
  const openLearningCompetencies = (learning) => {
    setSelected({ year: String(learning.id_anio_lectivo), aprendizaje: String(learning.id_aprendizaje), curso: "", competencia: "" });
    setTab("competencias"); setMode("list"); setQuery(""); setFeedback({ type: "", text: "" });
  };
  const openCompetencyCapacities = (competency) => {
    setSelected((current) => ({ ...current, competencia: String(competency.id_competencia) }));
    setTab("capacidades"); setMode("list"); setQuery(""); setFeedback({ type: "", text: "" });
  };
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === "checkbox" ? target.checked : target.value }));
  const submit = async (event) => {
    event.preventDefault(); setFeedback({ type: "", text: "" });
    if ((tab === "aprendizajes" && (!form.id_anio_lectivo || !form.nombre_aprendizaje.trim())) || (tab === "competencias" && (!form.id_aprendizaje || !form.id_curso || !form.descripcion.trim())) || (tab === "capacidades" && (!form.id_competencia || !form.descripcion.trim()))) return setFeedback({ type: "error", text: "Completa los campos obligatorios." });
    setSaving(true);
    try {
      if (tab === "aprendizajes") await (form.id ? updateAprendizaje(form.id, form) : createAprendizaje(form));
      if (tab === "competencias") {
        const sequence = data.competencias.filter((item) => String(item.id_aprendizaje) === String(form.id_aprendizaje) && String(item.id_curso) === String(form.id_curso)).length + 1;
        await (form.id ? updateCompetencia(form.id, form) : createCompetencia({ ...form, codigo: `Competencia ${String(sequence).padStart(2, "0")}` }));
      }
      if (tab === "capacidades") await (form.id ? updateCapacidad(form.id, form) : createCapacidad(form));
      setFeedback({ type: "success", text: form.id ? "Registro actualizado correctamente." : "Registro creado correctamente." }); setMode("list"); await load();
    } catch (error) { setFeedback({ type: "error", text: error.message }); }
    finally { setSaving(false); }
  };
  const selectTab = (next) => { setTab(next); setMode("list"); setQuery(""); setFeedback({ type: "", text: "" }); };
  const contextLabel = tab === "aprendizajes" ? `Año: ${maps.years.get(String(form.id_anio_lectivo))?.anio || "—"}` : tab === "competencias" ? `Aprendizaje: ${maps.learnings.get(String(form.id_aprendizaje))?.nombre_aprendizaje || "—"} · Curso: ${maps.courses.get(String(form.id_curso))?.nombre || "—"}` : `Aprendizaje: ${maps.learnings.get(String(selected.aprendizaje))?.nombre_aprendizaje || "—"} · Curso: ${maps.courses.get(String(selected.curso))?.nombre || "—"} · Competencia: ${maps.competencies.get(String(form.id_competencia))?.descripcion || "—"}`;
  const searchBox = (placeholder) => <label className="tree-search management-search"><Search size={17} /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} /></label>;

  return <main className="page-content evaluation-settings-page"><div className="page-heading"><h2>Configuración de evaluaciones</h2><p>Administra aprendizajes, competencias y capacidades</p></div><div className="parameter-tabs" role="tablist">{tabs.map((item) => <button type="button" key={item.id} className={tab === item.id ? "is-active" : ""} onClick={() => selectTab(item.id)}>{item.label}</button>)}</div><section className="parameter-panel evaluation-panel">
    {tab === "consolidado" && <ConsolidatedView {...data} loading={loading} onEditLearning={(item, context) => openEdit("aprendizajes", item, context)} onEditCompetency={(item, context) => openEdit("competencias", item, context)} onAddCapacity={(context) => openCreate("capacidades", context)} onEditCapacity={(item, context) => openEdit("capacidades", item, context)} />}
    {tab === "competencias" && mode === "list" && selected.aprendizaje && !selected.curso && <div className="course-create-standalone"><button className="parameter-create" type="button" onClick={() => openCreate("competencias", { ...selected, curso: "", competencia: "" })}><Plus size={16} />Nueva competencia</button></div>}

    {tab === "aprendizajes" && <><div className="management-heading"><h3>Aprendizajes</h3><select value={selected.year} onChange={(e) => setSelected({ year: e.target.value, aprendizaje: "", curso: "", competencia: "" })}><option value="">Todos los años</option>{data.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</select></div>{mode === "list" && <div className="management-toolbar">{searchBox("Buscar aprendizaje...")}<button className="parameter-create" disabled={!selected.year} onClick={() => openCreate("aprendizajes")}><Plus size={16} />Nuevo aprendizaje</button></div>}{mode === "list" && <div className="management-list">{yearLearnings.filter((x) => matches(`${x.nombre_aprendizaje} ${maps.years.get(String(x.id_anio_lectivo))?.anio}`)).map((item) => <article key={item.id_aprendizaje}><button className="management-row-main" type="button" onClick={() => openLearningCompetencies(item)}><span><strong>{item.nombre_aprendizaje}</strong><small>{maps.years.get(String(item.id_anio_lectivo))?.anio} · Ver cursos y competencias</small></span><span aria-hidden="true">›</span></button><ContextMenu actions={[{ label: "Editar", icon: <Pencil size={14} />, onClick: () => openEdit("aprendizajes", item, { year: String(item.id_anio_lectivo), aprendizaje: String(item.id_aprendizaje), curso: "", competencia: "" }) }]} /></article>)}</div>}</>}

    {tab === "competencias" && <><h3>Gestionar competencias</h3>{mode === "list" && selected.aprendizaje && <p className="evaluation-context">Aprendizaje: {maps.learnings.get(String(selected.aprendizaje))?.nombre_aprendizaje} · {maps.years.get(String(selected.year))?.anio}</p>}{mode === "list" && !selected.aprendizaje && <p className="parameter-empty">Selecciona un aprendizaje desde la pestaña Aprendizajes para consultar sus cursos.</p>}{mode === "list" && selected.aprendizaje && !selected.curso && <><div className="management-toolbar">{searchBox("Buscar curso por nombre...")}</div><div className="management-list course-browser">{yearCourses.filter((item) => matches(item.nombre)).map((item) => { const count = data.competencias.filter((x) => String(x.id_aprendizaje) === String(selected.aprendizaje) && String(x.id_curso) === String(item.id_curso)).length; return <article key={item.id_curso}><button className="management-row-main" type="button" onClick={() => { setSelected((current) => ({ ...current, curso: String(item.id_curso), competencia: "" })); setQuery(""); }}><span><strong>{item.nombre}</strong><small>{count} {count === 1 ? "competencia" : "competencias"}</small></span><span aria-hidden="true">›</span></button></article>; })}</div></>}{mode === "list" && selected.curso && <><button className="management-back" type="button" onClick={() => { setSelected((current) => ({ ...current, curso: "", competencia: "" })); setQuery(""); }}>← Cursos</button><div className="management-course-title"><h4>{maps.courses.get(String(selected.curso))?.nombre}</h4><span>{contextCompetencies.length} competencias</span></div><div className="management-toolbar">{searchBox("Buscar competencia...")}<button className="parameter-create" onClick={() => openCreate("competencias")}><Plus size={16} />Nueva competencia</button></div><div className="management-list">{contextCompetencies.filter((x) => matches(`${x.codigo} ${x.descripcion}`)).map((item, index) => <article key={item.id_competencia}><button className="management-row-main" type="button" onClick={() => openCompetencyCapacities(item)}><span><strong>Competencia {String(index + 1).padStart(2, "0")} - {item.descripcion}</strong><small>Ver capacidades</small></span><span aria-hidden="true">›</span></button><button className="management-edit-visible" type="button" onClick={() => openEdit("competencias", item)}><Pencil size={14} />Editar</button></article>)}{!contextCompetencies.length && <div className="inline-empty"><p>No hay competencias registradas para este curso.</p><button onClick={() => openCreate("competencias")}><Plus size={15} />Crear primera competencia</button></div>}</div></>}</>}

    {tab === "capacidades" && <><h3>Gestionar capacidades</h3>{mode === "list" && selected.competencia && <p className="evaluation-context">Aprendizaje: {maps.learnings.get(String(selected.aprendizaje))?.nombre_aprendizaje} · Curso: {maps.courses.get(String(selected.curso))?.nombre} · Competencia: {maps.competencies.get(String(selected.competencia))?.descripcion}</p>}{mode === "list" && selected.competencia && <div className="management-toolbar">{searchBox("Buscar capacidad...")}<button className="parameter-create" onClick={() => openCreate("capacidades")}><Plus size={16} />Nueva capacidad</button></div>}{mode === "list" && !selected.competencia && <p className="parameter-empty">Selecciona una competencia desde Consolidado para administrar sus capacidades.</p>}{mode === "list" && selected.competencia && <div className="management-list">{contextCapacities.filter((x) => matches(x.descripcion)).map((item) => <article key={item.id_capacidad}><span>{item.descripcion}</span><ContextMenu actions={[{ label: "Editar", icon: <Pencil size={14} />, onClick: () => openEdit("capacidades", item) }]} /></article>)}{!contextCapacities.length && <div className="inline-empty"><p>No hay capacidades registradas.</p><button onClick={() => openCreate("capacidades")}><Plus size={15} />Crear primera capacidad</button></div>}</div>}</>}

    {tab !== "consolidado" && (mode === "create" || mode === "edit") && <><p className="evaluation-context">{contextLabel}</p><form className="parameter-form parameter-form-card evaluation-config-form" onSubmit={submit}>{tab === "aprendizajes" && <div><label>Nombre del aprendizaje *</label><input name="nombre_aprendizaje" value={form.nombre_aprendizaje} onChange={change} /></div>}{tab === "competencias" && <>{!form.id_curso && <div className="course-assignment-search"><label>Buscar y asignar curso *</label><div className="course-assignment-search__input"><Search size={16} /><input value={courseQuery} onChange={(e) => setCourseQuery(e.target.value)} placeholder="Buscar curso por nombre..." /></div>{courseQuery.trim() && <div className="course-assignment-results">{data.cursos.filter((item) => (!selected.year || String(item.id_anio_lectivo) === String(selected.year)) && matchesCourse(item.nombre, courseQuery)).map((item) => <button type="button" key={item.id_curso} onClick={() => { setForm((current) => ({ ...current, id_curso: item.id_curso })); setSelected((current) => ({ ...current, curso: String(item.id_curso) })); setCourseQuery(""); }}><span>{item.nombre}</span><small>Asignar</small></button>)}{!data.cursos.some((item) => (!selected.year || String(item.id_anio_lectivo) === String(selected.year)) && matchesCourse(item.nombre, courseQuery)) && <p>No se encontraron cursos.</p>}</div>}</div>}{form.id_curso && <><div><label>Curso asignado</label><input value={maps.courses.get(String(form.id_curso))?.nombre || "Curso seleccionado"} disabled /></div><div><label>Código</label><input name="codigo" value={form.codigo} onChange={change} /></div><div><label>Nombre *</label><input name="descripcion" value={form.descripcion} onChange={change} /></div><div><label>Tipo</label><input name="tipo" value={form.tipo} onChange={change} /></div></>}</>}{tab === "capacidades" && <div><label>Descripción *</label><input name="descripcion" value={form.descripcion} onChange={change} /></div>}{(tab !== "competencias" || form.id_curso) && <><label className="evaluation-state"><input type="checkbox" name="estado" checked={form.estado} onChange={change} />Activo</label><button className="parameter-save" disabled={saving}>{form.id ? <Pencil size={16} /> : <Plus size={16} />}{saving ? "Guardando..." : form.id ? "Actualizar" : "Guardar"}</button></>}<button className="parameter-cancel" type="button" onClick={() => setMode("list")}><RotateCcw size={16} />Cancelar</button></form></>}
    {feedback.text && <p className={`parameter-feedback is-${feedback.type}`}>{feedback.text}</p>}{loading && <p className="parameter-empty">Cargando...</p>}
  </section></main>;
}
