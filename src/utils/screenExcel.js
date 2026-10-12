const text = element => (element?.textContent || "").replace(/\s+/g, " ").trim();
export function exportVisible(element) {
  for (let node = element; node?.nodeType === 1; node = node.parentElement) {
    if (node.hidden || node.getAttribute("aria-hidden") === "true" || node.hasAttribute("data-export-ignore")) return false;
    if (node.tagName === "DETAILS" && !node.open) return false;
    const style = node.ownerDocument.defaultView?.getComputedStyle?.(node);
    if (style?.display === "none" || style?.visibility === "hidden") return false;
  }
  return true;
}
const visibleNodes = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)].filter(element => exportVisible(element) && !element.closest(".agent-page, .agent-message, .agent-markdown, .chat-artifact"));
function valueOf(element) {
  const select = element.querySelector("select");
  if (select) return text(select.selectedOptions?.[0] || select.options?.[select.selectedIndex] || select.querySelector("option[selected]")) || select.value || "";
  const input = element.querySelector('input:not([type="password"]), textarea');
  return input ? input.type === "checkbox" ? (input.checked ? "Sí" : "No") : input.value : text(element);
}

export function screenReports(root, title) {
  if (!root || root.closest?.(".agent-page, .agent-message, .agent-markdown, .chat-artifact")) return [];
  const reports = [];
  const add = (name, columns, rows) => { if (rows.length) reports.push({ title: name, columns: columns.map(label => ({ label, key: label })), rows }); };
  for (const [index, table] of visibleNodes(root, "table").entries()) {
    const headings = [...table.querySelectorAll("thead tr:last-child th")];
    const included = headings.map((cell, index) => ({ cell, index })).filter(({ cell }) => !cell.classList.contains("table-actions") && !/^(acciones|acción)$/i.test(text(cell)));
    if (!included.length) continue;
    const sourceRows = table.getAttribute("data-export-rows");
    const loadedRows = sourceRows ? JSON.parse(sourceRows) : null;
    const rows = Array.isArray(loadedRows) ? loadedRows.map(row => included.map(({ index }) => row[index] ?? "")) : visibleNodes(table, "tbody tr").map(row => {
      const cells = [...row.children].filter(cell => ["TD", "TH"].includes(cell.tagName)).flatMap(cell => [cell, ...Array(Math.max(0, Number(cell.getAttribute("colspan") || 1) - 1)).fill(null)]);
      return included.map(({ index }) => cells[index] ? valueOf(cells[index]) : "");
    });
    add(text(table.querySelector("caption")) || `Tabla ${index + 1}`, included.map(({ cell }) => text(cell)), rows);
  }
  add("Asistencia", ["Alumno", "Documento", "Asistencia"], visibleNodes(root, ".student-attendance-row").map(row => [text(row.querySelector(".student-identity strong")), text(row.querySelector(".student-identity small")), row.querySelector('.student-status [aria-pressed="true"]')?.getAttribute("aria-label") || "Sin registro"]));
  for (const [index, list] of visibleNodes(root, ".enrollment-list, .management-list").entries()) {
    add(`Listado ${index + 1}`, ["Nombre o descripción", "Detalle"], visibleNodes(list, "article").map(row => {
      const main = row.querySelector("strong") || row.querySelector(".management-row-main span") || row.querySelector("span") || row;
      return [text(main), text(row.querySelector("small"))];
    }));
  }
  add("Alumnos consultados", ["Alumno", "Estado"], visibleNodes(root, ".student-roster__list button").map(row => [text(row.querySelector("strong")), text(row.querySelector("small"))]));
  const screen = root.closest("main") || root;
  const student = text(screen.querySelector(".evaluation-current-student strong"));
  add("Competencias", ["Alumno", "Competencia", "Nivel de logro", "Observación"], visibleNodes(root, ".competency-card").map(card => [student, text(card.querySelector(".competency-card__heading > span:nth-child(2) strong")), valueOf(card.querySelector(".competency-achievement") || card), card.querySelector("textarea")?.value || ""]));
  add("Capacidades", ["Alumno", "Competencia", "Capacidad", "Calificación"], visibleNodes(root, ".capacity-row").map(row => [student, text(row.closest(".competency-card")?.querySelector(".competency-card__heading > span:nth-child(2) strong")), text(row.querySelector("strong")), text(row.querySelector(".score-options .is-selected")) || "Sin nota"]));
  add("Plan de evaluación", ["Tipo", "Descripción"], visibleNodes(root, ".tree-row, .mobile-academic-row").map(row => {
    const type = row.classList.contains("tree-row--capacity") ? "Capacidad" : row.classList.contains("tree-row--competency") ? "Competencia" : "Elemento";
    const clone = row.cloneNode(true);
    clone.querySelectorAll("svg, .context-menu, .context-menu-trigger").forEach(node => node.remove());
    return [type, text(clone)];
  }));
  add("Resumen de calificaciones", ["Indicador", "Valor"], visibleNodes(root, ".grades-register > div, .grades-distribution > div").map(row => [text(row.querySelector("dt, span")), text(row.querySelector("dd, strong"))]));
  return reports;
}

export async function screenWorkbook(reports) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  for (const [index, report] of reports.entries()) {
    const name = `${index + 1} ${report.title}`.replace(/[\\/*?:\[\]]/g, " ").slice(0, 31);
    const sheet = book.addWorksheet(name);
    sheet.addRow(report.columns.map(column => column.label));
    report.rows.forEach(row => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174E83" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: report.columns.length } };
    sheet.columns.forEach((column, ci) => {
      column.width = Math.min(60, Math.max(18, report.columns[ci].label.length + 2, ...report.rows.slice(0, 100).map(row => String(row[ci] ?? "").length + 2)));
      column.alignment = { wrapText: true, vertical: "top" };
    });
  }
  return book.xlsx.writeBuffer();
}
