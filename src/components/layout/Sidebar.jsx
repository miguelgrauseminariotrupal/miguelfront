import { Bot, BookOpen, CalendarCheck, ClipboardCheck, GraduationCap, Home, ListChecks, ListTree, Presentation, Settings2, UserPlus, Users, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const primaryItems = [
  { label: "Inicio", path: "/inicio", icon: Home },
  { label: "Asistencia", path: "/asistencia", icon: CalendarCheck },
  { label: "Calificaciones", path: "/evaluaciones/calificaciones", icon: ClipboardCheck },
  { label: "Agente académico", path: "/agente-miguel", icon: Bot },
];

const managementItems = [
  { label: "Registro de clases", path: "/programacion", icon: Users },
  { label: "Matrícula", path: "/matricula", icon: UserPlus },
  { label: "Docentes", path: "/docentes", icon: Presentation },
  { label: "Alumnos", path: "/alumnos", icon: GraduationCap },
  { label: "Cursos", path: "/cursos", icon: BookOpen },
  { label: "Asignar cursos", path: "/generar-matricula-curso", icon: ListChecks },
  { label: "Plan de evaluación", path: "/evaluaciones/configuracion", icon: ListTree },
  { label: "Configuración", path: "/configuracion", icon: Settings2 },
];

function NavigationItem({ item, collapsed, onClose }) {
  const Icon = item.icon;
  return <NavLink to={item.path} onClick={onClose} title={collapsed ? item.label : undefined} aria-label={collapsed ? item.label : undefined} className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
    <Icon size={19} strokeWidth={1.8} /><span>{item.label}</span>
  </NavLink>;
}

export default function Sidebar({ open, collapsed, onClose }) {
  const { role } = useAuth();
  const location = useLocation();
  const attendanceOnly = role === "asistencia";
  const visiblePrimary = attendanceOnly ? primaryItems.filter((item) => item.path === "/asistencia") : primaryItems;
  const isManagementRoute = managementItems.some((item) => item.path === location.pathname);

  return <>
    <button className={`sidebar-backdrop ${open ? "is-visible" : ""}`} type="button" aria-label="Cerrar navegación" onClick={onClose} />
    <aside id="main-navigation" className={`sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`} aria-label="Navegación principal">
      <div className="sidebar__brand">
        <img src="/logo.png" alt="" />
        <div><strong>MIGUEL</strong><span>Gestión académica</span></div>
        <button className="sidebar__close" type="button" aria-label="Cerrar menú" onClick={onClose}><X size={20} /></button>
      </div>
      <nav className="sidebar__nav">
        <div className="nav-section">
          {!attendanceOnly && <span className="nav-section__title">Principal</span>}
          {visiblePrimary.map((item) => <NavigationItem key={item.path} item={item} collapsed={collapsed} onClose={onClose} />)}
        </div>
        {!attendanceOnly && <details className="nav-section nav-section--management" open={isManagementRoute}>
          <summary className="nav-section__title"><Settings2 size={15} /><span>Administración</span></summary>
          <div className="nav-section__items">{managementItems.map((item) => <NavigationItem key={item.path} item={item} collapsed={collapsed} onClose={onClose} />)}</div>
        </details>}
      </nav>
      <p className="sidebar__school">I.E. Almirante Miguel Grau Seminario</p>
    </aside>
  </>;
}
