import { useEffect, useState } from "react";
import { getProgramacionSecciones } from "../../services/programacionSecciones.service";
import { getSeccion } from "../../services/secciones.service";
import { getGrado } from "../../services/grados.service";
import { getNivel } from "../../services/niveles.service";
import { getAnioLectivo } from "../../services/aniosLectivos.service";
import AttendanceWorkspace from "./AttendanceWorkspace";

export default function TeacherAttendance({ docente }) {
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const teacherId = docente?.id_docente;

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setSections([]);
    setSelected("");
    setError("");
    setLoading(true);
    async function load() {
      if (!teacherId) return;
      const programs = await getProgramacionSecciones({ id_docente_responsable: teacherId, ...options });
      const ids = [...new Set(programs
        .filter(item => String(item.id_docente_responsable) === String(teacherId))
        .map(item => item.id_seccion))];
      const records = await Promise.all(ids.map(async id => {
        const section = await getSeccion(id, options);
        const grade = await getGrado(section.id_grado, options);
        const level = await getNivel(grade.id_nivel, options);
        const year = await getAnioLectivo(level.id_anio_lectivo, options);
        if ([section, grade, level, year].some(item => item.estado === false)) return null;
        return {
          anio: String(year.id_anio_lectivo), nivel: String(level.id_nivel),
          grado: String(grade.id_grado), seccion: String(section.id_seccion),
          year: Number(year.anio),
          label: `${year.anio} · ${level.nombre} · ${grade.nombre} · ${section.nombre}`,
        };
      }));
      if (controller.signal.aborted) return;
      const assigned = records.filter(Boolean).sort((a, b) => b.year - a.year || a.label.localeCompare(b.label, "es"));
      setSections(assigned);
      setSelected(assigned[0]?.seccion || "");
    }
    load().catch(err => {
      if (!controller.signal.aborted) setError(err.message || "No se pudo cargar tu sección asignada.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [teacherId]);

  if (loading) return <p role="status">Cargando tu sección asignada…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!teacherId) return <p role="status">Tu usuario no está vinculado a un docente. Solicita al administrador que revise la vinculación.</p>;
  if (!sections.length) return <p role="status">No tienes una sección activa asignada como docente responsable. Solicita al administrador que revise la programación de secciones.</p>;
  const selection = sections.find(item => item.seccion === selected);
  return <>
    <section className="academic-filters" aria-label="Sección asignada">
      <div className="academic-field">
        <label htmlFor="teacher-section">{sections.length === 1 ? "Tu sección" : "Tus secciones"}</label>
        <select id="teacher-section" value={selected} onChange={event => setSelected(event.target.value)} disabled={sections.length === 1}>
          {sections.map(item => <option key={item.seccion} value={item.seccion}>{item.label}</option>)}
        </select>
      </div>
    </section>
    {selection && <AttendanceWorkspace selection={selection} />}
  </>;
}
