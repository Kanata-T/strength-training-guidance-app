import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Strength Training Guidance',
  description: 'Personalised strength training guidance and logging powered by Supabase.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full bg-slate-950 text-slate-100">
      <body className={`${inter.className} h-full`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
