import { exportVisible } from "./screenExcel.js";

const records = "table, .student-attendance-list, .enrollment-list, .management-list, .student-roster__list, .competency-list, .academic-tree-desktop, .academic-tree-mobile, .attendance-kpis, .attendance-coverage, .grades-register, .grades-distribution, .agent-message";
const panels = "main > section, .parameter-panel, .enrollment-card, .evaluation-student-panel, .generation-card, .responsible-teacher-card, .home-option-card, .evaluation-teacher, .attendance-responsible-teacher, .evaluation-context, .current-teacher, .teacher-selection";

export function exportBlocks(root) {
  if (!root) return [];
  const blocks = [...root.querySelectorAll(`${records}, ${panels}`)].filter(element => exportVisible(element) && !element.closest("[data-export-ignore], .chat-artifact"));
  // Se prefieren resultados específicos a paneles que contienen esos mismos resultados.
  return blocks.filter(element => !blocks.some(child => child !== element && element.contains(child))).filter(element => {
    if (element.matches("table")) return element.querySelector("tbody tr");
    if (element.matches(".student-attendance-list")) return element.querySelector(".student-attendance-row");
    if (element.matches(".enrollment-list, .management-list")) return element.querySelector("article");
    return (element.textContent || "").trim().length > 0;
  });
}
