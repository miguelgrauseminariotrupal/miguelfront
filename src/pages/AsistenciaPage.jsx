import { useCallback, useState } from "react";
import AcademicFilters from "../components/academic/AcademicFilters";
import AttendanceWorkspace from "../components/attendance/AttendanceWorkspace";
import TeacherAttendance from "../components/attendance/TeacherAttendance";
import { useAuth } from "../context/AuthContext";

export default function AsistenciaPage() {
  const { role, docente } = useAuth();
  const [selection, setSelection] = useState({ anio: "", nivel: "", grado: "", seccion: "" });
  const handleSelection = useCallback((nextSelection) => setSelection(nextSelection), []);

  return <main className="page-content attendance-page"><div className="page-heading"><h2>Asistencia</h2><p>Gestión de asistencia académica</p></div>{role === "admin" ? <><AcademicFilters onSelectionChange={handleSelection} /><AttendanceWorkspace selection={selection} /></> : <TeacherAttendance docente={docente} />}</main>;
}
