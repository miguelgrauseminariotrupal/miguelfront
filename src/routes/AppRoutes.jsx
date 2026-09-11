import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import LoginPage from "../pages/LoginPage";
import InicioPage from "../pages/InicioPage";
import AgenteMiguelPage from "../pages/AgenteMiguelPage";
import AsistenciaPage from "../pages/AsistenciaPage";
import EvaluacionesPage from "../pages/EvaluacionesPage";
import ParametrosPage from "../pages/ParametrosPage";
import DocentesPage from "../pages/DocentesPage";
import AlumnosPage from "../pages/AlumnosPage";
import ProgramacionPage from "../pages/ProgramacionPage";
import CursosPage from "../pages/CursosPage";
import MatriculaPage from "../pages/MatriculaPage";

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { role } = useAuth();
  return role === "admin" ? children : <Navigate to="/asistencia" replace />;
}

function PublicRoute() {
  const { isAuthenticated, role } = useAuth();
  return isAuthenticated ? <Navigate to={role === "asistencia" ? "/asistencia" : "/inicio"} replace /> : <LoginPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />} />
      <Route element={<PrivateRoute />}>
        <Route path="/inicio" element={<AdminRoute><InicioPage /></AdminRoute>} />
        <Route path="/agente-miguel" element={<AdminRoute><AgenteMiguelPage /></AdminRoute>} />
        <Route path="/asistencia" element={<AsistenciaPage />} />
        <Route path="/evaluaciones" element={<AdminRoute><EvaluacionesPage /></AdminRoute>} />
        <Route path="/configuracion" element={<AdminRoute><ParametrosPage /></AdminRoute>} />
        <Route path="/docentes" element={<AdminRoute><DocentesPage /></AdminRoute>} />
        <Route path="/alumnos" element={<AdminRoute><AlumnosPage /></AdminRoute>} />
        <Route path="/cursos" element={<AdminRoute><CursosPage /></AdminRoute>} />
        <Route path="/programacion" element={<AdminRoute><ProgramacionPage /></AdminRoute>} />
        <Route path="/matricula" element={<AdminRoute><MatriculaPage /></AdminRoute>} />
        <Route path="/parametros" element={<AdminRoute><Navigate to="/configuracion" replace /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
