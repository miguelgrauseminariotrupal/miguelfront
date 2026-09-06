import { Pencil, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { createAnioLectivo, getAniosLectivos, updateAnioLectivo } from "../services/aniosLectivos.service";
import { createNivel, getNiveles, updateNivel } from "../services/niveles.service";
import { createGrado, getGrados, updateGrado } from "../services/grados.service";
import {
  CursosCrud, SeccionesCrud,
} from "../components/configuration/ConfigurationCruds";

const tabs = [
  { id: "anios", label: "Año lectivo" },
  { id: "niveles", label: "Nivel" },
  { id: "grados", label: "Grado" },
  { id: "secciones", label: "Secciones" },
  { id: "cursos", label: "Cursos" },
];

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
  const [anioForm, setAnioForm] = useState({ id: "", anio: "" });
  const [nivelForm, setNivelForm] = useState({ id: "", idAnio: "", nombre: "" });
  const [gradoForm, setGradoForm] = useState({ id: "", idAnio: "", idNivel: "", nombre: "" });
  const [loading, setLoading] = useState({ anios: true, list: false, save: false });
  const [feedback, setFeedback] = useState({ error: "", success: "" });

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
    if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) {
      return setFeedback({ error: "Ingresa un año lectivo válido de cuatro dígitos.", success: "" });
    }
    const isDuplicate = anios.some((item) => Number(item.anio) === numericYear && String(item.id_anio_lectivo) !== String(anioForm.id));
    if (isDuplicate) return setFeedback({ error: `El año lectivo ${numericYear} ya existe.`, success: "" });
    setLoading((state) => ({ ...state, save: true }));
    try {
      anioForm.id ? await updateAnioLectivo(anioForm.id, numericYear) : await createAnioLectivo(numericYear);
      setFeedback({ error: "", success: anioForm.id ? "Año lectivo actualizado." : "Año lectivo creado." });
      setAnioForm({ id: "", anio: "" }); await loadAnios();
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
      setNivelForm((state) => ({ ...state, id: "", nombre: "" })); await loadNiveles(nivelForm.idAnio);
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
      setGrados(await getGrados(gradoForm.idNivel));
    } catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading((state) => ({ ...state, save: false })); }
  };

  return (
    <main className="page-content parameters-page">
      <div className="page-heading"><h2>Configuración</h2><p>Administración de la estructura y programación académica</p></div>
      <div className="parameter-tabs" role="tablist" aria-label="Tipos de parámetro">
        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => selectTab(tab.id)}>{tab.label}</button>)}
      </div>

      {activeTab === "secciones" && <SeccionesCrud />}
      {activeTab === "cursos" && <CursosCrud />}

      {activeTab === "anios" && <section className="parameter-panel">
        <form className="parameter-form" onSubmit={submitAnio}>
          <div><label htmlFor="parameter-year">Año lectivo</label><input id="parameter-year" type="number" min="1" placeholder="Ingresa el año" value={anioForm.anio} onChange={(event) => setAnioForm((state) => ({ ...state, anio: event.target.value }))} /></div>
          <button className="parameter-save" type="submit" disabled={loading.save}>{anioForm.id ? <Pencil size={17} /> : <Plus size={17} />}{loading.save ? "Guardando..." : anioForm.id ? "Actualizar" : "Crear"}</button>
          {anioForm.id && <button className="parameter-cancel" type="button" onClick={() => setAnioForm({ id: "", anio: "" })}><RotateCcw size={16} />Cancelar</button>}
        </form>
        <Feedback {...feedback} /><div className="parameter-list"><EmptyList loading={loading.anios} items={anios} />{anios.map((item) => <div className={`parameter-row ${String(anioForm.id) === String(item.id_anio_lectivo) ? "is-editing" : ""}`} key={item.id_anio_lectivo}><span>{item.anio}</span><button type="button" onClick={() => { setAnioForm({ id: item.id_anio_lectivo, anio: item.anio }); clearFeedback(); }}><Pencil size={16} />Editar</button></div>)}</div>
      </section>}

      {activeTab === "niveles" && <section className="parameter-panel">
        <form className="parameter-form" onSubmit={submitNivel}>
          <div><label htmlFor="level-year">Año lectivo</label><select id="level-year" value={nivelForm.idAnio} onChange={(event) => handleNivelAnio(event.target.value)} disabled={loading.anios}><option value="">Selecciona un año</option>{anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></div>
          <div><label htmlFor="level-name">Nombre del nivel</label><input id="level-name" placeholder="Ingresa el nivel" value={nivelForm.nombre} onChange={(event) => setNivelForm((state) => ({ ...state, nombre: event.target.value }))} disabled={!nivelForm.idAnio} /></div>
          <button className="parameter-save" type="submit" disabled={loading.save || !nivelForm.idAnio}>{nivelForm.id ? <Pencil size={17} /> : <Plus size={17} />}{loading.save ? "Guardando..." : nivelForm.id ? "Actualizar" : "Crear"}</button>
        </form>
        <Feedback {...feedback} />{nivelForm.idAnio && <div className="parameter-list"><EmptyList loading={loading.list} items={niveles} />{niveles.map((item) => <div className={`parameter-row ${String(nivelForm.id) === String(item.id_nivel) ? "is-editing" : ""}`} key={item.id_nivel}><span>{item.nombre}</span><button type="button" onClick={() => { setNivelForm((state) => ({ ...state, id: item.id_nivel, nombre: item.nombre })); clearFeedback(); }}><Pencil size={16} />Editar</button></div>)}</div>}
      </section>}

      {activeTab === "grados" && <section className="parameter-panel">
        <form className="parameter-form" onSubmit={submitGrado}>
          <div><label htmlFor="grade-year">Año lectivo</label><select id="grade-year" value={gradoForm.idAnio} onChange={(event) => handleGradoAnio(event.target.value)} disabled={loading.anios}><option value="">Selecciona un año</option>{anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}</select></div>
          <div><label htmlFor="grade-level">Nivel</label><select id="grade-level" value={gradoForm.idNivel} onChange={(event) => handleGradoNivel(event.target.value)} disabled={!gradoForm.idAnio}><option value="">Selecciona un nivel</option>{nivelesGrado.map((item) => <option key={item.id_nivel} value={item.id_nivel}>{item.nombre}</option>)}</select></div>
          <div><label htmlFor="grade-name">Nombre del grado</label><input id="grade-name" placeholder="Ingresa el grado" value={gradoForm.nombre} onChange={(event) => setGradoForm((state) => ({ ...state, nombre: event.target.value }))} disabled={!gradoForm.idNivel} /></div>
          <button className="parameter-save" type="submit" disabled={loading.save || !gradoForm.idNivel}>{gradoForm.id ? <Pencil size={17} /> : <Plus size={17} />}{loading.save ? "Guardando..." : gradoForm.id ? "Actualizar" : "Crear"}</button>
        </form>
        <Feedback {...feedback} />{gradoForm.idNivel && <div className="parameter-list"><EmptyList loading={loading.list} items={grados} />{grados.map((item) => <div className={`parameter-row ${String(gradoForm.id) === String(item.id_grado) ? "is-editing" : ""}`} key={item.id_grado}><span>{item.nombre}</span><button type="button" onClick={() => { setGradoForm((state) => ({ ...state, id: item.id_grado, nombre: item.nombre })); clearFeedback(); }}><Pencil size={16} />Editar</button></div>)}</div>}
      </section>}

      <p className="parameter-note">La eliminación no está disponible porque la colección Postman no define endpoints DELETE.</p>
    </main>
  );
}
