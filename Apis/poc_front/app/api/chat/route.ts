import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from 'ai';
import {
  asegurarConversacion,
  cargarMensajes,
  esIdValido,
  guardarMensaje,
  textoDe,
} from '@/lib/chat-store';
import { tools } from '@/lib/tools';

export const maxDuration = 60;

const MODELO = process.env.CHAT_MODEL ?? 'gemini-3.8-flash';

// Acepta GEMINI_API_KEY o el nombre por defecto del SDK.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const instrucciones = () =>
  `Eres el asistente académico del colegio. Fecha: ${new Date().toISOString().slice(0, 10)}. ` +
  'Respondes en español, de forma breve y clara. Para cualquier dato usa ' +
  'SIEMPRE las herramientas; nunca inventes cifras ni nombres. Las notas ' +
  'están en escala vigesimal (0 a 20). ' +
  'Estructura académica: año lectivo -> nivel -> grado -> sección. A partir de ' +
  'nombres (por ejemplo "1ero de secundaria") resuelve los ids encadenando ' +
  'listar_anios_lectivos, listar_niveles, listar_grados y listar_secciones, ' +
  'buscando por nombre en cada resultado. Nunca pidas ids al usuario. Si no ' +
  'indica el año, usa el año lectivo activo más reciente. Presenta los ' +
  'listados de forma clara y breve (tablas o viñetas).';

export async function POST(req: Request) {
  const { id, message }: { id?: string; message?: UIMessage } = await req
    .json()
    .catch(() => ({}));

  if (!id || !esIdValido(id) || !message) {
    return Response.json({ error: 'Faltan id o message' }, { status: 400 });
  }

  try {
    await asegurarConversacion(id, textoDe(message), MODELO);
    await guardarMensaje(id, message);

    const historial = await cargarMensajes(id);
    const mensajes = await validateUIMessages({ messages: historial, tools });

    const result = streamText({
      model: google(MODELO),
      instructions: instrucciones(),
      messages: await convertToModelMessages(mensajes, { tools }),
      tools,
      stopWhen: isStepCount(8),
    });

    // Que termine y se guarde aunque el cliente cierre la pestaña.
    result.consumeStream();

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: mensajes,
        generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
        onError: (e) => (e instanceof Error ? e.message : 'Error del modelo'),
        onEnd: async ({ responseMessage, isAborted }) => {
          if (isAborted || responseMessage.parts.length === 0) return;
          try {
            await guardarMensaje(id, responseMessage);
          } catch (e) {
            console.error('[chat] no se pudo guardar la respuesta:', e);
          }
        },
      }),
    });
  } catch (e) {
    console.error('[chat] fallo:', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Error inesperado' },
      { status: 500 },
    );
  }
}
