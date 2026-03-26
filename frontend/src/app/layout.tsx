import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'PropelERP — AI-Powered Property Management',
    template: '%s | PropelERP',
  },
  description: 'Enterprise property management ERP with AI intelligence. Leasing, Finance, HR, Maintenance and more.',
  metadataBase: new URL('https://propel.wisewit.ai'),
  openGraph: {
    siteName: 'PropelERP',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
