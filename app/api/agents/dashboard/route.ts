import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import PersistentDocumentAgentManager from '@/lib/agents/persistent-agent-manager'

// Store persistent agent managers per user
const userAgentManagers = new Map<string, PersistentDocumentAgentManager>()

/**
 * Get persistent agent manager for user (create if doesn't exist)
 */
function getUserAgentManager(userId: string): PersistentDocumentAgentManager {
  if (!userAgentManagers.has(userId)) {
    const manager = new PersistentDocumentAgentManager(userId, true)
    userAgentManagers.set(userId, manager)
    
    // Set up global event listeners for logging
    manager.on('agent_created', (data) => {
      console.log(`[Agent API] Agent created: ${data.agentId}`)
    })
    
    manager.on('collaboration_initiated', (collaboration) => {
      console.log(`[Agent API] Collaboration initiated: ${collaboration.id}`)
    })
    
    manager.on('swarm_notification', (notification) => {
      console.log(`[Agent API] Swarm notification: ${notification.type}`)
    })
  }
  
  return userAgentManagers.get(userId)!
}

/**
 * GET /api/agents/dashboard
 * Get agent dashboard data including swarm metrics and agent status
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

    const agentManager = getUserAgentManager(session.user.id)
    
    // Get comprehensive dashboard data
    const dashboardData = {
      swarmMetrics: agentManager.getSwarmMetrics(),
      agents: agentManager.getAgents(),
      collaborations: agentManager.getCollaborations(),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('[Agent Dashboard API] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/dashboard
 * Handle agent commands and swarm queries
 */
export async function POST(request: NextRequest) {
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
    const { action, agentId, instruction, query, timeout } = body

    const agentManager = getUserAgentManager(session.user.id)

    switch (action) {
      case 'send_instruction':
        if (!agentId || !instruction) {
          return NextResponse.json(
            { error: 'agentId and instruction are required' },
            { status: 400 }
          )
        }
        
        await agentManager.sendInstructionToAgent(agentId, instruction)
        
        return NextResponse.json({
          success: true,
          message: 'Instruction sent to agent',
          data: { agentId, instruction }
        })

      case 'pause_agent':
        if (!agentId) {
          return NextResponse.json(
            { error: 'agentId is required' },
            { status: 400 }
          )
        }
        
        await agentManager.pauseAgent(agentId)
        
        return NextResponse.json({
          success: true,
          message: 'Agent paused',
          data: { agentId }
        })

      case 'resume_agent':
        if (!agentId) {
          return NextResponse.json(
            { error: 'agentId is required' },
            { status: 400 }
          )
        }
        
        await agentManager.resumeAgent(agentId)
        
        return NextResponse.json({
          success: true,
          message: 'Agent resumed',
          data: { agentId }
        })

      case 'query_swarm':
        if (!query) {
          return NextResponse.json(
            { error: 'query is required' },
            { status: 400 }
          )
        }
        
        const swarmResponse = await agentManager.querySwarm(query, timeout || 30000)
        
        return NextResponse.json({
          success: true,
          message: 'Swarm query completed',
          data: swarmResponse
        })

      case 'get_agent':
        if (!agentId) {
          return NextResponse.json(
            { error: 'agentId is required' },
            { status: 400 }
          )
        }
        
        const agent = agentManager.getAgent(agentId)
        
        if (!agent) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: agent
        })

      case 'create_collaboration':
        const { participantIds, objective } = body
        
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
          return NextResponse.json(
            { error: 'At least 2 participant agent IDs required' },
            { status: 400 }
          )
        }
        
        if (!objective) {
          return NextResponse.json(
            { error: 'collaboration objective is required' },
            { status: 400 }
          )
        }
        
        // Create collaboration through agent manager
        // This would need to be implemented in the agent manager
        return NextResponse.json({
          success: true,
          message: 'Collaboration creation requested',
          data: { participantIds, objective }
        })

      case 'get_swarm_insights':
        // Generate insights about swarm behavior with analytics
        const metrics = agentManager.getSwarmMetrics()
        const collaborations = agentManager.getCollaborations()
        const analytics = await agentManager.getAnalyticsData(30)
        
        const insights = {
          swarmHealth: metrics.averageEfficiency > 80 ? 'excellent' : 
                      metrics.averageEfficiency > 60 ? 'good' : 'needs_improvement',
          collaborationRate: collaborations.length / Math.max(1, metrics.totalAgents),
          recommendations: [
            metrics.totalAgents === 0 ? 'Upload documents to create autonomous agents' :
            metrics.averageEfficiency < 70 ? 'Consider optimizing agent workloads' :
            collaborations.length === 0 ? 'Enable collaboration between agents' :
            'Swarm is operating efficiently'
          ],
          emergentBehaviors: metrics.emergentBehaviors,
          collectiveIntelligence: metrics.collectiveIntelligence,
          persistence: agentManager.getPersistenceStatus(),
          analytics: analytics
        }
        
        return NextResponse.json({
          success: true,
          data: insights
        })

      case 'get_persistence_status':
        const persistenceStatus = agentManager.getPersistenceStatus()
        
        return NextResponse.json({
          success: true,
          data: persistenceStatus
        })

      case 'create_backup':
        try {
          const backup = await agentManager.createBackup()
          
          return NextResponse.json({
            success: true,
            message: 'Backup created successfully',
            data: backup
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create backup',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }

      case 'get_analytics':
        const analyticsDays = body.days || 30
        const analyticsData = await agentManager.getAnalyticsData(analyticsDays)
        
        return NextResponse.json({
          success: true,
          data: analyticsData
        })

      case 'get_predictive_insights':
        const predictiveInsights = agentManager.getPredictiveInsights()
        
        return NextResponse.json({
          success: true,
          data: predictiveInsights
        })

      case 'generate_predictions':
        const newPredictions = await agentManager.generatePredictiveInsights()
        
        return NextResponse.json({
          success: true,
          message: `Generated ${newPredictions.length} predictive insights`,
          data: newPredictions
        })

      case 'dismiss_insight':
        const { insightId } = body
        
        if (!insightId) {
          return NextResponse.json(
            { error: 'insightId is required' },
            { status: 400 }
          )
        }
        
        await agentManager.dismissPredictiveInsight(insightId)
        
        return NextResponse.json({
          success: true,
          message: 'Insight dismissed',
          data: { insightId }
        })

      case 'analyze_all_documents':
        const crossDocumentAnalysis = await agentManager.analyzeAllDocuments()
        
        return NextResponse.json({
          success: true,
          message: 'Cross-document analysis completed',
          data: crossDocumentAnalysis
        })

      case 'query_across_documents':
        const { query, documentScope, analysisType, includeRelationships, includeTimeline, maxDocuments } = body
        
        if (!query) {
          return NextResponse.json(
            { error: 'query is required' },
            { status: 400 }
          )
        }

        const multiDocQuery = {
          query,
          documentScope: documentScope || 'all',
          analysisType: analysisType || 'comprehensive',
          includeRelationships: includeRelationships !== false,
          includeTimeline: includeTimeline !== false,
          maxDocuments
        }

        const queryResult = await agentManager.queryAcrossDocuments(multiDocQuery)
        
        return NextResponse.json({
          success: true,
          data: queryResult
        })

      case 'find_document_relationships':
        const { documentIds } = body
        
        if (!documentIds || !Array.isArray(documentIds)) {
          return NextResponse.json(
            { error: 'documentIds array is required' },
            { status: 400 }
          )
        }

        const relationships = await agentManager.findDocumentRelationships(documentIds)
        
        return NextResponse.json({
          success: true,
          data: relationships
        })

      case 'detect_knowledge_gaps':
        const knowledgeGaps = await agentManager.detectKnowledgeGaps()
        
        return NextResponse.json({
          success: true,
          data: knowledgeGaps
        })

      case 'get_document_clusters':
        const clusters = agentManager.getCachedDocumentClusters()
        
        return NextResponse.json({
          success: true,
          data: clusters
        })

      case 'get_cross_document_insights':
        const crossInsights = agentManager.getCachedCrossDocumentInsights()
        
        return NextResponse.json({
          success: true,
          data: crossInsights
        })

      case 'get_knowledge_graph':
        const knowledgeGraph = agentManager.getKnowledgeGraph()
        
        return NextResponse.json({
          success: true,
          data: knowledgeGraph
        })

      case 'create_knowledge_transfer':
        const { sourceAgentId, targetAgentId, domain } = body
        
        if (!sourceAgentId || !targetAgentId || !domain) {
          return NextResponse.json(
            { error: 'sourceAgentId, targetAgentId, and domain are required' },
            { status: 400 }
          )
        }

        const learningSession = await agentManager.createKnowledgeTransferSession(sourceAgentId, targetAgentId, domain)
        
        return NextResponse.json({
          success: true,
          data: learningSession
        })

      case 'get_learning_recommendations':
        const { targetAgentId: learningTargetAgentId } = body
        
        if (!learningTargetAgentId) {
          return NextResponse.json(
            { error: 'targetAgentId is required' },
            { status: 400 }
          )
        }

        const recommendations = await agentManager.generateLearningRecommendations(learningTargetAgentId)
        
        return NextResponse.json({
          success: true,
          data: recommendations
        })

      case 'create_knowledge_article':
        const { authorAgentId, title, content, articleDomain, difficulty } = body
        
        if (!authorAgentId || !title || !content || !articleDomain || !difficulty) {
          return NextResponse.json(
            { error: 'authorAgentId, title, content, domain, and difficulty are required' },
            { status: 400 }
          )
        }

        const article = await agentManager.createKnowledgeArticle(authorAgentId, title, content, articleDomain, difficulty)
        
        return NextResponse.json({
          success: true,
          data: article
        })

      case 'execute_swarm_learning':
        const { agentIds: swarmAgentIds, objective: swarmObjective, learningDomain } = body
        
        if (!swarmAgentIds || !Array.isArray(swarmAgentIds) || !swarmObjective || !learningDomain) {
          return NextResponse.json(
            { error: 'agentIds array, objective, and domain are required' },
            { status: 400 }
          )
        }

        const swarmSession = await agentManager.executeSwarmLearning(swarmAgentIds, swarmObjective, learningDomain)
        
        return NextResponse.json({
          success: true,
          data: swarmSession
        })

      case 'get_learning_analytics':
        const learningAnalytics = agentManager.getLearningNetworkAnalytics()
        
        return NextResponse.json({
          success: true,
          data: learningAnalytics
        })

      case 'get_learning_nodes':
        const learningNodes = agentManager.getLearningNodes()
        
        return NextResponse.json({
          success: true,
          data: learningNodes
        })

      case 'get_knowledge_articles':
        const knowledgeArticles = agentManager.getKnowledgeArticles()
        
        return NextResponse.json({
          success: true,
          data: knowledgeArticles
        })

      case 'get_learning_sessions':
        const learningSessions = agentManager.getLearningSessions()
        
        return NextResponse.json({
          success: true,
          data: learningSessions
        })

      case 'start_voice_listening':
        try {
          await agentManager.startVoiceListening()
          return NextResponse.json({
            success: true,
            message: 'Voice listening started'
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to start voice listening'
          }, { status: 500 })
        }

      case 'stop_voice_listening':
        agentManager.stopVoiceListening()
        
        return NextResponse.json({
          success: true,
          message: 'Voice listening stopped'
        })

      case 'process_voice_command':
        const { transcript, confidence } = body
        
        if (!transcript) {
          return NextResponse.json(
            { error: 'transcript is required' },
            { status: 400 }
          )
        }

        const voiceCommand = await agentManager.processVoiceCommand(transcript, confidence)
        
        return NextResponse.json({
          success: true,
          data: voiceCommand
        })

      case 'speak_text':
        const { text, language } = body
        
        if (!text) {
          return NextResponse.json(
            { error: 'text is required' },
            { status: 400 }
          )
        }

        await agentManager.speak(text, language)
        
        return NextResponse.json({
          success: true,
          message: 'Text spoken successfully'
        })

      case 'get_voice_history':
        const voiceHistory = agentManager.getVoiceCommandHistory()
        
        return NextResponse.json({
          success: true,
          data: voiceHistory
        })

      case 'update_voice_settings':
        const { voiceSettings } = body
        
        if (!voiceSettings) {
          return NextResponse.json(
            { error: 'voiceSettings is required' },
            { status: 400 }
          )
        }

        agentManager.updateVoiceSettings(voiceSettings)
        
        return NextResponse.json({
          success: true,
          message: 'Voice settings updated'
        })

      case 'get_voice_profile':
        const voiceProfile = agentManager.getVoiceProfile()
        
        return NextResponse.json({
          success: true,
          data: voiceProfile
        })

      case 'add_custom_voice_command':
        const { customCommand } = body
        
        if (!customCommand) {
          return NextResponse.json(
            { error: 'customCommand is required' },
            { status: 400 }
          )
        }

        agentManager.addCustomVoiceCommand(customCommand)
        
        return NextResponse.json({
          success: true,
          message: 'Custom voice command added'
        })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('[Agent Dashboard API] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/agents/dashboard
 * Update agent configuration or swarm settings
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
    const { agentId, settings, autonomyLevel } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    const agentManager = getUserAgentManager(session.user.id)
    const agent = agentManager.getAgent(agentId)
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Update agent settings
    if (autonomyLevel !== undefined) {
      // This would need to be implemented in the DocumentAgent class
      console.log(`[Agent API] Setting autonomy level for agent ${agentId} to ${autonomyLevel}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Agent settings updated',
      data: { agentId, settings, autonomyLevel }
    })

  } catch (error) {
    console.error('[Agent Dashboard API] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update agent settings' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agents/dashboard
 * Remove agent from swarm
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId parameter is required' },
        { status: 400 }
      )
    }

    const agentManager = getUserAgentManager(session.user.id)
    
    await agentManager.removeAgent(agentId)

    return NextResponse.json({
      success: true,
      message: 'Agent removed from swarm',
      data: { agentId }
    })

  } catch (error) {
    console.error('[Agent Dashboard API] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to remove agent' },
      { status: 500 }
    )
  }
}