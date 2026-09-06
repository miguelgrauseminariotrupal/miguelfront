import { useState } from "react";
import { ProgramacionCursosCrud, ProgramacionSeccionesCrud } from "../components/configuration/ConfigurationCruds";

const tabs = [
  { id: "secciones", label: "Programación de secciones" },
  { id: "cursos", label: "Programación de cursos" },
];

export default function ProgramacionPage() {
  const [activeTab, setActiveTab] = useState("secciones");
  return <main className="page-content parameters-page">
    <div className="page-heading"><h2>Programación</h2><p>Asignación de secciones, cursos y docentes</p></div>
    <div className="parameter-tabs" role="tablist" aria-label="Tipos de programación">
      {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
    </div>
    {activeTab === "secciones" && <ProgramacionSeccionesCrud />}
    {activeTab === "cursos" && <ProgramacionCursosCrud />}
    <p className="parameter-note">La eliminación no está disponible porque la colección Postman no define endpoints DELETE.</p>
  </main>;
}
