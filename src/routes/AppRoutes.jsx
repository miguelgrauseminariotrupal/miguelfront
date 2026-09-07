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

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/inicio" replace /> : <LoginPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />} />
      <Route element={<PrivateRoute />}>
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/agente-miguel" element={<AgenteMiguelPage />} />
        <Route path="/asistencia" element={<AsistenciaPage />} />
        <Route path="/evaluaciones" element={<EvaluacionesPage />} />
        <Route path="/configuracion" element={<ParametrosPage />} />
        <Route path="/docentes" element={<DocentesPage />} />
        <Route path="/alumnos" element={<AlumnosPage />} />
        <Route path="/cursos" element={<CursosPage />} />
        <Route path="/programacion" element={<ProgramacionPage />} />
        <Route path="/parametros" element={<Navigate to="/configuracion" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
