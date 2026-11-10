# Agente Miguel

El frontend consume directamente el endpoint publicado del compa?ero, documentado en Apis/openapi (1).yaml:

https://fqidwaafiojvcamzmilu.supabase.co/functions/v1/chat

## Configuraci?n

VITE_AGENT_API_URL permite cambiar la URL del chat; sin esa variable se usa el endpoint anterior. VITE_SUPABASE_ANON_KEY permite enviar la clave anon/publishable en el header apikey si el servidor la requiere. Reiniciar Vite despu?s de modificar .env; en Vercel configurar las variables y volver a compilar.

El frontend no necesita claves de Gemini, OpenAI ni credenciales administrativas de Supabase. OpenAI, las herramientas acad?micas y la persistencia se ejecutan en el backend externo. La implementaci?n anterior en server/agent queda como referencia y no participa en el chat de la interfaz. El middleware local de Gemini fue retirado.

## Contrato

POST con { id, message }: id es el UUID de la conversaci?n y message es el ?ltimo mensaje del usuario en formato UIMessage (id, role, parts). Los reintentos env?an el mismo mensaje con su mismo id. El backend mantiene el historial y devuelve un stream SSE compatible con el protocolo UI Message Stream del AI SDK. Los errores HTTP y los errores recibidos dentro del stream se muestran en el chat.

La interfaz conserva sus conversaciones en sessionStorage (hasta 30), con Markdown, tablas, estados de herramientas y bot?n para detener. Las conversaciones locales anteriores no se migran al backend; iniciar una nueva conversaci?n si se necesita un contexto completo. Aunque el endpoint permite GET para listar conversaciones y recuperar mensajes, la barra lateral todav?a muestra el historial de esta pesta?a.

npm run dev, npm run build y npm run preview funcionan sin servidor de IA local. El backend externo debe permitir CORS para el origen del frontend.

## Contexto de la sección asignada

Cada conversación utiliza un transporte que añade al mensaje saliente una parte de texto con el contexto de la interfaz. Para docentes incluye los identificadores del año, nivel, grado y sección seleccionados, además de su descripción. El contrato del POST sigue siendo `{ id, message }`; no depende de que el backend admita nuevos campos.

Las indicaciones solicitan usar esa sección y su año como alcance predeterminado, sin pedir otra vez esos datos. Ante una orden clara se pide ejecutar la consulta directamente, reservando el menú para solicitudes de ayuda o mensajes sin una intención concreta. Si falta un período indispensable, se solicita solo ese dato. Un alcance distinto pedido explícitamente debe validarse en el backend, sin sustituirse silenciosamente por el aula asignada.

El mensaje visible conserva el texto original del usuario. Al recuperar mensajes desde el servidor se elimina la parte de contexto añadida, incluso si el backend concatenó sus partes de texto. La autenticación Bearer no cambia. El contexto enviado por el cliente es una ayuda de interpretación y no constituye autorización: el backend debe verificar los permisos de cada consulta y descarga.

Comprobación de esta modificación: una solicitud de Excel de asistencia para el primer bimestre enviada con la cuenta docente de prueba incluyó el contexto asignado y recibió una respuesta con enlace Excel, sin menú de presentación ni solicitud de nivel, grado o sección. Esta comprobación observa el comportamiento de esa solicitud; no valida el contenido del archivo ni todas las posibles respuestas del modelo externo.
