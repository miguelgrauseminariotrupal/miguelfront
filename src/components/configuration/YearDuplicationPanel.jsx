import { AlertTriangle, ArrowRight, CheckCircle2, Copy, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { duplicateAnioLectivo } from "../../services/aniosLectivos.service";

const initialOptions = {
  incluirEstructura: true,
  incluirCursos: true,
  incluirCurriculo: true,
  incluirProgramacionSecciones: false,
  incluirProgramacionCursos: false,
};

const optionDefinitions = [
  { key: "incluirEstructura", title: "Estructura académica", detail: "Niveles, grados y secciones", order: "1–3" },
  { key: "incluirCursos", title: "Cursos", detail: "Listado de cursos del año", order: "4" },
  { key: "incluirCurriculo", title: "Currículo", detail: "Aprendizajes, competencias y capacidades", order: "5–7" },
  { key: "incluirProgramacionSecciones", title: "Tutores por sección", detail: "Copia el mismo docente responsable", order: "8", optional: true },
  { key: "incluirProgramacionCursos", title: "Docentes por curso", detail: "Copia cursos y docentes asignados por sección", order: "9", optional: true },
];

const resultDefinitions = [
  ["Niveles", (result) => result.estructura?.niveles],
  ["Grados", (result) => result.estructura?.grados],
  ["Secciones", (result) => result.estructura?.secciones],
  ["Cursos", (result) => result.cursos],
  ["Aprendizajes", (result) => result.curriculo?.aprendizajes],
  ["Competencias", (result) => result.curriculo?.competencias],
  ["Capacidades", (result) => result.curriculo?.capacidades],
  ["Tutores por sección", (result) => result.programacion_secciones],
  ["Docentes por curso", (result) => result.programacion_cursos],
];

function yearLabel(year) {
  return year?.nombre ? `${year.anio} · ${year.nombre}` : year?.anio;
}

export default function YearDuplicationPanel({ years, loadingYears }) {
  const [selection, setSelection] = useState({ origin: "", destination: "" });
  const [options, setOptions] = useState(initialOptions);
  const [reviewing, setReviewing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [diagnostic, setDiagnostic] = useState(null);
  const [result, setResult] = useState(null);

  const origin = useMemo(() => years.find((year) => String(year.id_anio_lectivo) === selection.origin), [years, selection.origin]);
  const destination = useMemo(() => years.find((year) => String(year.id_anio_lectivo) === selection.destination), [years, selection.destination]);
  const selectedCount = Object.values(options).filter(Boolean).length;
  const validSelection = selection.origin && selection.destination && selection.origin !== selection.destination && selectedCount > 0;

  const updateSelection = (key, value) => {
    setSelection((current) => ({ ...current, [key]: value }));
    setReviewing(false);
    setResult(null);
    setFeedback("");
    setDiagnostic(null);
  };

  const toggleOption = (key) => {
    setOptions((current) => {
      const next = { ...current, [key]: !current[key] };
      if (key === "incluirProgramacionCursos" && next[key]) {
        next.incluirProgramacionSecciones = true;
        next.incluirCursos = true;
        next.incluirEstructura = true;
      }
      if (key === "incluirProgramacionSecciones" && next[key]) next.incluirEstructura = true;
      return next;
    });
    setReviewing(false);
    setResult(null);
    setFeedback("");
    setDiagnostic(null);
  };

  const duplicate = async () => {
    setDuplicating(true);
    setFeedback("");
    setDiagnostic(null);
    setResult(null);
    try {
      const response = await duplicateAnioLectivo({
        idAnioOrigen: selection.origin,
        idAnioDestino: selection.destination,
        ...options,
      });
      setResult(response);
      setReviewing(false);
    } catch (error) {
      setFeedback(`${error.message} La operación se detuvo; prueba los bloques por separado para identificar cuál contiene datos incompatibles.`);
      setDiagnostic(error.details || {
        status: error.status || "Sin código",
        response: error.message,
        payload: { id_anio_origen: Number(selection.origin), id_anio_destino: Number(selection.destination), ...options },
      });
    } finally {
      setDuplicating(false);
    }
  };

  const reset = () => {
    setSelection({ origin: "", destination: "" });
    setOptions(initialOptions);
    setReviewing(false);
    setFeedback("");
    setDiagnostic(null);
    setResult(null);
  };

  return <section className="parameter-panel duplication-panel" aria-labelledby="duplication-title">
    <div className="duplication-intro">
      <div className="duplication-intro__icon"><Copy size={22} /></div>
      <div><h3 id="duplication-title">Duplicar configuración anual</h3><p>Copia la estructura académica respetando automáticamente la jerarquía y las relaciones entre registros.</p></div>
    </div>

    <div className="duplication-years">
      <label><span>Año de origen</span><select value={selection.origin} disabled={loadingYears || duplicating} onChange={(event) => updateSelection("origin", event.target.value)}><option value="">Selecciona el año a copiar</option>{years.map((year) => <option key={year.id_anio_lectivo} value={year.id_anio_lectivo} disabled={String(year.id_anio_lectivo) === selection.destination}>{yearLabel(year)}</option>)}</select></label>
      <ArrowRight className="duplication-arrow" aria-hidden="true" />
      <label><span>Año de destino</span><select value={selection.destination} disabled={loadingYears || duplicating} onChange={(event) => updateSelection("destination", event.target.value)}><option value="">Selecciona el año que recibirá los datos</option>{years.map((year) => <option key={year.id_anio_lectivo} value={year.id_anio_lectivo} disabled={String(year.id_anio_lectivo) === selection.origin}>{yearLabel(year)}</option>)}</select></label>
    </div>

    <fieldset className="duplication-options" disabled={duplicating}>
      <legend>¿Qué deseas copiar?</legend>
      {optionDefinitions.map((option) => <label className={options[option.key] ? "is-selected" : ""} key={option.key}>
        <input type="checkbox" checked={options[option.key]} onChange={() => toggleOption(option.key)} />
        <span className="duplication-option__order">{option.order}</span>
        <span><strong>{option.title}{option.optional && <small>Opcional</small>}</strong><span>{option.detail}</span></span>
      </label>)}
    </fieldset>

    {!selectedCount && <p className="duplication-warning"><AlertTriangle size={17} />Selecciona por lo menos un bloque para continuar.</p>}
    {selection.origin && selection.destination && selection.origin === selection.destination && <p className="duplication-warning"><AlertTriangle size={17} />El año de origen y destino deben ser diferentes.</p>}

    {reviewing && <div className="duplication-review" role="alertdialog" aria-labelledby="duplication-review-title">
      <AlertTriangle size={22} />
      <div><strong id="duplication-review-title">Confirma la duplicación</strong><p>Se copiarán {selectedCount} bloques desde <b>{yearLabel(origin)}</b> hacia <b>{yearLabel(destination)}</b>. Los registros que ya existan no se duplicarán.</p></div>
      <div className="duplication-review__actions"><button className="parameter-cancel" type="button" onClick={() => setReviewing(false)}>Volver</button><button className="parameter-save" type="button" disabled={duplicating} onClick={duplicate}><Copy size={16} />{duplicating ? "Duplicando..." : "Confirmar y duplicar"}</button></div>
    </div>}

    {duplicating && <div className="duplication-progress" role="status" aria-live="polite">
      <div className="duplication-progress__heading"><strong>Duplicando configuración...</strong><span>Este proceso puede tardar unos momentos.</span></div>
      <div className="duplication-progress__track" aria-label="Duplicación en curso"><span /></div>
    </div>}

    {!reviewing && !result && <div className="duplication-actions"><button className="parameter-cancel" type="button" onClick={reset}><RotateCcw size={16} />Limpiar</button><button className="parameter-save" type="button" disabled={!validSelection || duplicating} onClick={() => setReviewing(true)}><Copy size={16} />Revisar duplicación</button></div>}
    {feedback && <p className="parameter-feedback is-error" role="alert">{feedback}</p>}
    {diagnostic && <details className="duplication-diagnostic" open>
      <summary><AlertTriangle size={16} />Ver diagnóstico técnico</summary>
      <dl>
        <div><dt>Estado</dt><dd>{diagnostic.status} {diagnostic.statusText}</dd></div>
        <div><dt>ID de solicitud</dt><dd>{diagnostic.requestId || "No proporcionado"}</dd></div>
        <div><dt>Respuesta</dt><dd><code>{diagnostic.response}</code></dd></div>
        <div><dt>Datos enviados</dt><dd><pre>{JSON.stringify(diagnostic.payload, null, 2)}</pre></dd></div>
      </dl>
    </details>}

    {result && <div className="duplication-result" role="status">
      <div className="duplication-result__heading"><CheckCircle2 size={22} /><div><strong>Duplicación completada</strong><span>{yearLabel(origin)} → {yearLabel(destination)}</span></div></div>
      <div className="duplication-result__grid">{resultDefinitions.map(([label, getBlock]) => { const block = getBlock(result); return block && <article key={label}><strong>{label}</strong><span><b>{block.creados ?? 0}</b> creados</span><span>{block.ya_existian ?? 0} ya existían</span><span className={block.omitidos?.length ? "has-omissions" : ""}>{block.omitidos?.length ?? 0} omitidos</span></article>; })}</div>
      <button className="parameter-save" type="button" onClick={reset}>Realizar otra duplicación</button>
    </div>}
  </section>;
}
