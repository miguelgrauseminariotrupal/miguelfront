import { Pencil, Plus, RotateCcw, Search } from "lucide-react";
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

function CrudPanel({ initial, createValues, canOperate = true, showActions = true, autoShowResults = false, resultsTrigger = "", onEditItem, load, save, idOf, labelOf, columns, filters, renderFields, editValues, validate, noun }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  useEffect(() => {
    if (autoShowResults && resultsTrigger) {
      setFormOpen(false);
      setResultsVisible(true);
    }
  }, [autoShowResults, resultsTrigger]);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setItems(await load()); }
    catch (error) { setFeedback({ error: error.message, success: "" }); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { refresh(); }, [refresh]);
  const change = (event) => setForm((state) => ({ ...state, [event.target.name]: event.target.value }));
  const reset = () => { setForm(initial); setFormOpen(false); setResultsVisible(true); };
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
  const gridColumns = columns || [{ label: "Nombre", value: labelOf }];
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredItems = items.filter((item) => !normalizedQuery || gridColumns.some((column) => text(column.value(item)).toLocaleLowerCase("es").includes(normalizedQuery)));
  const panelMode = formOpen ? (form.id ? "edit" : "create") : (resultsVisible ? "search" : "idle");
  return <section className={`parameter-panel flow-panel view-${panelMode}`}>
    {filters}
    {showActions && <div className="parameter-actions parameter-actions--buttons"><button className="parameter-search-button" type="button" disabled={!canOperate} onClick={() => { setFormOpen(false); setResultsVisible(true); }}><Search size={17} />Buscar</button><button className="parameter-create" type="button" disabled={!canOperate} onClick={() => { setForm(createValues ? createValues() : initial); setFormOpen(true); setResultsVisible(false); setFeedback({ error: "", success: "" }); }}><Plus size={17} />Crear {noun.toLocaleLowerCase("es")}</button></div>}
    {resultsVisible && <label className="parameter-search"><Search size={17} /><span className="sr-only">Buscar</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${noun.toLocaleLowerCase("es")}`} /></label>}
    {formOpen && <form className="parameter-form configuration-form parameter-form-card" onSubmit={submit}>
      {renderFields(form, change)}
      <button className="parameter-save" type="submit" disabled={saving}><>{form.id ? <Pencil size={17} /> : <Plus size={17} />}{saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}</></button>
      <button className="parameter-cancel" type="button" onClick={reset}><RotateCcw size={16} />Cancelar</button>
    </form>}
    {feedback.error && <p className="parameter-feedback is-error" role="alert">{feedback.error}</p>}
    {feedback.success && <p className="parameter-feedback is-success" role="status">{feedback.success}</p>}
    {resultsVisible && <div className="parameter-table-wrap configuration-list">
      {loading && <p className="parameter-empty">Cargando...</p>}
      {!loading && !filteredItems.length && <p className="parameter-empty">No se encontraron registros.</p>}
      {!loading && filteredItems.length > 0 && <table className="parameter-table"><thead><tr>{gridColumns.map((column) => <th key={column.label}>{column.label}</th>)}<th>Acciones</th></tr></thead><tbody>
        {filteredItems.map((item) => <tr className={formOpen && text(form.id) === text(idOf(item)) ? "is-editing" : ""} key={idOf(item)}>{gridColumns.map((column) => <td key={column.label}>{column.value(item) || "—"}</td>)}<td><button type="button" onClick={() => { if (onEditItem?.(item) === true) return; setForm(editValues(item)); setFormOpen(true); setResultsVisible(true); setFeedback({ error: "", success: "" }); }}><Pencil size={15} />Editar</button></td></tr>)}
      </tbody></table>}
    </div>}
  </section>;
}

export function SeccionesCrud() {
  const [options, setOptions] = useState({ anios: [], niveles: [], grados: [] });
  const [selection, setSelection] = useState({ anio: "", nivel: "" });
  useEffect(() => { getAniosLectivos().then((anios) => setOptions((s) => ({ ...s, anios }))).catch(() => {}); }, []);
  const initial = { id: "", idAnio: "", idNivel: "", id_grado: "", nombre: "", estado: "true" };
  const load = useCallback(() => Promise.resolve([]), []);
  const [selectedGrade, setSelectedGrade] = useState("");
  const actualLoad = useCallback(() => getSecciones(selectedGrade), [selectedGrade]);
  const filterAnio = async (event) => { const anio = event.target.value; setSelection({ anio, nivel: "" }); setSelectedGrade(""); setOptions((state) => ({ ...state, niveles: [], grados: [] })); const niveles = anio ? await getNiveles(anio) : []; setOptions((state) => ({ ...state, niveles })); };
  const filterNivel = async (event) => { const nivel = event.target.value; setSelection((state) => ({ ...state, nivel })); setSelectedGrade(""); setOptions((state) => ({ ...state, grados: [] })); const grados = nivel ? await getGrados(nivel) : []; setOptions((state) => ({ ...state, grados })); };
  void load;
  const render = (form, change) => {
    const changeAnio = async (e) => { change(e); setSelection({ anio: e.target.value, nivel: "" }); setOptions((s) => ({ ...s, niveles: [], grados: [] })); const niveles = e.target.value ? await getNiveles(e.target.value) : []; setOptions((s) => ({ ...s, niveles })); };
    const changeNivel = async (e) => { change(e); setSelection((s) => ({ ...s, nivel: e.target.value })); setOptions((s) => ({ ...s, grados: [] })); const grados = e.target.value ? await getGrados(e.target.value) : []; setOptions((s) => ({ ...s, grados })); };
    const changeGrado = (e) => { change(e); setSelectedGrade(e.target.value); };
    return <><Field label="Año lectivo" name="idAnio" value={form.idAnio} onChange={changeAnio}>{options.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field>
      <Field label="Nivel" name="idNivel" value={form.idNivel} onChange={changeNivel} disabled={!form.idAnio}>{options.niveles.map((x) => <option key={x.id_nivel} value={x.id_nivel}>{x.nombre}</option>)}</Field>
      <Field label="Grado" name="id_grado" value={form.id_grado} onChange={changeGrado} disabled={!form.idNivel}>{options.grados.map((x) => <option key={x.id_grado} value={x.id_grado}>{x.nombre}</option>)}</Field>
      <Field label="Sección" name="nombre" value={form.nombre} onChange={change} placeholder="Ej. A" />{form.id && <StateField value={form.estado} onChange={change} />}</>;
  };
  return <CrudPanel initial={initial} load={actualLoad} idOf={(x) => x.id_seccion} labelOf={(x) => `${x.nombre}${x.estado === false ? " · Inactiva" : ""}`} noun="Sección"
    canOperate={Boolean(selectedGrade)}
    createValues={() => ({ ...initial, idAnio: selection.anio, idNivel: selection.nivel, id_grado: selectedGrade })}
    filters={<div className="parameter-filters"><Field label="Año lectivo" name="filterAnio" value={selection.anio} onChange={filterAnio}>{options.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field><Field label="Nivel" name="filterNivel" value={selection.nivel} onChange={filterNivel} disabled={!selection.anio}>{options.niveles.map((x) => <option key={x.id_nivel} value={x.id_nivel}>{x.nombre}</option>)}</Field><Field label="Grado" name="filterGrado" value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)} disabled={!selection.nivel}>{options.grados.map((x) => <option key={x.id_grado} value={x.id_grado}>{x.nombre}</option>)}</Field></div>}
    columns={[{ label: "Año lectivo", value: () => options.anios.find((x) => text(x.id_anio_lectivo) === text(selection.anio))?.anio }, { label: "Nivel", value: () => options.niveles.find((x) => text(x.id_nivel) === text(selection.nivel))?.nombre }, { label: "Grado", value: () => options.grados.find((x) => text(x.id_grado) === text(selectedGrade))?.nombre }, { label: "Sección", value: (x) => x.nombre }]}
    validate={(f) => !f.id_grado || !f.nombre.trim() ? "Selecciona el grado e ingresa el nombre de la sección." : ""}
    save={(f) => f.id ? updateSeccion(f.id, f.id_grado, f.nombre, f.estado === "true") : createSeccion(f.id_grado, f.nombre)}
    editValues={(x) => ({ ...initial, id: x.id_seccion, idAnio: selection.anio, idNivel: selection.nivel, id_grado: text(x.id_grado), nombre: text(x.nombre), estado: String(booleanValue(x.estado)) })} renderFields={render} />;
}

export function CursosCrud() {
  const [anios, setAnios] = useState([]); const [filter, setFilter] = useState("");
  useEffect(() => { getAniosLectivos().then(setAnios).catch(() => {}); }, []);
  const initial = { id: "", id_anio_lectivo: "", nombre: "", estado: "true" };
  return <CrudPanel initial={initial} load={useCallback(() => getCursos(filter), [filter])} idOf={(x) => x.id_curso} labelOf={(x) => `${x.nombre}${x.estado === false ? " · Inactivo" : ""}`} noun="Curso"
    canOperate={Boolean(filter)} createValues={() => ({ ...initial, id_anio_lectivo: filter })}
    filters={<div className="parameter-filters"><Field label="Año lectivo" name="filterCursoAnio" value={filter} onChange={(event) => setFilter(event.target.value)}>{anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field></div>}
    columns={[{ label: "Año lectivo", value: (x) => anios.find((year) => text(year.id_anio_lectivo) === text(x.id_anio_lectivo || filter))?.anio }, { label: "Nombre", value: (x) => x.nombre }, { label: "Estado", value: (x) => booleanValue(x.estado) ? "Activo" : "Inactivo" }]}
    validate={(f) => !f.id_anio_lectivo || !f.nombre.trim() ? "Selecciona el año lectivo e ingresa el curso." : ""}
    save={(f) => f.id ? updateCurso(f.id, f.id_anio_lectivo, f.nombre, f.estado === "true") : createCurso(f.id_anio_lectivo, f.nombre)}
    editValues={(x) => ({ id: x.id_curso, id_anio_lectivo: text(x.id_anio_lectivo), nombre: text(x.nombre), estado: String(booleanValue(x.estado)) })}
    renderFields={(f, change) => <>{f.id && <Field label="Año lectivo" name="id_anio_lectivo" value={f.id_anio_lectivo} onChange={change}>{anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field>}<Field label="Nombre" name="nombre" value={f.nombre} onChange={change} placeholder="Ej. Matemática" />{f.id && <StateField value={f.estado} onChange={change} />}</>} />;
}

const personInitial = { id: "", nombres: "", apellido_paterno: "", apellido_materno: "", dni: "", correo: "", telefono: "", fecha_nacimiento: "", id_usuario: "", indUsuario: "true", estado: "true" };
const personFields = (f, change, teacher) => <><Field label="Nombres" name="nombres" value={f.nombres} onChange={change} /><Field label="Apellido paterno" name="apellido_paterno" value={f.apellido_paterno} onChange={change} /><Field label="Apellido materno" name="apellido_materno" value={f.apellido_materno} onChange={change} /><Field label="DNI" name="dni" value={f.dni} onChange={change} />{teacher ? <><Field label="Correo" name="correo" type="email" value={f.correo} onChange={change} />{f.id && <Field label="Teléfono" name="telefono" required={false} value={f.telefono} onChange={change} />}{!f.id && <Field label="Crear usuario" name="indUsuario" value={f.indUsuario} onChange={change}><option value="true">Sí</option><option value="false">No</option></Field>}</> : <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" value={f.fecha_nacimiento} onChange={change} />}{f.id && <StateField value={f.estado} onChange={change} />}</>;
const personEdit = (x, id) => ({ ...personInitial, ...x, id: x[id], estado: String(booleanValue(x.estado)), indUsuario: "true", fecha_nacimiento: text(x.fecha_nacimiento).slice(0, 10) });

export function DocentesCrud() { return <CrudPanel initial={personInitial} load={useCallback(() => getDocentes(), [])} idOf={(x) => x.id_docente} labelOf={personName} noun="Docente" columns={[{ label: "Nombres", value: (x) => x.nombres }, { label: "Apellido paterno", value: (x) => x.apellido_paterno }, { label: "Apellido materno", value: (x) => x.apellido_materno }, { label: "DNI", value: (x) => x.dni }, { label: "Correo", value: (x) => x.correo }, { label: "Teléfono", value: (x) => x.telefono }, { label: "Estado", value: (x) => booleanValue(x.estado) ? "Activo" : "Inactivo" }]} validate={(f) => !f.nombres.trim() || !f.apellido_paterno.trim() || !f.dni.trim() || !f.correo.trim() ? "Completa nombres, apellido paterno, DNI y correo." : ""} save={(f) => f.id ? updateDocente(f.id, f) : createDocente(f)} editValues={(x) => personEdit(x, "id_docente")} renderFields={(f, c) => personFields(f, c, true)} />; }
export function AlumnosCrud() { return <CrudPanel initial={personInitial} load={useCallback(() => getAlumnos(), [])} idOf={(x) => x.id_estudiante} labelOf={personName} noun="Alumno" columns={[{ label: "Nombres", value: (x) => x.nombres }, { label: "Apellido paterno", value: (x) => x.apellido_paterno }, { label: "Apellido materno", value: (x) => x.apellido_materno }, { label: "DNI", value: (x) => x.dni }, { label: "Fecha de nacimiento", value: (x) => text(x.fecha_nacimiento).slice(0, 10) }, { label: "Estado", value: (x) => booleanValue(x.estado) ? "Activo" : "Inactivo" }]} validate={(f) => !f.nombres.trim() || !f.apellido_paterno.trim() || !f.dni.trim() || !f.fecha_nacimiento ? "Completa nombres, apellido paterno, DNI y fecha de nacimiento." : ""} save={(f) => f.id ? updateAlumno(f.id, f) : createAlumno(f)} editValues={(x) => personEdit(x, "id_estudiante")} renderFields={(f, c) => personFields(f, c, false)} />; }

export function ProgramacionSeccionesCrud({ onEdit }) {
  const [docentes, setDocentes] = useState([]);
  const [academic, setAcademic] = useState({ anios: [], niveles: [], grados: [], secciones: [], anio: "", nivel: "", grado: "" });
  useEffect(() => { Promise.all([getDocentes(), getAniosLectivos()]).then(([docentesResult, anios]) => { setDocentes(docentesResult); setAcademic((state) => ({ ...state, anios })); }).catch(() => {}); }, []);
  const changeAnio = async (event) => { const anio = event.target.value; const niveles = anio ? await getNiveles(anio) : []; setAcademic((state) => ({ ...state, anio, nivel: "", grado: "", niveles, grados: [], secciones: [] })); };
  const changeNivel = async (event) => { const nivel = event.target.value; const grados = nivel ? await getGrados(nivel) : []; setAcademic((state) => ({ ...state, nivel, grado: "", grados, secciones: [] })); };
  const changeGrado = async (event) => { const grado = event.target.value; const secciones = grado ? await getSecciones(grado) : []; setAcademic((state) => ({ ...state, grado, secciones })); };
  const initial = { id: "", id_seccion: "", id_docente_responsable: "", estado_completado: "false" };
  const loadFiltered = useCallback(async () => {
    if (!academic.grado) return [];
    const [records, courseAssignments] = await Promise.all([getProgramacionSecciones(), getProgramacionCursos({ estado: true })]);
    const anio = academic.anios.find((item) => text(item.id_anio_lectivo) === text(academic.anio));
    const nivel = academic.niveles.find((item) => text(item.id_nivel) === text(academic.nivel));
    const grado = academic.grados.find((item) => text(item.id_grado) === text(academic.grado));
    return academic.secciones.map((seccion) => {
      const record = records.find((item) => text(item.id_seccion) === text(seccion.id_seccion));
      const hasResponsibleTeacher = Boolean(record?.id_docente_responsable);
      const hasActiveCourse = Boolean(record?.id_programacion_seccion) && courseAssignments.some((item) => item.estado !== false && text(item.id_programacion_seccion) === text(record.id_programacion_seccion));
      return { ...record, estado_completado: hasResponsibleTeacher && hasActiveCourse, row_key: seccion.id_seccion, id_seccion: seccion.id_seccion, seccion, academic_context: { anio, nivel, grado, seccion } };
    });
  }, [academic.anio, academic.nivel, academic.grado, academic.anios, academic.niveles, academic.grados, academic.secciones]);
  return <CrudPanel initial={initial} load={loadFiltered} idOf={(x) => x.row_key} noun="Registro de sección" canOperate={Boolean(academic.grado)} showActions={false} autoShowResults resultsTrigger={academic.grado} onEditItem={onEdit}
    filters={<div className="parameter-filters"><Field label="Año lectivo" name="registroAnio" value={academic.anio} onChange={changeAnio}>{academic.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field><Field label="Nivel" name="registroNivel" value={academic.nivel} onChange={changeNivel} disabled={!academic.anio}>{academic.niveles.map((x) => <option key={x.id_nivel} value={x.id_nivel}>{x.nombre}</option>)}</Field><Field label="Grado" name="registroGrado" value={academic.grado} onChange={changeGrado} disabled={!academic.nivel}>{academic.grados.map((x) => <option key={x.id_grado} value={x.id_grado}>{x.nombre}</option>)}</Field></div>}
    columns={[{ label: "Sección", value: (x) => x.seccion?.nombre }, { label: "Docente responsable", value: (x) => personName(x.docente_responsable || x.docente || {}) || (docentes.find((item) => text(item.id_docente) === text(x.id_docente_responsable)) ? personName(docentes.find((item) => text(item.id_docente) === text(x.id_docente_responsable))) : "Sin asignar") }, { label: "Estado", value: (x) => x.estado_completado ? "Completado" : "Pendiente" }]}
    validate={(f) => !f.id_seccion || !f.id_docente_responsable ? "Selecciona la sección y el docente responsable." : ""} save={(f) => f.id ? updateProgramacionSeccion(f.id, f.id_seccion, f.id_docente_responsable, f.estado_completado === "true") : createProgramacionSeccion(f.id_seccion, f.id_docente_responsable)} editValues={(x) => ({ ...initial, id: x.id_programacion_seccion, id_seccion: text(x.id_seccion), id_docente_responsable: text(x.id_docente_responsable), estado_completado: String(Boolean(x.estado_completado)) })} renderFields={(f, c) => <><Field label="Sección" name="id_seccion" value={f.id_seccion} onChange={c}>{academic.secciones.map((x) => <option key={x.id_seccion} value={x.id_seccion}>{x.nombre}</option>)}</Field><Field label="Docente responsable" name="id_docente_responsable" value={f.id_docente_responsable} onChange={c}>{docentes.map((x) => <option key={x.id_docente} value={x.id_docente}>{personName(x)}</option>)}</Field>{f.id && <Field label="Estado" name="estado_completado" value={f.estado_completado} onChange={c}><option value="false">Pendiente</option><option value="true">Completado</option></Field>}</>} />;
}

export function ProgramacionCursosCrud() {
  const [options, setOptions] = useState({ programaciones: [], docentes: [], anios: [], cursos: [] });
  useEffect(() => { Promise.all([getProgramacionSecciones(), getDocentes(), getAniosLectivos()]).then(([programaciones, docentes, anios]) => setOptions({ programaciones, docentes, anios, cursos: [] })).catch(() => {}); }, []);
  const initial = { id: "", id_programacion_seccion: "", id_curso: "", id_docente: "", idAnio: "", estado: "true" };
  return <CrudPanel initial={initial} load={useCallback(() => getProgramacionCursos(), [])} idOf={(x) => x.id_programacion_curso} noun="Programación de curso" labelOf={(x) => `Programación #${x.id_programacion_curso} · ${x.curso?.nombre || `Curso ${x.id_curso}`} · ${personName(x.docente || {}) || `Docente ${x.id_docente}`}`} validate={(f) => !f.id_programacion_seccion || !f.id_curso || !f.id_docente ? "Selecciona la programación de sección, el curso y el docente." : ""} save={(f) => f.id ? updateProgramacionCurso(f.id, f) : createProgramacionCurso(f.id_programacion_seccion, f.id_curso, f.id_docente)} editValues={(x) => ({ ...initial, id: x.id_programacion_curso, id_programacion_seccion: text(x.id_programacion_seccion), id_curso: text(x.id_curso), id_docente: text(x.id_docente), estado: String(booleanValue(x.estado)) })} renderFields={(f, c) => <><Field label="Programación de sección" name="id_programacion_seccion" value={f.id_programacion_seccion} onChange={c}>{options.programaciones.map((x) => <option key={x.id_programacion_seccion} value={x.id_programacion_seccion}>#{x.id_programacion_seccion} · Sección {x.seccion?.nombre || x.id_seccion}</option>)}</Field><Field label="Año lectivo" name="idAnio" value={f.idAnio} onChange={async (e) => { c(e); const cursos = e.target.value ? await getCursos(e.target.value) : []; setOptions((s) => ({ ...s, cursos })); }}>{options.anios.map((x) => <option key={x.id_anio_lectivo} value={x.id_anio_lectivo}>{x.anio}</option>)}</Field><Field label="Curso" name="id_curso" value={f.id_curso} onChange={c} disabled={!f.idAnio && !f.id}>{options.cursos.map((x) => <option key={x.id_curso} value={x.id_curso}>{x.nombre}</option>)}</Field><Field label="Docente" name="id_docente" value={f.id_docente} onChange={c}>{options.docentes.map((x) => <option key={x.id_docente} value={x.id_docente}>{personName(x)}</option>)}</Field>{f.id && <StateField value={f.estado} onChange={c} />}</>} />;
}
