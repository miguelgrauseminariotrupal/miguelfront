import { CursosCrud } from "../components/configuration/ConfigurationCruds";

export default function CursosPage() {
  return <main className="page-content">
    <div className="page-heading"><h2>Cursos</h2><p>Administración de cursos por año lectivo</p></div>
    <CursosCrud />
  </main>;
}
