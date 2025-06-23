import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthProvider'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://prismy.in'),
  title: 'Prismy - AI-Powered Translation Platform',
  description:
    "The world's most advanced AI translation platform. Translate text and documents instantly with 99.9% accuracy across 150+ languages.",
  keywords:
    'translation, AI translation, document translation, language translation, multilingual',
  authors: [{ name: 'Prismy' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prismy',
    startupImage: [
      {
        url: '/icons/apple-splash-2048-2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1668-2388.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1536-2048.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1125-2436.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-splash-1242-2208.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-splash-750-1334.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-640-1136.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/logo.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-rounded.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcut: '/logo.ico',
    apple: [
      { url: '/favicon-rounded.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Prismy - AI-Powered Translation Platform',
    description:
      'Translate text and documents instantly with 99.9% accuracy across 150+ languages.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'vi_VN',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prismy - AI Translation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prismy - AI-Powered Translation Platform',
    description: 'Translate text and documents instantly with 99.9% accuracy.',
    images: ['/images/twitter-card.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBFAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="version" content="1.0.1-fix-nav" />
      </head>
      <body
        className="font-inter antialiased bg-white text-gray-900 overflow-x-hidden"
        style={{ fontSize: '18px', lineHeight: '1.6' }}
      >
        <LanguageProvider>
          <AuthProvider>
            <UnifiedAuthProvider>
              <Navbar />
              {children}
            </UnifiedAuthProvider>
          </AuthProvider>
        </LanguageProvider>
        {/* Temporarily disabled to fix caching issues
        <ServiceWorkerRegistration /> */}
        <PerformanceMonitor />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Preload critical resources on interaction
              const preloadEvents = ['mousedown', 'touchstart', 'keydown'];
              const preload = () => {
                const link = document.createElement('link');
                link.rel = 'modulepreload';
                link.href = '/_next/static/chunks/tesseract.js';
                document.head.appendChild(link);
                
                preloadEvents.forEach(event => {
                  document.removeEventListener(event, preload);
                });
              };
              preloadEvents.forEach(event => {
                document.addEventListener(event, preload, { once: true });
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
