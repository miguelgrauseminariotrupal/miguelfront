import test from "node:test";
import assert from "node:assert/strict";
import { sectionEnrollments, sectionPrompt } from "./sectionContext.js";

test("teacher indicators include only enrollments in the assigned section", () => {
  const rows = [{ id_seccion: 3, id_matricula: 1 }, { id_seccion: 4, id_matricula: 2 }];
  assert.deepEqual(sectionEnrollments(rows, { seccion: "3" }), [rows[0]]);
  assert.equal(sectionEnrollments(rows, {}), rows);
  assert.deepEqual(sectionEnrollments(rows, { seccion: "99" }), []);
});
test("teacher chat includes section context without changing admin queries", () => {
  const prompt = sectionPrompt("Consulta asistencia", { anio: "1", nivel: "2", grado: "3", seccion: "4", label: "2026 · Primaria · 3 · A" });
  assert.ok(prompt.startsWith("Consulta asistencia"));
  assert.ok(prompt.includes("sección ID 4"));
  assert.ok(prompt.includes("2026 · Primaria · 3 · A"));
  assert.equal(sectionPrompt("Consulta asistencia"), "Consulta asistencia");
});
