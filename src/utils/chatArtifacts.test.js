import test from "node:test";
import assert from "node:assert/strict";
import { chartType, normalizeChart, normalizeReport, reportWorkbook } from "./chatArtifacts.js";

test("chart defaults and explicit/requested types", () => {
  assert.equal(chartType(), "pie");
  assert.equal(chartType(null, "Dame un gráfico de líneas"), "line");
  assert.equal(chartType("circular", "barras"), "pie");
  assert.equal(chartType("radar"), null);
});
test("chart validates numbers, matching labels and circular values", () => {
  assert.equal(normalizeChart({ etiquetas: ["A"], valores: [3] }).type, "pie");
  assert.throws(() => normalizeChart({ etiquetas: ["A"], valores: ["3"] }));
  assert.throws(() => normalizeChart({ etiquetas: ["A"], valores: [] }));
  assert.throws(() => normalizeChart({ etiquetas: ["A"], valores: [-3] }));
  assert.equal(normalizeChart({ etiquetas: ["A"], valores: [-3], tipo: "barras" }).series[0].values[0], -3);
});
test("report preserves column order, blanks and typed cells", () => {
  assert.deepEqual(normalizeReport({ columnas: [{ titulo: "Alumno", clave: "nombre" }, { titulo: "Nota", clave: "nota" }], filas: [{ nota: 3, nombre: "Ana" }, { nombre: "Luis", nota: null }] }).rows, [["Ana", 3], ["Luis", ""]]);
  assert.throws(() => normalizeReport({ columnas: ["A"], filas: [[1, 2]] }));
  assert.throws(() => normalizeReport({ columnas: ["A"], filas: [[{}]] }));
});
test("xlsx roundtrip keeps all rows, numbers, and formula-like text", async () => {
  const { default: ExcelJS } = await import("exceljs");
  const report = normalizeReport({ titulo: "Reporte", columnas: ["Alumno", "Cantidad"], filas: [["=1+1", 2], ["Ana", 4]] });
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await reportWorkbook(report));
  const sheet = book.worksheets[0];
  assert.equal(sheet.getCell("A2").value, "Alumno");
  assert.equal(sheet.getCell("A3").value, "=1+1");
  assert.equal(sheet.getCell("B4").value, 4);
  assert.equal(sheet.rowCount, 4);
});
