export function summarizeGrades(records, period, scale = []) {
  const codeOf = (note) => String(note?.valor?.codigo || scale.find((value) => note?.id_valor != null && String(value.id_valor) === String(note.id_valor))?.codigo || "").trim().toUpperCase();
  const distribution = Object.fromEntries([...new Set(["AD", "A", "B", "C", ...scale.map((item) => item.codigo)])].map((code) => [code, 0]));
  const students = new Set(), support = new Set();
  let expected = 0, registered = 0, capacities = 0;
  for (const record of records) {
    for (const competency of record.competencias || []) {
      const bimestre = competency.bimestres?.find((item) => String(item.id_bimestre) === String(period));
      expected += 1;
      const code = codeOf(period === "annual" ? competency.nota_final : bimestre?.nota_bimestre);
      if (code) {
        registered += 1;
        distribution[code] = (distribution[code] || 0) + 1;
        students.add(String(record.id_estudiante));
        if (["B", "C"].includes(code)) support.add(String(record.id_estudiante));
      }
      if (period !== "annual") for (const capacity of bimestre?.capacidades || []) {
        if (codeOf(capacity.nota_bimestre)) { capacities += 1; students.add(String(record.id_estudiante)); }
      }
    }
  }
  return { expected, registered, capacities, students: students.size, support: support.size, distribution,
    coverage: expected ? Math.round(registered / expected * 100) : 0,
    achieved: registered ? Math.round(((distribution.AD || 0) + (distribution.A || 0)) / registered * 100) : 0,
    hasGrades: registered + capacities > 0 };
}
