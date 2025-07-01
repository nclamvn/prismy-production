import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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
  themeColor: '#4F46E5',
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
        {children}
      </body>
    </html>
  )
}
