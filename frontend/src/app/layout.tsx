import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Bodega Verde — Sistema de Gestión y Control',
  description: 'Sistema web para pedidos y control de inventario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-sand-50 text-charcoal-800 antialiased selection:bg-sage-100 selection:text-sage-700">
        {children}
      </body>
    </html>
  );
}
