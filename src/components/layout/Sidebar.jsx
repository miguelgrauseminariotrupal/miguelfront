import { Bot, BookOpen, CalendarCheck, ClipboardCheck, GraduationCap, Home, ListChecks, Presentation, Settings2, SlidersHorizontal, UserPlus, Users, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { label: "Inicio", path: "/inicio", icon: Home },
  { label: "Agente Miguel", path: "/agente-miguel", icon: Bot, featured: true },
  { label: "Asistencia", path: "/asistencia", icon: CalendarCheck },
  { label: "Evaluaciones", path: "/evaluaciones/calificaciones", icon: ClipboardCheck, children: [
    { label: "Calificaciones", path: "/evaluaciones/calificaciones", icon: ListChecks },
    { label: "Configuración", path: "/evaluaciones/configuracion", icon: SlidersHorizontal },
  ] },
  { label: "Configuración", path: "/configuracion", icon: Settings2 },
  { label: "Docentes", path: "/docentes", icon: Presentation },
  { label: "Alumnos", path: "/alumnos", icon: GraduationCap },
  { label: "Matrícula", path: "/matricula", icon: UserPlus },
  { label: "Generar Matrícula - Curso", path: "/generar-matricula-curso", icon: ListChecks },
  { label: "Cursos", path: "/cursos", icon: BookOpen },
  { label: "Registro Clase", path: "/programacion", icon: Users },
];

export default function Sidebar({ open, collapsed, onClose }) {
  const { role } = useAuth();
  const visibleItems = role === "asistencia" ? menuItems.filter(({ path }) => path === "/asistencia") : menuItems;
  return (
    <>
      <button className={`sidebar-backdrop ${open ? "is-visible" : ""}`} type="button" aria-label="Cerrar navegación" onClick={onClose} />
      <aside className={`sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`} aria-label="Navegación principal">
        <div className="sidebar__brand">
          <img src="/logo.png" alt="I.E. Almirante Miguel Grau Seminario" />
          <div><strong>MIGUEL</strong><span>Gestión académica</span></div>
          <button className="sidebar__close" type="button" aria-label="Cerrar menú" onClick={onClose}><X size={20} /></button>
        </div>
        <nav className="sidebar__nav">
          {visibleItems.map(({ label, path, icon: Icon, featured, children }) => <div className="nav-group" key={path}>
            <NavLink to={path} onClick={onClose} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={({ isActive }) => `nav-item ${featured ? "nav-item--featured" : ""} ${isActive && !children ? "is-active" : ""}`}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>{featured && <i aria-hidden="true" />}
            </NavLink>
            {children && <div className="nav-submenu">{children.map(({ label: childLabel, path: childPath, icon: ChildIcon }) => <NavLink key={childPath} to={childPath} onClick={onClose} title={collapsed ? childLabel : undefined} className={({ isActive }) => `nav-item nav-item--sub ${isActive ? "is-active" : ""}`}><ChildIcon size={15} /><span>{childLabel}</span></NavLink>)}</div>}
          </div>)}
        </nav>
        <p className="sidebar__school">I.E. Almirante Miguel<br />Grau Seminario</p>
      </aside>
    </>
  );
}
