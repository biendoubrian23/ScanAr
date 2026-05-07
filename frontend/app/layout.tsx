import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/lib/stores/authStore';

// Self-hosted woff2 in `app/fonts/` (sourced from @fontsource).
// Avoids the build-time fetch to fonts.googleapis.com which fails behind
// corporate SSL inspection (self-signed root CA in the chain).
const inter = localFont({
  src: [
    { path: './fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/inter-latin-800-normal.woff2', weight: '800', style: 'normal' },
    { path: './fonts/inter-latin-900-normal.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-inter',
  display:  'swap',
});

const unna = localFont({
  src: [
    { path: './fonts/unna-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/unna-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-unna',
  display:  'swap',
});

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${unna.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&family=Montserrat:wght@400;500;600;700;800&family=Lato:wght@400;700;900&family=Playfair+Display:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-gray-900 antialiased font-sans min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
