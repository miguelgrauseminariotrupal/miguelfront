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
  assert.deepEqual(screenReports(scope, "Tabla")[0].rows, [["Ana"]]);
  scope.querySelector("td").textContent = "Resultado actualizado";
  assert.deepEqual(screenReports(scope, "Tabla")[0].rows, [["Resultado actualizado"]]);
  const slot = document.createElement("div"); slot.setAttribute("data-export-ignore", ""); slot.textContent = "Descargar Excel";
  scope.after(slot);
  assert.deepEqual(exportBlocks(root).map(element => element.id), ["a", "b"]);
});

test("excludes descriptive content and standalone teacher details", () => {
  const { document } = parseHTML('<main><section><p>25 estudiantes</p><table><thead><tr><th>Alumno</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table></section><div class="current-teacher"><strong>Juan Perez</strong></div></main>');
  const root = document.querySelector("main");
  assert.equal(screenReports(root, "Pantalla").length, 1);
  assert.deepEqual(screenReports(document.querySelector(".current-teacher"), "Docente"), []);
  assert.equal(exportBlocks(root).length, 1);
});

test("hidden and empty results are not downloadable targets", () => {
  const { document } = parseHTML('<main><table><tbody></tbody></table><section hidden><div class="management-list"><article>Ana</article></div></section></main>');
  assert.deepEqual(exportBlocks(document.querySelector("main")), []);
});

test("chat tables and ordinary conversations never get automatic downloads", () => {
  const { document } = parseHTML('<main class="agent-page"><article class="agent-message"><p>Respuesta normal</p><table><thead><tr><th>Alumno</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table></article></main>');
  const root = document.querySelector("main");
  assert.deepEqual(exportBlocks(root), []);
  assert.deepEqual(screenReports(root, "Chat"), []);
});

test("exports every loaded report row even when the preview is shorter", () => {
  const { document } = parseHTML('<main><table><thead><tr><th>Alumno</th></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table></main>');
  const table = document.querySelector("table");
  table.setAttribute("data-export-rows", JSON.stringify([["Ana"], ["Luis"], ["Maria"]]));
  assert.equal(screenReports(table, "Reporte")[0].rows.length, 3);
});
