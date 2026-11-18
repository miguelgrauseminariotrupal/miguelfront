import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileSpreadsheet, X } from "lucide-react";
import { exportReporteAsistencia } from "../../services/asistencias.service";
import { getProgramacionSecciones } from "../../services/programacionSecciones.service";
import { useAuth } from "../../context/AuthContext";
import "./attendance-report.css";

const dateValue = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

// Secciones activas con año, nivel y grado a partir de las programaciones (una sola llamada).
function toSections(programs) {
  const seen = new Set();
  return programs.map(item => {
    const { seccion: section, grado: grade, nivel: level, anio_lectivo: year } = item;
    if (![section, grade, level, year].every(Boolean) || [section, grade, level, year].some(entity => entity.estado === false)) return null;
    if (seen.has(section.id_seccion)) return null;
    seen.add(section.id_seccion);
    return { id: String(section.id_seccion), year: Number(year.anio), label: `${year.anio} · ${level.nombre} · ${grade.nombre} · ${section.nombre}` };
  }).filter(Boolean).sort((a, b) => b.year - a.year || a.label.localeCompare(b.label, "es"));
}

export default function AttendanceReportButton() {
  const { role, docente } = useAuth();
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState("");
  const today = dateValue(new Date());
  const [start, setStart] = useState(() => `${today.slice(0, 8)}01`);
  const [end, setEnd] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setError(""); setLoading(true);
    const filters = role === "admin" ? {} : { id_docente_responsable: docente?.id_docente };
    (role === "admin" || docente?.id_docente ? getProgramacionSecciones({ ...filters, signal: controller.signal }) : Promise.resolve([]))
      .then(programs => {
        if (controller.signal.aborted) return;
        const mine = role === "admin" ? programs : programs.filter(item => String(item.id_docente_responsable) === String(docente?.id_docente));
        const list = toSections(mine);
        setSections(list);
        setSection(current => list.some(item => item.id === current) ? current : list[0]?.id || "");
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || "No se pudieron cargar las secciones."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, role, docente?.id_docente]);

  useEffect(() => {
    if (!open) return;
    const onKey = event => { if (event.key === "Escape" && !busy) setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const invalid = !section ? "Selecciona una sección." : !start || !end ? "Indica la fecha de inicio y la fecha fin." : start > end ? "La fecha de inicio no puede ser mayor que la fecha fin." : "";

  async function exportReport() {
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError("");
    try {
      const { blob, filename } = await exportReporteAsistencia({ id_seccion: section, fecha_inicio: start, fecha_fin: end });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch (err) { setError(err.message || "No se pudo generar el reporte."); }
    finally { setBusy(false); }
  }

  return <>
    <button className="screen-excel-button" type="button" onClick={() => setOpen(true)} title="Reporte de asistencia por rango de fechas"><FileSpreadsheet size={17} aria-hidden="true" /><span>Reporte</span></button>
    {open && createPortal(<div className="report-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <div className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <header><h2 id="report-modal-title">Reporte de asistencia</h2><button type="button" aria-label="Cerrar" disabled={busy} onClick={() => setOpen(false)}><X size={18} /></button></header>
        <label>Sección
          <select value={section} disabled={loading || busy || !sections.length} onChange={event => setSection(event.target.value)}>
            {loading && <option value="">Cargando secciones…</option>}
            {!loading && !sections.length && <option value="">Sin secciones disponibles</option>}
            {sections.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <div className="report-modal-dates">
          <label>Fecha de inicio<input type="date" value={start} max={end || undefined} disabled={busy} onChange={event => setStart(event.target.value)} /></label>
          <label>Fecha fin<input type="date" value={end} min={start || undefined} disabled={busy} onChange={event => setEnd(event.target.value)} /></label>
        </div>
        <p className="report-modal-hint">El Excel incluye los datos generales (año, nivel, grado, sección y fechas) y la tabla FECHA · ALUMNO · ASISTENCIA.</p>
        {error && <p className="report-modal-error" role="alert">{error}</p>}
        <footer><button type="button" className="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button><button type="button" disabled={busy || loading || Boolean(invalid)} onClick={exportReport}>{busy ? "Generando…" : "Exportar Excel"}</button></footer>
      </div>
    </div>, document.body)}
  </>;
}
