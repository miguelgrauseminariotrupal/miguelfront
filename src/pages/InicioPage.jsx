import { Bot, CalendarCheck, ChevronRight, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

const shortcuts = [
  { title: "Registrar asistencia", description: "Selecciona una sección y registra el día.", path: "/asistencia", icon: CalendarCheck },
  { title: "Ingresar calificaciones", description: "Consulta y administra las evaluaciones.", path: "/evaluaciones/calificaciones", icon: ClipboardCheck },
  { title: "Consultar al agente", description: "Obtén ayuda sobre la gestión académica.", path: "/agente-miguel", icon: Bot },
];

export default function InicioPage() {
  return <main className="page-content home-page">
    <header className="home-intro"><span>Gestión académica</span><h2>¿Qué deseas hacer?</h2><p>Accede rápidamente a las tareas principales del colegio.</p></header>
    <nav className="home-actions" aria-label="Acciones principales">
      {shortcuts.map(({ title, description, path, icon: Icon }) => <Link to={path} key={path}><Icon size={21} /><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={18} /></Link>)}
    </nav>
  </main>;
}
