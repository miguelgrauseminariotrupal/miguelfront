const types = { circular: "pie", circulos: "pie", pastel: "pie", pie: "pie", dona: "doughnut", doughnut: "doughnut", barras: "bar", bar: "bar", lineas: "line", line: "line" };

export function chartType(value, prompt = "") {
  if (value) return types[String(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()] || null;
  const text = prompt.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (/\b(barras?|bar)\b/.test(text)) return "bar";
  if (/\b(lineas?|line)\b/.test(text)) return "line";
  if (/\b(dona|anillo|doughnut)\b/.test(text)) return "doughnut";
  return "pie";
}

export function normalizeChart(output, prompt) {
  const data = output?.grafico || output;
  if (!data || typeof data !== "object") throw new Error("No se recibieron datos para el gráfico.");
  const type = chartType(data.tipo || data.type, prompt);
  if (!type) throw new Error("El tipo de gráfico recibido todavía no está disponible.");
  const points = data.datos || data.data;
  const labels = data.etiquetas || data.labels || (Array.isArray(points) ? points.map(item => item.etiqueta ?? item.label) : null);
  const series = data.series || (Array.isArray(points) ? [{ nombre: "Cantidad", valores: points.map(item => item.valor ?? item.value) }] : [{ nombre: "Cantidad", valores: data.valores || data.values }]);
  if (!Array.isArray(labels) || !labels.length || labels.some(label => typeof label !== "string") || !Array.isArray(series) || !series.length) throw new Error("El gráfico necesita etiquetas y valores.");
  const normalized = series.map(item => ({ name: String(item.nombre || item.name || "Cantidad"), values: item.valores || item.values || item.data }));
  if (normalized.some(item => !Array.isArray(item.values) || item.values.length !== labels.length || item.values.some(value => typeof value !== "number" || !Number.isFinite(value)))) throw new Error("Los valores del gráfico deben ser números y coincidir con sus etiquetas.");
  if (["pie", "doughnut"].includes(type) && (normalized.length !== 1 || normalized[0].values.some(value => value < 0))) throw new Error("El gráfico circular necesita una serie con valores positivos o cero.");
  return { title: String(data.titulo || data.title || "Gráfico"), type, labels, series: normalized };
}

export function normalizeReport(output) {
  const data = output?.reporte || output;
  if (!Array.isArray(data?.columnas) || !data.columnas.length || !Array.isArray(data.filas)) throw new Error("El reporte necesita columnas y filas.");
  const columns = data.columnas.map(column => typeof column === "string" ? { label: column, key: column } : { label: column?.titulo || column?.nombre || column?.label, key: column?.clave || column?.key || column?.campo });
  if (columns.some(column => typeof column.label !== "string" || !column.label || typeof column.key !== "string" || !column.key)) throw new Error("Las columnas del reporte no son válidas.");
  const rows = data.filas.map(row => {
    if (!row || typeof row !== "object" || (Array.isArray(row) && row.length !== columns.length)) throw new Error("Una fila del reporte no coincide con las columnas.");
    return columns.map((column, index) => {
      const value = Array.isArray(row) ? row[index] : row[column.key];
      if (value == null) return "";
      if (!["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) throw new Error("El reporte contiene una celda inválida.");
      return value;
    });
  });
  return { title: String(data.titulo || "Reporte"), columns, rows };
}

export async function reportWorkbook(report) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte");
  sheet.addRow([report.title]);
  if (report.columns.length > 1) sheet.mergeCells(1, 1, 1, report.columns.length);
  sheet.getRow(1).font = { bold: true, size: 16 };
  sheet.addRow(report.columns.map(column => column.label));
  sheet.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174E83" } };
  report.rows.forEach(row => sheet.addRow(row));
  sheet.views = [{ state: "frozen", ySplit: 2 }];
  sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: report.columns.length } };
  sheet.columns.forEach((column, index) => { column.width = Math.min(48, Math.max(14, report.columns[index].label.length + 2)); });
  return workbook.xlsx.writeBuffer();
}
