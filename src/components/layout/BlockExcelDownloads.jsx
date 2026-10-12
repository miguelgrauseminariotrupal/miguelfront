import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import DownloadScreenExcel from "./DownloadScreenExcel";
import { exportBlocks } from "../../utils/exportBlocks";

export default function BlockExcelDownloads({ containerRef }) {
  const { pathname } = useLocation();
  const [targets, setTargets] = useState([]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const hosts = new Map();
    let sequence = 0, frame;
    function sync() {
      const main = container.querySelector("main");
      const blocks = exportBlocks(main);
      let changed = false;
      for (const [element, entry] of hosts) {
        if (!blocks.includes(element) || !entry.host.isConnected) {
          entry.host.remove(); hosts.delete(element); changed = true;
        }
      }
      for (const element of blocks) {
        if (hosts.has(element)) continue;
        const host = document.createElement("div");
        host.className = "block-excel-download";
        host.setAttribute("data-export-ignore", "");
        // Inserta fuera de tablas y listas para conservar su estructura.
        element.after(host);
        const heading = element.querySelector("caption, h2, h3, h4")?.textContent || element.closest("section, article")?.querySelector("h2, h3, h4")?.textContent || main?.querySelector("h2")?.textContent || "Resultados";
        hosts.set(element, { id: `${pathname}-${sequence++}`, scope: element, host, title: heading.trim() });
        changed = true;
      }
      if (changed) setTargets([...hosts.values()]);
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(sync); };
    const observer = new MutationObserver(mutations => {
      if (mutations.every(mutation => mutation.target.closest?.("[data-export-ignore]"))) return;
      schedule();
    });
    observer.observe(container, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "hidden", "open"] });
    sync();
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      hosts.forEach(entry => entry.host.remove());
    };
  }, [containerRef, pathname]);
  return targets.map(target => createPortal(<DownloadScreenExcel scope={target.scope} title={target.title} />, target.host, target.id));
}
