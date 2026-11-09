export function isExcelUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && /\.(xlsx?|xlsm|xlsb)(?:$|[?&#/])/i.test(decodeURIComponent(url.pathname + url.search + url.hash));
  } catch { return false; }
}

export function excelLinks(output, excelTool = false) {
  const links = new Set();
  function visit(value, depth = 0) {
    if (depth > 8) return;
    if (typeof value === "string") {
      if (isExcelUrl(value) || (excelTool && /^https?:\/\/[^\s]+$/i.test(value))) links.add(value);
    } else if (value && typeof value === "object") Object.values(value).forEach(item => visit(item, depth + 1));
  }
  visit(output);
  return [...links];
}
