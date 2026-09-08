import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const toggleMenu = () => {
    if (window.matchMedia("(max-width: 760px)").matches) setSidebarOpen(true);
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
        <Header onOpenMenu={toggleMenu} sidebarCollapsed={sidebarCollapsed} />
        <Outlet />
      </div>
    </div>
  );
}
