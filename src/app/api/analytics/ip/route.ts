import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get IP address from various possible headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              request.headers.get('x-real-ip') ||
              request.headers.get('cf-connecting-ip') || // Cloudflare
              request.headers.get('x-client-ip') ||
              '127.0.0.1'

    return NextResponse.json({ ip })
  } catch (error) {
    console.error('IP detection error:', error)
    return NextResponse.json({ ip: 'unknown' })
  }
}