import { exportVisible } from "./screenExcel.js";

const records = "table, .student-attendance-list, .enrollment-list, .management-list, .student-roster__list, .competency-list, .academic-tree-desktop, .academic-tree-mobile, .grades-register, .grades-distribution";

export function exportBlocks(root) {
  if (!root) return [];
  const blocks = [...root.querySelectorAll(records)].filter(element => exportVisible(element) && !element.closest("[data-export-ignore], .agent-page, .agent-message, .chat-artifact"));
  // Se prefieren resultados específicos a paneles que contienen esos mismos resultados.
  return blocks.filter(element => !blocks.some(child => child !== element && element.contains(child))).filter(element => {
    if (element.matches("table")) return element.querySelector("tbody tr");
    if (element.matches(".student-attendance-list")) return element.querySelector(".student-attendance-row");
    if (element.matches(".enrollment-list, .management-list")) return element.querySelector("article");
    return (element.textContent || "").trim().length > 0;
  });
}
