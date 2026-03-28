import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Supratik — Property Management System',
    template: '%s | Supratik',
  },
  description: 'Enterprise property management system with AI intelligence for Supratik Properties.',
  metadataBase: new URL('https://propelerp.wisewit.ai'),
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    siteName: 'Supratik',
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
