import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    const syncLayout = () => {
      if (!window.matchMedia("(max-width: 1024px)").matches) setSidebarOpen(false);
    };

    document.addEventListener("keydown", closeWithEscape);
    window.addEventListener("resize", syncLayout);
    document.body.classList.toggle("has-navigation-open", sidebarOpen);

    return () => {
      document.removeEventListener("keydown", closeWithEscape);
      window.removeEventListener("resize", syncLayout);
      document.body.classList.remove("has-navigation-open");
    };
  }, [sidebarOpen]);

  const toggleMenu = () => {
    if (window.matchMedia("(max-width: 1024px)").matches) setSidebarOpen((current) => !current);
    else setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} />
      <div className={`app-shell__main ${sidebarCollapsed ? "is-expanded" : ""}`}>
        <Header onOpenMenu={toggleMenu} navigationOpen={sidebarOpen} />
        <Outlet />
      </div>
    </div>
  );
}
