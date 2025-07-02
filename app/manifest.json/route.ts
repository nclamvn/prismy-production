import { NextResponse } from 'next/server'
import { designTokens } from '@/lib/design-tokens'

export async function GET() {
  const manifest = {
    name: 'Prismy - AI Document Translation',
    short_name: 'Prismy',
    description: 'Enterprise-grade AI-powered document translation platform',
    start_url: '/',
    display: 'standalone',
    background_color: designTokens.color.bg.default,
    theme_color: designTokens.color.accent[600],
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['productivity', 'business', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
