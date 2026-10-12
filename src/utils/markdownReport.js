function splitRow(line) {
  const cells = [];
  let cell = "", escaped = false;
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|") && !text.endsWith("\\|")) text = text.slice(0, -1);
  for (const character of text) {
    if (escaped) { cell += character; escaped = false; }
    else if (character === "\\") escaped = true;
    else if (character === "|") { cells.push(cell.trim()); cell = ""; }
    else cell += character;
  }
  cells.push((cell + (escaped ? "\\" : "")).trim());
  return cells;
}

export function markdownReports(text) {
  const lines = text.split(/\r?\n/);
  const reports = [];
  let fenced = false, title = "Reporte";
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (/^(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    if (/^#{1,6}\s/.test(line)) title = line.replace(/^#{1,6}\s+/, "");
    if (!line.includes("|") || !lines[index + 1]) continue;
    const columns = splitRow(line);
    const separator = splitRow(lines[index + 1]);
    if (!columns.every(Boolean) || columns.length !== separator.length || !separator.every(cell => /^:?-{3,}:?$/.test(cell))) continue;
    index += 2;
    const rows = [];
    for (; index < lines.length && lines[index].includes("|"); index++) {
      const row = splitRow(lines[index]);
      if (row.length !== columns.length) break;
      rows.push(row);
    }
    index -= 1;
    reports.push({ titulo: title, columnas: columns, filas: rows });
  }
  return reports;
}

export function asksForReport(prompt = "") {
  return /\b(excel|xlsx|pdf|word|docx|csv|json|txt|html|reporte|reportes|exporta\w*|descarga\w*)\b/i.test(prompt);
}
