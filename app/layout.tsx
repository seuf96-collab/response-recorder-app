import type { Metadata } from 'next';
// Disabled Google Fonts due to network timeout issues
// import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jury Selection App - Professional Voir Dire Management',
  description: 'A professional jury selection application for criminal prosecutors to manage juror information during voir dire proceedings.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Jury Selection App',
    description: 'Professional voir dire management for criminal prosecutors',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
