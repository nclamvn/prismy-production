import React from 'react'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import '@/styles/globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Prismy - AI Translation Platform',
  description: 'AI-powered translation platform with 99.9% accuracy across 150+ languages',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function SimpleRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const nonce = headersList.get('X-CSP-Nonce') || 'fallback-nonce'
  
  return (
    <html lang="en">
      <head>
        <meta name="version" content="1.0.0-MVP" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}