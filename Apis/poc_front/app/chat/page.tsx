import { redirect } from 'next/navigation';

// Una conversación nueva = un uuid nuevo. La fila se crea al enviar el
// primer mensaje (api/chat), así no quedan conversaciones vacías.
export default function NuevoChat() {
  redirect(`/chat/${crypto.randomUUID()}`);
}
