import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
  console.log('🍪 Debug cookies endpoint called')
  
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    // Find code verifier cookies
    const codeVerifierCookies = allCookies.filter(cookie => 
      cookie.name.includes('code-verifier')
    )
    
    // Find all auth-related cookies  
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth')
    )
    
    const results = {
      timestamp: new Date().toISOString(),
      totalCookies: allCookies.length,
      codeVerifierCookies: codeVerifierCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueStart: c.value?.substring(0, 20),
        isBase64: c.value?.startsWith('base64-')
      })),
      authCookies: authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueStart: c.value?.substring(0, 20)
      })),
      allCookieNames: allCookies.map(c => c.name)
    }
    
    console.log('🍪 Cookie analysis:', results)
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('🍪 Cookie debug error:', error)
    return NextResponse.json({
      error: 'Cookie debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}