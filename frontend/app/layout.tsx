import type { Metadata, Viewport } from 'next';
import './globals.css';

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
  themeColor: '#0d0d12',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-dark-950 text-zinc-100 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
