import { Pencil, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getAniosLectivos } from "../../services/aniosLectivos.service";
import { getNiveles } from "../../services/niveles.service";
import { getGrados } from "../../services/grados.service";
import { createSeccion, getSecciones, updateSeccion } from "../../services/secciones.service";
import { createCurso, getCursos, updateCurso } from "../../services/cursos.service";
import { createDocente, getDocentes, updateDocente } from "../../services/docentes.service";
import { createAlumno, getAlumnos, updateAlumno } from "../../services/alumnos.service";
import { createProgramacionSeccion, getProgramacionSecciones, updateProgramacionSeccion } from "../../services/programacionSecciones.service";
import { createProgramacionCurso, getProgramacionCursos, updateProgramacionCurso } from "../../services/programacionCursos.service";

const text = (value) => value == null ? "" : String(value);
const personName = (item) => [item.nombres, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(" ");
const booleanValue = (value) => value === undefined || value === null ? true : Boolean(value);

function Field({ label, name, value, onChange, type = "text", required = true, children, disabled = false, placeholder = "" }) {
  const props = { id: `config-${name}`, name, value, onChange, disabled, required };
  return <div><label htmlFor={props.id}>{label}</label>{children
    ? <select {...props}><option value="">Selecciona una opción</option>{children}</select>
    : <input {...props} type={type} placeholder={placeholder} />}</div>;
}

function StateField({ value, onChange }) {
  return <Field label="Estado" name="estado" value={String(value)} onChange={onChange}>
    <option value="true">Activo</option><option value="false">Inactivo</option>
  </Field>;
}

function CrudPanel({ initial, load, save, idOf, labelOf, renderFields, editValues, validate, noun }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setItems(await load()); }
    catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { refresh(); }, [refresh]);
  const change = (event) => setForm((state) => ({ ...state, [event.target.name]: event.target.value }));
  const reset = () => setForm(initial);
  const submit = async (event) => {
    event.preventDefault();
    const error = validate?.(form);
    if (error) return setFeedback({ error, success: "" });
    setSaving(true); setFeedback({ error: "", success: "" });
    try {
      await save(form);
      setFeedback({ error: "", success: `${noun} ${form.id ? "actualizado" : "creado"} correctamente.` });
      reset(); await refresh();
    } catch (requestError) { setFeedback({ error: requestError.message, success: "" }); }
    finally { setSaving(false); }
  };
  return <section className="parameter-panel">
    <form className="parameter-form configuration-form" onSubmit={submit}>
      {renderFields(form, change)}
      <button className="parameter-save" type="submit" disabled={saving}><>{form.id ? <Pencil size={17} /> : <Plus size={17} />}{saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}</></button>
      {form.id && <button className="parameter-cancel" type="button" onClick={reset}><RotateCcw size={16} />Cancelar</button>}
    </form>
    {feedback.error && <p className="parameter-feedback is-error" role="alert">{feedback.error}</p>}
    {feedback.success && <p className="parameter-feedback is-success" role="status">{feedback.success}</p>}
    <div className="parameter-list configuration-list">
      {loading && <p className="parameter-empty">Cargando...</p>}
      {!loading && !items.length && <p className="parameter-empty">No hay registros para mostrar.</p>}
      {items.map((item) => <div className={`parameter-row ${text(form.id) === text(idOf(item)) ? "is-editing" : ""}`} key={idOf(item)}>
        <span>{labelOf(item)}</span><button type="button" onClick={() => { setForm(editValues(item)); setFeedback({ error: "", success: "" }); }}><Pencil size={16} />Editar</button>
      </div>)}
    </div>
  </section>;
}

export function SeccionesCrud() {
  const [options, setOptions] = useState({ anios: [], niveles: [], grados: [] });
  useEffect(() => { getAniosLectivos().then((anios) => setOptions((s) => ({ ...s, anios }))).catch(() => {}); }, []);
  const initial = { id: "", idAnio: "", idNivel: "", id_grado: "", nombre: "", estado: "true" };
  const load = useCallback(() => Promise.resolve([]), []);
  const [selectedGrade, setSelectedGrade] = useState("");
  const actualLoad = useCallback(() => getSecciones(selectedGrade), [selectedGrade]);
  void load;
  const render = (form, change) => {
    const changeAnio = async (e) => { change(e); setOptions((s) => ({ ...s, niveles: [], grados: [] })); const niveles = e.target.value ? await getNiveles(e.target.value) : []; setOptions((s) => ({ ...s, niveles })); };
    const changeNivel = async (e) => { change(e); setOptions((s) => ({ ...s, grados: [] })); const grados = e.target.value ? await getGrados(e.target.value) : []; setOptions((s) => ({ ...s, grados })); };
    const changeGrado = (e) => { change(e); setSelectedGrade(e.target.value); };
    return <><Field label="Año lectivo" name="idAnio" value={form.idAnio} onChange={changeAnio}>{options.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field>
      <Field label="Nivel" name="idNivel" value={form.idNivel} onChange={changeNivel} disabled={!form.idAnio}>{options.niveles.map((x) => <option key={x.id_nivel} value={x.id_nivel}>{x.nombre}</option>)}</Field>
      <Field label="Grado" name="id_grado" value={form.id_grado} onChange={changeGrado} disabled={!form.idNivel}>{options.grados.map((x) => <option key={x.id_grado} value={x.id_grado}>{x.nombre}</option>)}</Field>
      <Field label="Sección" name="nombre" value={form.nombre} onChange={change} placeholder="Ej. A" />{form.id && <StateField value={form.estado} onChange={change} />}</>;
  };
  return <CrudPanel initial={initial} load={actualLoad} idOf={(x) => x.id_seccion} labelOf={(x) => `${x.nombre}${x.estado === false ? " · Inactiva" : ""}`} noun="Sección"
    validate={(f) => !f.id_grado || !f.nombre.trim() ? "Selecciona el grado e ingresa el nombre de la sección." : ""}
    save={(f) => f.id ? updateSeccion(f.id, f.id_grado, f.nombre, f.estado === "true") : createSeccion(f.id_grado, f.nombre)}
    editValues={(x) => ({ ...initial, id: x.id_seccion, id_grado: text(x.id_grado), nombre: text(x.nombre), estado: String(booleanValue(x.estado)) })} renderFields={render} />;
}

export function CursosCrud() {
  const [anios, setAnios] = useState([]); const [filter, setFilter] = useState("");
  useEffect(() => { getAniosLectivos().then(setAnios).catch(() => {}); }, []);
  const initial = { id: "", id_anio_lectivo: "", nombre: "", estado: "true" };
  return <CrudPanel initial={initial} load={useCallback(() => getCursos(filter), [filter])} idOf={(x) => x.id_curso} labelOf={(x) => `${x.nombre}${x.estado === false ? " · Inactivo" : ""}`} noun="Curso"
    validate={(f) => !f.id_anio_lectivo || !f.nombre.trim() ? "Selecciona el año lectivo e ingresa el curso." : ""}
    save={(f) => f.id ? updateCurso(f.id, f.id_anio_lectivo, f.nombre, f.estado === "true") : createCurso(f.id_anio_lectivo, f.nombre)}
    editValues={(x) => ({ id: x.id_curso, id_anio_lectivo: text(x.id_anio_lectivo), nombre: text(x.nombre), estado: String(booleanValue(x.estado)) })}
    renderFields={(f, change) => <><Field label="Año lectivo" name="id_anio_lectivo" value={f.id_anio_lectivo} onChange={(e) => { change(e); setFilter(e.target.value); }}>{anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field><Field label="Nombre" name="nombre" value={f.nombre} onChange={change} placeholder="Ej. Matemática" />{f.id && <StateField value={f.estado} onChange={change} />}</>} />;
}

const personInitial = { id: "", nombres: "", apellido_paterno: "", apellido_materno: "", dni: "", correo: "", telefono: "", fecha_nacimiento: "", id_usuario: "", indUsuario: "true", estado: "true" };
const personFields = (f, change, teacher) => <><Field label="Nombres" name="nombres" value={f.nombres} onChange={change} /><Field label="Apellido paterno" name="apellido_paterno" value={f.apellido_paterno} onChange={change} /><Field label="Apellido materno" name="apellido_materno" value={f.apellido_materno} onChange={change} /><Field label="DNI" name="dni" value={f.dni} onChange={change} />{teacher ? <><Field label="Correo" name="correo" type="email" value={f.correo} onChange={change} />{f.id && <Field label="Teléfono" name="telefono" required={false} value={f.telefono} onChange={change} />}{!f.id && <Field label="Crear usuario" name="indUsuario" value={f.indUsuario} onChange={change}><option value="true">Sí</option><option value="false">No</option></Field>}</> : <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" value={f.fecha_nacimiento} onChange={change} />}{f.id && <StateField value={f.estado} onChange={change} />}</>;
const personEdit = (x, id) => ({ ...personInitial, ...x, id: x[id], estado: String(booleanValue(x.estado)), indUsuario: "true", fecha_nacimiento: text(x.fecha_nacimiento).slice(0, 10) });

export function DocentesCrud() { return <CrudPanel initial={personInitial} load={useCallback(() => getDocentes(), [])} idOf={(x) => x.id_docente} labelOf={(x) => `${personName(x)} · ${x.dni || "Sin DNI"}`} noun="Docente" validate={(f) => !f.nombres.trim() || !f.apellido_paterno.trim() || !f.dni.trim() || !f.correo.trim() ? "Completa nombres, apellido paterno, DNI y correo." : ""} save={(f) => f.id ? updateDocente(f.id, f) : createDocente(f)} editValues={(x) => personEdit(x, "id_docente")} renderFields={(f, c) => personFields(f, c, true)} />; }
export function AlumnosCrud() { return <CrudPanel initial={personInitial} load={useCallback(() => getAlumnos(), [])} idOf={(x) => x.id_estudiante} labelOf={(x) => `${personName(x)} · ${x.dni || "Sin DNI"}`} noun="Alumno" validate={(f) => !f.nombres.trim() || !f.apellido_paterno.trim() || !f.dni.trim() || !f.fecha_nacimiento ? "Completa nombres, apellido paterno, DNI y fecha de nacimiento." : ""} save={(f) => f.id ? updateAlumno(f.id, f) : createAlumno(f)} editValues={(x) => personEdit(x, "id_estudiante")} renderFields={(f, c) => personFields(f, c, false)} />; }

export function ProgramacionSeccionesCrud() {
  const [docentes, setDocentes] = useState([]); useEffect(() => { getDocentes().then(setDocentes).catch(() => {}); }, []);
  const initial = { id: "", id_seccion: "", id_docente_responsable: "", estado: "true" };
  return <CrudPanel initial={initial} load={useCallback(() => getProgramacionSecciones(), [])} idOf={(x) => x.id_programacion_seccion} noun="Programación de sección" labelOf={(x) => `Programación #${x.id_programacion_seccion} · Sección ${x.seccion?.nombre || x.id_seccion} · ${personName(x.docente_responsable || x.docente || {}) || `Docente ${x.id_docente_responsable}`}`} validate={(f) => !f.id_seccion || !f.id_docente_responsable ? "Ingresa la sección y selecciona el docente responsable." : ""} save={(f) => f.id ? updateProgramacionSeccion(f.id, f.id_seccion, f.id_docente_responsable, f.estado === "true") : createProgramacionSeccion(f.id_seccion, f.id_docente_responsable)} editValues={(x) => ({ ...initial, id: x.id_programacion_seccion, id_seccion: text(x.id_seccion), id_docente_responsable: text(x.id_docente_responsable), estado: String(booleanValue(x.estado)) })} renderFields={(f, c) => <><Field label="ID de sección" name="id_seccion" type="number" value={f.id_seccion} onChange={c} /><Field label="Docente responsable" name="id_docente_responsable" value={f.id_docente_responsable} onChange={c}>{docentes.map((x) => <option key={x.id_docente} value={x.id_docente}>{personName(x)}</option>)}</Field>{f.id && <StateField value={f.estado} onChange={c} />}</>} />;
}

export function ProgramacionCursosCrud() {
  const [options, setOptions] = useState({ programaciones: [], docentes: [], anios: [], cursos: [] });
  useEffect(() => { Promise.all([getProgramacionSecciones(), getDocentes(), getAniosLectivos()]).then(([programaciones, docentes, anios]) => setOptions({ programaciones, docentes, anios, cursos: [] })).catch(() => {}); }, []);
  const initial = { id: "", id_programacion_seccion: "", id_curso: "", id_docente: "", idAnio: "", estado: "true" };
  return <CrudPanel initial={initial} load={useCallback(() => getProgramacionCursos(), [])} idOf={(x) => x.id_programacion_curso} noun="Programación de curso" labelOf={(x) => `Programación #${x.id_programacion_curso} · ${x.curso?.nombre || `Curso ${x.id_curso}`} · ${personName(x.docente || {}) || `Docente ${x.id_docente}`}`} validate={(f) => !f.id_programacion_seccion || !f.id_curso || !f.id_docente ? "Selecciona la programación de sección, el curso y el docente." : ""} save={(f) => f.id ? updateProgramacionCurso(f.id, f) : createProgramacionCurso(f.id_programacion_seccion, f.id_curso, f.id_docente)} editValues={(x) => ({ ...initial, id: x.id_programacion_curso, id_programacion_seccion: text(x.id_programacion_seccion), id_curso: text(x.id_curso), id_docente: text(x.id_docente), estado: String(booleanValue(x.estado)) })} renderFields={(f, c) => <><Field label="Programación de sección" name="id_programacion_seccion" value={f.id_programacion_seccion} onChange={c}>{options.programaciones.map((x) => <option key={x.id_programacion_seccion} value={x.id_programacion_seccion}>#{x.id_programacion_seccion} · Sección {x.seccion?.nombre || x.id_seccion}</option>)}</Field><Field label="Año lectivo" name="idAnio" value={f.idAnio} onChange={async (e) => { c(e); const cursos = e.target.value ? await getCursos(e.target.value) : []; setOptions((s) => ({ ...s, cursos })); }}>{options.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field><Field label="Curso" name="id_curso" value={f.id_curso} onChange={c} disabled={!f.idAnio && !f.id}>{options.cursos.map((x) => <option key={x.id_curso} value={x.id_curso}>{x.nombre}</option>)}</Field><Field label="Docente" name="id_docente" value={f.id_docente} onChange={c}>{options.docentes.map((x) => <option key={x.id_docente} value={x.id_docente}>{personName(x)}</option>)}</Field>{f.id && <StateField value={f.estado} onChange={c} />}</>} />;
}
