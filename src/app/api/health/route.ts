import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: 'ready',
      storage: 'ready',
      translation: 'ready'
    }
  })
}