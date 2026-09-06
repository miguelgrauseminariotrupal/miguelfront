import { useCallback, useState } from "react";
import AcademicFilters from "../components/academic/AcademicFilters";
import AttendanceWorkspace from "../components/attendance/AttendanceWorkspace";

export default function AsistenciaPage() {
  const [selection, setSelection] = useState({ anio: "", nivel: "", grado: "", seccion: "" });
  const handleSelection = useCallback((nextSelection) => setSelection(nextSelection), []);

  return <main className="page-content attendance-page"><div className="page-heading"><h2>Asistencia</h2><p>Gestión de asistencia académica</p></div><AcademicFilters onSelectionChange={handleSelection} /><AttendanceWorkspace selection={selection} /></main>;
}
