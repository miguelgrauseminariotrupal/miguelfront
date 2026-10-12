import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { screenReports, screenWorkbook } from "../../utils/screenExcel";
import "./screen-excel.css";

export default function DownloadScreenExcel({ scope, title: blockTitle, label = "Descargar Excel" }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const location = useLocation();
  async function download() {
    setBusy(true); setFeedback(null);
    try {
      const root = scope || document.querySelector(".app-shell__main main");
      const title = blockTitle || document.querySelector(".app-header h1")?.textContent || "Reporte";
      const reports = screenReports(root, title);
      if (!reports.length) { setFeedback({ route: location.pathname, text: "Carga o consulta información en esta pantalla antes de descargar." }); return; }
      const content = await screenWorkbook(reports);
      const url = URL.createObjectURL(new Blob([content], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      link.download = `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")}-${date}.xlsx`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setFeedback({ route: location.pathname, text: "No se pudo generar el Excel. Intenta nuevamente." }); }
    finally { setBusy(false); }
  }
  return <div className="screen-excel" data-export-ignore><button className="screen-excel-button" type="button" disabled={busy} onClick={download} title={scope ? "Descargar todos los resultados cargados en este bloque" : "Descargar toda la información cargada en esta pantalla"}><Download size={16} /><span>{busy ? "Preparando…" : label}</span></button>{feedback?.route === location.pathname && <div className="screen-excel-feedback" role="status">{feedback.text}<button type="button" aria-label="Cerrar aviso de descarga" onClick={() => setFeedback(null)}>×</button></div>}</div>;
}
