import { NextRequest, NextResponse } from 'next/server'
import { ModelRouter, TaskComplexity, UserTier } from '@/lib/model-router'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

interface ModelRouteRequest {
  taskType: 'translation' | 'document_processing' | 'ocr' | 'embedding' | 'chat'
  complexity?: TaskComplexity
  estimatedTokens: number
  requiresVision?: boolean
  languagePair?: string
  qualityRequirement?: number
  budgetConstraint?: number
}

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const supabase = createRouteHandlerClient({ cookies })
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

// Helper function to get user tier
async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data } = await supabase
      .from('user_subscriptions')
      .select('subscription_tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return (data?.subscription_tier as UserTier) || UserTier.FREE
  } catch (error) {
    logger.error('Failed to get user tier', { error, userId })
    return UserTier.FREE
  }
}

// Helper function to estimate complexity from task type and content
function estimateComplexity(taskType: string, estimatedTokens: number, languagePair?: string): TaskComplexity {
  // Simple heuristics for complexity estimation
  if (taskType === 'embedding') return TaskComplexity.SIMPLE
  
  if (estimatedTokens > 4000) return TaskComplexity.COMPLEX
  if (estimatedTokens > 1500) return TaskComplexity.MODERATE
  
  // Complex language pairs
  if (languagePair) {
    const complexLanguages = ['zh', 'ja', 'ar', 'hi', 'th', 'ko']
    const [source, target] = languagePair.split('-')
    if (complexLanguages.includes(source) || complexLanguages.includes(target)) {
      return TaskComplexity.MODERATE
    }
  }
  
  return TaskComplexity.SIMPLE
}

export async function POST(request: NextRequest) {
  try {
    const body: ModelRouteRequest = await request.json()
    
    // Validate request
    if (!body.taskType || !body.estimatedTokens) {
      return NextResponse.json(
        { error: 'Missing required fields: taskType, estimatedTokens' },
        { status: 400 }
      )
    }

    // Get user information
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userTier = await getUserTier(userId)
    
    // Estimate complexity if not provided
    const complexity = body.complexity || estimateComplexity(
      body.taskType, 
      body.estimatedTokens, 
      body.languagePair
    )

    // Get model recommendation
    const router = ModelRouter.getInstance()
    const recommendation = await router.getOptimalModel({
      taskType: body.taskType,
      complexity,
      userTier,
      userId,
      estimatedTokens: body.estimatedTokens,
      requiresVision: body.requiresVision,
      languagePair: body.languagePair,
      qualityRequirement: body.qualityRequirement,
      budgetConstraint: body.budgetConstraint
    })

    // Log the recommendation
    logger.info('Model recommendation generated', {
      userId,
      taskType: body.taskType,
      selectedProvider: recommendation.provider,
      selectedModel: recommendation.model,
      estimatedCost: recommendation.estimatedCost,
      reasonCode: recommendation.reasonCode
    })

    return NextResponse.json({
      success: true,
      recommendation,
      userTier,
      complexity,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Model router API error', { error })
    return NextResponse.json(
      { error: 'Failed to get model recommendation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const router = ModelRouter.getInstance()

    switch (action) {
      case 'stats':
        // Get provider performance stats
        const providerStats = router.getProviderStats()
        return NextResponse.json({
          success: true,
          stats: providerStats
        })

      case 'estimates':
        // Get cost estimates for different models
        const taskType = searchParams.get('taskType') || 'translation'
        const tokens = parseInt(searchParams.get('tokens') || '1000')
        const userTier = await getUserTier(userId)
        
        const estimates = await router.getCostEstimates(taskType, tokens, userTier)
        
        return NextResponse.json({
          success: true,
          estimates,
          userTier
        })

      case 'insights':
        // Get cost optimization insights for user
        const { data: insights, error } = await supabase
          .from('cost_optimization_insights')
          .select('*')
          .eq('user_id', userId)
          .eq('is_acknowledged', false)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          insights
        })

      case 'history':
        // Get user's model routing history
        const limit = parseInt(searchParams.get('limit') || '50')
        const { data: history, error: historyError } = await supabase
          .from('model_routing_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (historyError) {
          throw historyError
        }

        return NextResponse.json({
          success: true,
          history
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Model router GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { insightId, acknowledged } = body

    if (!insightId) {
      return NextResponse.json(
        { error: 'Missing insightId' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update insight acknowledgment
    const { error } = await supabase
      .from('cost_optimization_insights')
      .update({ 
        is_acknowledged: acknowledged,
        updated_at: new Date().toISOString()
      })
      .eq('id', insightId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Insight updated successfully'
    })

  } catch (error) {
    logger.error('Model router PATCH API error', { error })
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    )
  }
}

// Performance feedback endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      provider, 
      model, 
      success, 
      latency, 
      actualCost, 
      qualityScore,
      routingLogId 
    } = body

    if (!provider || !model || success === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model, success' },
        { status: 400 }
      )
    }

    // Update provider performance
    await supabase.rpc('update_provider_performance', {
      p_provider: provider,
      p_model: model,
      p_success: success,
      p_latency_ms: latency || 0,
      p_cost: actualCost || 0,
      p_quality_score: qualityScore
    })

    // Update routing log with actual performance if ID provided
    if (routingLogId && actualCost) {
      await supabase
        .from('model_routing_logs')
        .update({
          actual_cost: actualCost,
          performance_metrics: {
            latency,
            success,
            quality_score: qualityScore
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', routingLogId)
    }

    logger.info('Performance feedback recorded', {
      provider,
      model,
      success,
      latency,
      actualCost
    })

    return NextResponse.json({
      success: true,
      message: 'Performance feedback recorded'
    })

  } catch (error) {
    logger.error('Performance feedback API error', { error })
    return NextResponse.json(
      { error: 'Failed to record performance feedback' },
      { status: 500 }
    )
  }
}