import AcademicFilters from "../components/academic/AcademicFilters";

export default function EvaluacionesPage() {
  return <main className="page-content"><div className="page-heading"><h2>Calificaciones</h2><p>Gestión y seguimiento de calificaciones por estudiante</p></div><AcademicFilters /><div className="empty-module"><p>La estructura académica está disponible. El registro de notas se habilitará cuando la API publique los endpoints de evaluaciones.</p></div></main>;
}
