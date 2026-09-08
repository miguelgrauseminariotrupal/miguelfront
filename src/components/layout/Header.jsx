import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const titles = { "/inicio": "Inicio", "/agente-miguel": "Agente Miguel", "/asistencia": "Asistencia", "/evaluaciones": "Evaluaciones", "/configuracion": "Configuración", "/docentes": "Docentes", "/alumnos": "Alumnos", "/matricula": "Matrícula", "/cursos": "Cursos", "/programacion": "Registro Clase" };

export default function Header({ onOpenMenu, sidebarCollapsed }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const close = (event) => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <header className="app-header">
      <div className="app-header__title">
        <button className="menu-button" type="button" aria-label={sidebarCollapsed ? "Expandir menú" : "Ocultar menú"} aria-pressed={sidebarCollapsed} onClick={onOpenMenu}><Menu size={22} /></button>
        <h1>{titles[location.pathname] ?? "Miguel"}</h1>
      </div>
      <div className="user-menu" ref={menuRef}>
        <button className="user-menu__trigger" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          <span className="user-avatar">A</span><span className="user-name">Administrador</span><ChevronDown size={16} />
        </button>
        {menuOpen && <div className="user-menu__dropdown"><button type="button" onClick={handleLogout}><LogOut size={17} />Cerrar sesión</button></div>}
      </div>
    </header>
  );
}
