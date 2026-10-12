import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { exportBlocks } from "./exportBlocks.js";
import { screenReports } from "./screenExcel.js";

test("creates individual targets for each loaded table and list", () => {
  const { document } = parseHTML('<main><section><table id="a"><thead><tr><th>Nombre</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table><div id="b" class="enrollment-list"><article><strong>Luis</strong></article></div></section></main>');
  const root = document.querySelector("main");
  assert.deepEqual(exportBlocks(root).map(element => element.id), ["a", "b"]);
  const scope = document.querySelector("#a");
  assert.deepEqual(screenReports(scope, "Tabla")[1].rows, [["Ana"]]);
  scope.querySelector("td").textContent = "Resultado actualizado";
  assert.deepEqual(screenReports(scope, "Tabla")[1].rows, [["Resultado actualizado"]]);
  const slot = document.createElement("div"); slot.setAttribute("data-export-ignore", ""); slot.textContent = "Descargar Excel";
  scope.after(slot);
  assert.deepEqual(exportBlocks(root).map(element => element.id), ["a", "b"]);
});

test("informational content exports alongside tables and scoped cards", () => {
  const { document } = parseHTML('<main><section><p>Sección A: 25 estudiantes</p><table><thead><tr><th>Alumno</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table></section><div class="current-teacher"><small>Docente responsable actual</small><strong>Juan Perez</strong></div></main>');
  const root = document.querySelector("main");
  const result = screenReports(root, "Pantalla");
  assert.ok(result.find(report => report.title === "Contenido").rows.some(row => row[0].includes("25 estudiantes")));
  const scope = document.querySelector(".current-teacher");
  assert.ok(screenReports(scope, "Docente")[1].rows[0][0].includes("Juan Perez"));
});

test("hidden and empty results are not downloadable targets", () => {
  const { document } = parseHTML('<main><table><tbody></tbody></table><section hidden><div class="management-list"><article>Ana</article></div></section></main>');
  assert.deepEqual(exportBlocks(document.querySelector("main")), []);
});

test("exports every loaded report row even when the preview is shorter", () => {
  const { document } = parseHTML('<main><table><thead><tr><th>Alumno</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table></main>');
  const table = document.querySelector("table");
  table.setAttribute("data-export-rows", JSON.stringify([["Ana"], ["Luis"], ["Maria"]]));
  assert.equal(screenReports(table, "Reporte")[1].rows.length, 3);
});
