import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Asistente académico',
  description: 'PoC chatbot — Asociación Educativa Carlos A. Mannucci',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
