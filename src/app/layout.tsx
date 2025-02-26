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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full overflow-x-hidden`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen overflow-hidden">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 