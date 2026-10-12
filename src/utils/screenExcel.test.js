import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { screenReports, screenWorkbook } from "./screenExcel.js";
const reports = html => screenReports(parseHTML(`<main>${html}</main>`).document.querySelector("main"), "Prueba");

test("exports tables without actions, excludes hidden rows, and preserves DNI", () => {
  const result = reports('<table><thead><tr><th class="table-actions">Acciones</th><th>DNI</th><th>Alumno</th></tr></thead><tbody><tr><td>Editar</td><td>00123</td><td>Ana</td></tr><tr hidden><td>Editar</td><td>999</td><td>Oculto</td></tr></tbody></table>');
  assert.deepEqual(result[0].rows, [["00123", "Ana"]]);
  assert.deepEqual(result[0].columns.map(column => column.label), ["DNI", "Alumno"]);
});
test("row headings and merged cells retain their column positions", () => {
  const result = reports('<table><thead><tr><th>Periodo</th><th>AD</th><th>A</th></tr></thead><tbody><tr><th>III</th><td>5</td><td>7</td></tr><tr><th>IV</th><td colspan="2">Sin notas</td></tr></tbody></table>');
  assert.deepEqual(result[0].rows, [["III", "5", "7"], ["IV", "Sin notas", ""]]);
});
test("attendance export uses the selected status, not every button", () => {
  const result = reports('<article class="student-attendance-row"><div class="student-identity"><strong>Ana</strong><small>DNI 00123</small></div><div class="student-status"><button aria-pressed="true" aria-label="Presente">P</button><button aria-pressed="false" aria-label="Ausente">A</button></div></article>');
  assert.deepEqual(result[0].rows, [["Ana", "DNI 00123", "Presente"]]);
});
test("empty screens and hidden sections do not produce fake records", () => {
  assert.deepEqual(reports('<h2>Alumnos</h2><p>No hay alumnos</p>'), []);
  assert.deepEqual(reports('<section hidden><div class="management-list"><article><strong>Oculto</strong></article></div></section>'), []);
});
test("exports only data lists and excludes chat messages", async () => {
  const result = reports('<div class="enrollment-list"><article><strong>Ana</strong><small>DNI 00123</small></article></div><article class="agent-message agent-message-user"><div class="agent-markdown">=1+1</div></article>');
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await screenWorkbook(result));
  assert.equal(book.worksheets.length, 1);
  assert.equal(book.worksheets[0].getCell("A2").value, "Ana");
  assert.ok(!JSON.stringify(result).includes("=1+1"));
});
