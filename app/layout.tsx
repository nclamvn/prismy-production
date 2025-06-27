import React from 'react'
import type { Metadata, Viewport } from 'next'
// NotebookLM Typography System Migration
import { Inter } from 'next/font/google'

// Keep Inter for now but prepare for NotebookLM-style font system
// Google Sans is proprietary, so we'll use Inter as base and modify with CSS
import '@/styles/globals.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { SSRSafeLanguageProvider } from '@/contexts/SSRSafeLanguageContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthProvider'
import {
  LoadingProvider,
  GlobalLoadingIndicator,
} from '@/contexts/LoadingContext'
import AuthErrorHandler from '@/components/auth/AuthErrorHandler'

// Phase 2 Performance Optimizations
import { CriticalCSS } from '@/components/CriticalCSS'
import { SkeletonProvider } from '@/components/ui/Skeleton'
import PageTransition from '@/components/transitions/PageTransition'
import ConditionalNavbar from '@/components/navigation/ConditionalNavbar'

// Phase 6.3 & 6.4: Accessibility and Theme Providers
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

// Phase 8: Advanced Features & Monitoring
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { WebVitalsMonitor } from '@/components/monitoring/WebVitalsMonitor'

// AI Agent System Integration
import { AgentProvider } from '@/contexts/AgentContext'
import AnalyticsInitializer from '@/components/analytics/AnalyticsInitializer'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://prismy.in'),
  title: {
    default: 'Prismy - AI-Powered Translation Platform',
    template: '%s | Prismy',
  },
  other: {
    charset: 'utf-8',
  },
  description:
    "The world's most advanced AI translation platform. Translate text and documents instantly with 99.9% accuracy across 150+ languages. NotebookLM-inspired design for enterprise teams.",
  keywords: [
    'translation',
    'AI translation',
    'document translation',
    'language translation',
    'multilingual',
    'enterprise translation',
    'NotebookLM design',
    'Material Design 3',
    'Vietnamese translation',
    'real-time translation',
    'API translation',
    'document OCR',
    'AI-powered platform',
  ],
  authors: [{ name: 'Prismy', url: 'https://prismy.in' }],
  creator: 'Prismy Team',
  publisher: 'Prismy',
  category: 'Technology',
  classification: 'AI Translation Platform',
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
      { url: '/favicon-rounded.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/icons/logo.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/logo.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon-rounded.svg',
    apple: [
      { url: '/favicon-rounded.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['vi_VN', 'zh_CN', 'ja_JP', 'ko_KR'],
    url: 'https://prismy.in',
    siteName: 'Prismy',
    title: 'Prismy - AI-Powered Translation Platform',
    description:
      'Translate text and documents instantly with 99.9% accuracy across 150+ languages. Enterprise-grade AI translation with NotebookLM-inspired design.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prismy - AI Translation Platform with NotebookLM Design',
        type: 'image/png',
      },
      {
        url: '/images/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: 'Prismy Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@PrismyAI',
    creator: '@PrismyAI',
    title: 'Prismy - AI-Powered Translation Platform',
    description:
      'Enterprise-grade AI translation with 99.9% accuracy across 150+ languages.',
    images: ['/images/twitter-card.png'],
  },
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: 'https://prismy.in',
    languages: {
      'en-US': 'https://prismy.in',
      'vi-VN': 'https://prismy.in/vi',
      'zh-CN': 'https://prismy.in/zh',
      'ja-JP': 'https://prismy.in/ja',
      'ko-KR': 'https://prismy.in/ko',
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-site-verification': 'your-google-verification-code',
    'msvalidate.01': 'your-bing-verification-code',
    'yandex-verification': 'your-yandex-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBFAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  viewportFit: 'cover',
  colorScheme: 'light dark',
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
        <meta
          name="version"
          content="1.0.5-FINAL-CLEAN-TIGHTER-SPACING-20250626"
        />

        {/* Enhanced SEO Meta Tags */}
        <meta name="application-name" content="Prismy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Prismy" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="preconnect" href="https://api.prismy.in" />
        
        {/* Font optimization - let Next.js handle font preloading automatically */}

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//prismy.in" />
        <link rel="dns-prefetch" href="//cdn.prismy.in" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Prismy',
              applicationCategory: 'BusinessApplication',
              description:
                'AI-powered translation platform for enterprise teams with 99.9% accuracy across 150+ languages',
              url: 'https://prismy.in',
              screenshot: 'https://prismy.in/images/og-image.png',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                priceValidUntil: '2025-12-31',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '1250',
              },
              author: {
                '@type': 'Organization',
                name: 'Prismy',
                url: 'https://prismy.in',
              },
            }),
          }}
        />
      </head>
      <body
        className="font-inter antialiased overflow-x-hidden"
        style={{
          fontSize: '18px',
          lineHeight: '1.6',
          backgroundColor: 'var(--surface-panel)',
          color: 'var(--text-primary)',
        }}
      >
        <CriticalCSS>
          <ErrorBoundary>
            <ThemeProvider defaultTheme="system">
              <AccessibilityProvider>
                <ToastProvider>
                  <LoadingProvider>
                    <SkeletonProvider
                      loading={false}
                      skeleton={
                        <div className="min-h-screen bg-gray-50 animate-pulse" />
                      }
                    >
                      <SSRSafeLanguageProvider
                        defaultLanguage="en"
                        ssrLanguage="en"
                      >
                        <AuthProvider>
                          <UnifiedAuthProvider>
                            <AgentProvider>
                              <GlobalLoadingIndicator />
                              <AuthErrorHandler />
                              <AnalyticsInitializer />
                              <WebVitalsMonitor
                                debug={process.env.NODE_ENV === 'development'}
                              />
                              {/* Conditional Navbar - only on public pages */}
                              <ConditionalNavbar />
                              <PageTransition>{children}</PageTransition>
                            </AgentProvider>
                          </UnifiedAuthProvider>
                        </AuthProvider>
                      </SSRSafeLanguageProvider>
                    </SkeletonProvider>
                  </LoadingProvider>
                </ToastProvider>
              </AccessibilityProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </CriticalCSS>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
