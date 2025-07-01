import { NextRequest, NextResponse } from 'next/server'

// Forward to unified endpoint with task creation enabled
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Add createTask flag for authenticated endpoint behavior
  const unifiedBody = {
    ...body,
    createTask: true,
    trackHistory: false // Task-based translations don't need history tracking
  }
  
  // Clone request with modified body
  const unifiedRequest = new Request(request.url.replace('/authenticated', '/unified'), {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(unifiedBody)
  })
  
  // Import dynamically to avoid circular dependencies
  const { POST: unifiedPOST } = await import('../unified/route')
  return unifiedPOST(unifiedRequest as NextRequest)
}

export { OPTIONS } from '../unified/route'