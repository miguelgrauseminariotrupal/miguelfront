import ExcelLink from "../components/ExcelLink";
import { isExcelUrl, excelLinks } from "../utils/excelLinks";
import LoadingBar from "../components/LoadingBar.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { isToolUIPart } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Bot, CalendarCheck, ChevronRight, GraduationCap, MessageSquare, PanelLeft, Plus, RotateCcw, Square, Users, X } from "lucide-react";
import { createAgentTransport, listChatConversations, getChatMessages } from "../services/agentService";
import ChatArtifact from "../components/ChatArtifact";
import { saveChatMessages } from "../utils/chatHistory";
import { markdownReports, asksForReport } from "../utils/markdownReport";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TeacherAttendance from "../components/attendance/TeacherAttendance";

const LABELS = {
  exportar_excel: "Preparando reporte Excel",
  generar_grafico: "Preparando gráfico",
  crear_grafico: "Preparando gráfico",
  mostrar_grafico: "Preparando gráfico",
  graficar: "Preparando gráfico",
  listar_anios_lectivos: "Consultando años lectivos",
  listar_niveles: "Consultando niveles",
  listar_grados: "Consultando grados",
  listar_secciones: "Consultando secciones",
  listar_cursos: "Consultando cursos",
  listar_matriculas: "Consultando matrículas",
  obtener_docente_responsable: "Buscando docente responsable",
  obtener_notas: "Consultando notas",
  listar_asistencias: "Consultando asistencias",
};
const SUGGESTIONS = [
  { title: "Asistencia", description: "Consulta los registros del día", prompt: "Quiero consultar las asistencias de hoy.", icon: CalendarCheck },
  { title: "Calificaciones", description: "Revisa el avance de tus alumnos", prompt: "Ayúdame a consultar las calificaciones de mis alumnos.", icon: GraduationCap },
  { title: "Secciones", description: "Encuentra tu información académica", prompt: "¿Qué secciones puedo consultar en el año lectivo actual?", icon: Users },
];
const newChat = () => ({ id: crypto.randomUUID(), title: "Nueva conversación", messages: [] });
function toolExcelLinks(part) {
  if (!isToolUIPart(part) || part.state !== "output-available" || part.output?.error) return [];
  return excelLinks(part.output, (part.toolName || part.type.replace(/^tool-/, "")) === "exportar_excel");
}
function MessagePart({ part, prompt, allowTableExport, complete, parts, partIndex }) {
  if (part.type === "text") {
    const reports = allowTableExport && complete && asksForReport(prompt) ? markdownReports(part.text) : [];
    return <><div className="agent-markdown"><Markdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => parts.some(item => toolExcelLinks(item).includes(href)) ? null : isExcelUrl(href) ? <ExcelLink href={href} /> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{part.text}</Markdown></div>{reports.map((report, index) => <ChatArtifact key={index} kind="report" output={report} prompt={prompt} />)}</>;
  }
  if (!isToolUIPart(part)) return null;
  const name = part.toolName || part.type.replace(/^tool-/, "");
  const done = ["output-available", "output-error"].includes(part.state);
  const error = part.state === "output-error" || Boolean(part.output?.error);
  if (part.state === "output-available" && !error) {
    const files = toolExcelLinks(part);
    if (files.length) return <>{files.filter(href => !parts.slice(0, partIndex).some(item => toolExcelLinks(item).includes(href))).map(href => <ExcelLink key={href} href={href} />)}</>;
    if (asksForReport(prompt) && ["exportar_excel", "generar_reporte", "exportar_reporte", "exportar_pdf", "exportar_word", "exportar_csv"].includes(name)) return <ChatArtifact kind="report" output={{ ...part.output, ...(name === "exportar_pdf" ? { formato: "pdf" } : name === "exportar_word" ? { formato: "docx" } : name === "exportar_csv" ? { formato: "csv" } : {}) }} prompt={prompt} />;
    if (["generar_grafico", "crear_grafico", "mostrar_grafico", "graficar"].includes(name)) return <ChatArtifact kind="chart" output={part.output} prompt={prompt} />;
  }
  return <div className={`agent-tool${error ? " agent-tool-error" : ""}`} role="status">
    <span className={`agent-dot${done ? " done" : ""}`} />
    {LABELS[name] || "Consultando información académica"}{error ? ": no se pudo consultar" : done ? " · Listo" : "…"}
  </div>;
}
function Conversation({ conversation, onSave, assignedSelection }) {
  const [input, setInput] = useState("");
  const bottom = useRef(null);
  const textarea = useRef(null);
  const initialMessages = useRef(conversation.messages);
  const transport = useMemo(() => createAgentTransport(assignedSelection), [assignedSelection?.anio, assignedSelection?.nivel, assignedSelection?.grado, assignedSelection?.seccion, assignedSelection?.year, assignedSelection?.label]);
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    id: conversation.id,
    messages: initialMessages.current,
    transport,
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = "auto";
    textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 160)}px`;
  }, [input]);
  useEffect(() => { onSave(conversation.id, messages); }, [conversation.id, messages, onSave]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, status]);
  useEffect(() => () => { stop(); }, [stop]);
  const send = (text) => {
    if (!text.trim() || busy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };
  return <section className={`chat-area agent-conversation${!messages.length ? " is-empty" : ""}`} aria-label="Conversación con Agente Miguel" aria-busy={busy}>
    <div className="agent-messages" role="log" aria-label="Mensajes">
      {assignedSelection && <p className="agent-section-context">Consultando tu sección: {assignedSelection.label}</p>}
      {!messages.length && <div className="agent-empty">
        <span className="agent-empty-mark"><Bot size={30} strokeWidth={1.5} aria-hidden="true" /></span>
        <span className="agent-eyebrow">Menos búsquedas. Más respuestas.</span>
        <h3>¿Qué necesitas consultar?</h3>
        <p>Tu información académica, en una conversación.</p>
        <div className="agent-suggestions">{SUGGESTIONS.map(({ title, description, prompt, icon: Icon }) => <button key={title} type="button" disabled={busy} onClick={() => send(prompt)}>
          <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
          <strong>{title}</strong><span>{description}</span><ChevronRight size={15} className="agent-suggestion-arrow" aria-hidden="true" />
        </button>)}</div>
      </div>}
      {messages.map((message, messageIndex) => <article key={message.id} className={`agent-message agent-message-${message.role}`}>
        <span className={`agent-message-author${message.role === "user" ? " sr-only" : ""}`}>{message.role === "user" ? "Tú" : <><Bot size={16} aria-hidden="true" /> Miguel</>}</span>
        {message.parts.map((part, index) => <MessagePart key={index} parts={message.parts} partIndex={index} part={part} complete={!busy || messageIndex < messages.length - 1} allowTableExport={message.role === "assistant" && !message.parts.some(item => isToolUIPart(item) && item.state === "output-available" && ["exportar_excel", "generar_reporte", "exportar_reporte", "exportar_pdf", "exportar_word", "exportar_csv"].includes(item.toolName || item.type.replace(/^tool-/, "")))} prompt={messages.slice(0, messageIndex).findLast(item => item.role === "user")?.parts.filter(item => item.type === "text").map(item => item.text).join(" ") || ""} />)}
      </article>)}
      {busy && <LoadingBar label="Preparando respuesta" />}
      {error && <div className="agent-error" role="alert"><p>{error.message}</p><button type="button" disabled={busy} onClick={() => regenerate()}><RotateCcw size={14} />Reintentar</button></div>}
      <div ref={bottom} />
    </div>
    <div className="agent-composer-wrap">
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <label className="sr-only" htmlFor="agent-message">Escribe tu consulta</label>
        <textarea ref={textarea} rows={1} id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); }
        }} maxLength={4000} placeholder="Pregúntale a Miguel…" autoComplete="off" />
        {busy ? <button type="button" onClick={() => stop()} aria-label="Detener respuesta" title="Detener respuesta"><Square size={16} fill="currentColor" /></button> :
          <button type="submit" disabled={!input.trim()} aria-label="Enviar consulta" title="Enviar consulta"><ArrowUp size={20} /></button>}
      </form>
      <p className="agent-composer-hint">Consulta, comprende y sigue adelante.<span>Enter para enviar · Shift + Enter para una nueva línea</span></p>
    </div>
  </section>;
}

export default function AgenteMiguelPage() {
  const { role, docente, user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState(() => [newChat()]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [retry, setRetry] = useState(0);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [activeId, setActiveId] = useState(() => chats[0].id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyToggle = useRef(null);
  const active = chats.find((chat) => chat.id === activeId) || chats[0];
  const save = useCallback((id, messages) => {
    setChats(previous => saveChatMessages(previous, id, messages));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setHistoryLoading(true); setHistoryError("");
    listChatConversations({ signal: controller.signal }).then(rows => {
      if (controller.signal.aborted) return;
      const loaded = rows.map(row => ({ id: row.id, title: row.titulo || "Nueva conversación", messages: null }));
      const next = loaded.length ? loaded : [newChat()];
      setChats(next); setActiveId(next[0].id);
    }).catch(error => {
      if (!controller.signal.aborted) setHistoryError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [user?.id_usuario, historyRetry]);
  useEffect(() => {
    setMessagesError("");
    if (historyLoading || historyError || active.messages !== null) return;
    const controller = new AbortController();
    getChatMessages(active.id, { signal: controller.signal }).then(messages => {
      if (!controller.signal.aborted) setChats(previous => previous.map(chat => chat.id === active.id ? { ...chat, messages } : chat));
    }).catch(error => { if (!controller.signal.aborted) setMessagesError(error.message); });
    return () => controller.abort();
  }, [active.id, active.messages, historyLoading, historyError, retry]);
  const startConversation = () => {
    const chat = newChat(); setChats(previous => [chat, ...previous].slice(0, 30)); setActiveId(chat.id);
    setHistoryOpen(false);
  };
  const closeHistory = () => { setHistoryOpen(false); historyToggle.current?.focus(); };
  return <main className="page-content agent-page">
    <header className="agent-toolbar">
      <div className="agent-identity"><span className="agent-identity-icon"><Bot size={21} strokeWidth={1.7} aria-hidden="true" /></span><div><h2>Miguel</h2><p>Tu asistente académico</p></div></div>
      <div className="agent-toolbar-actions">
        <button ref={historyToggle} type="button" className={`agent-history-toggle${historyOpen ? " is-active" : ""}`} onClick={() => setHistoryOpen(value => !value)} aria-label="Mostrar u ocultar historial" aria-expanded={historyOpen} aria-controls="agent-history"><PanelLeft size={17} /><span>Historial</span></button>
        <button type="button" className="agent-new" onClick={startConversation} disabled={historyLoading || Boolean(historyError)} aria-label="Nueva conversación" title="Nueva conversación"><Plus size={17} /><span>Nueva conversación</span></button>
      </div>
    </header>
    <div className="agent-workspace">
      <aside id="agent-history" className="agent-history" hidden={!historyOpen} aria-label="Conversaciones" onKeyDown={event => { if (event.key === "Escape") closeHistory(); }}>
        <div className="agent-history-heading"><h3>Tus conversaciones</h3><button type="button" onClick={closeHistory} aria-label="Cerrar historial"><X size={16} /></button></div>
        <nav>{historyLoading ? <LoadingBar label="Historial de conversaciones" /> : historyError ? <p role="alert">{historyError}<button type="button" onClick={() => historyError ? setHistoryRetry(value => value + 1) : setRetry(value => value + 1)}>Reintentar</button></p> : chats.map(chat => <button type="button" key={chat.id} aria-current={chat.id === active.id ? "true" : undefined} className={chat.id === active.id ? "active" : ""} onClick={() => {
          setActiveId(chat.id);
          if (window.matchMedia("(max-width: 700px)").matches) closeHistory();
        }} title={chat.title}><MessageSquare size={15} aria-hidden="true" /><span>{chat.title}</span></button>)}</nav>
        <p>Conversaciones guardadas en tu cuenta</p>
      </aside>
      {historyLoading ? <LoadingBar label="Historial de conversaciones" /> : historyError || messagesError ? <div className="agent-error" role="alert"><p>{historyError || messagesError}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div> : active.messages === null ? <LoadingBar label="Mensajes de la conversación" /> : role === "docente" ? <div className="agent-teacher-content"><TeacherAttendance docente={docente} initialSection={location.state?.academicSelection?.seccion}>{selection => <Conversation key={`${active.id}-${selection.seccion}`} conversation={active} onSave={save} assignedSelection={selection} />}</TeacherAttendance></div> : <Conversation key={active.id} conversation={active} onSave={save} />}
    </div>
  </main>;
}
