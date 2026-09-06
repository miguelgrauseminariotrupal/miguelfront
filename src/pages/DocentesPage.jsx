import { DocentesCrud } from "../components/configuration/ConfigurationCruds";

export default function DocentesPage() {
  return <main className="page-content parameters-page">
    <div className="page-heading"><h2>Docentes</h2><p>Administración de docentes de la institución</p></div>
    <DocentesCrud />
  </main>;
}
