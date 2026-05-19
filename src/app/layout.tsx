import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'ContractShield — AI-Powered Contract Risk Analysis',
  description: 'Stop signing contracts blind. AI-powered risk analysis that reads the fine print, flags red flags, and scores every clause in seconds.',
  openGraph: {
    title: 'ContractShield — AI-Powered Contract Risk Analysis',
    description: 'Stop signing contracts blind. AI that reads the fine print for you.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-navy-950 text-white antialiased">{children}</body>
    </html>
  );
}
