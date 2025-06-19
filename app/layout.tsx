import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Prismy - AI-Powered Translation Platform',
  description: 'The world\'s most advanced AI translation platform. Translate text and documents instantly with 99.9% accuracy across 150+ languages.',
  keywords: 'translation, AI translation, document translation, language translation, multilingual',
  authors: [{ name: 'Prismy' }],
  openGraph: {
    title: 'Prismy - AI-Powered Translation Platform',
    description: 'Translate text and documents instantly with 99.9% accuracy across 150+ languages.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'vi_VN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prismy - AI-Powered Translation Platform',
    description: 'Translate text and documents instantly with 99.9% accuracy.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}