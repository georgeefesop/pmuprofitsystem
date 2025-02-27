import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PMU Profit System – Mini Marketing Course for PMU Specialists',
  description: 'The PMU Profit System is a targeted mini course designed specifically for qualified permanent makeup artists who are struggling to get clients consistently.',
  viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col relative">
            {children}
          </main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
} 