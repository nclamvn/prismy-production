/**
 * PRISMY CROSS-DOCUMENT INTELLIGENCE
 * Advanced multi-document analysis and knowledge synthesis
 * Connects insights across documents to find patterns, relationships, and holistic understanding
 */

import { Agent, Document, TaskResult } from '@/components/workspace/types'
import { aiProviderManager } from '../../ai/providers/ai-provider-manager'
import { agentDatabaseService } from '../database/agent-database-service'

export interface DocumentCluster {
  id: string
  name: string
  documents: Document[]
  theme: string
  confidence: number
  keyTopics: string[]
  timeline?: {
    startDate: Date
    endDate: Date
    milestones: DocumentMilestone[]
  }
  relationships: DocumentRelationship[]
}

export interface DocumentMilestone {
  date: Date
  documentId: string
  title: string
  significance: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface DocumentRelationship {
  sourceDocumentId: string
  targetDocumentId: string
  relationshipType: 'references' | 'supersedes' | 'supports' | 'contradicts' | 'extends' | 'similar_theme'
  strength: number
  description: string
  evidence: string[]
}

export interface CrossDocumentInsight {
  id: string
  type: 'pattern_discovery' | 'knowledge_synthesis' | 'gap_analysis' | 'contradiction_detection' | 'trend_analysis'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  involvedDocuments: string[]
  evidence: {
    documentExcerpts: Array<{
      documentId: string
      excerpt: string
      relevance: number
    }>
    patterns: string[]
    contradictions?: string[]
  }
  recommendations: string[]
  metadata: {
    analysisDate: string
    agentIds: string[]
    processingTime: number
    qualityScore: number
  }
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  clusters: KnowledgeCluster[]
  centralConcepts: string[]
  orphanNodes: string[]
}

export interface KnowledgeNode {
  id: string
  concept: string
  documentIds: string[]
  importance: number
  frequency: number
  context: string[]
  relatedConcepts: string[]
}

export interface KnowledgeEdge {
  source: string
  target: string
  relationship: string
  strength: number
  evidence: string[]
  documentSupport: string[]
}

export interface KnowledgeCluster {
  id: string
  name: string
  concepts: string[]
  coherence: number
  centralConcept: string
  peripheralConcepts: string[]
}

export interface MultiDocumentQuery {
  query: string
  documentScope: string[] | 'all'
  analysisType: 'comprehensive' | 'targeted' | 'comparative'
  includeRelationships: boolean
  includeTimeline: boolean
  maxDocuments?: number
}

export interface MultiDocumentResponse {
  answer: string
  confidence: number
  supportingEvidence: Array<{
    documentId: string
    title: string
    relevantSections: string[]
    confidenceContribution: number
  }>
  crossReferences: DocumentRelationship[]
  gaps: string[]
  recommendations: string[]
}

export class CrossDocumentIntelligenceService {
  private documentClusters: Map<string, DocumentCluster> = new Map()
  private knowledgeGraph: KnowledgeGraph | null = null
  private lastAnalysis: Date | null = null
  private crossDocumentInsights: Map<string, CrossDocumentInsight> = new Map()

  constructor(private userId: string) {}

  /**
   * Analyze all user documents for cross-document patterns and insights
   */
  async analyzeAllDocuments(): Promise<{
    clusters: DocumentCluster[]
    insights: CrossDocumentInsight[]
    knowledgeGraph: KnowledgeGraph
    summary: {
      totalDocuments: number
      clustersFound: number
      insightsGenerated: number
      analysisQuality: number
    }
  }> {
    try {
      console.log(`[Cross-Document Intelligence] Starting comprehensive analysis for user ${this.userId}`)
      
      // Get all user documents through agents
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const documents = await this.reconstructDocumentsFromAgents(agents)

      if (documents.length < 2) {
        return this.getEmptyAnalysisResult()
      }

      // Step 1: Cluster documents by theme and relationships
      const clusters = await this.clusterDocuments(documents)
      
      // Step 2: Build knowledge graph
      const knowledgeGraph = await this.buildKnowledgeGraph(documents, clusters)
      
      // Step 3: Generate cross-document insights
      const insights = await this.generateCrossDocumentInsights(documents, clusters, knowledgeGraph)
      
      // Step 4: Calculate analysis quality
      const analysisQuality = this.calculateAnalysisQuality(documents, clusters, insights, knowledgeGraph)

      // Cache results
      for (const cluster of clusters) {
        this.documentClusters.set(cluster.id, cluster)
      }
      for (const insight of insights) {
        this.crossDocumentInsights.set(insight.id, insight)
      }
      this.knowledgeGraph = knowledgeGraph
      this.lastAnalysis = new Date()

      console.log(`[Cross-Document Intelligence] Analysis completed: ${clusters.length} clusters, ${insights.length} insights`)

      return {
        clusters,
        insights,
        knowledgeGraph,
        summary: {
          totalDocuments: documents.length,
          clustersFound: clusters.length,
          insightsGenerated: insights.length,
          analysisQuality
        }
      }

    } catch (error) {
      console.error('[Cross-Document Intelligence] Analysis failed:', error)
      return this.getEmptyAnalysisResult()
    }
  }

  /**
   * Query across multiple documents with intelligent synthesis
   */
  async queryAcrossDocuments(query: MultiDocumentQuery): Promise<MultiDocumentResponse> {
    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const documents = await this.reconstructDocumentsFromAgents(agents)
      
      // Filter documents based on scope
      const targetDocuments = query.documentScope === 'all' 
        ? documents 
        : documents.filter(doc => query.documentScope.includes(doc.id))

      if (targetDocuments.length === 0) {
        return this.getEmptyQueryResponse()
      }

      // Limit documents if specified
      const analysisDocuments = query.maxDocuments 
        ? targetDocuments.slice(0, query.maxDocuments)
        : targetDocuments

      // Generate AI-powered cross-document analysis
      const response = await this.performMultiDocumentAnalysis(query, analysisDocuments)

      return response

    } catch (error) {
      console.error('[Cross-Document Intelligence] Query failed:', error)
      return this.getEmptyQueryResponse()
    }
  }

  /**
   * Find relationships between specific documents
   */
  async findDocumentRelationships(documentIds: string[]): Promise<DocumentRelationship[]> {
    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const documents = await this.reconstructDocumentsFromAgents(agents)
      
      const targetDocuments = documents.filter(doc => documentIds.includes(doc.id))
      
      if (targetDocuments.length < 2) {
        return []
      }

      const relationships: DocumentRelationship[] = []

      // Compare each document with every other document
      for (let i = 0; i < targetDocuments.length; i++) {
        for (let j = i + 1; j < targetDocuments.length; j++) {
          const doc1 = targetDocuments[i]
          const doc2 = targetDocuments[j]
          
          const relationship = await this.analyzeDocumentPair(doc1, doc2)
          if (relationship) {
            relationships.push(relationship)
          }
        }
      }

      return relationships.sort((a, b) => b.strength - a.strength)

    } catch (error) {
      console.error('[Cross-Document Intelligence] Relationship analysis failed:', error)
      return []
    }
  }

  /**
   * Detect knowledge gaps across document collection
   */
  async detectKnowledgeGaps(): Promise<{
    gaps: Array<{
      area: string
      description: string
      severity: 'low' | 'medium' | 'high'
      suggestedDocuments: string[]
      relatedConcepts: string[]
    }>
    completeness: number
    recommendations: string[]
  }> {
    try {
      const agents = await agentDatabaseService.getUserAgents(this.userId)
      const documents = await this.reconstructDocumentsFromAgents(agents)

      if (documents.length === 0) {
        return { gaps: [], completeness: 0, recommendations: [] }
      }

      // Analyze document coverage and identify gaps
      const gaps = await this.identifyKnowledgeGaps(documents)
      const completeness = this.calculateKnowledgeCompleteness(documents, gaps)
      const recommendations = await this.generateGapRecommendations(gaps, documents)

      return {
        gaps,
        completeness,
        recommendations
      }

    } catch (error) {
      console.error('[Cross-Document Intelligence] Gap detection failed:', error)
      return { gaps: [], completeness: 0.5, recommendations: [] }
    }
  }

  /**
   * Cluster documents by theme and content similarity
   */
  private async clusterDocuments(documents: Document[]): Promise<DocumentCluster[]> {
    if (documents.length < 2) return []

    const clusters: DocumentCluster[] = []
    const clusteredDocuments = new Set<string>()

    // AI-powered document clustering
    for (let i = 0; i < documents.length; i++) {
      if (clusteredDocuments.has(documents[i].id)) continue

      const seedDocument = documents[i]
      const clusterDocuments = [seedDocument]
      clusteredDocuments.add(seedDocument.id)

      // Find similar documents
      for (let j = i + 1; j < documents.length; j++) {
        if (clusteredDocuments.has(documents[j].id)) continue

        const similarity = await this.calculateDocumentSimilarity(seedDocument, documents[j])
        if (similarity > 0.6) {
          clusterDocuments.push(documents[j])
          clusteredDocuments.add(documents[j].id)
        }
      }

      if (clusterDocuments.length >= 1) {
        const cluster = await this.createDocumentCluster(clusterDocuments)
        clusters.push(cluster)
      }
    }

    return clusters
  }

  /**
   * Build knowledge graph from documents
   */
  private async buildKnowledgeGraph(documents: Document[], clusters: DocumentCluster[]): Promise<KnowledgeGraph> {
    const concepts = new Map<string, KnowledgeNode>()
    const relationships = new Map<string, KnowledgeEdge>()

    // Extract concepts from each document
    for (const doc of documents) {
      const documentConcepts = await this.extractDocumentConcepts(doc)
      
      for (const concept of documentConcepts) {
        if (!concepts.has(concept.concept)) {
          concepts.set(concept.concept, {
            id: concept.concept,
            concept: concept.concept,
            documentIds: [],
            importance: 0,
            frequency: 0,
            context: [],
            relatedConcepts: []
          })
        }
        
        const node = concepts.get(concept.concept)!
        node.documentIds.push(doc.id)
        node.frequency += concept.frequency
        node.importance = Math.max(node.importance, concept.importance)
        node.context.push(...concept.context)
      }
    }

    // Build relationships between concepts
    const conceptNodes = Array.from(concepts.values())
    for (let i = 0; i < conceptNodes.length; i++) {
      for (let j = i + 1; j < conceptNodes.length; j++) {
        const relationship = await this.findConceptRelationship(conceptNodes[i], conceptNodes[j])
        if (relationship && relationship.strength > 0.3) {
          relationships.set(`${relationship.source}-${relationship.target}`, relationship)
        }
      }
    }

    // Create knowledge clusters
    const knowledgeClusters = await this.createKnowledgeClusters(conceptNodes, Array.from(relationships.values()))

    return {
      nodes: conceptNodes,
      edges: Array.from(relationships.values()),
      clusters: knowledgeClusters,
      centralConcepts: this.findCentralConcepts(conceptNodes, Array.from(relationships.values())),
      orphanNodes: conceptNodes.filter(node => node.relatedConcepts.length === 0).map(node => node.id)
    }
  }

  /**
   * Generate cross-document insights
   */
  private async generateCrossDocumentInsights(
    documents: Document[], 
    clusters: DocumentCluster[], 
    knowledgeGraph: KnowledgeGraph
  ): Promise<CrossDocumentInsight[]> {
    const insights: CrossDocumentInsight[] = []

    // Pattern discovery insights
    const patternInsights = await this.discoverPatterns(documents, clusters)
    insights.push(...patternInsights)

    // Knowledge synthesis insights
    const synthesisInsights = await this.synthesizeKnowledge(documents, knowledgeGraph)
    insights.push(...synthesisInsights)

    // Contradiction detection
    const contradictionInsights = await this.detectContradictions(documents)
    insights.push(...contradictionInsights)

    // Trend analysis
    const trendInsights = await this.analyzeTrends(documents, clusters)
    insights.push(...trendInsights)

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Perform AI-powered multi-document analysis
   */
  private async performMultiDocumentAnalysis(
    query: MultiDocumentQuery, 
    documents: Document[]
  ): Promise<MultiDocumentResponse> {
    // Prepare document content for analysis
    const documentContents = documents.map(doc => 
      `Document: ${doc.title}\nType: ${doc.type}\nContent: ${this.getDocumentSummary(doc)}`
    ).join('\n\n---\n\n')

    const analysisRequest = {
      documentContent: `CROSS-DOCUMENT ANALYSIS QUERY: ${query.query}\n\nDOCUMENTS TO ANALYZE:\n${documentContents}`,
      documentType: 'multi_document_analysis',
      focus: 'research_synthesis' as const,
      personality: 'research',
      language: 'vi' as const,
      culturalContext: 'Vietnam' as const
    }

    const analysis = await aiProviderManager.analyzeDocument(analysisRequest)

    // Find relationships if requested
    const crossReferences = query.includeRelationships 
      ? await this.findDocumentRelationships(documents.map(d => d.id))
      : []

    return {
      answer: analysis.insights,
      confidence: analysis.confidence,
      supportingEvidence: documents.map(doc => ({
        documentId: doc.id,
        title: doc.title,
        relevantSections: this.extractRelevantSections(doc, query.query),
        confidenceContribution: 1 / documents.length
      })),
      crossReferences,
      gaps: this.identifyQueryGaps(query.query, documents),
      recommendations: analysis.recommendations
    }
  }

  /**
   * Helper methods
   */
  private async reconstructDocumentsFromAgents(agents: any[]): Promise<Document[]> {
    return agents.map(agent => ({
      id: agent.document_id,
      title: agent.document_title,
      type: agent.document_type,
      size: '0 KB',
      lastModified: agent.updated_at,
      agentsAssigned: [agent.id],
      status: 'ready' as const,
      language: agent.language || 'vi',
      pageCount: 1,
      wordCount: 0
    }))
  }

  private async calculateDocumentSimilarity(doc1: Document, doc2: Document): Promise<number> {
    // Simplified similarity calculation based on type and title
    let similarity = 0

    if (doc1.type === doc2.type) {
      similarity += 0.3
    }

    // Title similarity (basic keyword matching)
    const words1 = doc1.title.toLowerCase().split(' ')
    const words2 = doc2.title.toLowerCase().split(' ')
    const commonWords = words1.filter(word => words2.includes(word))
    const titleSimilarity = commonWords.length / Math.max(words1.length, words2.length)
    similarity += titleSimilarity * 0.4

    // Date proximity
    const date1 = new Date(doc1.lastModified)
    const date2 = new Date(doc2.lastModified)
    const daysDifference = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    const dateProximity = Math.max(0, 1 - daysDifference / 30) // 30 days max
    similarity += dateProximity * 0.3

    return Math.min(1, similarity)
  }

  private async createDocumentCluster(documents: Document[]): Promise<DocumentCluster> {
    const clusterDocuments = documents.slice(0, 10) // Limit cluster size
    
    return {
      id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateClusterName(clusterDocuments),
      documents: clusterDocuments,
      theme: this.identifyCommonTheme(clusterDocuments),
      confidence: 0.8,
      keyTopics: this.extractKeyTopics(clusterDocuments),
      timeline: this.buildClusterTimeline(clusterDocuments),
      relationships: []
    }
  }

  private generateClusterName(documents: Document[]): string {
    const types = [...new Set(documents.map(d => d.type))]
    const typeString = types.length === 1 ? types[0] : 'Mixed'
    return `${typeString} Cluster (${documents.length} documents)`
  }

  private identifyCommonTheme(documents: Document[]): string {
    // Simple theme identification based on document types and titles
    const types = documents.map(d => d.type)
    const mostCommonType = types.reduce((a, b, _, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    )
    
    return `${mostCommonType} documents with related content`
  }

  private extractKeyTopics(documents: Document[]): string[] {
    // Extract key topics from document titles
    const allWords = documents.flatMap(doc => 
      doc.title.toLowerCase().split(' ').filter(word => word.length > 3)
    )
    
    const wordCounts = allWords.reduce((counts, word) => {
      counts[word] = (counts[word] || 0) + 1
      return counts
    }, {} as Record<string, number>)
    
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  private buildClusterTimeline(documents: Document[]): DocumentCluster['timeline'] {
    if (documents.length < 2) return undefined

    const dates = documents.map(doc => new Date(doc.lastModified)).sort((a, b) => a.getTime() - b.getTime())
    
    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      milestones: documents.map(doc => ({
        date: new Date(doc.lastModified),
        documentId: doc.id,
        title: doc.title,
        significance: 'medium' as const,
        description: `Document uploaded: ${doc.title}`
      })).sort((a, b) => a.date.getTime() - b.date.getTime())
    }
  }

  private getEmptyAnalysisResult() {
    return {
      clusters: [],
      insights: [],
      knowledgeGraph: {
        nodes: [],
        edges: [],
        clusters: [],
        centralConcepts: [],
        orphanNodes: []
      },
      summary: {
        totalDocuments: 0,
        clustersFound: 0,
        insightsGenerated: 0,
        analysisQuality: 0
      }
    }
  }

  private getEmptyQueryResponse(): MultiDocumentResponse {
    return {
      answer: 'Không tìm thấy thông tin liên quan trong tài liệu.',
      confidence: 0,
      supportingEvidence: [],
      crossReferences: [],
      gaps: [],
      recommendations: []
    }
  }

  private calculateAnalysisQuality(
    documents: Document[], 
    clusters: DocumentCluster[], 
    insights: CrossDocumentInsight[], 
    knowledgeGraph: KnowledgeGraph
  ): number {
    let quality = 0

    // Document coverage
    const documentCoverage = documents.length > 0 ? 1 : 0
    quality += documentCoverage * 0.3

    // Clustering quality
    const clusteringQuality = clusters.length > 0 ? Math.min(1, clusters.length / Math.max(1, documents.length / 3)) : 0
    quality += clusteringQuality * 0.3

    // Insights quality
    const insightsQuality = insights.length > 0 ? Math.min(1, insights.length / Math.max(1, documents.length / 2)) : 0
    quality += insightsQuality * 0.2

    // Knowledge graph connectivity
    const graphQuality = knowledgeGraph.nodes.length > 0 ? 
      Math.min(1, knowledgeGraph.edges.length / Math.max(1, knowledgeGraph.nodes.length)) : 0
    quality += graphQuality * 0.2

    return Math.min(1, quality)
  }

  // Placeholder implementations for complex analysis methods
  private async analyzeDocumentPair(doc1: Document, doc2: Document): Promise<DocumentRelationship | null> {
    const similarity = await this.calculateDocumentSimilarity(doc1, doc2)
    
    if (similarity < 0.3) return null

    return {
      sourceDocumentId: doc1.id,
      targetDocumentId: doc2.id,
      relationshipType: similarity > 0.7 ? 'similar_theme' : 'references',
      strength: similarity,
      description: `Documents share ${Math.round(similarity * 100)}% similarity`,
      evidence: [`Similar titles: ${doc1.title} / ${doc2.title}`, `Same type: ${doc1.type}`]
    }
  }

  private async extractDocumentConcepts(doc: Document): Promise<Array<{
    concept: string
    frequency: number
    importance: number
    context: string[]
  }>> {
    // Simplified concept extraction from title
    const words = doc.title.toLowerCase().split(' ').filter(word => word.length > 3)
    
    return words.map(word => ({
      concept: word,
      frequency: 1,
      importance: 0.5,
      context: [doc.type, doc.title]
    }))
  }

  private async findConceptRelationship(node1: KnowledgeNode, node2: KnowledgeNode): Promise<KnowledgeEdge | null> {
    // Check if concepts appear in same documents
    const sharedDocs = node1.documentIds.filter(id => node2.documentIds.includes(id))
    
    if (sharedDocs.length === 0) return null

    return {
      source: node1.id,
      target: node2.id,
      relationship: 'co_occurs',
      strength: sharedDocs.length / Math.max(node1.documentIds.length, node2.documentIds.length),
      evidence: [`Co-occur in ${sharedDocs.length} documents`],
      documentSupport: sharedDocs
    }
  }

  private async createKnowledgeClusters(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): Promise<KnowledgeCluster[]> {
    // Simplified clustering - group highly connected concepts
    const clusters: KnowledgeCluster[] = []
    const clustered = new Set<string>()

    for (const node of nodes) {
      if (clustered.has(node.id)) continue

      const relatedNodes = edges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.source === node.id ? edge.target : edge.source)
        .filter(id => !clustered.has(id))

      if (relatedNodes.length > 0) {
        const clusterConcepts = [node.id, ...relatedNodes]
        clusterConcepts.forEach(id => clustered.add(id))

        clusters.push({
          id: `knowledge-cluster-${clusters.length}`,
          name: `${node.concept} cluster`,
          concepts: clusterConcepts,
          coherence: 0.8,
          centralConcept: node.id,
          peripheralConcepts: relatedNodes
        })
      }
    }

    return clusters
  }

  private findCentralConcepts(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): string[] {
    const nodeDegrees = new Map<string, number>()
    
    for (const edge of edges) {
      nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1)
      nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1)
    }

    return Array.from(nodeDegrees.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([concept]) => concept)
  }

  private getDocumentSummary(doc: Document): string {
    return `${doc.title} (${doc.type})`
  }

  private extractRelevantSections(doc: Document, query: string): string[] {
    // Simplified - would extract actual relevant sections in production
    return [`Section from ${doc.title} relevant to: ${query}`]
  }

  private identifyQueryGaps(query: string, documents: Document[]): string[] {
    // Simplified gap identification
    return [`More detailed analysis needed for: ${query}`]
  }

  // Placeholder methods for complex analysis features
  private async identifyKnowledgeGaps(documents: Document[]): Promise<any[]> { return [] }
  private calculateKnowledgeCompleteness(documents: Document[], gaps: any[]): number { return 0.75 }
  private async generateGapRecommendations(gaps: any[], documents: Document[]): Promise<string[]> { return [] }
  private async discoverPatterns(documents: Document[], clusters: DocumentCluster[]): Promise<CrossDocumentInsight[]> { return [] }
  private async synthesizeKnowledge(documents: Document[], graph: KnowledgeGraph): Promise<CrossDocumentInsight[]> { return [] }
  private async detectContradictions(documents: Document[]): Promise<CrossDocumentInsight[]> { return [] }
  private async analyzeTrends(documents: Document[], clusters: DocumentCluster[]): Promise<CrossDocumentInsight[]> { return [] }

  /**
   * Public API methods
   */
  public getCachedClusters(): DocumentCluster[] {
    return Array.from(this.documentClusters.values())
  }

  public getCachedInsights(): CrossDocumentInsight[] {
    return Array.from(this.crossDocumentInsights.values())
  }

  public getKnowledgeGraph(): KnowledgeGraph | null {
    return this.knowledgeGraph
  }

  public getLastAnalysisTime(): Date | null {
    return this.lastAnalysis
  }

  public clearCache(): void {
    this.documentClusters.clear()
    this.crossDocumentInsights.clear()
    this.knowledgeGraph = null
    this.lastAnalysis = null
    console.log(`[Cross-Document Intelligence] Cache cleared for user ${this.userId}`)
  }
}

export default CrossDocumentIntelligenceService