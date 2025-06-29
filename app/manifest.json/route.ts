import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Serve manifest.json dynamically to prevent 401 errors
 * This ensures the manifest is always accessible
 */
export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json')
    const manifestContent = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error serving manifest.json:', error)

    // Fallback manifest if file read fails
    const fallbackManifest = {
      name: 'Prismy - AI Translation Platform',
      short_name: 'Prismy',
      description: 'Enterprise-grade AI translation platform',
      start_url: '/',
      display: 'standalone',
      background_color: '#FBFAF9',
      theme_color: '#111111',
      icons: [
        {
          src: '/favicon-rounded.svg',
          sizes: 'any',
          type: 'image/svg+xml',
        },
      ],
    }

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
