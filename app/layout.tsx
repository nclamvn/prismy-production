import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import { LanguageProvider } from '@/contexts/LanguageContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

// Times New Roman font configuration with system fallbacks
const timesFont = {
  variable: '--font-times'
}

export const metadata: Metadata = {
  title: 'Prismy - AI-Powered Translation Platform',
  description: 'The world\'s most advanced AI translation platform. Translate text and documents instantly with 99.9% accuracy across 150+ languages.',
  keywords: 'translation, AI translation, document translation, language translation, multilingual',
  authors: [{ name: 'Prismy' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prismy',
    startupImage: [
      {
        url: '/icons/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-splash-1242-2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-splash-640-1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#111111' },
    ],
  },
  openGraph: {
    title: 'Prismy - AI-Powered Translation Platform',
    description: 'Translate text and documents instantly with 99.9% accuracy across 150+ languages.',
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
    <html lang="vi" className={`${inter.variable} ${timesFont.variable}`}>
      <body className="font-times antialiased bg-white text-gray-900" style={{ fontSize: '21.6px', lineHeight: '1.6' }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <ServiceWorkerRegistration />
        <PerformanceMonitor />
      </body>
    </html>
  )
}