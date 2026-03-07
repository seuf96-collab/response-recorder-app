import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Action Tiles — Customizable Dashboard',
  description: 'A customizable tile-based dashboard. Create, arrange, and interact with tiles for your smart home, links, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
