import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔥 TEST ROUTE CALLED!', request.url)
  
  return NextResponse.json({ 
    message: 'TEST ROUTE WORKS!',
    url: request.url,
    timestamp: new Date().toISOString()
  })
}