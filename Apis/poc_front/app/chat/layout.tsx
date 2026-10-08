import Link from 'next/link';
import { listarConversaciones } from '@/lib/chat-store';

export const dynamic = 'force-dynamic';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conversaciones = await listarConversaciones().catch(() => []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/chat" className="nuevo">
          + Nueva conversación
        </Link>
        <nav>
          {conversaciones.map((c) => (
            <Link key={c.id} href={`/chat/${c.id}`} className="conv">
              {c.titulo ?? 'Sin título'}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
