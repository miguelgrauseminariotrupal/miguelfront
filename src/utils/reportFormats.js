import { reportWorkbook } from "./chatArtifacts.js";

export const REPORT_FORMATS = { xlsx: "Excel", pdf: "PDF", docx: "Word", csv: "CSV", json: "JSON", txt: "Texto", html: "HTML" };
const aliases = { excel: "xlsx", xlsx: "xlsx", pdf: "pdf", word: "docx", docx: "docx", csv: "csv", json: "json", texto: "txt", txt: "txt", html: "html" };

export function requestedFormats(output, prompt = "") {
  const explicit = output?.formatos ?? output?.formato ?? output?.reporte?.formatos ?? output?.reporte?.formato;
  if (explicit != null) {
    const formats = (Array.isArray(explicit) ? explicit : [explicit]).map(value => aliases[String(value).toLowerCase().trim()]);
    if (formats.some(value => !value)) throw new Error("Uno de los formatos solicitados no está disponible. Usa Excel, PDF, Word, CSV, JSON, TXT o HTML.");
    return [...new Set(formats)];
  }
  const matches = prompt.toLowerCase().match(/\b(excel|xlsx|pdf|word|docx|csv|json|texto|txt|html)\b/g);
  return matches ? [...new Set(matches.map(value => aliases[value]))] : ["xlsx"];
}
const escape = text => String(text).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const csvCell = value => {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
};

export async function buildReportFile(report, format) {
  if (!REPORT_FORMATS[format]) throw new Error("Formato no disponible.");
  const headers = report.columns.map(column => column.label);
  let content, mime;
  if (format === "xlsx") {
    content = await reportWorkbook(report);
    mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (format === "csv") {
    content = "\uFEFF" + [headers, ...report.rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    mime = "text/csv;charset=utf-8";
  } else if (format === "json") {
    content = JSON.stringify({ titulo: report.title, columnas: headers, filas: report.rows }, null, 2);
    mime = "application/json;charset=utf-8";
  } else if (format === "txt") {
    content = [report.title, "", headers.join("\t"), ...report.rows.map(row => row.map(value => String(value).replace(/[\r\n\t]/g, " ")).join("\t"))].join("\n");
    mime = "text/plain;charset=utf-8";
  } else if (format === "html") {
    content = `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escape(report.title)}</title><style>body{font:14px Arial;padding:24px}table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#edf3fa}</style><h1>${escape(report.title)}</h1><table><thead><tr>${headers.map(value => `<th>${escape(value)}</th>`).join("")}</tr></thead><tbody>${report.rows.map(row => `<tr>${row.map(value => `<td>${escape(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></html>`;
    mime = "text/html;charset=utf-8";
  } else if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;
    const print = (text, size = 10) => {
      doc.setFontSize(size);
      for (const line of doc.splitTextToSize(text, 175)) {
        if (y > 277) { doc.addPage(); y = 20; }
        doc.text(line, 18, y); y += size * .5 + 2;
      }
    };
    print(report.title, 16);
    print(`${report.rows.length} registros`);
    report.rows.forEach((row, index) => {
      y += 4;
      print(`Registro ${index + 1}`, 11);
      row.forEach((value, column) => print(`${headers[column]}: ${value}`));
    });
    content = doc.output("arraybuffer"); mime = "application/pdf";
  } else {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } = await import("docx");
    const table = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headers, ...report.rows].map((row, index) => new TableRow({ tableHeader: index === 0, children: row.map(value => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(value), bold: index === 0 })] })] })) })) });
    const document = new Document({ sections: [{ children: [new Paragraph({ text: report.title, heading: "Heading1" }), table] }] });
    content = await Packer.toArrayBuffer(document);
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return { content, mime, extension: format };
}
