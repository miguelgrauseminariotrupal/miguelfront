import { MoreVertical } from "lucide-react";

export default function ContextMenu({ label = "Acciones", actions }) {
  if (actions.length === 1) {
    const action = actions[0];
    return <button className="management-edit-visible" type="button" onClick={action.onClick}>{action.icon}{action.label}</button>;
  }
  return <details className="context-menu"><summary aria-label={label}><MoreVertical size={18} /></summary><div className="context-menu__items">{actions.map((action) => <button type="button" key={action.label} onClick={(event) => { event.currentTarget.closest("details").removeAttribute("open"); action.onClick(); }}>{action.icon}{action.label}</button>)}</div></details>;
}
