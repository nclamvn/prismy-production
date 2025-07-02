import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  
  console.log('🔍 Debug Flow - Received OAuth code:', code)
  console.log('🍪 Available cookies:', request.cookies.getAll().map(c => c.name))
  
  // Redirect to the actual callback with the code
  if (code) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('next', '/app')
    
    console.log('🔄 Redirecting to callback:', callbackUrl.toString())
    return NextResponse.redirect(callbackUrl)
  }
  
  return NextResponse.json({
    error: "No OAuth code provided",
    timestamp: new Date().toISOString()
  })
}