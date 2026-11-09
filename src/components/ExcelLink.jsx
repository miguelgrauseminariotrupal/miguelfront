import { FileSpreadsheet, Download } from "lucide-react";

export default function ExcelLink({ href }) {
  return <a className="chat-excel-link" href={href} target="_blank" rel="noopener noreferrer" aria-label="Abrir archivo Excel"><FileSpreadsheet size={30} aria-hidden="true" /><span><strong>Archivo Excel</strong><small>Abrir o descargar</small></span><Download size={18} aria-hidden="true" /></a>;
}
