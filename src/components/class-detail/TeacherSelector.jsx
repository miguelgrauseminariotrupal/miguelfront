import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDocentes } from "../../services/docentes.service";

export const teacherFullName = (teacher = {}) => [teacher.nombres, teacher.apellido_paterno, teacher.apellido_materno].filter(Boolean).join(" ");

export default function TeacherSelector({ onCancel, onConfirm, confirmLabel = "Asignar docente" }) {
  const [teachers, setTeachers] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getDocentes().then(setTeachers).catch(() => setError("No se pudieron cargar los docentes.")).finally(() => setLoading(false)); }, []);
  const results = useMemo(() => { const term = query.trim().toLocaleLowerCase("es"); return term ? teachers.filter((teacher) => teacherFullName(teacher).toLocaleLowerCase("es").includes(term)) : teachers; }, [teachers, query]);
  const confirm = async () => { if (!selected) return; setSaving(true); try { await onConfirm(selected); } finally { setSaving(false); } };

  return <div className="teacher-picker">
    <label className="teacher-search"><Search size={17} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); }} placeholder="Buscar docente por nombre o apellido" /></label>
    <div className="teacher-results">{loading && <p>Cargando docentes...</p>}{error && <p>{error}</p>}{!loading && !error && results.map((teacher) => <button type="button" className={selected?.id_docente === teacher.id_docente ? "is-selected" : ""} key={teacher.id_docente} onClick={() => setSelected(teacher)}><span>{teacherFullName(teacher)}</span>{selected?.id_docente === teacher.id_docente && <Check size={17} />}</button>)}{!loading && !error && !results.length && <p>No se encontraron docentes.</p>}</div>
    {selected && <div className="teacher-selection"><small>Docente seleccionado</small><strong>{teacherFullName(selected)}</strong></div>}
    <div className="teacher-picker__actions"><button type="button" className="parameter-cancel" onClick={onCancel}><X size={16} />Cancelar</button><button type="button" className="parameter-save" disabled={!selected || saving} onClick={confirm}>{saving ? "Guardando..." : confirmLabel}</button></div>
  </div>;
}
