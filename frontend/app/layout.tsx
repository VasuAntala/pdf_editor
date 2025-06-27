import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PDF Editor - Advanced PDF Editing Tool',
  description: 'Edit, convert, and manage your PDFs with our advanced online PDF editor. Support for text editing, image manipulation, merging, splitting, and more.',
  keywords: 'PDF editor, PDF converter, PDF merge, PDF split, online PDF tool',
  authors: [{ name: 'PDF Editor Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'PDF Editor - Advanced PDF Editing Tool',
    description: 'Edit, convert, and manage your PDFs with our advanced online PDF editor.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Editor - Advanced PDF Editing Tool',
    description: 'Edit, convert, and manage your PDFs with our advanced online PDF editor.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <Navigation />
            {children}
          </AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
} 