import { useState } from "react";
import { Download } from "lucide-react";
import { normalizeChart, normalizeReport } from "../utils/chatArtifacts";
import { buildReportFile, requestedFormats, REPORT_FORMATS } from "../utils/reportFormats";
import "./chat-artifacts.css";

const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];
const color = index => colors[index % colors.length];

function Chart({ data }) {
  const circular = ["pie", "doughnut"].includes(data.type);
  const total = data.series[0].values.reduce((sum, value) => sum + value, 0);
  let offset = 0;
  const values = data.series.flatMap(series => series.values);
  const min = Math.min(0, ...values), max = Math.max(0, ...values);
  const y = value => 220 - (value - min) / (max - min || 1) * 190;
  const x = index => 50 + (index + .5) / data.labels.length * 500;
  return <>
    {circular && !total ? <p>No hay valores para representar en el gráfico circular.</p> : <svg viewBox={circular ? "0 0 280 280" : "0 0 600 280"} role="img" aria-label={data.title} className="chat-artifact-chart">
      <title>{data.title}</title>
      {circular ? <g transform="rotate(-90 140 140)">{data.series[0].values.map((value, index) => {
        const percentage = value / total * 100;
        const start = offset; offset += percentage;
        return <circle key={index} cx="140" cy="140" r={data.type === "pie" ? 60 : 90} fill="none" stroke={color(index)} strokeWidth={data.type === "pie" ? 120 : 42} pathLength="100" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-start}><title>{data.labels[index]}: {value} ({percentage.toFixed(1)}%)</title></circle>;
      })}</g> : <>
        <line x1="50" x2="550" y1={y(0)} y2={y(0)} stroke="#94a3b8" />
        <text x="45" y="25" textAnchor="end">{max}</text><text x="45" y="225" textAnchor="end">{min}</text>
        {data.labels.map((label, index) => <text key={index} x={x(index)} y="250" textAnchor="middle"><title>{label}</title>{label.length > 12 ? `${label.slice(0, 10)}…` : label}</text>)}
        {data.series.map((series, seriesIndex) => <g key={seriesIndex}>
          {data.type === "line" && <polyline fill="none" stroke={color(seriesIndex)} strokeWidth="3" points={series.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />}
          {series.values.map((value, index) => data.type === "line" ? <circle key={index} cx={x(index)} cy={y(value)} r="5" fill={color(seriesIndex)}><title>{series.name} · {data.labels[index]}: {value}</title></circle> : <rect key={index} x={50 + index * 500 / data.labels.length + seriesIndex * 400 / data.labels.length / data.series.length + 10 / data.labels.length} y={Math.min(y(0), y(value))} width={400 / data.labels.length / data.series.length} height={Math.abs(y(value) - y(0))} fill={color(seriesIndex)} rx="2"><title>{series.name} · {data.labels[index]}: {value}</title></rect>)}
        </g>)}
      </>}
    </svg>}
    <ul className="chat-artifact-legend">{(circular ? data.labels : data.series.map(series => series.name)).map((label, index) => <li key={index}><i style={{ background: color(index) }} />{label}{circular ? `: ${data.series[0].values[index]}` : ""}</li>)}</ul>
    <details><summary>Ver datos</summary><div className="chat-artifact-table"><table><thead><tr><th>Categoría</th>{data.series.map((series, index) => <th key={index}>{series.name}</th>)}</tr></thead><tbody>{data.labels.map((label, index) => <tr key={index}><td>{label}</td>{data.series.map((series, si) => <td key={si}>{series.values[index]}</td>)}</tr>)}</tbody></table></div></details>
  </>;
}

function Report({ data, formats }) {
  const [selected, setSelected] = useState(null);
  const format = selected || formats[0] || "xlsx";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true); setError("");
    try {
      const file = await buildReportFile(data, format);
      const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }));
      const link = document.createElement("a");
      link.href = url; link.download = `${data.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 100) || "Reporte"}.${file.extension}`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("No se pudo generar el reporte. Intenta descargarlo nuevamente."); }
    finally { setBusy(false); }
  }
  return <><p>{data.rows.length} filas · {data.columns.length} columnas</p><div className="chat-artifact-table"><table data-export-rows={JSON.stringify(data.rows)}><thead><tr>{data.columns.map((column, index) => <th key={index}>{column.label}</th>)}</tr></thead><tbody>{data.rows.slice(0, 10).map((row, index) => <tr key={index}>{row.map((cell, ci) => <td key={ci}>{String(cell)}</td>)}</tr>)}</tbody></table></div>{data.rows.length > 10 && <small>Vista previa de las primeras 10 filas. La descarga incluye todas.</small>}<div className="chat-report-formats"><label>Formato<select value={format} disabled={busy} onChange={event => setSelected(event.target.value)}>{Object.entries(REPORT_FORMATS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{formats.length > 1 && <small>Solicitados: {formats.map(item => REPORT_FORMATS[item]).join(", ")}. Selecciona cada formato para descargarlo.</small>}<button type="button" disabled={busy} onClick={download}><Download size={16} />{busy ? "Preparando reporte..." : `Descargar ${REPORT_FORMATS[format]}`}</button></div>{error && <p role="alert">{error}</p>}</>;
}

export default function ChatArtifact({ kind, output, prompt }) {
  let data, formats;
  try {
    data = kind === "report" ? normalizeReport(output) : normalizeChart(output, prompt);
    if (kind === "report") formats = requestedFormats(output, prompt);
  }
  catch (error) { return <p className="agent-error" role="alert">{error.message}</p>; }
  return <section className="chat-artifact"><h4>{data.title}</h4>{kind === "report" ? <Report data={data} formats={formats} /> : <Chart data={data} />}</section>;
}
