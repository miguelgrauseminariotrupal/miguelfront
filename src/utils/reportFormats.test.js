import test from "node:test";
import assert from "node:assert/strict";
import { requestedFormats, buildReportFile } from "./reportFormats.js";
import { normalizeReport } from "./chatArtifacts.js";

test("requested formats use backend priority and detect multiple formats", () => {
  assert.deepEqual(requestedFormats({}, "Dame el reporte en PDF y Word"), ["pdf", "docx"]);
  assert.deepEqual(requestedFormats({ formato: "csv" }, "PDF"), ["csv"]);
  assert.deepEqual(requestedFormats({}, "Genera un reporte"), ["xlsx"]);
  assert.throws(() => requestedFormats({ formato: "exe" }));
});
const report = normalizeReport({ titulo: "Asistencia", columnas: ["Alumno", "Cantidad"], filas: [["Ana Pérez", 3], ["=1+1", 2], ["<script>alert(1)</script>", 0]] });
test("text formats preserve all rows and escape executable content", async () => {
  const csv = await buildReportFile(report, "csv");
  assert.ok(csv.content.includes('"\'=1+1"'));
  const json = await buildReportFile(report, "json");
  assert.deepEqual(JSON.parse(json.content).filas, report.rows);
  const html = await buildReportFile(report, "html");
  assert.ok(html.content.includes("&lt;script&gt;"));
  assert.ok(!html.content.includes("<script>"));
  assert.ok((await buildReportFile(report, "txt")).content.includes("Ana Pérez\t3"));
});
test("PDF and Word are real binary documents", async () => {
  const pdf = await buildReportFile(report, "pdf");
  assert.equal(Buffer.from(pdf.content).subarray(0, 4).toString(), "%PDF");
  const word = await buildReportFile(report, "docx");
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(word.content);
  const xml = await zip.file("word/document.xml").async("string");
  assert.ok(xml.includes("Ana Pérez"));
  assert.ok(xml.includes("Asistencia"));
  assert.ok(xml.includes("&lt;script&gt;"));
});
