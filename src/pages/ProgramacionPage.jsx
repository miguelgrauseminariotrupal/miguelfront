import { useState } from "react";
import { ProgramacionSeccionesCrud } from "../components/configuration/ConfigurationCruds";
import ResponsibleTeacherSection from "../components/class-detail/ResponsibleTeacherSection";

const tabs = [
  { id: "secciones", label: "Lista de Clase" },
  { id: "cursos", label: "Detalle de clase" },
];

export default function ProgramacionPage() {
  const [activeTab, setActiveTab] = useState("secciones");
  const [detailEnabled, setDetailEnabled] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  return <main className="page-content parameters-page">
    <div className="page-heading"><h2>Registro Clase</h2><p>Asignación de secciones, cursos y docentes</p></div>
    <div className="parameter-tabs" role="tablist" aria-label="Tipos de registro de clase">
      {tabs.map((tab) => { const disabled = tab.id === "cursos" && !detailEnabled; return <button key={tab.id} type="button" role="tab" disabled={disabled} aria-disabled={disabled} aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => !disabled && setActiveTab(tab.id)}>{tab.label}</button>; })}
    </div>
    <div hidden={activeTab !== "secciones"}><ProgramacionSeccionesCrud onEdit={(classRecord) => { setSelectedClass(classRecord); setDetailEnabled(true); setActiveTab("cursos"); return true; }} /></div>
    <div hidden={activeTab !== "cursos"}>{selectedClass && <ResponsibleTeacherSection classRecord={selectedClass} onUpdated={setSelectedClass} />}</div>
  </main>;
}
