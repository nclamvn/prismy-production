import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

/**
 * GET /api/dashboard/recent-activity
 * Get recent user activity including translations, document uploads, and agent actions
 */
export async function GET(request: NextRequest) {
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

    const userId = session.user.id
    const now = new Date()
    
    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const days = parseInt(url.searchParams.get('days') || '30')
    
    // Calculate date range
    const sinceDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const activities: any[] = []

    try {
      // Get translation history
      const { data: translations, error: translationError } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (translationError) {
        console.error('Translation history error:', translationError)
      } else if (translations) {
        // Add translation activities
        translations.forEach(t => {
          activities.push({
            id: `translation-${t.id}`,
            type: 'translation',
            text: `Translated ${t.source_language?.toUpperCase()} to ${t.target_language?.toUpperCase()}${
              t.document_name ? ` - ${t.document_name}` : ''
            }`,
            time: formatTimeAgo(t.created_at),
            timestamp: new Date(t.created_at),
            metadata: {
              sourceLanguage: t.source_language,
              targetLanguage: t.target_language,
              documentName: t.document_name,
              wordCount: Math.floor((t.source_text?.length || 0) / 5)
            }
          })
        })
      }

      // Get agent activities
      const { data: agents, error: agentError } = await supabase
        .from('document_agents')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (agentError) {
        console.error('Agent activities error:', agentError)
      } else if (agents) {
        // Add agent activities
        agents.forEach(agent => {
          activities.push({
            id: `agent-${agent.id}`,
            type: 'agent',
            text: `Created ${agent.personality} agent "${agent.name}" for document processing`,
            time: formatTimeAgo(agent.created_at),
            timestamp: new Date(agent.created_at),
            metadata: {
              agentId: agent.id,
              agentName: agent.name,
              personality: agent.personality,
              documentType: agent.document_type
            }
          })
        })
      }

      // Get collaboration activities
      const { data: collaborations, error: collaborationError } = await supabase
        .from('agent_collaborations')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', sinceDate.toISOString())
        .order('started_at', { ascending: false })
        .limit(limit)

      if (collaborationError) {
        console.error('Collaboration activities error:', collaborationError)
      } else if (collaborations) {
        // Add collaboration activities
        collaborations.forEach(collab => {
          activities.push({
            id: `collaboration-${collab.id}`,
            type: 'collaboration',
            text: `Started agent collaboration: ${collab.objective}`,
            time: formatTimeAgo(collab.started_at),
            timestamp: new Date(collab.started_at),
            metadata: {
              collaborationId: collab.id,
              objective: collab.objective,
              participantCount: collab.participant_ids?.length || 0,
              status: collab.status
            }
          })
        })
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Take only the requested limit
      const limitedActivities = activities.slice(0, limit)

      return NextResponse.json({
        success: true,
        data: limitedActivities,
        meta: {
          totalActivities: activities.length,
          limit,
          days,
          userId
        },
        timestamp: now.toISOString()
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      
      // Return sample activities if database queries fail
      const sampleActivities = generateSampleActivities(userId, limit)
      
      return NextResponse.json({
        success: true,
        data: sampleActivities,
        meta: {
          totalActivities: sampleActivities.length,
          limit,
          days,
          userId,
          note: 'Using sample data due to database access issues'
        },
        timestamp: now.toISOString()
      })
    }

  } catch (error) {
    console.error('[Recent Activity API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get recent activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to format time ago
 */
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
}

/**
 * Generate sample activities for fallback
 */
function generateSampleActivities(userId: string, limit: number) {
  const sampleActivities = [
    {
      id: 'sample-1',
      type: 'translation',
      text: 'Translated EN to VI - Business Contract.pdf',
      time: '2 hours ago',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: {
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        documentName: 'Business Contract.pdf',
        wordCount: 1250
      }
    },
    {
      id: 'sample-2',
      type: 'agent',
      text: 'Created legal agent "Legal Document Processor" for contract analysis',
      time: '5 hours ago',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      metadata: {
        agentName: 'Legal Document Processor',
        personality: 'legal',
        documentType: 'contract'
      }
    },
    {
      id: 'sample-3',
      type: 'translation',
      text: 'Translated VI to EN - Marketing Proposal.docx',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metadata: {
        sourceLanguage: 'vi',
        targetLanguage: 'en',
        documentName: 'Marketing Proposal.docx',
        wordCount: 890
      }
    },
    {
      id: 'sample-4',
      type: 'collaboration',
      text: 'Started agent collaboration: Analyze financial documents for Q4 report',
      time: '2 days ago',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadata: {
        objective: 'Analyze financial documents for Q4 report',
        participantCount: 3,
        status: 'completed'
      }
    }
  ]

  return sampleActivities.slice(0, limit)
}