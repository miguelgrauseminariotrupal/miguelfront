import { useCallback, useState } from "react";
import AcademicFilters from "../components/academic/AcademicFilters";
import EnrollmentWorkspace from "../components/enrollment/EnrollmentWorkspace";

export default function MatriculaPage() {
  const [selection, setSelection] = useState({ anio: "", nivel: "", grado: "", seccion: "" });
  const handleSelection = useCallback((next) => setSelection(next), []);
  return <main className="page-content enrollment-page">
    <div className="page-heading"><h2>Matrícula</h2><p>Gestión de estudiantes matriculados por sección</p></div>
    <AcademicFilters onSelectionChange={handleSelection} />
    <EnrollmentWorkspace selection={selection} />
  </main>;
}
