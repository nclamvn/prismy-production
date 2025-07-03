/**
 * /api/agent - Alias route that proxies to /api/llm-chat
 * 
 * This provides a cleaner API endpoint for chat functionality
 * while maintaining backward compatibility with existing llm-chat endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.text()
    
    // Get headers from original request
    const headers = new Headers(request.headers)
    
    // Construct the target URL for llm-chat
    const baseUrl = request.nextUrl.origin
    const targetUrl = `${baseUrl}/api/llm-chat`
    
    // Forward the request to /api/llm-chat
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': headers.get('content-type') || 'application/json',
        'Authorization': headers.get('authorization') || '',
        'Cookie': headers.get('cookie') || '',
      },
      body: body,
    })
    
    // Get response data
    const responseData = await response.text()
    
    // Return the response with original status and headers
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Cache-Control': response.headers.get('cache-control') || 'no-cache',
      },
    })
    
  } catch (error) {
    console.error('Agent route proxy error:', error)
    
    return NextResponse.json(
      { 
        error: 'Agent service unavailable',
        message: 'Failed to connect to chat service'
      },
      { status: 503 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'agent',
    status: 'online',
    proxy_target: '/api/llm-chat',
    methods: ['POST'],
    description: 'AI Agent chat endpoint - proxies to llm-chat service'
  })
}