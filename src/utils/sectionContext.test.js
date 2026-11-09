import test from "node:test";
import assert from "node:assert/strict";
import { sectionEnrollments } from "./sectionContext.js";

test("teacher indicators include only enrollments in the assigned section", () => {
  const rows = [{ id_seccion: 3, id_matricula: 1 }, { id_seccion: 4, id_matricula: 2 }];
  assert.deepEqual(sectionEnrollments(rows, { seccion: "3" }), [rows[0]]);
  assert.equal(sectionEnrollments(rows, {}), rows);
  assert.deepEqual(sectionEnrollments(rows, { seccion: "99" }), []);
});
