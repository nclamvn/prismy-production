import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-service'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface AuthenticatedTranslationRequest {
  text: string
  sourceLang?: string
  targetLang: string
  qualityTier?: 'standard' | 'premium' | 'enterprise'
  serviceType?: 'google_translate' | 'llm'
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
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: AuthenticatedTranslationRequest = await request.json()
    
    // Validate request
    if (!body.text || !body.targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text and targetLang' },
        { status: 400 }
      )
    }

    const serviceType = body.serviceType || 'google_translate'
    const requiredCredits = calculateCredits(body.text, serviceType)

    // Check user's credit balance
    const { data: creditData, error: creditError } = await supabase
      .rpc('get_user_credit_balance', { p_user_id: user.id })
      .single()

    if (creditError || !creditData) {
      console.error('Credit check error:', creditError)
      return NextResponse.json(
        { error: 'Failed to check credit balance' },
        { status: 500 }
      )
    }

    const currentBalance = creditData.balance || 0

    // Check if user has enough credits
    if (currentBalance < requiredCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: requiredCredits,
          current: currentBalance,
          message: 'Please upgrade your plan to continue'
        },
        { status: 402 } // Payment Required
      )
    }

    // Apply rate limiting based on user tier
    const rateLimitResult = await getRateLimitForTier(
      request, 
      body.qualityTier || 'standard',
      user.id
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      )
    }

    // Create task record
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        type: 'translate',
        cost: requiredCredits,
        status: 'running',
        metadata: {
          serviceType,
          sourceLang: body.sourceLang || 'auto',
          targetLang: body.targetLang,
          textLength: body.text.length,
          wordCount: body.text.split(/\s+/).length
        }
      })
      .select()
      .single()

    if (taskError || !task) {
      console.error('Task creation error:', taskError)
      return NextResponse.json(
        { error: 'Failed to create translation task' },
        { status: 500 }
      )
    }

    try {
      // Perform translation
      const startTime = Date.now()
      const result = await translationService.translateText({
        text: body.text,
        sourceLang: body.sourceLang || 'auto',
        targetLang: body.targetLang,
        qualityTier: body.qualityTier || 'standard',
        abTestVariant: 'cache_enabled'
      })
      const endTime = Date.now()

      // Deduct credits
      const { error: creditDeductError } = await supabase
        .from('credits')
        .insert({
          user_id: user.id,
          change: -requiredCredits,
          reason: `Translation task ${task.id}`,
          created_at: new Date().toISOString()
        })

      if (creditDeductError) {
        console.error('Credit deduction error:', creditDeductError)
        // Continue with translation but log the error
      }

      // Update task status
      await supabase
        .from('tasks')
        .update({
          status: 'done',
          metadata: {
            ...task.metadata,
            processingTime: endTime - startTime,
            cached: result.cached || false
          }
        })
        .eq('id', task.id)

      // Return successful response with credit info
      return NextResponse.json({
        success: true,
        result: {
          translatedText: result.translatedText,
          sourceLanguage: result.detectedSourceLanguage || body.sourceLang || 'auto',
          targetLanguage: body.targetLang,
          qualityTier: body.qualityTier || 'standard',
          qualityScore: result.qualityScore || 0.90,
          cached: result.cached || false,
          processingTime: endTime - startTime
        },
        credits: {
          charged: requiredCredits,
          remaining: currentBalance - requiredCredits
        },
        taskId: task.id
      })

    } catch (translationError) {
      // Update task status to error
      await supabase
        .from('tasks')
        .update({
          status: 'error',
          metadata: {
            ...task.metadata,
            error: translationError instanceof Error ? translationError.message : 'Unknown error'
          }
        })
        .eq('id', task.id)

      // Refund credits on error
      await supabase
        .from('credits')
        .insert({
          user_id: user.id,
          change: requiredCredits,
          reason: `Refund for failed task ${task.id}`,
          created_at: new Date().toISOString()
        })

      throw translationError
    }

  } catch (error) {
    console.error('❌ Authenticated translation API error:', error)
    
    let errorMessage = 'Translation service temporarily unavailable'
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        errorMessage = 'Translation quota exceeded. Please try again later.'
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Translation service configuration error'
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Translation failed',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    )
  }
}