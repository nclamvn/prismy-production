/**
 * TRANSLATION COLLABORATION API
 * Real-time collaborative translation endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { translationCollaborationEngine } from '@/lib/collaboration/translation-collaboration'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

// Create Translation Session
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user tier for rate limiting
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

    const body = await request.json()
    const { 
      sourceText, 
      sourceLanguage, 
      targetLanguage,
      metadata = {}
    } = body

    if (!sourceText || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Source text, source language, and target language are required' },
        { status: 400 }
      )
    }

    logger.info(`Creating translation collaboration session`, {
      userId: session.user.id,
      sourceLanguage,
      targetLanguage,
      textLength: sourceText.length
    })

    // Create translation session
    const translationSession = await translationCollaborationEngine.createTranslationSession(
      session.user.id,
      sourceText,
      sourceLanguage,
      targetLanguage,
      {
        ...metadata,
        userId: session.user.id
      }
    )

    // Store session metadata in database
    await supabase
      .from('translation_sessions')
      .insert({
        id: translationSession.id,
        source_text: sourceText,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        creator_id: session.user.id,
        status: translationSession.status,
        metadata: translationSession.metadata,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      session: {
        id: translationSession.id,
        sourceText: translationSession.sourceText,
        sourceLanguage: translationSession.sourceLanguage,
        targetLanguage: translationSession.targetLanguage,
        status: translationSession.status,
        collaborators: translationSession.collaborators.map(c => ({
          userId: c.userId,
          userName: c.userName,
          role: c.role,
          status: c.status,
          color: c.color
        })),
        metadata: translationSession.metadata
      }
    })

  } catch (error) {
    logger.error('Failed to create translation collaboration session:', error)
    return NextResponse.json(
      { error: 'Failed to create translation session' },
      { status: 500 }
    )
  }
}

// Get Translation Session or List Sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')
    const action = searchParams.get('action')

    if (sessionId) {
      if (action === 'join') {
        // Join translation session
        const userName = searchParams.get('userName') || session.user.email?.split('@')[0] || 'Anonymous'
        const userEmail = session.user.email || ''
        const role = searchParams.get('role') as any || 'translator'

        const success = await translationCollaborationEngine.joinTranslationSession(
          sessionId,
          session.user.id,
          userName,
          userEmail,
          role
        )

        if (!success) {
          return NextResponse.json(
            { error: 'Translation session not found or access denied' },
            { status: 404 }
          )
        }

        const translationSession = await translationCollaborationEngine.getSession(sessionId)
        
        return NextResponse.json({
          success: true,
          session: translationSession
        })
      }

      if (action === 'leave') {
        // Leave translation session
        await translationCollaborationEngine.leaveTranslationSession(sessionId, session.user.id)
        
        return NextResponse.json({
          success: true,
          message: 'Left translation session successfully'
        })
      }

      if (action === 'progress') {
        // Get translation progress
        const progress = await translationCollaborationEngine.getSessionProgress(sessionId)
        
        if (!progress) {
          return NextResponse.json(
            { error: 'Translation session not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({
          success: true,
          progress
        })
      }

      if (action === 'stats') {
        // Get session statistics
        const stats = await translationCollaborationEngine.getSessionStats(sessionId)
        
        if (!stats) {
          return NextResponse.json(
            { error: 'Translation session not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({
          success: true,
          stats
        })
      }

      // Get single translation session
      const translationSession = await translationCollaborationEngine.getSession(sessionId)
      
      if (!translationSession) {
        return NextResponse.json(
          { error: 'Translation session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        session: translationSession
      })
    }

    // List user's active translation sessions
    const activeSessions = await translationCollaborationEngine.getActiveSessionsForUser(session.user.id)

    return NextResponse.json({
      success: true,
      sessions: activeSessions
    })

  } catch (error) {
    logger.error('Failed to get translation collaboration session:', error)
    return NextResponse.json(
      { error: 'Failed to get translation session' },
      { status: 500 }
    )
  }
}

// Update Translation Session
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessionId, action, ...data } = body

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'submit_proposal':
        const { sectionId, translatedText, confidence, aiAssisted, alternatives } = data
        
        const proposalSuccess = await translationCollaborationEngine.submitTranslationProposal(
          sessionId,
          sectionId,
          session.user.id,
          translatedText,
          confidence,
          aiAssisted,
          alternatives || []
        )
        
        if (!proposalSuccess) {
          return NextResponse.json(
            { error: 'Failed to submit translation proposal' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Translation proposal submitted successfully'
        })

      case 'vote_proposal':
        const { proposalId, voteType, comment } = data
        
        const voteSuccess = await translationCollaborationEngine.voteOnProposal(
          sessionId,
          proposalId,
          session.user.id,
          voteType,
          comment
        )
        
        if (!voteSuccess) {
          return NextResponse.json(
            { error: 'Failed to vote on proposal' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Vote submitted successfully'
        })

      case 'add_comment':
        const { proposalId: commentProposalId, content, replyTo } = data
        
        const commentSuccess = await translationCollaborationEngine.addComment(
          sessionId,
          commentProposalId,
          session.user.id,
          content,
          replyTo
        )
        
        if (!commentSuccess) {
          return NextResponse.json(
            { error: 'Failed to add comment' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Comment added successfully'
        })

      case 'assign_section':
        const { sectionId: assignSectionId, assigneeId } = data
        
        const assignSuccess = await translationCollaborationEngine.assignSection(
          sessionId,
          assignSectionId,
          assigneeId,
          session.user.id
        )
        
        if (!assignSuccess) {
          return NextResponse.json(
            { error: 'Failed to assign section or insufficient permissions' },
            { status: 403 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Section assigned successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Failed to update translation collaboration session:', error)
    return NextResponse.json(
      { error: 'Failed to update translation session' },
      { status: 500 }
    )
  }
}

// Delete Translation Session
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Check if user is the creator or has admin role
    const { data: translationSession } = await supabase
      .from('translation_sessions')
      .select('creator_id')
      .eq('id', sessionId)
      .single()

    if (!translationSession || translationSession.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Translation session not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from database
    await supabase
      .from('translation_sessions')
      .delete()
      .eq('id', sessionId)

    // Note: In production, also clean up in-memory session and notify collaborators

    return NextResponse.json({
      success: true,
      message: 'Translation session deleted successfully'
    })

  } catch (error) {
    logger.error('Failed to delete translation collaboration session:', error)
    return NextResponse.json(
      { error: 'Failed to delete translation session' },
      { status: 500 }
    )
  }
}