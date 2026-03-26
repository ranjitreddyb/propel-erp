import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Supratik ERP — Property Management System',
    template: '%s | Supratik ERP',
  },
  description: 'Enterprise property management ERP with AI intelligence for Supratik Properties.',
  metadataBase: new URL('https://propelerp.wisewit.ai'),
  openGraph: {
    siteName: 'Supratik ERP',
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
