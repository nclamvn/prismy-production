import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { validateCSRFMiddleware } from '@/lib/csrf'
import { aiOrchestrator } from '@/lib/ai/ai-orchestrator'
import { backgroundQueue } from '@/lib/background-processing-queue'
import { documentIntelligenceOrchestrator } from '@/lib/ai/document-intelligence-orchestrator'
import { intelligenceJobProcessor } from '@/lib/ai/intelligence-job-processor'
import { streamingProcessor } from '@/lib/ai/streaming-processor'
import { semanticSearchEngine } from '@/lib/ai/semantic-search-engine'
import { analytics } from '@/lib/analytics'
import { logger, performanceLogger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { getAgentManager } from '@/lib/agents/agent-manager'

export interface IntelligenceProcessingRequest {
  file: File
  options: {
    analysisDepth: 'quick' | 'standard' | 'comprehensive'
    language?: string
    domain?: string
    enablePredictiveInsights?: boolean
    userContext?: {
      previousDocuments?: string[]
      currentProjects?: string[]
      expertiseDomains?: string[]
    }
  }
}

export interface InstantIntelligence {
  documentId: string
  quickInsights: {
    documentType: string
    detectedLanguage: string
    estimatedReadingTime: number
    keyTopics: string[]
    complexity: 'low' | 'medium' | 'high'
    confidence: number
  }
  processingRecommendations: {
    suggestedAnalysisDepth: 'quick' | 'standard' | 'comprehensive'
    estimatedProcessingTime: number
    recommendedFeatures: string[]
  }
  backgroundJobId: string
  estimatedCompletion: Date
  documentAgent: {
    agentId: string
    personality: string
    autonomyLevel: number
    capabilities: string[]
    status: string
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Authentication and authorization
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required for document intelligence' },
        { status: 401 }
      )
    }

    // CSRF validation
    const csrfValidation = await validateCSRFMiddleware(
      request,
      session.user.id
    )
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }

    // Get user profile and subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, usage_count, preferences')
      .eq('user_id', session.user.id)
      .single()

    const userTier = profile?.subscription_tier || 'free'

    // Rate limiting based on tier
    const rateLimitResult = await getRateLimitForTier(request, userTier as any)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Document intelligence rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
          tier: userTier,
        },
        { status: 429 }
      )
    }

    // Parse form data (multipart/form-data for file upload)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsStr = formData.get('options') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const options = optionsStr ? JSON.parse(optionsStr) : {}

    // Validate file type and size
    const maxSizeMB =
      userTier === 'free' ? 10 : userTier === 'premium' ? 50 : 100
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size for ${userTier} tier: ${maxSizeMB}MB`,
        },
        { status: 400 }
      )
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    logger.info(
      {
        documentId,
        filename: file.name,
        size: file.size,
        type: file.type,
        userId: session.user.id,
        tier: userTier,
        options,
      },
      'Starting intelligent document processing'
    )

    // Stage 1: Instant Intelligence (< 2 seconds)
    const quickAnalysisStart = Date.now()

    // Convert File to Buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Quick document analysis for immediate feedback
    const quickInsights = await generateQuickInsights(
      fileBuffer,
      file.name,
      file.type,
      options
    )

    const quickAnalysisTime = Date.now() - quickAnalysisStart

    // Get user's document context for contextual processing
    const userContext = await getUserDocumentContext(session.user.id, supabase)

    // Revolutionary Feature: Create Autonomous Document Agent
    const agentManager = getAgentManager(session.user.id)

    // Create preliminary document intelligence for agent creation
    const preliminaryIntelligence = {
      documentId,
      insights: {
        classification: {
          documentType: quickInsights.documentType,
          domain: 'general', // Will be enhanced by full analysis
        },
        confidence: quickInsights.confidence,
        topics: quickInsights.keyTopics,
      },
      content: {
        keyEntities: [], // Will be populated by background processing
        concepts: [],
        fullText: '', // Will be extracted in background
      },
      structure: {
        metadata: {
          filename: file.name,
          wordCount: Math.ceil(file.size / 6), // Rough estimate
          pageCount: Math.ceil(file.size / 3000), // Rough estimate
          language: quickInsights.detectedLanguage,
        },
      },
    }

    // Create autonomous agent for this document
    const documentAgent = await agentManager.createAgentForDocument(
      documentId,
      preliminaryIntelligence,
      {
        userTier,
        preferences: options,
        context: userContext,
      }
    )

    const agentStatus = await documentAgent.getAgentStatus()

    // Stage 2: Background Deep Analysis Pipeline
    const backgroundJobId = await createIntelligenceJob(
      documentId,
      fileBuffer,
      file.name,
      file.type,
      {
        ...options,
        userId: session.user.id,
        userTier,
        userContext,
        agentId: documentAgent.agentId, // Pass agent ID for integration
      }
    )

    // Calculate processing estimates based on file size and user tier
    const processingEstimates = calculateProcessingEstimates(
      file.size,
      file.type,
      options.analysisDepth || 'standard',
      userTier
    )

    const instantIntelligence: InstantIntelligence = {
      documentId,
      quickInsights,
      processingRecommendations: processingEstimates.recommendations as any,
      backgroundJobId,
      estimatedCompletion: new Date(
        Date.now() + processingEstimates.estimatedMs
      ),
      documentAgent: {
        agentId: documentAgent.agentId,
        personality: documentAgent.personality,
        autonomyLevel: agentStatus.autonomyLevel,
        capabilities: getAgentCapabilities(documentAgent.personality),
        status: agentStatus.state,
      },
    }

    // Track analytics
    analytics.track('document_intelligence_started', {
      documentId,
      filename: file.name,
      fileSize: file.size,
      analysisDepth: options.analysisDepth || 'standard',
      quickAnalysisTime,
      userId: session.user.id,
      tier: userTier,
    })

    const totalResponseTime = Date.now() - startTime

    performanceLogger.info(
      {
        operation: 'document_intelligence_instant',
        documentId,
        responseTime: totalResponseTime,
        quickAnalysisTime,
        fileSize: file.size,
      },
      'Instant intelligence completed'
    )

    return NextResponse.json({
      success: true,
      documentId,
      intelligence: instantIntelligence,
      processingTime: totalResponseTime,
    })
  } catch (error) {
    logger.error(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
        userId: session?.user?.id,
      },
      'Document intelligence processing failed'
    )

    return NextResponse.json(
      {
        error: 'Document intelligence processing failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to process document for intelligence analysis',
      },
      { status: 500 }
    )
  }
}

// Quick insights generation (< 2 seconds)
async function generateQuickInsights(
  fileBuffer: Buffer,
  filename: string,
  fileType: string,
  options: any
): Promise<InstantIntelligence['quickInsights']> {
  try {
    // Enhanced quick analysis using real AI for better accuracy
    logger.info('Generating enhanced quick insights', { 
      filename, 
      fileType, 
      bufferSize: fileBuffer.length 
    })

    // Try to extract a small text sample for AI analysis
    let textSample = ''
    try {
      // For text files, use buffer content directly
      if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) {
        textSample = fileBuffer.toString('utf8').substring(0, 2000)
      } else {
        // For other files, use filename and metadata for analysis
        textSample = `Filename: ${filename}\nFile type: ${fileType}\nFile size: ${fileBuffer.length} bytes`
      }
    } catch (error) {
      logger.warn('Failed to extract text sample, using metadata only')
      textSample = `Filename: ${filename}\nFile type: ${fileType}`
    }

    // Use AI for enhanced quick analysis if we have a reasonable text sample
    if (textSample.length > 20) {
      try {
        const quickAnalysisResult = await documentIntelligenceOrchestrator.analyzeDocument({
          content: textSample,
          analysisDepth: 'quick',
          detectLanguage: true,
          extractKeyTerms: true,
          identifyTopics: true,
          analyzeComplexity: true,
          userTier: options.userTier || 'free'
        })

        if (quickAnalysisResult.success && quickAnalysisResult.documentInfo) {
          const documentInfo = quickAnalysisResult.documentInfo
          
          return {
            documentType: documentInfo.type || detectDocumentType(filename, fileType),
            detectedLanguage: documentInfo.language || options.language || 'auto',
            estimatedReadingTime: Math.ceil(documentInfo.wordCount / 200) || Math.ceil(fileBuffer.length / 1000),
            keyTopics: quickAnalysisResult.topics?.map(t => t.topic) || extractQuickTopics(filename, fileType),
            complexity: documentInfo.complexity || estimateComplexity(fileBuffer.length, fileType),
            confidence: documentInfo.confidence || 0.85,
          }
        }
      } catch (aiError) {
        logger.warn('AI quick analysis failed, falling back to heuristics', { error: aiError })
      }
    }

    // Fallback to enhanced heuristic analysis
    const documentType = detectDocumentType(filename, fileType)
    const detectedLanguage = options.language || (await detectLanguageQuick(fileBuffer, fileType))
    const complexity = estimateComplexity(fileBuffer.length, fileType)
    const estimatedReadingTime = Math.ceil(fileBuffer.length / 1000)
    const keyTopics = extractQuickTopics(filename, fileType)

    return {
      documentType,
      detectedLanguage,
      estimatedReadingTime,
      keyTopics,
      complexity,
      confidence: 0.75, // Slightly lower confidence for heuristic analysis
    }
  } catch (error) {
    logger.warn(
      { error, filename },
      'Enhanced quick insights generation failed, using fallback'
    )

    return {
      documentType: 'document',
      detectedLanguage: 'auto',
      estimatedReadingTime: 5,
      keyTopics: [],
      complexity: 'medium',
      confidence: 0.5,
    }
  }
}

// Create background intelligence processing job
async function createIntelligenceJob(
  documentId: string,
  fileBuffer: Buffer,
  filename: string,
  fileType: string,
  options: any
): Promise<string> {
  try {
    logger.info('Creating enhanced intelligence job', {
      documentId,
      filename,
      fileSize: fileBuffer.length,
      analysisDepth: options.analysisDepth || 'standard',
      userTier: options.userTier
    })

    // Extract text content for processing (if possible)
    let extractedContent = ''
    try {
      if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) {
        extractedContent = fileBuffer.toString('utf8')
      } else if (fileType.includes('pdf') || fileType.includes('document')) {
        // For binary files, we'll need OCR or document parsing
        // For now, use filename and metadata
        extractedContent = `Document: ${filename}\nType: ${fileType}\nSize: ${fileBuffer.length} bytes`
      }
    } catch (error) {
      logger.warn('Failed to extract content for intelligence job')
      extractedContent = `Document: ${filename}\nType: ${fileType}`
    }

    // Determine if we should use streaming processing for large files
    const shouldUseStreaming = extractedContent.length > 100000 // 100KB threshold
    
    if (shouldUseStreaming) {
      logger.info('Using streaming processing for large document', {
        contentLength: extractedContent.length,
        documentId
      })
      
      // Create streaming intelligence job
      const jobId = await intelligenceJobProcessor.addJob({
        type: 'document_analysis',
        priority: options.userTier === 'enterprise' ? 'high' : 
                 options.userTier === 'premium' ? 'medium' : 'low',
        data: {
          documentId,
          content: extractedContent,
          filename,
          fileType,
          documentType: options.documentType,
          language: options.language,
          useStreaming: true,
          options: {
            analysisDepth: options.analysisDepth || 'standard',
            extractEntities: true,
            generateEmbeddings: options.analysisDepth !== 'quick',
            buildKnowledgeGraph: options.analysisDepth === 'comprehensive',
            createSummary: true,
            extractKeyTerms: true,
            identifyTopics: true,
            analyzeComplexity: true,
            detectLanguage: !options.language
          },
          userTier: options.userTier || 'free',
          userId: options.userId,
          agentId: options.agentId,
          userContext: options.userContext
        }
      })
      
      return jobId
    } else {
      // Use standard processing for smaller files
      const jobId = await intelligenceJobProcessor.addJob({
        type: 'document_analysis',
        priority: options.userTier === 'enterprise' ? 'high' : 
                 options.userTier === 'premium' ? 'medium' : 'low',
        data: {
          documentId,
          content: extractedContent,
          filename,
          fileType,
          documentType: options.documentType,
          language: options.language,
          useStreaming: false,
          options: {
            analysisDepth: options.analysisDepth || 'standard',
            extractEntities: true,
            generateEmbeddings: options.analysisDepth !== 'quick',
            buildKnowledgeGraph: options.analysisDepth === 'comprehensive',
            createSummary: true,
            extractKeyTerms: true,
            identifyTopics: true,
            analyzeComplexity: true,
            detectLanguage: !options.language
          },
          userTier: options.userTier || 'free',
          userId: options.userId,
          agentId: options.agentId,
          userContext: options.userContext
        }
      })
      
      return jobId
    }

    logger.info(`Enhanced intelligence job created: ${jobId}`)
    return jobId

  } catch (error) {
    logger.error('Failed to create enhanced intelligence job:', error)
    
    // Fallback to simple job creation
    const fallbackJobId = `intelligence_fallback_${documentId}`
    
    await backgroundQueue.addJob({
      type: 'document_intelligence',
      priority: options.userTier === 'enterprise' ? 'high' : 'medium',
      userId: options.userId,
      maxRetries: 3,
      data: {
        documentId,
        fileBuffer: fileBuffer.toString('base64'),
        filename,
        fileType,
        options,
      },
      metadata: {
        filename,
        fileSize: fileBuffer.length,
        analysisDepth: options.analysisDepth || 'standard',
      },
    })
    
    return fallbackJobId
  }
}

// Get user's document context for personalized processing
async function getUserDocumentContext(userId: string, supabase: any) {
  try {
    // Get user's recent documents for context
    const { data: recentDocs } = await supabase
      .from('document_intelligence')
      .select('document_id, insights, entities, concepts')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user's query history for understanding interests
    const { data: queryHistory } = await supabase
      .from('document_queries')
      .select('query, context, document_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    return {
      recentDocuments: recentDocs || [],
      queryHistory: queryHistory || [],
      expertiseDomains: extractExpertiseDomains(recentDocs || []),
      commonTopics: extractCommonTopics(recentDocs || []),
    }
  } catch (error) {
    logger.warn({ error, userId }, 'Failed to get user document context')
    return {
      recentDocuments: [],
      queryHistory: [],
      expertiseDomains: [],
      commonTopics: [],
    }
  }
}

// Helper functions
function detectDocumentType(filename: string, fileType: string): string {
  if (fileType.includes('pdf')) return 'PDF Document'
  if (fileType.includes('word') || filename.endsWith('.docx'))
    return 'Word Document'
  if (fileType.includes('spreadsheet') || filename.endsWith('.xlsx'))
    return 'Spreadsheet'
  if (fileType.includes('image')) return 'Image Document'
  if (filename.includes('contract')) return 'Contract'
  if (filename.includes('report')) return 'Report'
  if (filename.includes('invoice')) return 'Invoice'
  return 'Document'
}

async function detectLanguageQuick(
  fileBuffer: Buffer,
  fileType: string
): Promise<string> {
  // Quick language detection - can be enhanced with AI in background
  return 'auto' // Fallback to auto-detection
}

function estimateComplexity(
  fileSize: number,
  fileType: string
): 'low' | 'medium' | 'high' {
  if (fileSize < 100000) return 'low' // < 100KB
  if (fileSize < 1000000) return 'medium' // < 1MB
  return 'high' // > 1MB
}

function extractQuickTopics(filename: string, fileType: string): string[] {
  const topics: string[] = []
  const name = filename.toLowerCase()

  // Basic keyword extraction from filename
  if (name.includes('financial') || name.includes('budget'))
    topics.push('Finance')
  if (name.includes('contract') || name.includes('agreement'))
    topics.push('Legal')
  if (name.includes('report') || name.includes('analysis'))
    topics.push('Business')
  if (name.includes('technical') || name.includes('spec'))
    topics.push('Technical')
  if (name.includes('meeting') || name.includes('notes'))
    topics.push('Meetings')

  return topics
}

function calculateProcessingEstimates(
  fileSize: number,
  fileType: string,
  analysisDepth: string,
  userTier: string
) {
  const baseTimeMs = Math.max(10000, fileSize / 1000) // Minimum 10 seconds

  const depthMultiplier =
    {
      quick: 1,
      standard: 2,
      comprehensive: 4,
    }[analysisDepth] || 2

  const tierMultiplier =
    {
      free: 2,
      premium: 1.5,
      enterprise: 1,
    }[userTier] || 2

  const estimatedMs = baseTimeMs * depthMultiplier * tierMultiplier

  return {
    estimatedMs,
    recommendations: {
      suggestedAnalysisDepth: fileSize > 5000000 ? 'comprehensive' : 'standard',
      estimatedProcessingTime: Math.ceil(estimatedMs / 1000),
      recommendedFeatures: [
        'semantic_search',
        'question_answering',
        ...(userTier !== 'free'
          ? ['knowledge_graph', 'predictive_insights']
          : []),
      ],
    },
  }
}

function extractExpertiseDomains(documents: any[]): string[] {
  // Extract domains from user's document history
  const domains = new Set<string>()
  documents.forEach(doc => {
    if (doc.insights?.classification?.domain) {
      domains.add(doc.insights.classification.domain)
    }
  })
  return Array.from(domains)
}

function extractCommonTopics(documents: any[]): string[] {
  // Extract common topics from user's documents
  const topicCounts = new Map<string, number>()
  documents.forEach(doc => {
    if (doc.insights?.topics) {
      doc.insights.topics.forEach((topic: any) => {
        topicCounts.set(topic.name, (topicCounts.get(topic.name) || 0) + 1)
      })
    }
  })

  return Array.from(topicCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic]) => topic)
}

// GET endpoint to check processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const documentId = searchParams.get('documentId')

    if (!jobId && !documentId) {
      return NextResponse.json(
        { error: 'Job ID or Document ID required' },
        { status: 400 }
      )
    }

    // Get job status from background queue
    const job = await backgroundQueue.getJob(
      jobId || `intelligence_${documentId}`
    )

    if (!job) {
      return NextResponse.json(
        { error: 'Processing job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        estimatedDuration: job.estimatedDuration,
        result: job.result,
        error: job.error,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get intelligence processing status')

    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    )
  }
}

// Helper function to determine agent capabilities based on personality
function getAgentCapabilities(personality: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    legal: [
      'Contract monitoring and expiration alerts',
      'Legal compliance checking',
      'Risk assessment and mitigation',
      'Regulatory requirement tracking',
      'Legal deadline management',
    ],
    financial: [
      'Budget tracking and variance analysis',
      'Financial metric monitoring',
      'Cost optimization suggestions',
      'ROI calculations and projections',
      'Expense categorization and reporting',
    ],
    project: [
      'Milestone and deadline tracking',
      'Resource allocation monitoring',
      'Progress reporting and alerts',
      'Dependency management',
      'Risk identification and mitigation',
    ],
    research: [
      'Literature review and synthesis',
      'Trend identification and analysis',
      'Research gap detection',
      'Citation and reference management',
      'Knowledge discovery and connections',
    ],
    general: [
      'Content summarization and analysis',
      'Topic extraction and categorization',
      'Information retrieval and search',
      'Cross-document relationship mapping',
      'Intelligent notifications and reminders',
    ],
  }

  return capabilityMap[personality] || capabilityMap.general
}
