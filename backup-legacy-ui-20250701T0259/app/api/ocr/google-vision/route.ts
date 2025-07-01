import { NextRequest, NextResponse } from 'next/server'
import { validateCSRFMiddleware } from '@/lib/csrf'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // CSRF validation
    const csrfValidation = await validateCSRFMiddleware(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      )
    }

    // Get user session for rate limiting
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = await getRateLimitForTier(session.user.id, 'ocr')
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      )
    }

    // Validate Google Cloud credentials
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Google Cloud not configured' },
        { status: 503 }
      )
    }

    const requestBody = await request.json()
    
    // Validate request structure
    if (!requestBody.requests || !Array.isArray(requestBody.requests)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Construct Google Vision API request
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate`
    
    // Get access token
    const accessToken = await getGoogleAccessToken()
    
    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[Google Vision API] Error:', errorData)
      
      return NextResponse.json(
        { error: 'OCR processing failed', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Log successful usage for analytics
    await logOCRUsage(session.user.id, 'google-vision', data)
    
    return NextResponse.json(data)

  } catch (error) {
    console.error('[Google Vision API Route] Error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get Google Cloud access token
 */
async function getGoogleAccessToken(): Promise<string> {
  // Check if we have a service account key file
  const keyFilePath = process.env.GOOGLE_CLOUD_KEY_FILE
  const hasValidKeyFile = keyFilePath && 
    keyFilePath !== '/path/to/service-account.json' && 
    keyFilePath !== 'your-service-account-key-file.json'

  if (hasValidKeyFile) {
    // Use service account file
    try {
      const { GoogleAuth } = await import('google-auth-library')
      const auth = new GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      })
      
      const client = await auth.getClient()
      const accessToken = await client.getAccessToken()
      
      if (!accessToken.token) {
        throw new Error('Failed to get access token')
      }
      
      return accessToken.token
    } catch (error) {
      console.error('[Google Vision] Service account auth failed:', error)
      throw new Error('Authentication failed')
    }
  }

  // Check for application default credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const { GoogleAuth } = await import('google-auth-library')
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      })
      
      const client = await auth.getClient()
      const accessToken = await client.getAccessToken()
      
      if (!accessToken.token) {
        throw new Error('Failed to get access token')
      }
      
      return accessToken.token
    } catch (error) {
      console.error('[Google Vision] Application default credentials failed:', error)
      throw new Error('Authentication failed')
    }
  }

  // Fallback to metadata service (for Cloud Run, App Engine, etc.)
  try {
    const metadataResponse = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      {
        headers: {
          'Metadata-Flavor': 'Google'
        }
      }
    )
    
    if (metadataResponse.ok) {
      const tokenData = await metadataResponse.json()
      return tokenData.access_token
    }
  } catch (error) {
    console.error('[Google Vision] Metadata service failed:', error)
  }

  throw new Error('No valid Google Cloud authentication method found')
}

/**
 * Log OCR usage for analytics
 */
async function logOCRUsage(userId: string, method: string, result: any) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Extract useful metrics
    const textLength = result.responses?.[0]?.fullTextAnnotation?.text?.length || 0
    const blockCount = result.responses?.[0]?.textAnnotations?.length || 0
    
    await supabase.from('ocr_usage_logs').insert({
      user_id: userId,
      method,
      text_length: textLength,
      block_count: blockCount,
      success: !!result.responses?.[0]?.fullTextAnnotation?.text,
      processing_time: Date.now(), // Will be calculated on client
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('[OCR Usage Logging] Error:', error)
    // Don't throw - logging failures shouldn't break OCR
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}