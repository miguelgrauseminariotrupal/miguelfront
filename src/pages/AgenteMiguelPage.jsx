import { Send } from "lucide-react";

export default function AgenteMiguelPage() {
  return (
    <main className="page-content agent-page">
      <div className="page-heading"><h2>Agente Miguel</h2><p>Asistente inteligente para la gestión académica</p></div>
      <section className="chat-area" aria-label="Conversación con Agente Miguel">
        <form className="chat-composer" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="agent-message">Escribe tu consulta</label>
          <input id="agent-message" type="text" placeholder="Escribe tu consulta..." autoComplete="off" />
          <button type="submit" aria-label="Enviar consulta"><Send size={19} /></button>
        </form>
      </section>
    </main>
  );
}
