import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { redisTranslationCache } from '@/lib/redis-translation-cache'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile for rate limiting
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', session.user.id)
      .single()

    const userTier = profile?.subscription_tier || 'free'

    // Apply rate limiting
    const rateLimitResult = await getRateLimitForTier(request, userTier as any)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const sourceLang = url.searchParams.get('sourceLang')
    const targetLang = url.searchParams.get('targetLang')
    const qualityTier = url.searchParams.get('qualityTier')
    const search = url.searchParams.get('search')

    // Create cache key based on query parameters
    const queryParams = {
      page,
      limit,
      sourceLang,
      targetLang,
      qualityTier,
      search
    }
    const queryHash = createHash('md5')
      .update(JSON.stringify(queryParams))
      .digest('hex')

    // Try to get from cache first
    const cachedHistory = await redisTranslationCache.getCachedUserHistory(session.user.id, queryHash)
    if (cachedHistory) {
      return NextResponse.json({
        success: true,
        history: cachedHistory,
        cached: true,
        pagination: {
          page,
          limit,
          hasMore: cachedHistory.length === limit
        }
      })
    }

    // Build database query
    let query = supabase
      .from('translation_history')
      .select(`
        id,
        source_text,
        translated_text,
        source_language,
        target_language,
        quality_tier,
        quality_score,
        character_count,
        created_at
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (sourceLang) {
      query = query.eq('source_language', sourceLang)
    }
    if (targetLang) {
      query = query.eq('target_language', targetLang)
    }
    if (qualityTier) {
      query = query.eq('quality_tier', qualityTier)
    }
    if (search) {
      query = query.or(`source_text.ilike.%${search}%,translated_text.ilike.%${search}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: history, error } = await query

    if (error) {
      throw error
    }

    // Cache the result (TTL: 5 minutes for user history)
    if (history && history.length > 0) {
      await redisTranslationCache.cacheUserHistory(session.user.id, queryHash, history)
    }

    // Get additional statistics
    const { count: totalCount } = await supabase
      .from('translation_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    return NextResponse.json({
      success: true,
      history: history || [],
      cached: false,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        hasMore: (history?.length || 0) === limit
      },
      stats: {
        totalTranslations: totalCount || 0,
        currentQuery: {
          resultsCount: history?.length || 0,
          filters: { sourceLang, targetLang, qualityTier, search }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch translation history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { translationId } = body

    if (!translationId) {
      return NextResponse.json(
        { error: 'Translation ID is required' },
        { status: 400 }
      )
    }

    // Delete the translation
    const { error } = await supabase
      .from('translation_history')
      .delete()
      .eq('id', translationId)
      .eq('user_id', session.user.id) // Ensure user can only delete their own translations

    if (error) {
      throw error
    }

    // Invalidate user history cache
    await redisTranslationCache.invalidateUserHistory(session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Translation deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting translation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete translation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}