import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { designTokens } from '@/lib/design-tokens'
import { THEME_INIT_SCRIPT } from '@/lib/theme/theme-system'
import { inter, fontOptimizationScript } from '@/lib/fonts/font-setup'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prismy - Enterprise Document Processing',
  description:
    'AI-powered document processing platform for enterprise-scale operations',
  metadataBase: new URL('https://prismy.in'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-rounded.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Prismy - Enterprise Document Processing',
    description:
      'AI-powered document processing platform for enterprise-scale operations',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: designTokens.color.accent[600], // Design Doctrine: brand-primary
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="version" content="2.0.0-vNEXT" />
        <meta name="theme-color" content={designTokens.color.bg.default} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: fontOptimizationScript }} />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://rsms.me" crossOrigin="anonymous" />
      </head>
      <body className="h-screen overflow-hidden bg-[#F9FAFB] font-sans antialiased text-primary">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
