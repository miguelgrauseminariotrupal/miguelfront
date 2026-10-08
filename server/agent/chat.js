import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { convertToModelMessages, stepCountIs, streamText, validateUIMessages } from 'ai';
import { tools } from './tools.js';
import { createChatStore, getMockUserId, isConversationId } from './chat-store.js';
import { chatErrorMessage } from './chat-errors.js';

export async function handleChat(request) {
  if (request.method !== 'POST') return Response.json({ error: 'Método no permitido' }, { status: 405 });
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return Response.json({ error: 'Configura GEMINI_API_KEY en el servidor para activar Agente Miguel.' }, { status: 503 });
  if (!process.env.ACADEMICO_API_URL && !process.env.VITE_API_URL) {
    return Response.json({ error: 'Configura ACADEMICO_API_URL en el servidor.' }, { status: 503 });
  }
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 30 ||
      JSON.stringify(body.messages).length > 200000 ||
      body.messages.some((message) => !message || !['user', 'assistant'].includes(message.role)) ||
      body.messages.at(-1).role !== 'user') {
    return Response.json({ error: 'Historial de conversación inválido' }, { status: 400 });
  }
  let messages;
  try { messages = await validateUIMessages({ messages: body.messages, tools }); } catch {
    return Response.json({ error: 'Los mensajes no tienen un formato válido' }, { status: 400 });
  }
  try {
    const userId = getMockUserId();
    const store = createChatStore();
    const model = process.env.CHAT_MODEL || 'gemini-3.8-flash';
    if (store) {
      if (!isConversationId(body.id)) return Response.json({ error: 'El id de conversación debe ser un UUID válido.' }, { status: 400 });
      const title = messages.find((message) => message.role === 'user')?.parts
        .filter((part) => part.type === 'text').map((part) => part.text).join('') || '';
      await store.ensureConversation(body.id, title, model);
      await store.saveMessages(body.id, messages);
    }
    const google = createGoogleGenerativeAI({ apiKey: key });
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
    const result = streamText({
      model: google(model),
      // Un rechazo por cuota debe mostrarse sin esperar reintentos automáticos.
      maxRetries: 0,
      ...(model.startsWith('gemini-3') ? {
        providerOptions: { google: { thinkingConfig: { thinkingLevel: 'low' } } },
      } : {}),
      system: `Eres Agente Miguel, el asistente académico del colegio. Fecha: ${date}. ` +
        'Responde en español, de forma breve y clara. Para cualquier dato académico usa SIEMPRE las herramientas; ' +
        'nunca inventes cifras ni nombres. Las notas están en escala vigesimal (0 a 20). ' +
        'La estructura es año lectivo -> nivel -> grado -> sección. Resuelve los nombres encadenando ' +
        'listar_anios_lectivos, listar_niveles, listar_grados y listar_secciones; nunca pidas ids al usuario. ' +
        'Si no indica el año, usa el año lectivo activo más reciente. Presenta tablas o viñetas. ' +
        'Si una herramienta falla, explica que no se pudo consultar el dato. Solo puedes consultar información, no modificarla.',
      messages: await convertToModelMessages(messages, { tools }),
      tools,
      stopWhen: stepCountIs(8),
      // Reserva el último paso para responder aunque se agote el límite de consultas.
      prepareStep: ({ stepNumber }) => stepNumber === 7 ? { toolChoice: 'none' } : undefined,
      abortSignal: request.signal,
    });
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      messageMetadata: ({ part }) => part.type === 'start' && userId ? { usuario_id: userId } : undefined,
      onFinish: async ({ responseMessage, isAborted }) => {
        if (store && !isAborted && responseMessage.parts.length) {
          await store.saveMessages(body.id, [responseMessage]);
        }
      },
      onError: chatErrorMessage,
    });
  } catch (error) {
    if (error.message?.includes('USUARIO_MOCK_ID') || error.message?.includes('Supabase')) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    return Response.json({ error: 'No se pudo iniciar la consulta al agente.' }, { status: 502 });
  }
}
