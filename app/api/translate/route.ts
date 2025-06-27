import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-service'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateRequest, translationSchema } from '@/lib/validation'
import { validateCSRFMiddleware } from '@/lib/csrf'
import { createRouteHandlerClient } from '@/lib/supabase'
import { redisTranslationCache } from '@/lib/redis-translation-cache'
import { checkAndDeductCredits, estimateTokensFromText } from '@/lib/credit-manager'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get user session for rate limiting and CSRF validation
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting per user
    const userEmail = session.user.email || session.user.id
    const rateLimitKey = `translate:${userEmail}`
    const userTier = session.user.user_metadata?.subscription_tier || 'free'
    const limit = getRateLimitForTier(userTier as any)
    const rateLimitResult = await limit.check(request, { rateLimitKey })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: rateLimitResult.reset,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      )
    }

    // CSRF validation for web requests
    const origin = request.headers.get('origin')
    if (origin && origin !== 'null') {
      const csrfResult = await validateCSRFMiddleware(request)
      if (!csrfResult.valid) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }

    // Validate request body
    const validation = await validateRequest(request, translationSchema)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    const { text, sourceLanguage, targetLanguage, qualityTier = 'standard' } = validation.data

    // Estimate credits needed
    const estimatedTokens = estimateTokensFromText(text, qualityTier)
    
    // Check and deduct credits
    const creditResult = await checkAndDeductCredits(
      session.user.id,
      estimatedTokens,
      'translation',
      {
        text_length: text.length,
        source_lang: sourceLanguage,
        target_lang: targetLanguage,
        quality_tier: qualityTier
      }
    )

    if (!creditResult.success) {
      return NextResponse.json(
        { 
          error: creditResult.error,
          required: creditResult.required,
          available: creditResult.available
        },
        { status: 402 }
      )
    }

    const startTime = Date.now()
    let cacheHit = false
    let translationError: string | null = null

    try {
      // Perform translation
      const result = await translationService.translate({
        text,
        sourceLanguage,
        targetLanguage,
        qualityTier,
        userId: session.user.id,
        useCache: true,
        abTestVariant: 'cache_enabled'
      })

      if (!result.success || !result.translatedText) {
        throw new Error(result.error || 'Translation failed')
      }

      cacheHit = result.cached || false
      const endTime = Date.now()

      // Track usage in database
      await supabase
        .from('translation_history')
        .insert({
          user_id: session.user.id,
          source_text: text.substring(0, 500),
          translated_text: result.translatedText.substring(0, 500),
          source_language: result.detectedSourceLanguage || sourceLanguage,
          target_language: targetLanguage,
          quality_tier: qualityTier,
          processing_time: endTime - startTime,
          cached: result.cached || false,
          tokens_used: estimatedTokens,
          character_count: text.length
        })

      // Invalidate user history cache when new translation is added
      await redisTranslationCache.invalidateUserHistory(session.user.id)

      // Send real-time notification via WebSocket (disabled for now)
      const translationId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Return successful response with credit information
      return NextResponse.json({
        success: true,
        translationId,
        result: {
          translatedText: result.translatedText,
          sourceLanguage: result.detectedSourceLanguage || sourceLanguage,
          targetLanguage: targetLanguage,
          qualityTier: qualityTier,
          qualityScore: result.qualityScore || 0.95,
          cached: result.cached || false
        },
        credits: {
          used: creditResult.credits_used,
          remaining: creditResult.credits_after,
          previousBalance: creditResult.credits_before
        },
        billing: {
          charactersTranslated: text.length,
          tokensProcessed: estimatedTokens,
          qualityTier: qualityTier,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            limit: rateLimitResult.limit
          }
        }
      })

    } catch (error) {
      console.error('Translation API error:', error)
      translationError = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }

  } catch (error) {
    console.error('Translation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Translation failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Max-Age': '86400',
    },
  })
}