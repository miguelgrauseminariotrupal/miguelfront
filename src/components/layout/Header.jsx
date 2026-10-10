import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const titles = { "/inicio": "Inicio", "/agente-miguel": "Agente Miguel", "/asistencia": "Asistencia", "/evaluaciones": "Evaluaciones", "/evaluaciones/calificaciones": "Calificaciones", "/evaluaciones/configuracion": "Plan de evaluación", "/generar-matricula-curso": "Generar Matrícula - Curso", "/configuracion": "Configuración", "/docentes": "Docentes", "/alumnos": "Alumnos", "/matricula": "Matrícula", "/cursos": "Cursos", "/programacion": "Registro Clase" };

export default function Header({ onOpenMenu, navigationOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userFullName } = useAuth();
  const displayName = userFullName || "Usuario";

  useEffect(() => {
    const close = (event) => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <header className="app-header">
      <div className="app-header__title">
        <button className="menu-button" type="button" aria-label="Abrir o contraer menú principal" aria-expanded={navigationOpen} aria-controls="main-navigation" onClick={onOpenMenu}><Menu size={22} /></button>
        <h1>{titles[location.pathname] ?? "Miguel"}</h1>
      </div>
      <div className="user-menu" ref={menuRef}>
        <button className="user-menu__trigger" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          <span className="user-avatar">{displayName.charAt(0).toUpperCase()}</span><span className="user-name" title={displayName}>{displayName}</span><ChevronDown size={16} />
        </button>
        {menuOpen && <div className="user-menu__dropdown"><button type="button" onClick={handleLogout}><LogOut size={17} />Cerrar sesión</button></div>}
      </div>
    </header>
  );
}
