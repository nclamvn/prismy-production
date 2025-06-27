import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-service'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateRequest, translationSchema } from '@/lib/validation'
import { validateCSRFMiddleware } from '@/lib/csrf'
import { createRouteHandlerClient } from '@/lib/supabase'
import { redisTranslationCache } from '@/lib/redis-translation-cache'
// Removed A/B testing and websocket for MVP
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

    // Validate CSRF token
    const csrfValidation = await validateCSRFMiddleware(request, session.user.id)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }

    // Get user profile for subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', session.user.id)
      .single()

    const userTier = profile?.subscription_tier || 'free'

    // Apply rate limiting based on user tier
    const rateLimitResult = await getRateLimitForTier(request, userTier as any)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded for your subscription tier. Please upgrade or try again later.',
          retryAfter: rateLimitResult.retryAfter,
          tier: userTier,
          remaining: rateLimitResult.remaining
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Map legacy field names to new schema
    const normalizedBody = {
      text: body.text,
      sourceLanguage: body.sourceLang || body.sourceLanguage || 'auto',
      targetLanguage: body.targetLang || body.targetLanguage,
      qualityTier: body.qualityTier || 'standard',
      csrf_token: body.csrf_token || request.headers.get('x-csrf-token')
    }
    
    const validation = await validateRequest(translationSchema)(normalizedBody)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { text, sourceLanguage, targetLanguage, qualityTier } = validation.data

    // Calculate and check credits required
    const estimatedTokens = estimateTokensFromText(text)
    const creditResult = await checkAndDeductCredits(
      supabase,
      session.user.id,
      {
        tokens: estimatedTokens,
        characters: text.length,
        operation_type: 'translate',
        quality_tier: qualityTier as any
      },
      'translate',
      {
        sourceLanguage,
        targetLanguage,
        qualityTier,
        apiEndpoint: '/api/translate'
      }
    )

    if (!creditResult.success) {
      return NextResponse.json(
        { 
          error: creditResult.error,
          message: creditResult.message,
          credits: {
            available: creditResult.credits_before,
            needed: creditResult.calculation.tokens ? Math.ceil(creditResult.calculation.tokens / 1000) : 1
          }
        },
        { status: 402 } // Payment Required
      )
    }

    // A/B testing for cache performance
    const testId = 'cache_performance_2024_06'
    const isTestActive = false // abTestingFramework.isTestActive(testId)
    const variant = 'cache_enabled' // isTestActive ? abTestingFramework.getTestVariant(testId, session.user.id) : 'cache_enabled'

    const startTime = Date.now()
    let cacheHit = false
    let translationError: string | undefined

    try {
      // Perform translation using existing service
      const result = await translationService.translateText({
        text,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        qualityTier,
        // Pass A/B test variant to translation service
        abTestVariant: variant
      })

      cacheHit = result.cached || false
      const endTime = Date.now()

      // Record A/B test result if test is active
      if (isTestActive) {
        // await abTestingFramework.recordTestResult({
          testId,
          variant,
          startTime,
          endTime,
          responseTime: endTime - startTime,
          cacheHit,
          success: true,
          metadata: {
            textLength: text.length,
            sourceLang: sourceLanguage,
            targetLang: targetLanguage,
            qualityTier: qualityTier as string,
            userId: session.user.id
          }
        // })
      }

      // Track usage in database
      await supabase
        .from('translation_history')
        .insert({
          user_id: session.user.id,
          source_text: text,
          translated_text: result.translatedText,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          quality_tier: qualityTier,
          quality_score: result.qualityScore || 0.95,
          character_count: text.length
        })

      // Invalidate user history cache when new translation is added
      await redisTranslationCache.invalidateUserHistory(session.user.id)

      // Send real-time notification via WebSocket
      const translationId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // WebSocket notification disabled for production stability
      /*
      websocketManager.sendToUser(session.user.id, {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'translation_completed',
        userId: 'system',
        timestamp: Date.now(),
        data: {
          translationId,
          result: {
            translatedText: result.translatedText,
            sourceLanguage: result.detectedSourceLanguage || sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: result.qualityScore || 0.95
          },
          processingTime: endTime - startTime,
          cached: result.cached || false
        }
      })
      */

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
        // })

    } catch (error) {
      console.error('Translation API error:', error)
      translationError = error instanceof Error ? error.message : 'Unknown error'

      // Record A/B test result for error case
      if (isTestActive) {
        const endTime = Date.now()
        /* await abTestingFramework.recordTestResult({
          testId,
          variant,
          startTime,
          endTime,
          responseTime: endTime - startTime,
          cacheHit: false,
          success: false,
          errorMessage: translationError,
          metadata: {
            textLength: text.length,
            sourceLang: sourceLanguage,
            targetLang: targetLanguage,
            qualityTier: qualityTier as string,
            userId: session.user.id
          }
        // }) */
          }
        // })
      }

      throw error
    }

  } catch (error) {
    console.error('Translation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Translation failed',
        message: 'Translation service temporarily unavailable'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply basic rate limiting for language endpoint
    const rateLimitResult = await getRateLimitForTier(request, 'standard')
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get supported languages
    const languages = await translationService.getSupportedLanguages()
    
    return NextResponse.json({
      success: true,
      languages
    })
  } catch (error) {
    console.error('Languages API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch supported languages' },
      { status: 500 }
    )
  }
}