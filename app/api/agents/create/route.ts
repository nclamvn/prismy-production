import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import PersistentDocumentAgentManager from '@/lib/agents/persistent-agent-manager'
import { Document } from '@/components/workspace/types'

// Store persistent agent managers per user
const userAgentManagers = new Map<string, PersistentDocumentAgentManager>()

/**
 * Get persistent agent manager for user (create if doesn't exist)
 */
function getUserAgentManager(userId: string): PersistentDocumentAgentManager {
  if (!userAgentManagers.has(userId)) {
    const manager = new PersistentDocumentAgentManager(userId, true)
    userAgentManagers.set(userId, manager)
  }
  
  return userAgentManagers.get(userId)!
}

/**
 * POST /api/agents/create
 * Create autonomous agent for uploaded document
 */
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

    const body = await request.json()
    const { document, personality } = body

    // Validate document data
    if (!document || !document.id || !document.title || !document.type) {
      return NextResponse.json(
        { error: 'Valid document object is required' },
        { status: 400 }
      )
    }

    // Create document object that matches the Document interface
    const documentData: Document = {
      id: document.id,
      title: document.title,
      type: document.type,
      size: document.size || '0 KB',
      lastModified: document.lastModified || new Date().toISOString(),
      agentsAssigned: [],
      status: 'ready',
      metadata: document.metadata,
      insights: [],
      tags: document.tags || [],
      language: document.language || 'en',
      pageCount: document.pageCount || 1,
      wordCount: document.wordCount || 0
    }

    // Get agent manager
    const agentManager = getUserAgentManager(session.user.id)
    
    // Create autonomous agent
    const documentAgent = await agentManager.createAgent(documentData)
    const agent = documentAgent.getAgent()

    // Update document with assigned agent
    documentData.agentsAssigned = [agent.id]

    console.log(`[Agent Creation] Created agent ${agent.id} for document ${document.title}`)

    // Log agent creation for analytics
    try {
      await supabase.from('agent_creation_logs').insert({
        user_id: session.user.id,
        agent_id: agent.id,
        document_id: document.id,
        document_title: document.title,
        document_type: document.type,
        agent_personality: personality || 'auto-detected',
        agent_specialty: agent.specialty,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('[Agent Creation] Logging error:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Autonomous agent created successfully',
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          nameVi: agent.nameVi,
          specialty: agent.specialty,
          specialtyVi: agent.specialtyVi,
          avatar: agent.avatar,
          status: agent.status,
          personality: agent.personality,
          personalityVi: agent.personalityVi,
          capabilities: agent.capabilities,
          autonomyLevel: 75 // Default autonomy level
        },
        document: documentData,
        swarmSize: agentManager.getSwarmMetrics().totalAgents
      }
    })

  } catch (error) {
    console.error('[Agent Creation API] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create agent', details: error },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/create
 * Get information about agent creation capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const agentManager = getUserAgentManager(session.user.id)
    const metrics = agentManager.getSwarmMetrics()

    // Information about agent creation
    const agentCreationInfo = {
      supportedDocumentTypes: [
        'pdf', 'docx', 'txt', 'image', 'csv'
      ],
      availablePersonalities: [
        {
          type: 'legal',
          name: 'Legal Advisor',
          nameVi: 'Cố vấn Pháp lý',
          description: 'Specializes in legal document analysis, compliance, and risk assessment',
          descriptionVi: 'Chuyên phân tích tài liệu pháp lý, tuân thủ và đánh giá rủi ro',
          avatar: '⚖️',
          bestFor: ['contracts', 'agreements', 'legal documents']
        },
        {
          type: 'financial',
          name: 'Financial Analyst',
          nameVi: 'Chuyên gia Tài chính',
          description: 'Focuses on financial analysis, budgets, and cost optimization',
          descriptionVi: 'Tập trung vào phân tích tài chính, ngân sách và tối ưu hóa chi phí',
          avatar: '💰',
          bestFor: ['budgets', 'financial reports', 'invoices']
        },
        {
          type: 'project',
          name: 'Project Manager',
          nameVi: 'Quản lý Dự án',
          description: 'Manages project timelines, deliverables, and coordination',
          descriptionVi: 'Quản lý thời gian dự án, sản phẩm và điều phối',
          avatar: '📋',
          bestFor: ['project plans', 'timelines', 'schedules']
        },
        {
          type: 'research',
          name: 'Research Specialist',
          nameVi: 'Chuyên gia Nghiên cứu',
          description: 'Conducts research, synthesizes knowledge, and finds insights',
          descriptionVi: 'Thực hiện nghiên cứu, tổng hợp kiến thức và tìm hiểu biết',
          avatar: '🔍',
          bestFor: ['research papers', 'studies', 'reports']
        },
        {
          type: 'general',
          name: 'General Assistant',
          nameVi: 'Trợ lý Tổng quát',
          description: 'Versatile agent for general document assistance',
          descriptionVi: 'Đại lý linh hoạt cho hỗ trợ tài liệu tổng quát',
          avatar: '🤖',
          bestFor: ['general documents', 'mixed content']
        }
      ],
      currentSwarmStatus: {
        totalAgents: metrics.totalAgents,
        maxAgents: 50,
        canCreateMore: metrics.totalAgents < 50,
        averageEfficiency: metrics.averageEfficiency,
        activeCollaborations: metrics.totalCollaborations
      },
      features: {
        autonomousThinking: true,
        continuousMonitoring: true,
        agentCollaboration: true,
        swarmIntelligence: true,
        culturalAdaptation: true,
        personalityDetection: true
      }
    }

    return NextResponse.json({
      success: true,
      data: agentCreationInfo
    })

  } catch (error) {
    console.error('[Agent Creation API] GET Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get agent creation info' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/agents/create
 * Update agent creation settings or bulk create agents
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, documents, settings } = body

    const agentManager = getUserAgentManager(session.user.id)

    if (action === 'bulk_create') {
      if (!documents || !Array.isArray(documents)) {
        return NextResponse.json(
          { error: 'documents array is required for bulk creation' },
          { status: 400 }
        )
      }

      const results = []
      const errors = []

      for (const doc of documents) {
        try {
          const documentData: Document = {
            id: doc.id,
            title: doc.title,
            type: doc.type,
            size: doc.size || '0 KB',
            lastModified: doc.lastModified || new Date().toISOString(),
            agentsAssigned: [],
            status: 'ready',
            metadata: doc.metadata,
            insights: [],
            tags: doc.tags || [],
            language: doc.language || 'en',
            pageCount: doc.pageCount || 1,
            wordCount: doc.wordCount || 0
          }

          const documentAgent = await agentManager.createAgent(documentData)
          const agent = documentAgent.getAgent()

          results.push({
            documentId: doc.id,
            agentId: agent.id,
            agentName: agent.name,
            agentSpecialty: agent.specialty
          })

        } catch (error) {
          errors.push({
            documentId: doc.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk agent creation completed: ${results.length} successful, ${errors.length} failed`,
        data: {
          successful: results,
          failed: errors,
          swarmSize: agentManager.getSwarmMetrics().totalAgents
        }
      })
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Agent Creation API] PUT Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process bulk request' },
      { status: 500 }
    )
  }
}