import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/stores/authStore';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'ScanAR — Turn images into AR experiences',
    template: '%s | ScanAR',
  },
  description:
    'Upload a photo. Our AI generates a photorealistic 3D model in seconds. Share via QR code and let your customers view it in AR.',
  keywords: ['AR', '3D model', 'augmented reality', 'AI', 'QR code', 'SaaS'],
  authors: [{ name: 'ScanAR' }],
  creator: 'ScanAR',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scanar.app',
    siteName: 'ScanAR',
    title: 'ScanAR — Turn images into AR experiences',
    description:
      'Upload a photo. Our AI generates a photorealistic 3D model in seconds.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScanAR — Turn images into AR experiences',
    description:
      'Upload a photo. Our AI generates a photorealistic 3D model in seconds.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-surface text-gray-900 antialiased font-sans min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
