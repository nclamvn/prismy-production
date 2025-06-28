import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-service'

/**
 * EMERGENCY TRANSLATION TESTING ENDPOINT
 * Bypasses authentication and rate limiting for debugging
 * REMOVE IN PRODUCTION
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Emergency translation test endpoint called')

    const body = await request.json()
    const { text, targetLang, sourceLang = 'auto' } = body

    if (!text || !targetLang) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['text', 'targetLang'],
          received: { text: !!text, targetLang: !!targetLang },
        },
        { status: 400 }
      )
    }

    console.log('📝 Translation request:', {
      textLength: text.length,
      sourceLang,
      targetLang,
      textPreview: text.substring(0, 100),
    })

    // Test Google Translate API directly
    const startTime = Date.now()

    const result = await translationService.translateText({
      text,
      sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
      targetLang,
      qualityTier: 'standard',
      abTestVariant: 'cache_enabled',
    })

    const endTime = Date.now()
    const processingTime = endTime - startTime

    console.log('✅ Translation successful:', {
      translatedText: result.translatedText?.substring(0, 100),
      confidence: result.confidence,
      processingTime,
      cached: result.cached,
    })

    return NextResponse.json({
      success: true,
      test: true,
      result: {
        originalText: text,
        translatedText: result.translatedText,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        confidence: result.confidence,
        qualityScore: result.qualityScore,
        processingTime,
        cached: result.cached,
        timestamp: new Date().toISOString(),
      },
      debug: {
        endpoint: 'test',
        authBypass: true,
        environment: process.env.NODE_ENV,
        hasGoogleApiKey: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      },
    })
  } catch (error) {
    console.error('❌ Translation test failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            hasGoogleApiKey: !!process.env.GOOGLE_TRANSLATE_API_KEY,
            hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
            hasKeyFile: !!process.env.GOOGLE_CLOUD_KEY_FILE,
          },
        },
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Translation test endpoint is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
}
