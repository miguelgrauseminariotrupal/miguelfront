import test from "node:test";
import assert from "node:assert/strict";
import { markdownReports, asksForReport } from "./markdownReport.js";

test("extracts real markdown tables preserving identifiers and escaped pipes", () => {
  assert.deepEqual(markdownReports("## Asistencia\n| DNI | Alumno |\n| --- | :---: |\n| 00123 | Ana \\| Luis |\n"), [{ titulo: "Asistencia", columnas: ["DNI", "Alumno"], filas: [["00123", "Ana | Luis"]] }]);
});
test("does not invent a report from refusals or code blocks", () => {
  assert.deepEqual(markdownReports("No puedo generar archivos Excel directamente aquí"), []);
  assert.deepEqual(markdownReports("```\n| A | B |\n| --- | --- |\n| 1 | 2 |\n```"), []);
  assert.equal(asksForReport("Dame el reporte en Excel"), true);
  assert.equal(asksForReport("Hola"), false);
});
