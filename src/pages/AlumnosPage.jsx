import { AlumnosCrud } from "../components/configuration/ConfigurationCruds";

export default function AlumnosPage() {
  return <main className="page-content parameters-page">
    <div className="page-heading"><h2>Alumnos</h2><p>Administración de alumnos de la institución</p></div>
    <AlumnosCrud />
  </main>;
}
