import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-service'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateRequest, translationSchema } from '@/lib/validation'
import { validateCSRFMiddleware } from '@/lib/csrf'
import { createRouteHandlerClient } from '@/lib/supabase'
import { redisTranslationCache } from '@/lib/redis-translation-cache'
import { checkAndDeductCredits, estimateTokensFromText } from '@/lib/credit-manager'
import { cookies } from 'next/headers'

interface UnifiedTranslationRequest {
  text: string
  sourceLang?: string
  targetLang: string
  qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  serviceType?: 'google_translate' | 'llm'
  trackHistory?: boolean // default true
  createTask?: boolean // default false for backward compatibility
}

// Credit costs per service
const CREDIT_COSTS = {
  google_translate: 30, // per page (~500 words)
  llm: 500, // per page (more expensive for AI translation)
}

// Calculate credits based on text length and service
function calculateCredits(text: string, serviceType: 'google_translate' | 'llm'): number {
  const wordsPerPage = 500
  const wordCount = text.split(/\s+/).length
  const pages = Math.ceil(wordCount / wordsPerPage)
  return pages * CREDIT_COSTS[serviceType]
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
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
    const isWebRequest = origin && (
      origin.includes('localhost') || 
      origin.includes('prismy.io') ||
      origin.includes('prismy.in')
    )
    
    if (isWebRequest) {
      const csrfResult = await validateCSRFMiddleware(request)
      if (!csrfResult.valid) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }

    // Parse and validate request
    const body: UnifiedTranslationRequest = await request.json()
    const validation = translationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { text, sourceLang, targetLang, qualityTier = 'standard', serviceType = 'google_translate', trackHistory = true, createTask = false } = body

    // Calculate required credits
    const requiredCredits = createTask ? calculateCredits(text, serviceType) : estimateTokensFromText(text)

    // Check and deduct credits
    const creditResult = await checkAndDeductCredits(
      session.user.id,
      requiredCredits,
      'translation'
    )

    if (!creditResult.sufficient) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: requiredCredits,
          available: creditResult.credits_before,
          suggestion: 'Please purchase more credits to continue'
        },
        { status: 402 }
      )
    }

    let taskId: string | null = null
    
    // Create task record if requested
    if (createTask) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: session.user.id,
          type: 'translate',
          cost: requiredCredits,
          status: 'running',
          metadata: {
            serviceType,
            sourceLang: sourceLang || 'auto',
            targetLang,
            textLength: text.length,
            wordCount: text.split(/\s+/).length
          }
        })
        .select()
        .single()

      if (taskError || !task) {
        console.error('Task creation error:', taskError)
        // Continue without task tracking
      } else {
        taskId = task.id
      }
    }

    const startTime = Date.now()

    try {
      // Perform translation
      const result = await translationService.translate({
        text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        qualityTier,
        userId: session.user.id,
        useCache: true,
        abTestVariant: 'cache_enabled'
      })

      if (!result.success || !result.translatedText) {
        throw new Error(result.error || 'Translation failed')
      }

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Track usage in history if enabled
      if (trackHistory) {
        await supabase
          .from('translation_history')
          .insert({
            user_id: session.user.id,
            source_text: text.substring(0, 500),
            translated_text: result.translatedText.substring(0, 500),
            source_language: result.detectedSourceLanguage || sourceLang,
            target_language: targetLang,
            quality_tier: qualityTier,
            processing_time: processingTime,
            cached: result.cached || false,
            tokens_used: requiredCredits,
            character_count: text.length
          })

        // Invalidate user history cache
        await redisTranslationCache.invalidateUserHistory(session.user.id)
      }

      // Update task status if created
      if (taskId) {
        await supabase
          .from('tasks')
          .update({
            status: 'done',
            metadata: {
              processingTime,
              cached: result.cached || false
            }
          })
          .eq('id', taskId)
      }

      // Return successful response
      return NextResponse.json({
        success: true,
        translationId: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        result: {
          translatedText: result.translatedText,
          sourceLanguage: result.detectedSourceLanguage || sourceLang,
          targetLanguage: targetLang,
          qualityTier,
          qualityScore: result.qualityScore || 0.95,
          cached: result.cached || false,
          processingTime
        },
        credits: {
          used: creditResult.credits_used,
          remaining: creditResult.credits_after,
          previousBalance: creditResult.credits_before
        },
        billing: {
          charactersTranslated: text.length,
          tokensProcessed: requiredCredits,
          qualityTier,
          serviceType,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            limit: rateLimitResult.limit
          }
        },
        ...(taskId && { taskId })
      })

    } catch (error) {
      console.error('Translation error:', error)
      
      // Update task status to error if created
      if (taskId) {
        await supabase
          .from('tasks')
          .update({
            status: 'error',
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .eq('id', taskId)
      }

      // Refund credits on failure if task was created
      if (createTask) {
        await supabase
          .from('credits')
          .insert({
            user_id: session.user.id,
            change: requiredCredits,
            reason: `Refund for failed translation task ${taskId}`,
            created_at: new Date().toISOString()
          })
      }

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
    },
  })
}