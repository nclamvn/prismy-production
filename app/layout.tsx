import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { designTokens } from '@/lib/design-tokens'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'], // Design Doctrine: 300-700 range
})

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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon-48.svg', sizes: '48x48', type: 'image/svg+xml' },
      { url: '/favicon-64.svg', sizes: '64x64', type: 'image/svg+xml' },
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
      </head>
      <body className="font-sans antialiased bg-default text-primary">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
