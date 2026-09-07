import { Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { createAnioLectivo, getAniosLectivos, updateAnioLectivo } from "../services/aniosLectivos.service";
import { createNivel, getNiveles, updateNivel } from "../services/niveles.service";
import { createGrado, getGrados, updateGrado } from "../services/grados.service";
import { SeccionesCrud } from "../components/configuration/ConfigurationCruds";

const tabs = [
  { id: "anios", label: "Año lectivo" },
  { id: "niveles", label: "Nivel" },
  { id: "grados", label: "Grado" },
  { id: "secciones", label: "Secciones" },
];

function SearchBox({ value, onChange, placeholder = "Buscar..." }) {
  return <label className="parameter-search"><Search size={17} /><span className="sr-only">Buscar</span><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function ResultsTable({ columns, items, loading, query, rowKey, editingId, onEdit }) {
  const normalized = query.trim().toLocaleLowerCase("es");
  const filtered = items.filter((item) => !normalized || columns.some((column) => String(column.value(item) ?? "").toLocaleLowerCase("es").includes(normalized)));
  return <div className="parameter-table-wrap">
    <table className="parameter-table"><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}<th>Acciones</th></tr></thead>
      <tbody>{filtered.map((item) => <tr className={String(editingId) === String(rowKey(item)) ? "is-editing" : ""} key={rowKey(item)}>{columns.map((column) => <td key={column.label}>{column.value(item) || "—"}</td>)}<td><button type="button" onClick={() => onEdit(item)}><Pencil size={15} />Editar</button></td></tr>)}</tbody></table>
    {!loading && !filtered.length && <p className="parameter-empty">No se encontraron registros.</p>}
    {loading && <p className="parameter-empty">Cargando...</p>}
  </div>;
}

function Feedback({ error, success }) {
  if (error) return <p className="parameter-feedback is-error" role="alert">{error}</p>;
  if (success) return <p className="parameter-feedback is-success" role="status">{success}</p>;
  return null;
}

function EmptyList({ loading, items }) {
  if (loading) return <p className="parameter-empty">Cargando...</p>;
  if (!items.length) return <p className="parameter-empty">No hay registros para mostrar.</p>;
  return null;
}

export default function ParametrosPage() {
  const [activeTab, setActiveTab] = useState("anios");
  const [anios, setAnios] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [nivelesGrado, setNivelesGrado] = useState([]);
  const [grados, setGrados] = useState([]);
  const [anioForm, setAnioForm] = useState({ id: "", anio: "", nombre: "" });
  const [nivelForm, setNivelForm] = useState({ id: "", idAnio: "", nombre: "" });
  const [gradoForm, setGradoForm] = useState({ id: "", idAnio: "", idNivel: "", nombre: "" });
  const [loading, setLoading] = useState({ anios: true, list: false, save: false });
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [search, setSearch] = useState({ anios: "", niveles: "", grados: "" });
  const [formOpen, setFormOpen] = useState({ anios: false, niveles: false, grados: false });
  const [view, setView] = useState({ anios: "idle", niveles: "idle", grados: "idle" });

  const showForm = (name) => setFormOpen((state) => ({ ...state, [name]: true }));
  const hideForm = (name) => setFormOpen((state) => ({ ...state, [name]: false }));
  const setModuleView = (name, mode) => setView((state) => ({ ...state, [name]: mode }));

  const clearFeedback = () => setFeedback({ error: "", success: "" });

  const loadAnios = async () => {
    setLoading((state) => ({ ...state, anios: true }));
    try { setAnios(await getAniosLectivos()); }
    catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, anios: false })); }
  };

  useEffect(() => { loadAnios(); }, []);

  const selectTab = (tab) => {
    setActiveTab(tab);
    clearFeedback();
  };

  const loadNiveles = async (idAnio, target = "niveles") => {
    if (!idAnio) { target === "niveles" ? setNiveles([]) : setNivelesGrado([]); return; }
    setLoading((state) => ({ ...state, list: true }));
    clearFeedback();
    try {
      const result = await getNiveles(idAnio);
      target === "niveles" ? setNiveles(result) : setNivelesGrado(result);
    } catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, list: false })); }
  };

  const handleNivelAnio = (idAnio) => {
    setNivelForm({ id: "", idAnio, nombre: "" });
    setNiveles([]);
    loadNiveles(idAnio);
  };

  const handleGradoAnio = (idAnio) => {
    setGradoForm({ id: "", idAnio, idNivel: "", nombre: "" });
    setNivelesGrado([]); setGrados([]);
    loadNiveles(idAnio, "grados");
  };

  const handleGradoNivel = async (idNivel) => {
    setGradoForm((state) => ({ ...state, id: "", idNivel, nombre: "" }));
    setGrados([]); clearFeedback();
    if (!idNivel) return;
    setLoading((state) => ({ ...state, list: true }));
    try { setGrados(await getGrados(idNivel)); }
    catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, list: false })); }
  };

  const submitAnio = async (event) => {
    event.preventDefault(); clearFeedback();
    const numericYear = Number(anioForm.anio);
    if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999 || !anioForm.nombre.trim()) {
      return setFeedback({ error: "Ingresa un año lectivo válido de cuatro dígitos y un nombre.", success: "" });
    }
    const isDuplicate = anios.some((item) => Number(item.anio) === numericYear && String(item.id_anio_lectivo) !== String(anioForm.id));
    if (isDuplicate) return setFeedback({ error: `El año lectivo ${numericYear} ya existe.`, success: "" });
    setLoading((state) => ({ ...state, save: true }));
    try {
      anioForm.id ? await updateAnioLectivo(anioForm.id, numericYear, anioForm.nombre) : await createAnioLectivo(numericYear, anioForm.nombre);
      setFeedback({ error: "", success: anioForm.id ? "Año lectivo actualizado." : "Año lectivo creado." });
      setAnioForm({ id: "", anio: "", nombre: "" }); hideForm("anios"); await loadAnios();
    } catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, save: false })); }
  };

  const submitNivel = async (event) => {
    event.preventDefault(); clearFeedback();
    if (!nivelForm.idAnio || !nivelForm.nombre.trim()) return setFeedback({ error: "Selecciona el año e ingresa el nombre del nivel.", success: "" });
    setLoading((state) => ({ ...state, save: true }));
    try {
      nivelForm.id ? await updateNivel(nivelForm.id, nivelForm.idAnio, nivelForm.nombre) : await createNivel(nivelForm.idAnio, nivelForm.nombre);
      setFeedback({ error: "", success: nivelForm.id ? "Nivel actualizado." : "Nivel creado." });
      setNivelForm((state) => ({ ...state, id: "", nombre: "" })); hideForm("niveles"); await loadNiveles(nivelForm.idAnio);
    } catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, save: false })); }
  };

  const submitGrado = async (event) => {
    event.preventDefault(); clearFeedback();
    if (!gradoForm.idNivel || !gradoForm.nombre.trim()) return setFeedback({ error: "Selecciona el nivel e ingresa el nombre del grado.", success: "" });
    setLoading((state) => ({ ...state, save: true }));
    try {
      gradoForm.id ? await updateGrado(gradoForm.id, gradoForm.idNivel, gradoForm.nombre) : await createGrado(gradoForm.idNivel, gradoForm.nombre);
      setFeedback({ error: "", success: gradoForm.id ? "Grado actualizado." : "Grado creado." });
      setGradoForm((state) => ({ ...state, id: "", nombre: "" }));
      hideForm("grados");
      setGrados(await getGrados(gradoForm.idNivel));
    } catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, save: false })); }
  };

  return (
    <main className="page-content parameters-page configuration-structure-page">
      <div className="page-heading"><h2>Configuración</h2><p>Administración de la estructura y programación académica</p></div>
      <div className="parameter-tabs" role="tablist" aria-label="Tipos de parámetro">
        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => selectTab(tab.id)}>{tab.label}</button>)}
      </div>

      {activeTab === "secciones" && <SeccionesCrud />}

      {activeTab === "anios" && <section className={`parameter-panel flow-panel view-${view.anios}`}>
        <div className="parameter-actions parameter-actions--buttons"><button className="parameter-search-button" type="button" onClick={() => { hideForm("anios"); setModuleView("anios", "search"); }}><Search size={17} />Buscar</button><button className="parameter-create" type="button" onClick={() => { setAnioForm({ id: "", anio: "", nombre: "" }); showForm("anios"); setModuleView("anios", "create"); clearFeedback(); }}><Plus size={17} />Crear año lectivo</button></div>
        {(view.anios === "search" || view.anios === "edit") && <SearchBox value={search.anios} onChange={(value) => setSearch((state) => ({ ...state, anios: value }))} placeholder="Buscar por año o nombre" />}
        {formOpen.anios && <form className="parameter-form parameter-form-card" onSubmit={submitAnio}>
          <div><label htmlFor="parameter-year">Año lectivo</label><input id="parameter-year" type="number" min="1" placeholder="Ingresa el año" value={anioForm.anio} onChange={(event) => setAnioForm((state) => ({ ...state, anio: event.target.value }))} /></div>
          <div><label htmlFor="parameter-year-name">Nombre</label><input id="parameter-year-name" placeholder="Ej. Año escolar 2026" value={anioForm.nombre} onChange={(event) => setAnioForm((state) => ({ ...state, nombre: event.target.value }))} /></div>
          <button className="parameter-save" type="submit" disabled={loading.save}>{anioForm.id ? <Pencil size={17} /> : <Plus size={17} />}{loading.save ? "Guardando..." : anioForm.id ? "Actualizar" : "Crear"}</button>
          <button className="parameter-cancel" type="button" onClick={() => { setAnioForm({ id: "", anio: "", nombre: "" }); hideForm("anios"); }}><RotateCcw size={16} />Cancelar</button>
        </form>}
        <Feedback {...feedback} />
        {(view.anios === "search" || view.anios === "edit") && <ResultsTable loading={loading.anios} items={anios} query={search.anios} rowKey={(item) => item.id_anio_lectivo} editingId={formOpen.anios ? anioForm.id : ""} columns={[{ label: "Año lectivo", value: (item) => item.anio }, { label: "Nombre", value: (item) => item.nombre }]} onEdit={(item) => { setAnioForm({ id: item.id_anio_lectivo, anio: item.anio, nombre: item.nombre || "" }); showForm("anios"); setModuleView("anios", "edit"); clearFeedback(); }} />}
      </section>}

      {activeTab === "niveles" && <section className={`parameter-panel flow-panel view-${view.niveles}`}>
        <div className="parameter-filters"><div><label>Año lectivo</label><select value={nivelForm.idAnio} onChange={(event) => handleNivelAnio(event.target.value)}><option value="">Selecciona un año</option>{anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></div></div>
        <div className="parameter-actions parameter-actions--buttons"><button className="parameter-search-button" type="button" onClick={() => { hideForm("niveles"); setModuleView("niveles", "search"); }}><Search size={17} />Buscar</button><button className="parameter-create" type="button" onClick={() => { setNivelForm((state) => ({ ...state, id: "", nombre: "" })); showForm("niveles"); setModuleView("niveles", "create"); clearFeedback(); }}><Plus size={17} />Crear nivel</button></div>
        {formOpen.niveles && <form className="parameter-form parameter-form-card" onSubmit={submitNivel}>
          <div><label htmlFor="level-year">Año lectivo</label><select id="level-year" value={nivelForm.idAnio} onChange={(event) => handleNivelAnio(event.target.value)} disabled={loading.anios}><option value="">Selecciona un año</option>{anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></div>
          <div><label htmlFor="level-name">Nombre del nivel</label><input id="level-name" placeholder="Ingresa el nivel" value={nivelForm.nombre} onChange={(event) => setNivelForm((state) => ({ ...state, nombre: event.target.value }))} disabled={!nivelForm.idAnio} /></div>
          <button className="parameter-save" type="submit" disabled={loading.save || !nivelForm.idAnio}>{nivelForm.id ? <Pencil size={17} /> : <Plus size={17} />}{loading.save ? "Guardando..." : nivelForm.id ? "Actualizar" : "Crear"}</button>
          <button className="parameter-cancel" type="button" onClick={() => hideForm("niveles")}><RotateCcw size={16} />Cancelar</button>
        </form>}
        <Feedback {...feedback} />{nivelForm.idAnio && <><SearchBox value={search.niveles} onChange={(value) => setSearch((state) => ({ ...state, niveles: value }))} placeholder="Buscar nivel" /><ResultsTable loading={loading.list} items={niveles} query={search.niveles} rowKey={(item) => item.id_nivel} editingId={formOpen.niveles ? nivelForm.id : ""} columns={[{ label: "Año lectivo", value: () => anios.find((year) => String(year.id_anio_lectivo) === String(nivelForm.idAnio))?.anio }, { label: "Nivel", value: (item) => item.nombre }]} onEdit={(item) => { setNivelForm((state) => ({ ...state, id: item.id_nivel, nombre: item.nombre })); showForm("niveles"); clearFeedback(); }} /></>}
      </section>}

      {activeTab === "grados" && <section className={`parameter-panel flow-panel view-${view.grados}`}>
        <div className="parameter-filters"><div><label>Año lectivo</label><select value={gradoForm.idAnio} onChange={(event) => handleGradoAnio(event.target.value)}><option value="">Selecciona un año</option>{anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></div><div><label>Nivel</label><select value={gradoForm.idNivel} onChange={(event) => handleGradoNivel(event.target.value)} disabled={!gradoForm.idAnio}><option value="">Selecciona un nivel</option>{nivelesGrado.map((item) => <option key={item.id_nivel} value={item.id_nivel}>{item.nombre}</option>)}</select></div></div>
        <div className="parameter-actions parameter-actions--buttons"><button className="parameter-search-button" type="button" onClick={() => { hideForm("grados"); setModuleView("grados", "search"); }}><Search size={17} />Buscar</button><button className="parameter-create" type="button" onClick={() => { setGradoForm((state) => ({ ...state, id: "", nombre: "" })); showForm("grados"); setModuleView("grados", "create"); clearFeedback(); }}><Plus size={17} />Crear grado</button></div>
        {formOpen.grados && <form className="parameter-form parameter-form-card" onSubmit={submitGrado}>
          <div><label htmlFor="grade-year">Año lectivo</label><select id="grade-year" value={gradoForm.idAnio} onChange={(event) => handleGradoAnio(event.target.value)} disabled={loading.anios}><option value="">Selecciona un año</option>{anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></div>
          <div><label htmlFor="grade-level">Nivel</label><select id="grade-level" value={gradoForm.idNivel} onChange={(event) => handleGradoNivel(event.target.value)} disabled={!gradoForm.idAnio}><option value="">Selecciona un nivel</option>{nivelesGrado.map((item) => <option key={item.id_nivel} value={item.id_nivel}>{item.nombre}</option>)}</select></div>
          <div><label htmlFor="grade-name">Nombre del grado</label><input id="grade-name" placeholder="Ingresa el grado" value={gradoForm.nombre} onChange={(event) => setGradoForm((state) => ({ ...state, nombre: event.target.value }))} disabled={!gradoForm.idNivel} /></div>
          <button className="parameter-save" type="submit" disabled={loading.save || !gradoForm.idNivel}>{gradoForm.id ? <Pencil size={17} /> : <Plus size={17} />}{loading.save ? "Guardando..." : gradoForm.id ? "Actualizar" : "Crear"}</button>
          <button className="parameter-cancel" type="button" onClick={() => hideForm("grados")}><RotateCcw size={16} />Cancelar</button>
        </form>}
        <Feedback {...feedback} />{gradoForm.idNivel && <><SearchBox value={search.grados} onChange={(value) => setSearch((state) => ({ ...state, grados: value }))} placeholder="Buscar grado" /><ResultsTable loading={loading.list} items={grados} query={search.grados} rowKey={(item) => item.id_grado} editingId={formOpen.grados ? gradoForm.id : ""} columns={[{ label: "Año lectivo", value: () => anios.find((year) => String(year.id_anio_lectivo) === String(gradoForm.idAnio))?.anio }, { label: "Nivel", value: () => nivelesGrado.find((level) => String(level.id_nivel) === String(gradoForm.idNivel))?.nombre }, { label: "Grado", value: (item) => item.nombre }]} onEdit={(item) => { setGradoForm((state) => ({ ...state, id: item.id_grado, nombre: item.nombre })); showForm("grados"); clearFeedback(); }} /></>}
      </section>}

    </main>
  );
}
