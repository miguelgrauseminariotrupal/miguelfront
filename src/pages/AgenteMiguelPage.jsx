import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { isToolUIPart } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Plus, Send, Square } from "lucide-react";
import { agentTransport } from "../services/agentService";

const STORAGE_KEY = "miguel_agent_chats";
const LABELS = {
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
  "Dame la lista de secciones de 1ero de secundaria",
  "¿Qué niveles tiene el año lectivo actual?",
  "Lista los alumnos matriculados de 3ro de primaria",
];
const newChat = () => ({ id: crypto.randomUUID(), title: "Nueva conversación", messages: [] });
function loadChats() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      const valid = saved.filter((c) => typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages));
      if (valid.length) return valid;
    }
  } catch { /* Un historial inválido no impide abrir el chat. */ }
  return [newChat()];
}
function MessagePart({ part }) {
  if (part.type === "text") return <div className="agent-markdown"><Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown></div>;
  if (!isToolUIPart(part)) return null;
  const name = part.toolName || part.type.replace(/^tool-/, "");
  const done = ["output-available", "output-error"].includes(part.state);
  const error = part.state === "output-error" || Boolean(part.output?.error);
  return <div className={`agent-tool${error ? " agent-tool-error" : ""}`} role="status">
    <span className={`agent-dot${done ? " done" : ""}`} />
    {LABELS[name] || "Consultando información académica"}{error ? ": no se pudo consultar" : done ? " · Listo" : "…"}
  </div>;
}
function Conversation({ conversation, onSave }) {
  const [input, setInput] = useState("");
  const bottom = useRef(null);
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    id: conversation.id,
    messages: conversation.messages,
    transport: agentTransport,
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { onSave(conversation.id, messages); }, [conversation.id, messages, onSave]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, status]);
  useEffect(() => () => { stop(); }, [stop]);
  const send = (text) => {
    if (!text.trim() || busy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };
  return <section className="chat-area agent-conversation" aria-label="Conversación con Agente Miguel" aria-busy={busy}>
    <div className="agent-messages" role="log" aria-label="Mensajes">
      {!messages.length && <div className="agent-empty">
        <Bot size={40} aria-hidden="true" />
        <h3>¿En qué puedo ayudarte?</h3>
        <p>Consulta niveles, secciones, matrículas, notas y asistencias.</p>
        <div className="agent-suggestions">{SUGGESTIONS.map((text) => <button key={text} type="button" onClick={() => send(text)}>{text}</button>)}</div>
      </div>}
      {messages.map((message) => <article key={message.id} className={`agent-message agent-message-${message.role}`}>
        <span className="agent-message-author">{message.role === "user" ? "Tú" : "Agente Miguel"}</span>
        {message.parts.map((part, index) => <MessagePart key={index} part={part} />)}
      </article>)}
      {busy && <p className="agent-thinking" role="status">{status === "submitted" ? "Enviando consulta…" : "Agente Miguel está consultando y preparando la respuesta…"}</p>}
      {error && <div className="agent-error" role="alert"><p>{error.message}</p><button type="button" disabled={busy} onClick={() => regenerate()}>Reintentar</button></div>}
      <div ref={bottom} />
    </div>
    <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
      <label className="sr-only" htmlFor="agent-message">Escribe tu consulta</label>
      <input id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} placeholder="Escribe tu consulta..." autoComplete="off" />
      {busy ? <button type="button" onClick={() => stop()} aria-label="Detener respuesta" title="Detener respuesta"><Square size={17} /></button> :
        <button type="submit" disabled={!input.trim()} aria-label="Enviar consulta"><Send size={19} /></button>}
    </form>
  </section>;
}

export default function AgenteMiguelPage() {
  const [chats, setChats] = useState(loadChats);
  const [activeId, setActiveId] = useState(() => chats[0].id);
  const active = chats.find((chat) => chat.id === activeId) || chats[0];
  const save = useCallback((id, messages) => {
    setChats((previous) => previous.map((chat) => {
      if (chat.id !== id || chat.messages === messages) return chat;
      const first = messages.find((m) => m.role === "user");
      const title = first?.parts.filter((p) => p.type === "text").map((p) => p.text).join("").slice(0, 80);
      return { ...chat, messages, title: title || chat.title };
    }));
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch { /* El chat sigue funcionando si no hay espacio. */ }
  }, [chats]);
  return <main className="page-content agent-page">
    <div className="page-heading"><h2>Agente Miguel</h2><p>Asistente inteligente para la gestión académica</p></div>
    <div className="agent-workspace">
      <aside className="agent-history" aria-label="Conversaciones">
        <button type="button" className="agent-new" onClick={() => {
          const chat = newChat(); setChats((previous) => [chat, ...previous].slice(0, 30)); setActiveId(chat.id);
        }}><Plus size={17} /> Nueva conversación</button>
        <nav>{chats.map((chat) => <button type="button" key={chat.id} aria-current={chat.id === active.id ? "true" : undefined} className={chat.id === active.id ? "active" : ""} onClick={() => setActiveId(chat.id)} title={chat.title}>{chat.title}</button>)}</nav>
        <p>Historial de esta sesión del navegador.</p>
      </aside>
      <Conversation key={active.id} conversation={active} onSave={save} />
    </div>
  </main>;
}
