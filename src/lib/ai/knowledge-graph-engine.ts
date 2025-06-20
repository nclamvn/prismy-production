import { logger, performanceLogger } from '@/lib/logger'
import { analytics } from '../analytics'

export interface KnowledgeNode {
  id: string
  type: 'entity' | 'concept' | 'document' | 'section' | 'fact' | 'relation'
  label: string
  properties: Record<string, any>
  metadata: {
    confidence: number
    source: string
    extractedAt: Date
    language: string
    domain?: string
  }
  embeddings?: number[]
}

export interface KnowledgeEdge {
  id: string
  sourceId: string
  targetId: string
  relationship: string
  weight: number
  properties: Record<string, any>
  metadata: {
    confidence: number
    source: string
    extractedAt: Date
    bidirectional: boolean
  }
}

export interface EntityNode extends KnowledgeNode {
  type: 'entity'
  properties: {
    entityType: 'person' | 'organization' | 'location' | 'product' | 'event' | 'concept' | 'date' | 'money' | 'other'
    mentions: EntityMention[]
    aliases: string[]
    description?: string
    canonicalForm: string
  }
}

export interface ConceptNode extends KnowledgeNode {
  type: 'concept'
  properties: {
    definition: string
    domain: string
    relatedTerms: string[]
    importance: number
    frequency: number
  }
}

export interface DocumentNode extends KnowledgeNode {
  type: 'document'
  properties: {
    title: string
    documentType: string
    wordCount: number
    pageCount?: number
    language: string
    summary: string
    keyTopics: string[]
    processingDate: Date
  }
}

export interface EntityMention {
  text: string
  startIndex: number
  endIndex: number
  confidence: number
  context: string
}

export interface GraphQuery {
  nodeTypes?: string[]
  relationshipTypes?: string[]
  properties?: Record<string, any>
  limit?: number
  includeConnections?: boolean
}

export interface ConnectionStrength {
  directConnections: number
  sharedEntities: number
  conceptualSimilarity: number
  overallStrength: number
}

export class KnowledgeGraphEngine {
  private nodes: Map<string, KnowledgeNode> = new Map()
  private edges: Map<string, KnowledgeEdge> = new Map()
  private nodesByType: Map<string, Set<string>> = new Map()
  private relationshipsByType: Map<string, Set<string>> = new Map()

  constructor() {
    this.initializeEngine()
  }

  private initializeEngine(): void {
    logger.info('Initializing knowledge graph engine')
  }

  // Create document nodes from document intelligence
  async createDocumentNodes(
    documentIntelligence: any,
    existingDocuments: any[] = []
  ): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = []

    try {
      // Create main document node
      const documentNode: DocumentNode = {
        id: `doc_${documentIntelligence.documentId}`,
        type: 'document',
        label: documentIntelligence.structure.metadata.filename,
        properties: {
          title: documentIntelligence.structure.metadata.filename,
          documentType: documentIntelligence.insights.classification?.documentType || 'document',
          wordCount: documentIntelligence.structure.metadata.wordCount,
          pageCount: documentIntelligence.structure.metadata.pageCount,
          language: documentIntelligence.structure.metadata.language,
          summary: documentIntelligence.insights.summary,
          keyTopics: documentIntelligence.insights.topics?.map((t: any) => t.name) || [],
          processingDate: new Date()
        },
        metadata: {
          confidence: 0.95,
          source: 'document_processing',
          extractedAt: new Date(),
          language: documentIntelligence.structure.metadata.language
        },
        embeddings: documentIntelligence.queryable?.embeddings?.[0] || []
      }

      nodes.push(documentNode)
      this.addNode(documentNode)

      // Create entity nodes
      if (documentIntelligence.content.keyEntities) {
        for (const entity of documentIntelligence.content.keyEntities) {
          const entityNode: EntityNode = {
            id: `entity_${entity.id}`,
            type: 'entity',
            label: entity.text,
            properties: {
              entityType: entity.type,
              mentions: [{
                text: entity.text,
                startIndex: entity.position?.start || 0,
                endIndex: entity.position?.end || 0,
                confidence: entity.confidence,
                context: entity.context
              }],
              aliases: [],
              canonicalForm: entity.text
            },
            metadata: {
              confidence: entity.confidence,
              source: documentIntelligence.documentId,
              extractedAt: new Date(),
              language: documentIntelligence.structure.metadata.language
            }
          }

          nodes.push(entityNode)
          this.addNode(entityNode)

          // Create relationship between document and entity
          this.createEdge(
            documentNode.id,
            entityNode.id,
            'contains_entity',
            0.8,
            { extractedAt: new Date() }
          )
        }
      }

      // Create concept nodes
      if (documentIntelligence.content.concepts) {
        for (const concept of documentIntelligence.content.concepts) {
          const conceptNode: ConceptNode = {
            id: `concept_${concept.id}`,
            type: 'concept',
            label: concept.term,
            properties: {
              definition: concept.definition || '',
              domain: documentIntelligence.insights.classification?.domain || 'general',
              relatedTerms: concept.relatedTerms || [],
              importance: concept.importance,
              frequency: concept.frequency
            },
            metadata: {
              confidence: 0.85,
              source: documentIntelligence.documentId,
              extractedAt: new Date(),
              language: documentIntelligence.structure.metadata.language
            }
          }

          nodes.push(conceptNode)
          this.addNode(conceptNode)

          // Create relationship between document and concept
          this.createEdge(
            documentNode.id,
            conceptNode.id,
            'discusses_concept',
            concept.importance,
            { frequency: concept.frequency }
          )
        }
      }

      return nodes

    } catch (error) {
      logger.error({ error, documentId: documentIntelligence.documentId }, 'Failed to create document nodes')
      return []
    }
  }

  // Find connections between new document and existing documents
  async findConnections(
    newNodes: KnowledgeNode[],
    existingDocuments: any[]
  ): Promise<KnowledgeEdge[]> {
    const connections: KnowledgeEdge[] = []

    try {
      const newDocumentNode = newNodes.find(n => n.type === 'document')
      if (!newDocumentNode) return connections

      for (const existingDoc of existingDocuments) {
        const existingDocId = `doc_${existingDoc.document_id}`
        
        // Find shared entities
        const sharedEntities = this.findSharedEntities(newNodes, existingDoc)
        if (sharedEntities.length > 0) {
          connections.push(this.createEdge(
            newDocumentNode.id,
            existingDocId,
            'shares_entities',
            Math.min(sharedEntities.length / 10, 1),
            { sharedEntities: sharedEntities.map(e => e.label) }
          ))
        }

        // Find conceptual similarity
        const conceptualSimilarity = this.calculateConceptualSimilarity(newNodes, existingDoc)
        if (conceptualSimilarity > 0.5) {
          connections.push(this.createEdge(
            newDocumentNode.id,
            existingDocId,
            'conceptually_similar',
            conceptualSimilarity,
            { similarity: conceptualSimilarity }
          ))
        }

        // Find domain relationships
        const domainRelation = this.findDomainRelationships(newDocumentNode, existingDoc)
        if (domainRelation) {
          connections.push(domainRelation)
        }
      }

      return connections

    } catch (error) {
      logger.error({ error }, 'Failed to find document connections')
      return []
    }
  }

  // Helper methods
  private addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node)
    
    if (!this.nodesByType.has(node.type)) {
      this.nodesByType.set(node.type, new Set())
    }
    this.nodesByType.get(node.type)!.add(node.id)
  }

  private createEdge(
    sourceId: string,
    targetId: string,
    relationship: string,
    weight: number,
    properties: Record<string, any> = {}
  ): KnowledgeEdge {
    const edgeId = `edge_${sourceId}_${targetId}_${relationship}`
    
    const edge: KnowledgeEdge = {
      id: edgeId,
      sourceId,
      targetId,
      relationship,
      weight,
      properties,
      metadata: {
        confidence: weight,
        source: 'knowledge_graph_engine',
        extractedAt: new Date(),
        bidirectional: false
      }
    }

    this.edges.set(edgeId, edge)
    
    if (!this.relationshipsByType.has(relationship)) {
      this.relationshipsByType.set(relationship, new Set())
    }
    this.relationshipsByType.get(relationship)!.add(edgeId)

    return edge
  }

  private findSharedEntities(newNodes: KnowledgeNode[], existingDoc: any): KnowledgeNode[] {
    const newEntities = newNodes.filter(n => n.type === 'entity')
    const existingEntities = existingDoc.entities || []
    
    return newEntities.filter(newEntity => 
      existingEntities.some((existing: any) => 
        existing.text.toLowerCase() === newEntity.label.toLowerCase()
      )
    )
  }

  private calculateConceptualSimilarity(newNodes: KnowledgeNode[], existingDoc: any): number {
    const newConcepts = newNodes.filter(n => n.type === 'concept').map(n => n.label.toLowerCase())
    const existingConcepts = (existingDoc.concepts || []).map((c: any) => c.term.toLowerCase())
    
    if (newConcepts.length === 0 || existingConcepts.length === 0) return 0
    
    const sharedConcepts = newConcepts.filter(concept => existingConcepts.includes(concept))
    const totalConcepts = new Set([...newConcepts, ...existingConcepts]).size
    
    return sharedConcepts.length / totalConcepts
  }

  private findDomainRelationships(newDocumentNode: KnowledgeNode, existingDoc: any): KnowledgeEdge | null {
    const newDomain = (newDocumentNode as DocumentNode).properties.documentType
    const existingDomain = existingDoc.insights?.classification?.documentType
    
    if (newDomain === existingDomain) {
      return this.createEdge(
        newDocumentNode.id,
        `doc_${existingDoc.document_id}`,
        'same_domain',
        0.7,
        { domain: newDomain }
      )
    }
    
    return null
  }

  // Public query methods
  getNode(nodeId: string): KnowledgeNode | undefined {
    return this.nodes.get(nodeId)
  }

  getNodesByType(type: string): KnowledgeNode[] {
    const nodeIds = this.nodesByType.get(type) || new Set()
    return Array.from(nodeIds).map(id => this.nodes.get(id)!).filter(Boolean)
  }

  getConnections(nodeId: string): KnowledgeEdge[] {
    return Array.from(this.edges.values()).filter(
      edge => edge.sourceId === nodeId || edge.targetId === nodeId
    )
  }

  queryGraph(query: GraphQuery): { nodes: KnowledgeNode[], edges: KnowledgeEdge[] } {
    let nodes = Array.from(this.nodes.values())
    let edges = Array.from(this.edges.values())

    // Filter by node types
    if (query.nodeTypes) {
      nodes = nodes.filter(node => query.nodeTypes!.includes(node.type))
    }

    // Filter by relationship types
    if (query.relationshipTypes) {
      edges = edges.filter(edge => query.relationshipTypes!.includes(edge.relationship))
    }

    // Apply limit
    if (query.limit) {
      nodes = nodes.slice(0, query.limit)
    }

    return { nodes, edges }
  }
}

// Singleton instance
export const knowledgeGraphEngine = new KnowledgeGraphEngine()

export interface ProcessedDocumentNode extends KnowledgeNode {
  type: 'document'
  properties: {
    filename: string
    documentType: string
    language: string
    pageCount: number
    wordCount: number
    createdAt: Date
    summary: string
    keyTopics: string[]
    sentiment: number
  }
}

export interface SectionNode extends KnowledgeNode {
  type: 'section'
  properties: {
    documentId: string
    sectionTitle: string
    sectionType: 'introduction' | 'methodology' | 'results' | 'conclusion' | 'chapter' | 'appendix' | 'other'
    pageNumbers: number[]
    wordCount: number
    summary: string
  }
}

export interface FactNode extends KnowledgeNode {
  type: 'fact'
  properties: {
    statement: string
    factType: 'statistic' | 'definition' | 'claim' | 'rule' | 'procedure' | 'other'
    evidenceStrength: number
    sources: string[]
    verifiable: boolean
    temporal?: {
      startDate?: Date
      endDate?: Date
      timePeriod?: string
    }
    numerical?: {
      value: number
      unit: string
      comparison?: string
    }
  }
}

interface InternalEntityMention {
  text: string
  documentId: string
  sectionId: string
  position: { start: number, end: number, page: number }
  context: string
  confidence: number
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>
  edges: Map<string, KnowledgeEdge>
  indexes: {
    byType: Map<string, Set<string>>
    byLabel: Map<string, Set<string>>
    byDocument: Map<string, Set<string>>
    byDomain: Map<string, Set<string>>
    semantic: SemanticIndex
  }
  metadata: {
    createdAt: Date
    lastUpdated: Date
    nodeCount: number
    edgeCount: number
    documents: string[]
    domains: string[]
    languages: string[]
  }
}

interface SemanticIndex {
  embeddings: Map<string, number[]>
  clusters: Map<string, string[]>
  similarities: Map<string, Map<string, number>>
}

export interface GraphQuery {
  type: 'find_entities' | 'find_relationships' | 'semantic_search' | 'path_finding' | 'subgraph_extraction'
  parameters: {
    entityTypes?: string[]
    relationshipTypes?: string[]
    documentIds?: string[]
    domains?: string[]
    query?: string
    sourceNode?: string
    targetNode?: string
    maxHops?: number
    threshold?: number
    limit?: number
  }
  filters?: {
    confidence?: number
    language?: string
    dateRange?: { start: Date, end: Date }
    properties?: Record<string, any>
  }
}

export interface QueryResult {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  paths?: GraphPath[]
  clusters?: NodeCluster[]
  statistics: {
    nodeCount: number
    edgeCount: number
    avgConfidence: number
    domains: string[]
    timespan?: { start: Date, end: Date }
  }
  processingTime: number
}

interface GraphPath {
  nodes: string[]
  edges: string[]
  length: number
  strength: number
  description: string
}

interface NodeCluster {
  id: string
  centroid: string
  members: string[]
  cohesion: number
  label: string
}

