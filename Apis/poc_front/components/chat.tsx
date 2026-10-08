'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart, type UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ETIQUETAS: Record<string, string> = {
  listar_anios_lectivos: 'Consultando años lectivos',
  listar_niveles: 'Consultando niveles',
  listar_grados: 'Consultando grados',
  listar_secciones: 'Consultando secciones',
  listar_cursos: 'Consultando cursos',
  listar_matriculas: 'Consultando matrículas',
  obtener_docente_responsable: 'Buscando docente responsable',
  obtener_notas: 'Consultando notas',
  listar_asistencias: 'Consultando asistencias',
};

const SUGERENCIAS = [
  'Dame la lista de secciones de 1ero de secundaria',
  '¿Qué niveles tiene el año lectivo actual?',
  'Lista los alumnos matriculados de 3ro de primaria',
];

function Parte({ part }: { part: UIMessage['parts'][number] }) {
  if (part.type === 'text') {
    return (
      <div className="md">
        <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
      </div>
    );
  }

  if (isToolUIPart(part)) {
    const nombre = part.type.replace(/^tool-/, '');
    const etiqueta = ETIQUETAS[nombre] ?? nombre;
    const error =
      part.state === 'output-error'
        ? part.errorText
        : part.state === 'output-available' &&
            part.output &&
            typeof part.output === 'object' &&
            'error' in part.output
          ? String((part.output as { error: unknown }).error)
          : null;
    const terminado = part.state === 'output-available' || part.state === 'output-error';

    return (
      <details className={`tool ${error ? 'tool-error' : ''}`}>
        <summary>
          <span className={terminado ? 'punto ok' : 'punto cargando'} />
          {etiqueta}
          {error ? ` — error: ${error}` : terminado ? '' : '…'}
        </summary>
        <pre>{JSON.stringify({ input: part.input, output: part.output }, null, 2)}</pre>
      </details>
    );
  }

  return null;
}

export default function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: UIMessage[];
}) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const fin = useRef<HTMLDivElement>(null);
  const eraNueva = useRef(initialMessages.length === 0);

  const { messages, sendMessage, status, error, stop } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // El servidor ya tiene el historial: solo mandamos el último mensaje.
      prepareSendMessagesRequest: ({ messages, id }) => ({
        body: { id, message: messages[messages.length - 1] },
      }),
    }),
    onFinish: () => {
      // Refresca la barra lateral para que aparezca la conversación nueva.
      if (eraNueva.current) {
        eraNueva.current = false;
        router.refresh();
      }
    },
  });

  const ocupado = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const enviar = (texto: string) => {
    const t = texto.trim();
    if (!t || ocupado) return;
    sendMessage({ text: t });
    setInput('');
  };

  return (
    <div className="chat">
      <div className="mensajes">
        {messages.length === 0 && (
          <div className="vacio">
            <h1>Asistente académico</h1>
            <p>Consulta la estructura, matrículas, notas y asistencias.</p>
            <div className="sugerencias">
              {SUGERENCIAS.map((s) => (
                <button key={s} onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.parts.map((p, i) => (
              <Parte key={i} part={p} />
            ))}
          </div>
        ))}

        {status === 'submitted' && <div className="pensando">Pensando…</div>}
        {error && <div className="error">⚠ {error.message}</div>}
        <div ref={fin} />
      </div>

      <form
        className="entrada"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta…"
          autoFocus
        />
        {ocupado ? (
          <button type="button" onClick={() => stop()}>
            Detener
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()}>
            Enviar
          </button>
        )}
      </form>
    </div>
  );
}
