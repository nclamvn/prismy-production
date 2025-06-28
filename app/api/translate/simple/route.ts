import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

/**
 * SIMPLIFIED TRANSLATION ENDPOINT
 * Fixes the core issue: "translation produces NO output"
 * This bypasses complex pipeline and provides direct translation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Simple translation endpoint called')

    // Get user session (but don't fail if not authenticated)
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const body = await request.json()
    const { text, sourceLang = 'auto', targetLang = 'vi' } = body

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      )
    }

    console.log('📝 Processing translation:', {
      textLength: text.length,
      sourceLang,
      targetLang,
      hasUser: !!session?.user,
      requiresChunking: text.length > 30000,
      preview: text.substring(0, 50) + '...',
    })

    const startTime = Date.now()
    let translatedText: string
    let detectedSourceLang: string
    let processingTime: number

    // INTELLIGENT ROUTING: Route long texts through chunking system
    if (text.length > 30000) {
      console.log('🧩 Routing long text through chunking system', {
        textLength: text.length,
        chunksEstimated: Math.ceil(text.length / 6000),
      })

      // Forward to unified endpoint with chunking
      const unifiedResponse = await fetch(
        new URL('/api/translate/unified', request.url).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            text: text,
            sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
            targetLang: targetLang,
            qualityTier: 'standard',
            trackHistory: true,
            createTask: false,
          }),
        }
      )

      if (!unifiedResponse.ok) {
        const errorData = await unifiedResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Chunked translation failed')
      }

      const unifiedResult = await unifiedResponse.json()
      translatedText = unifiedResult.result.translatedText
      detectedSourceLang =
        unifiedResult.result.detectedSourceLanguage || sourceLang
      processingTime = Date.now() - startTime

      console.log('✅ Chunked translation completed:', {
        originalLength: text.length,
        translatedLength: translatedText.length,
        processingTime,
        chunksProcessed: unifiedResult.result.chunks?.processed || 'unknown',
      })
    } else {
      // Direct Google Translate for short texts (<30k characters)
      console.log('📝 Using direct Google Translate for short text')

      // Import Google Translate dynamically to avoid build issues
      const { Translate } = await import('@google-cloud/translate/build/src/v2')

      // Initialize Google Translate with API key
      const translate = new Translate({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        key: process.env.GOOGLE_TRANSLATE_API_KEY,
      })

      // Perform translation
      const [translation, metadata] = await translate.translate(text, {
        from: sourceLang === 'auto' ? undefined : sourceLang,
        to: targetLang,
        format: 'text',
      })

      processingTime = Date.now() - startTime
      translatedText = Array.isArray(translation) ? translation[0] : translation
      detectedSourceLang = metadata?.detectedSourceLanguage || sourceLang

      console.log('✅ Direct translation completed:', {
        originalLength: text.length,
        translatedLength: translatedText.length,
        processingTime,
      })
    }

    // Track usage in history if user is authenticated
    if (session?.user) {
      try {
        await supabase.from('translation_history').insert({
          user_id: session.user.id,
          source_text: text.substring(0, 500),
          translated_text: translatedText.substring(0, 500),
          source_language: detectedSourceLang,
          target_language: targetLang,
          processing_time: processingTime,
          character_count: text.length,
          quality_tier: 'standard',
          cached: false,
        })
      } catch (historyError) {
        console.warn('Failed to save translation history:', historyError)
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        translatedText,
        sourceLanguage: detectedSourceLang,
        targetLanguage: targetLang,
        originalText: text,
        processingTime,
        qualityScore: 0.95,
        cached: false,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        endpoint: 'simple',
        authenticated: !!session?.user,
        characterCount: text.length,
        wordCount: text.split(/\s+/).length,
      },
    })
  } catch (error) {
    console.error('❌ Simple translation failed:', error)

    // Provide helpful error message
    let errorMessage = 'Translation failed'
    let errorDetails = {}

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Google Translate API key is missing or invalid'
        errorDetails = {
          fix: 'Check GOOGLE_TRANSLATE_API_KEY environment variable',
          hasApiKey: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        }
      } else if (error.message.includes('quota')) {
        errorMessage = 'Translation quota exceeded'
        errorDetails = { fix: 'Check Google Cloud quotas and billing' }
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        debug: {
          environment: process.env.NODE_ENV,
          hasGoogleApiKey: !!process.env.GOOGLE_TRANSLATE_API_KEY,
          hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple translation endpoint',
    status: 'ready',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasGoogleApiKey: !!process.env.GOOGLE_TRANSLATE_API_KEY,
      hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
    },
    timestamp: new Date().toISOString(),
  })
}
