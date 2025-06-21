import { aiOrchestrator } from './ai-orchestrator'
import { semanticSearchEngine } from './semantic-search-engine'
import { multilingualQAEngine } from './multilingual-qa-engine'
import { knowledgeGraphEngine } from './knowledge-graph-engine'
import { backgroundQueue, ProcessingJob } from '../background-processing-queue'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger, performanceLogger } from '@/lib/logger'
import { analytics } from '../analytics'

export interface IntelligenceStage {
  name: string
  description: string
  estimatedDuration: number
  weight: number // For progress calculation
}

export interface IntelligenceJobData {
  documentId: string
  fileBuffer: string // base64 encoded
  filename: string
  fileType: string
  options: {
    analysisDepth: 'quick' | 'standard' | 'comprehensive'
    language?: string
    domain?: string
    enablePredictiveInsights?: boolean
    userId: string
    userTier: string
    userContext: {
      recentDocuments: any[]
      queryHistory: any[]
      expertiseDomains: string[]
      commonTopics: string[]
    }
  }
}

export interface IntelligenceResult {
  documentId: string
  documentIntelligence: any
  semanticIndex: any
  knowledgeGraph: any
  predictiveInsights?: any
  crossDocumentConnections?: any
  processingMetrics: {
    totalTime: number
    stageTimings: Record<string, number>
    aiModelsUsed: string[]
    tokensConsumed: number
    confidenceScores: Record<string, number>
  }
}

export class IntelligenceJobProcessor {
  private readonly stages: IntelligenceStage[] = [
    {
      name: 'structural_analysis',
      description: 'Extract document structure and content',
      estimatedDuration: 15000, // 15 seconds
      weight: 0.2
    },
    {
      name: 'semantic_indexing', 
      description: 'Generate semantic embeddings and index',
      estimatedDuration: 10000, // 10 seconds
      weight: 0.15
    },
    {
      name: 'entity_extraction',
      description: 'Extract entities and concepts',
      estimatedDuration: 20000, // 20 seconds
      weight: 0.25
    },
    {
      name: 'knowledge_integration',
      description: 'Integrate with knowledge graph',
      estimatedDuration: 15000, // 15 seconds
      weight: 0.2
    },
    {
      name: 'contextual_enhancement',
      description: 'Apply user context and patterns',
      estimatedDuration: 10000, // 10 seconds
      weight: 0.1
    },
    {
      name: 'predictive_insights',
      description: 'Generate predictive insights',
      estimatedDuration: 10000, // 10 seconds
      weight: 0.1
    }
  ]

  async processIntelligenceJob(job: ProcessingJob): Promise<IntelligenceResult> {
    const startTime = Date.now()
    const jobData = job.data as IntelligenceJobData
    const stageTimings: Record<string, number> = {}
    const aiModelsUsed: string[] = []
    let totalTokensConsumed = 0

    logger.info({
      jobId: job.id,
      documentId: jobData.documentId,
      analysisDepth: jobData.options.analysisDepth,
      userId: jobData.options.userId
    }, 'Starting intelligence job processing')

    try {
      // Update job status
      await this.updateJobProgress(job.id, 0, 'Starting intelligent analysis...')

      // Convert base64 back to buffer
      const fileBuffer = Buffer.from(jobData.fileBuffer, 'base64')

      // Filter stages based on analysis depth
      const selectedStages = this.selectStages(jobData.options.analysisDepth, jobData.options.userTier)
      let currentProgress = 0

      // Stage 1: Structural Analysis and Content Extraction
      const structuralStart = Date.now()
      await this.updateJobProgress(job.id, 5, 'Extracting document structure...')

      const documentIntelligence = await aiOrchestrator.processDocumentIntelligence(
        jobData.documentId,
        fileBuffer,
        jobData.filename,
        {
          language: jobData.options.language,
          domain: jobData.options.domain,
          analysisDepth: jobData.options.analysisDepth === 'comprehensive' ? 'comprehensive' : 'standard'
        }
      )

      stageTimings.structural_analysis = Date.now() - structuralStart
      currentProgress += 20
      await this.updateJobProgress(job.id, currentProgress, 'Document structure extracted')

      // Stage 2: Semantic Indexing
      if (selectedStages.includes('semantic_indexing')) {
        const semanticStart = Date.now()
        await this.updateJobProgress(job.id, currentProgress + 5, 'Building semantic index...')

        const semanticIndex = await this.buildSemanticIndex(
          jobData.documentId,
          documentIntelligence,
          jobData.options
        )

        stageTimings.semantic_indexing = Date.now() - semanticStart
        currentProgress += 15
        await this.updateJobProgress(job.id, currentProgress, 'Semantic index created')
      }

      // Stage 3: Entity Extraction and Concept Mapping
      if (selectedStages.includes('entity_extraction')) {
        const entityStart = Date.now()
        await this.updateJobProgress(job.id, currentProgress + 5, 'Extracting entities and concepts...')

        const enhancedIntelligence = await this.enhanceWithEntitiesAndConcepts(
          documentIntelligence,
          jobData.options
        )

        Object.assign(documentIntelligence, enhancedIntelligence)
        stageTimings.entity_extraction = Date.now() - entityStart
        currentProgress += 25
        await this.updateJobProgress(job.id, currentProgress, 'Entities and concepts extracted')
      }

      // Stage 4: Knowledge Graph Integration
      let knowledgeGraph = null
      if (selectedStages.includes('knowledge_integration')) {
        const kgStart = Date.now()
        await this.updateJobProgress(job.id, currentProgress + 5, 'Integrating with knowledge graph...')

        knowledgeGraph = await this.integrateWithKnowledgeGraph(
          documentIntelligence,
          jobData.options.userContext,
          jobData.options.userId
        )

        stageTimings.knowledge_integration = Date.now() - kgStart
        currentProgress += 20
        await this.updateJobProgress(job.id, currentProgress, 'Knowledge graph updated')
      }

      // Stage 5: Contextual Enhancement
      if (selectedStages.includes('contextual_enhancement')) {
        const contextStart = Date.now()
        await this.updateJobProgress(job.id, currentProgress + 2, 'Applying contextual enhancements...')

        const contextualEnhancements = await this.applyContextualEnhancements(
          documentIntelligence,
          jobData.options.userContext,
          jobData.options.userId
        )

        Object.assign(documentIntelligence, { contextualEnhancements })
        stageTimings.contextual_enhancement = Date.now() - contextStart
        currentProgress += 10
        await this.updateJobProgress(job.id, currentProgress, 'Contextual enhancements applied')
      }

      // Stage 6: Predictive Insights (Premium/Enterprise only)
      let predictiveInsights = null
      if (selectedStages.includes('predictive_insights') && jobData.options.enablePredictiveInsights) {
        const predictiveStart = Date.now()
        await this.updateJobProgress(job.id, currentProgress + 2, 'Generating predictive insights...')

        predictiveInsights = await this.generatePredictiveInsights(
          documentIntelligence,
          jobData.options.userContext,
          jobData.options.userId
        )

        stageTimings.predictive_insights = Date.now() - predictiveStart
        currentProgress += 10
        await this.updateJobProgress(job.id, currentProgress, 'Predictive insights generated')
      }

      // Final stage: Save results to database
      await this.updateJobProgress(job.id, 95, 'Saving intelligence results...')
      
      await this.saveIntelligenceResults(
        jobData.documentId,
        documentIntelligence,
        knowledgeGraph,
        predictiveInsights,
        jobData.options.userId
      )

      const totalTime = Date.now() - startTime

      const result: IntelligenceResult = {
        documentId: jobData.documentId,
        documentIntelligence,
        semanticIndex: null, // Will be stored separately
        knowledgeGraph,
        predictiveInsights,
        processingMetrics: {
          totalTime,
          stageTimings,
          aiModelsUsed,
          tokensConsumed: totalTokensConsumed,
          confidenceScores: this.calculateConfidenceScores(documentIntelligence)
        }
      }

      await this.updateJobProgress(job.id, 100, 'Intelligence processing completed')

      // Track completion analytics
      analytics.track('document_intelligence_completed', {
        documentId: jobData.documentId,
        userId: jobData.options.userId,
        analysisDepth: jobData.options.analysisDepth,
        totalTime,
        stageTimings,
        confidenceScores: result.processingMetrics.confidenceScores
      })

      performanceLogger.info({
        operation: 'intelligence_job_completed',
        documentId: jobData.documentId,
        totalTime,
        stageTimings,
        stages: selectedStages
      }, 'Intelligence processing completed successfully')

      return result

    } catch (error) {
      logger.error({ 
        error, 
        jobId: job.id, 
        documentId: jobData.documentId 
      }, 'Intelligence job processing failed')

      await this.updateJobProgress(job.id, -1, `Processing failed: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  private selectStages(analysisDepth: string, userTier: string): string[] {
    const baseStages = ['structural_analysis', 'semantic_indexing', 'entity_extraction']
    
    if (analysisDepth === 'quick') {
      return baseStages
    }

    const standardStages = [...baseStages, 'knowledge_integration', 'contextual_enhancement']
    
    if (analysisDepth === 'standard') {
      return standardStages
    }

    // Comprehensive analysis
    const comprehensiveStages = [...standardStages, 'predictive_insights']
    
    // Predictive insights only for premium/enterprise
    if (userTier === 'free') {
      return standardStages
    }

    return comprehensiveStages
  }

  private async buildSemanticIndex(
    documentId: string,
    documentIntelligence: any,
    options: any
  ) {
    try {
      // Index the document for semantic search
      await semanticSearchEngine.indexDocument(
        documentId,
        documentIntelligence.content.fullText,
        documentIntelligence.structure,
        {
          language: options.language,
          domain: options.domain,
          extractKeywords: true,
          extractEntities: true,
          extractConcepts: true
        }
      )

      return { indexed: true, documentId }
    } catch (error) {
      logger.warn({ error, documentId }, 'Semantic indexing failed')
      return { indexed: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private async enhanceWithEntitiesAndConcepts(
    documentIntelligence: any,
    options: any
  ) {
    try {
      // Use AI to extract enhanced entities and concepts
      const enhancementRequest = {
        id: `enhance_${Date.now()}`,
        type: 'extraction' as const,
        priority: 'medium' as const,
        input: {
          text: documentIntelligence.content.fullText,
          context: {
            domain: options.domain,
            language: options.language
          }
        },
        requirements: {
          accuracy: 'balanced' as const,
          languages: [options.language || 'en']
        }
      }

      const enhancementResponse = await aiOrchestrator.processDocumentIntelligence(
        documentIntelligence.documentId,
        Buffer.from(''), // Already processed
        '',
        { analysisDepth: 'basic' }
      )

      return {
        enhancedEntities: enhancementResponse.content.keyEntities,
        enhancedConcepts: enhancementResponse.content.concepts,
        enhancedRelationships: enhancementResponse.content.relationships
      }
    } catch (error) {
      logger.warn({ error }, 'Entity enhancement failed')
      return {
        enhancedEntities: [],
        enhancedConcepts: [],
        enhancedRelationships: []
      }
    }
  }

  private async integrateWithKnowledgeGraph(
    documentIntelligence: any,
    userContext: any,
    userId: string
  ) {
    try {
      // Build knowledge graph nodes for this document
      const nodes = await knowledgeGraphEngine.createDocumentNodes(
        documentIntelligence,
        userContext.recentDocuments
      )

      // Find connections to existing user documents
      const connections = await knowledgeGraphEngine.findConnections(
        nodes,
        userContext.recentDocuments
      )

      return {
        nodes,
        connections,
        graphUpdated: true
      }
    } catch (error) {
      logger.warn({ error, userId }, 'Knowledge graph integration failed')
      return {
        nodes: [],
        connections: [],
        graphUpdated: false
      }
    }
  }

  private async applyContextualEnhancements(
    documentIntelligence: any,
    userContext: any,
    userId: string
  ) {
    try {
      // Apply user-specific context and patterns
      const crossDocumentConnections = this.findCrossDocumentPatterns(
        documentIntelligence,
        userContext.recentDocuments
      )

      const personalizedInsights = this.generatePersonalizedInsights(
        documentIntelligence,
        userContext.expertiseDomains,
        userContext.commonTopics
      )

      return {
        crossDocumentConnections,
        personalizedInsights,
        userPatterns: userContext.commonTopics
      }
    } catch (error) {
      logger.warn({ error, userId }, 'Contextual enhancement failed')
      return {
        crossDocumentConnections: [],
        personalizedInsights: [],
        userPatterns: []
      }
    }
  }

  private async generatePredictiveInsights(
    documentIntelligence: any,
    userContext: any,
    userId: string
  ) {
    try {
      // Generate insights based on user patterns and document content
      const anticipatedQuestions = this.generateAnticipatedQuestions(
        documentIntelligence,
        userContext.queryHistory
      )

      const relevantDocuments = this.findRelevantDocuments(
        documentIntelligence,
        userContext.recentDocuments
      )

      const actionSuggestions = this.generateActionSuggestions(
        documentIntelligence,
        userContext.expertiseDomains
      )

      return {
        anticipatedQuestions,
        relevantDocuments,
        actionSuggestions,
        confidence: 0.8
      }
    } catch (error) {
      logger.warn({ error, userId }, 'Predictive insights generation failed')
      return null
    }
  }

  private async saveIntelligenceResults(
    documentId: string,
    documentIntelligence: any,
    knowledgeGraph: any,
    predictiveInsights: any,
    userId: string
  ) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Save main intelligence results
      await supabase
        .from('document_intelligence')
        .upsert({
          document_id: documentId,
          user_id: userId,
          structure: documentIntelligence.structure,
          content: documentIntelligence.content,
          insights: documentIntelligence.insights,
          knowledge_graph: knowledgeGraph,
          predictive_insights: predictiveInsights,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      logger.info('Intelligence results saved', { documentId, userId })
    } catch (error) {
      logger.error({ error, documentId, userId }, 'Failed to save intelligence results')
      throw error
    }
  }

  private async updateJobProgress(jobId: string, progress: number, message?: string) {
    try {
      backgroundQueue.updateProgress(jobId, progress, message)
    } catch (error) {
      logger.warn({ error, jobId }, 'Failed to update job progress')
    }
  }

  private calculateConfidenceScores(documentIntelligence: any): Record<string, number> {
    return {
      structuralAnalysis: documentIntelligence.structure?.confidence || 0.9,
      contentExtraction: documentIntelligence.content?.confidence || 0.85,
      entityExtraction: documentIntelligence.insights?.confidence || 0.8,
      overallConfidence: 0.85
    }
  }

  // Helper methods for contextual processing
  private findCrossDocumentPatterns(document: any, recentDocuments: any[]) {
    // Implementation for finding patterns across user's documents
    return []
  }

  private generatePersonalizedInsights(document: any, expertiseDomains: string[], commonTopics: string[]) {
    // Implementation for generating personalized insights
    return []
  }

  private generateAnticipatedQuestions(document: any, queryHistory: any[]) {
    // Implementation for predicting questions user might ask
    return []
  }

  private findRelevantDocuments(document: any, recentDocuments: any[]) {
    // Implementation for finding relevant documents
    return []
  }

  private generateActionSuggestions(document: any, expertiseDomains: string[]) {
    // Implementation for suggesting actions
    return []
  }
}

// Singleton instance
export const intelligenceJobProcessor = new IntelligenceJobProcessor()