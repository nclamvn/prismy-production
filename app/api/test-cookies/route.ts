import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  
  // Set a test cookie
  const testCookieName = `test-${Date.now()}`
  cookieStore.set(testCookieName, 'test-value', {
    path: '/',
    secure: true,
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 60 * 60 // 1 hour
  })
  
  // Get all cookies
  const allCookies = cookieStore.getAll()
  
  // Find code verifier cookies
  const codeVerifierCookies = allCookies.filter(c => c.name.includes('code-verifier'))
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    testCookieSet: testCookieName,
    totalCookies: allCookies.length,
    codeVerifierCookies: codeVerifierCookies.map(c => ({
      name: c.name,
      valueLength: c.value.length,
      valuePreview: c.value.substring(0, 50) + '...'
    })),
    allCookieNames: allCookies.map(c => c.name)
  })
}