import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeGrades } from "./gradeDashboard.js";

const note = (codigo) => ({ valor: { codigo } });
const records = [
  { id_estudiante: 1, competencias: [{ nota_final: note("AD"), bimestres: [{ id_bimestre: 1, nota_bimestre: note("A"), capacidades: [{ nota_bimestre: note("B") }] }, { id_bimestre: 2, nota_bimestre: note("C") }] }] },
  { id_estudiante: 1, competencias: [{ nota_final: null, bimestres: [{ id_bimestre: 1, nota_bimestre: note("B") }] }] },
  { id_estudiante: 2, competencias: [{ nota_final: note("A"), bimestres: [{ id_bimestre: 1, nota_bimestre: { id_valor: null, valor: null } }] }] },
];
test("separates bimesters, excludes blank templates and counts students once", () => {
  const first = summarizeGrades(records, "1");
  assert.equal(first.registered, 2);
  assert.equal(first.expected, 3);
  assert.equal(first.coverage, 67);
  assert.equal(first.achieved, 50);
  assert.equal(first.students, 1);
  assert.equal(first.support, 1);
  assert.equal(first.capacities, 1);
  const second = summarizeGrades(records, 2);
  assert.equal(second.registered, 1);
  assert.equal(second.distribution.C, 1);
});
test("annual metrics use recorded final grades rather than averaging bimesters", () => {
  const annual = summarizeGrades(records, "annual");
  assert.equal(annual.registered, 2);
  assert.equal(annual.students, 2);
  assert.equal(annual.achieved, 100);
  assert.equal(annual.support, 0);
  assert.equal(annual.capacities, 0);
});
test("empty or ungraded templates have no grades", () => {
  assert.equal(summarizeGrades([], 1).hasGrades, false);
  assert.equal(summarizeGrades([{ competencias: [{ bimestres: [{ id_bimestre: 1, nota_bimestre: { id_valor: null } }] }] }], 1).hasGrades, false);
});
test("resolves grade IDs and recognizes capacity-only progress", () => {
  const result = summarizeGrades([{ id_estudiante: 9, competencias: [{ bimestres: [{ id_bimestre: 1, capacidades: [{ nota_bimestre: { id_valor: 7 } }] }] }] }], 1, [{ id_valor: 7, codigo: "A" }]);
  assert.equal(result.hasGrades, true);
  assert.equal(result.registered, 0);
  assert.equal(result.capacities, 1);
  assert.equal(result.students, 1);
});
