import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { chunkedTranslationService } from '@/lib/chunked-translation-service'
import { redisTranslationCache } from '@/lib/redis-translation-cache'

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

    // ⚡ PHASE 1.2: Check cache first for performance optimization
    console.log('🔍 Checking translation cache...')
    const cachedTranslation = await redisTranslationCache.get(
      text,
      sourceLang,
      targetLang,
      'standard'
    )

    if (cachedTranslation) {
      console.log('✅ Cache HIT - returning cached translation', {
        hitCount: cachedTranslation.hitCount,
        textCategory: cachedTranslation.textCategory,
        cacheAge: Date.now() - new Date(cachedTranslation.timestamp).getTime(),
      })

      // Track cache hit in history if user is authenticated
      if (session?.user) {
        try {
          await supabase.from('translation_history').insert({
            user_id: session.user.id,
            source_text: text.substring(0, 500),
            translated_text: cachedTranslation.translatedText.substring(0, 500),
            source_language: cachedTranslation.sourceLang,
            target_language: cachedTranslation.targetLang,
            processing_time: 50, // Cache response time
            character_count: text.length,
            quality_tier: cachedTranslation.qualityTier,
            quality_score: cachedTranslation.qualityScore,
            cached: true,
          })
        } catch (historyError) {
          console.warn(
            'Failed to save cached translation history:',
            historyError
          )
        }
      }

      return NextResponse.json({
        success: true,
        result: {
          translatedText: cachedTranslation.translatedText,
          sourceLanguage: cachedTranslation.sourceLang,
          targetLanguage: cachedTranslation.targetLang,
          originalText: text,
          processingTime: 50,
          qualityScore: cachedTranslation.qualityScore,
          cached: true,
          timestamp: new Date().toISOString(),
        },
        metadata: {
          endpoint: 'simple',
          authenticated: !!session?.user,
          characterCount: text.length,
          wordCount: text.split(/\s+/).length,
          cacheHit: true,
          hitCount: cachedTranslation.hitCount,
        },
      })
    }

    console.log('❌ Cache MISS - proceeding with fresh translation')
    const startTime = Date.now()
    let translatedText: string
    let detectedSourceLang: string
    let processingTime: number

    // INTELLIGENT ROUTING: Route long texts through chunking system
    if (text.length > 30000) {
      console.log('🧩 Using chunked translation for long text', {
        textLength: text.length,
        chunksEstimated: Math.ceil(text.length / 6000),
      })

      // Use chunked translation service directly
      const result = await chunkedTranslationService.translateLargeText({
        text,
        sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
        targetLang,
        qualityTier: 'standard',
        chunkingOptions: chunkedTranslationService.getOptimalChunkingSettings(
          text,
          targetLang
        ),
        onProgress: progress => {
          console.log('📊 Translation progress:', {
            completed: progress.completedChunks,
            total: progress.totalChunks,
            percentage: Math.round(
              (progress.completedChunks / progress.totalChunks) * 100
            ),
            eta: progress.estimatedTimeRemaining,
          })
        },
      })

      translatedText = result.translatedText
      detectedSourceLang = result.sourceLang
      processingTime = Date.now() - startTime

      console.log('✅ Chunked translation completed:', {
        originalLength: text.length,
        translatedLength: translatedText.length,
        processingTime,
        chunksProcessed: result.chunks?.processed || 'unknown',
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

    // ⚡ PHASE 1.2: Cache the fresh translation result
    console.log('💾 Caching fresh translation result...')
    try {
      await redisTranslationCache.set(
        text,
        sourceLang,
        targetLang,
        {
          translatedText,
          sourceLang: detectedSourceLang,
          targetLang,
          confidence: 0.95,
          qualityScore: 0.95,
          timestamp: new Date().toISOString(),
          qualityTier: 'standard',
        },
        'standard'
      )
      console.log('✅ Translation cached successfully')
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache translation (non-critical):', cacheError)
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
          quality_score: 0.95,
          cached: false,
        })

        // Invalidate user history cache since we added a new entry
        await redisTranslationCache.invalidateUserHistory(session.user.id)
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
