import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    searchParams: Object.fromEntries(url.searchParams.entries()),
    cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  })
}