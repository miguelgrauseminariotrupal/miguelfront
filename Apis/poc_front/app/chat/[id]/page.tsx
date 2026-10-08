import { notFound } from 'next/navigation';
import Chat from '@/components/chat';
import { cargarMensajes, esIdValido } from '@/lib/chat-store';

export const dynamic = 'force-dynamic';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!esIdValido(id)) notFound();

  const mensajes = await cargarMensajes(id, 200);
  return <Chat key={id} id={id} initialMessages={mensajes} />;
}
