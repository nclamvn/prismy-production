/**
 * Phase 3.8-A: Semantic Intelligence Layer
 * 
 * Advanced semantic analysis and knowledge extraction engine
 * Provides contextual understanding, relationship mapping, and intelligent insights
 */

import { STEMDocument, MathFormula, TableStructure, DiagramElement, TextBlock } from '../stem/math-formula-detector'

export interface SemanticAnalysisResult {
  id: string
  documentContext: DocumentContext
  knowledgeDomains: KnowledgeDomain[]
  conceptMap: ConceptMap
  relationships: SemanticRelationship[]
  insights: IntelligentInsight[]
  recommendations: ActionableRecommendation[]
  confidence: number
  processingTime: number
}

export interface DocumentContext {
  domain: string
  subfield?: string
  academicLevel: 'undergraduate' | 'graduate' | 'research' | 'professional'
  contentType: 'textbook' | 'paper' | 'presentation' | 'report' | 'thesis'
  language: string
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert'
  keywords: string[]
  abstractTopics: string[]
}

export interface KnowledgeDomain {
  id: string
  name: string
  confidence: number
  coverage: number
  subdomains: string[]
  relatedConcepts: string[]
  prerequisites: string[]
  applications: string[]
}

export interface ConceptMap {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  clusters: ConceptCluster[]
  hierarchy: ConceptHierarchy
}

export interface ConceptNode {
  id: string
  label: string
  type: 'formula' | 'definition' | 'theorem' | 'principle' | 'method' | 'application'
  importance: number
  confidence: number
  sourceElements: string[]
  properties: Record<string, any>
}

export interface ConceptEdge {
  id: string
  source: string
  target: string
  type: 'prerequisite' | 'derives_from' | 'applies_to' | 'generalizes' | 'specializes' | 'contradicts'
  strength: number
  evidence: string[]
}

export interface ConceptCluster {
  id: string
  name: string
  nodes: string[]
  coherence: number
  topic: string
}

export interface ConceptHierarchy {
  levels: Array<{
    level: number
    concepts: string[]
    description: string
  }>
  dependencies: Array<{
    concept: string
    prerequisites: string[]
  }>
}

export interface SemanticRelationship {
  id: string
  type: 'mathematical' | 'logical' | 'causal' | 'temporal' | 'spatial' | 'comparative'
  entities: string[]
  description: string
  confidence: number
  evidence: Evidence[]
}

export interface Evidence {
  type: 'textual' | 'mathematical' | 'visual' | 'structural'
  content: string
  location: string
  reliability: number
}

export interface IntelligentInsight {
  id: string
  type: 'pattern' | 'anomaly' | 'gap' | 'opportunity' | 'verification'
  title: string
  description: string
  significance: number
  evidence: Evidence[]
  implications: string[]
}

export interface ActionableRecommendation {
  id: string
  category: 'content_enhancement' | 'structure_improvement' | 'clarity_boost' | 'completeness_check'
  priority: 'low' | 'medium' | 'high' | 'critical'
  action: string
  rationale: string
  expectedImpact: string
  implementationSteps: string[]
}

export class SemanticIntelligenceEngine {
  private knowledgeBase: Map<string, any>
  private conceptGraph: Map<string, ConceptNode>
  private domainModels: Map<string, any>
  private isInitialized = false
  
  constructor() {
    this.knowledgeBase = new Map()
    this.conceptGraph = new Map()
    this.domainModels = new Map()
    this.initializeKnowledgeBase()
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    console.log('🧠 Initializing Semantic Intelligence Engine...')
    
    try {
      // Load domain models and knowledge bases
      await this.loadDomainModels()
      await this.loadMathematicalConcepts()
      await this.loadScientificPrinciples()
      
      this.isInitialized = true
      console.log('✅ Semantic Intelligence Engine initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Semantic Intelligence Engine:', error)
      throw error
    }
  }
  
  async analyzeDocument(stemDocument: STEMDocument): Promise<SemanticAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    console.log('🧠 Starting semantic analysis...')
    const startTime = Date.now()
    
    try {
      // Extract document context
      const documentContext = await this.extractDocumentContext(stemDocument)
      
      // Identify knowledge domains
      const knowledgeDomains = await this.identifyKnowledgeDomains(stemDocument, documentContext)
      
      // Build concept map
      const conceptMap = await this.buildConceptMap(stemDocument, knowledgeDomains)
      
      // Analyze semantic relationships
      const relationships = await this.analyzeSemanticRelationships(stemDocument, conceptMap)
      
      // Generate intelligent insights
      const insights = await this.generateInsights(stemDocument, conceptMap, relationships)
      
      // Create actionable recommendations
      const recommendations = await this.generateRecommendations(stemDocument, insights, documentContext)
      
      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(conceptMap, relationships, insights)
      
      const result: SemanticAnalysisResult = {
        id: `semantic_${Date.now()}`,
        documentContext,
        knowledgeDomains,
        conceptMap,
        relationships,
        insights,
        recommendations,
        confidence,
        processingTime: Date.now() - startTime
      }
      
      console.log(`✅ Semantic analysis completed in ${result.processingTime}ms`)
      console.log(`🧠 Identified ${knowledgeDomains.length} domains, ${conceptMap.nodes.length} concepts, ${insights.length} insights`)
      
      return result
      
    } catch (error) {
      console.error('❌ Semantic analysis failed:', error)
      throw new Error(`Semantic analysis failed: ${error.message}`)
    }
  }
  
  private async extractDocumentContext(stemDocument: STEMDocument): Promise<DocumentContext> {
    console.log('📄 Extracting document context...')
    
    // Analyze text content for domain indicators
    const textContent = stemDocument.textBlocks.map(block => block.text).join(' ')
    const keywords = this.extractKeywords(textContent)
    const domain = this.identifyDomain(textContent, stemDocument.formulas, stemDocument.tables)
    const complexity = this.assessComplexity(stemDocument)
    const contentType = this.inferContentType(stemDocument)
    
    return {
      domain,
      academicLevel: this.inferAcademicLevel(stemDocument),
      contentType,
      language: 'en', // Would be detected from text
      complexity,
      keywords,
      abstractTopics: this.extractAbstractTopics(textContent, keywords)
    }
  }
  
  private async identifyKnowledgeDomains(
    stemDocument: STEMDocument, 
    context: DocumentContext
  ): Promise<KnowledgeDomain[]> {
    console.log('🔍 Identifying knowledge domains...')
    
    const domains: KnowledgeDomain[] = []
    
    // Primary domain based on context
    if (context.domain) {
      const primaryDomain = this.createKnowledgeDomain(
        context.domain,
        stemDocument,
        0.9 // High confidence for primary domain
      )
      domains.push(primaryDomain)
    }
    
    // Secondary domains from mathematical content
    const mathDomains = this.identifyMathematicalDomains(stemDocument.formulas)
    domains.push(...mathDomains)
    
    // Application domains from figures and tables
    const applicationDomains = this.identifyApplicationDomains(stemDocument.diagrams, stemDocument.tables)
    domains.push(...applicationDomains)
    
    return domains
  }
  
  private async buildConceptMap(
    stemDocument: STEMDocument,
    knowledgeDomains: KnowledgeDomain[]
  ): Promise<ConceptMap> {
    console.log('🗺️ Building concept map...')
    
    const nodes: ConceptNode[] = []
    const edges: ConceptEdge[] = []
    
    // Extract concepts from formulas
    for (const formula of stemDocument.formulas) {
      const formulaConcepts = this.extractFormulaConcepts(formula)
      nodes.push(...formulaConcepts)
    }
    
    // Extract concepts from text
    for (const textBlock of stemDocument.textBlocks) {
      const textConcepts = this.extractTextConcepts(textBlock, knowledgeDomains)
      nodes.push(...textConcepts)
    }
    
    // Extract concepts from tables
    for (const table of stemDocument.tables) {
      const tableConcepts = this.extractTableConcepts(table)
      nodes.push(...tableConcepts)
    }
    
    // Build relationships between concepts
    edges.push(...this.buildConceptRelationships(nodes, stemDocument))
    
    // Create clusters
    const clusters = this.clusterConcepts(nodes, edges)
    
    // Build hierarchy
    const hierarchy = this.buildConceptHierarchy(nodes, edges, knowledgeDomains)
    
    return { nodes, edges, clusters, hierarchy }
  }
  
  private async analyzeSemanticRelationships(
    stemDocument: STEMDocument,
    conceptMap: ConceptMap
  ): Promise<SemanticRelationship[]> {
    console.log('🔗 Analyzing semantic relationships...')
    
    const relationships: SemanticRelationship[] = []
    
    // Mathematical relationships from formulas
    relationships.push(...this.analyzeMathematicalRelationships(stemDocument.formulas, conceptMap))
    
    // Logical relationships from text
    relationships.push(...this.analyzeLogicalRelationships(stemDocument.textBlocks, conceptMap))
    
    // Causal relationships from content flow
    relationships.push(...this.analyzeCausalRelationships(stemDocument, conceptMap))
    
    // Comparative relationships from tables and figures
    relationships.push(...this.analyzeComparativeRelationships(stemDocument.tables, stemDocument.diagrams, conceptMap))
    
    return relationships
  }
  
  private async generateInsights(
    stemDocument: STEMDocument,
    conceptMap: ConceptMap,
    relationships: SemanticRelationship[]
  ): Promise<IntelligentInsight[]> {
    console.log('💡 Generating intelligent insights...')
    
    const insights: IntelligentInsight[] = []
    
    // Pattern detection
    insights.push(...this.detectPatterns(conceptMap, relationships))
    
    // Anomaly detection
    insights.push(...this.detectAnomalies(stemDocument, conceptMap))
    
    // Knowledge gaps
    insights.push(...this.identifyKnowledgeGaps(conceptMap, relationships))
    
    // Optimization opportunities
    insights.push(...this.identifyOptimizationOpportunities(stemDocument, conceptMap))
    
    // Content verification
    insights.push(...this.verifyContentConsistency(stemDocument, relationships))
    
    return insights
  }
  
  private async generateRecommendations(
    stemDocument: STEMDocument,
    insights: IntelligentInsight[],
    context: DocumentContext
  ): Promise<ActionableRecommendation[]> {
    console.log('📋 Generating actionable recommendations...')
    
    const recommendations: ActionableRecommendation[] = []
    
    // Content enhancement recommendations
    recommendations.push(...this.generateContentEnhancements(insights, context))
    
    // Structure improvement recommendations
    recommendations.push(...this.generateStructureImprovements(stemDocument, insights))
    
    // Clarity boost recommendations
    recommendations.push(...this.generateClarityBoosts(stemDocument, insights))
    
    // Completeness check recommendations
    recommendations.push(...this.generateCompletenessChecks(insights, context))
    
    return recommendations.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority))
  }
  
  // Helper methods for domain identification
  private identifyDomain(textContent: string, formulas: MathFormula[], tables: TableStructure[]): string {
    const domainIndicators = {
      'mathematics': ['theorem', 'proof', 'lemma', 'axiom', 'equation', 'function'],
      'physics': ['force', 'energy', 'momentum', 'field', 'particle', 'wave'],
      'chemistry': ['molecule', 'atom', 'reaction', 'compound', 'element', 'bond'],
      'biology': ['cell', 'gene', 'protein', 'organism', 'evolution', 'species'],
      'engineering': ['design', 'system', 'process', 'optimization', 'control', 'analysis'],
      'computer_science': ['algorithm', 'data', 'network', 'program', 'computation', 'software'],
      'statistics': ['probability', 'distribution', 'hypothesis', 'sample', 'variance', 'correlation']
    }
    
    const scores = new Map<string, number>()
    
    for (const [domain, indicators] of Object.entries(domainIndicators)) {
      let score = 0
      for (const indicator of indicators) {
        const regex = new RegExp(`\\b${indicator}\\b`, 'gi')
        const matches = textContent.match(regex)
        if (matches) {
          score += matches.length
        }
      }
      scores.set(domain, score)
    }
    
    // Also consider mathematical complexity
    if (formulas.length > 10) {
      scores.set('mathematics', (scores.get('mathematics') || 0) + 5)
    }
    
    const topDomain = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a)[0]
    
    return topDomain ? topDomain[0] : 'general'
  }
  
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (would be enhanced with NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const frequency = new Map<string, number>()
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1)
    })
    
    return Array.from(frequency.entries())
      .filter(([, count]) => count > 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word)
  }
  
  private extractFormulaConcepts(formula: MathFormula): ConceptNode[] {
    const concepts: ConceptNode[] = []
    
    // Create concept for the formula itself
    concepts.push({
      id: `concept_${formula.id}`,
      label: formula.rawText,
      type: 'formula',
      importance: this.calculateFormulaImportance(formula),
      confidence: formula.confidence,
      sourceElements: [formula.id],
      properties: {
        latex: formula.latex,
        variables: formula.variables,
        operators: formula.operators,
        formulaType: formula.type
      }
    })
    
    // Create concepts for variables if they represent well-known quantities
    for (const variable of formula.variables) {
      const concept = this.identifyVariableConcept(variable, formula)
      if (concept) {
        concepts.push(concept)
      }
    }
    
    return concepts
  }
  
  private detectPatterns(conceptMap: ConceptMap, relationships: SemanticRelationship[]): IntelligentInsight[] {
    const patterns: IntelligentInsight[] = []
    
    // Detect recurring mathematical patterns
    const formulaNodes = conceptMap.nodes.filter(n => n.type === 'formula')
    if (formulaNodes.length > 5) {
      const commonOperators = this.findCommonOperators(formulaNodes)
      if (commonOperators.length > 0) {
        patterns.push({
          id: `pattern_operators_${Date.now()}`,
          type: 'pattern',
          title: 'Recurring Mathematical Operations',
          description: `Common operators detected: ${commonOperators.join(', ')}`,
          significance: 0.7,
          evidence: [{
            type: 'mathematical',
            content: `Found ${commonOperators.length} recurring operators`,
            location: 'formula_analysis',
            reliability: 0.8
          }],
          implications: [
            'Document focuses on specific mathematical operations',
            'May benefit from operator precedence clarification',
            'Consider grouping related formulas'
          ]
        })
      }
    }
    
    // Detect conceptual clustering
    const clusters = conceptMap.clusters
    if (clusters.length > 2) {
      patterns.push({
        id: `pattern_clusters_${Date.now()}`,
        type: 'pattern',
        title: 'Conceptual Organization',
        description: `Document organizes into ${clusters.length} main conceptual clusters`,
        significance: 0.6,
        evidence: [{
          type: 'structural',
          content: `Identified ${clusters.length} coherent concept clusters`,
          location: 'concept_map',
          reliability: 0.9
        }],
        implications: [
          'Well-structured conceptual organization',
          'Clear topic boundaries',
          'May benefit from explicit section organization'
        ]
      })
    }
    
    return patterns
  }
  
  // Utility methods
  private initializeKnowledgeBase(): void {
    // Initialize with basic mathematical and scientific concepts
    this.knowledgeBase.set('mathematical_constants', ['π', 'e', 'i', '∞'])
    this.knowledgeBase.set('common_functions', ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt'])
    this.knowledgeBase.set('operators', ['+', '-', '×', '÷', '=', '≠', '≤', '≥', '∂', '∇', '∆'])
  }
  
  private async loadDomainModels(): Promise<void> {
    // Load domain-specific models (simplified for demo)
    this.domainModels.set('mathematics', {
      concepts: ['algebra', 'calculus', 'geometry', 'statistics', 'topology'],
      relationships: ['prerequisite', 'application', 'generalization']
    })
    
    this.domainModels.set('physics', {
      concepts: ['mechanics', 'thermodynamics', 'electromagnetism', 'quantum', 'relativity'],
      relationships: ['causal', 'derives_from', 'applies_to']
    })
  }
  
  private async loadMathematicalConcepts(): Promise<void> {
    // Load mathematical concept hierarchy
    const mathConcepts = [
      'number_theory', 'algebra', 'geometry', 'calculus', 'statistics',
      'discrete_math', 'linear_algebra', 'differential_equations'
    ]
    
    mathConcepts.forEach(concept => {
      this.conceptGraph.set(concept, {
        id: concept,
        label: concept.replace('_', ' '),
        type: 'principle',
        importance: 0.8,
        confidence: 0.9,
        sourceElements: [],
        properties: { domain: 'mathematics' }
      })
    })
  }
  
  private async loadScientificPrinciples(): Promise<void> {
    // Load scientific principles and laws
    const principles = [
      'conservation_of_energy', 'newton_laws', 'thermodynamic_laws',
      'electromagnetic_theory', 'quantum_mechanics', 'relativity'
    ]
    
    principles.forEach(principle => {
      this.conceptGraph.set(principle, {
        id: principle,
        label: principle.replace('_', ' '),
        type: 'principle',
        importance: 0.9,
        confidence: 0.95,
        sourceElements: [],
        properties: { domain: 'physics' }
      })
    })
  }
  
  private calculateOverallConfidence(
    conceptMap: ConceptMap,
    relationships: SemanticRelationship[],
    insights: IntelligentInsight[]
  ): number {
    const avgConceptConfidence = conceptMap.nodes.length > 0
      ? conceptMap.nodes.reduce((sum, node) => sum + node.confidence, 0) / conceptMap.nodes.length
      : 0
    
    const avgRelationshipConfidence = relationships.length > 0
      ? relationships.reduce((sum, rel) => sum + rel.confidence, 0) / relationships.length
      : 0
    
    const avgInsightSignificance = insights.length > 0
      ? insights.reduce((sum, insight) => sum + insight.significance, 0) / insights.length
      : 0
    
    return (avgConceptConfidence + avgRelationshipConfidence + avgInsightSignificance) / 3
  }
  
  private priorityScore(priority: string): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 }
    return scores[priority as keyof typeof scores] || 0
  }
  
  // Placeholder implementations for complex methods
  private assessComplexity(stemDocument: STEMDocument): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    const complexityScore = stemDocument.formulas.length * 2 + 
                           stemDocument.tables.length + 
                           stemDocument.diagrams.length
    
    if (complexityScore > 20) return 'expert'
    if (complexityScore > 10) return 'advanced'
    if (complexityScore > 5) return 'intermediate'
    return 'basic'
  }
  
  private inferContentType(stemDocument: STEMDocument): 'textbook' | 'paper' | 'presentation' | 'report' | 'thesis' {
    // Simple heuristic based on content structure
    if (stemDocument.formulas.length > 20) return 'paper'
    if (stemDocument.diagrams.length > 10) return 'presentation'
    if (stemDocument.tables.length > 5) return 'report'
    return 'textbook'
  }
  
  private inferAcademicLevel(stemDocument: STEMDocument): 'undergraduate' | 'graduate' | 'research' | 'professional' {
    const complexity = this.assessComplexity(stemDocument)
    if (complexity === 'expert') return 'research'
    if (complexity === 'advanced') return 'graduate'
    return 'undergraduate'
  }
  
  private extractAbstractTopics(textContent: string, keywords: string[]): string[] {
    // Extract abstract topics from keywords and text analysis
    return keywords.slice(0, 10) // Simplified
  }
  
  private createKnowledgeDomain(domain: string, stemDocument: STEMDocument, confidence: number): KnowledgeDomain {
    return {
      id: domain,
      name: domain.replace('_', ' '),
      confidence,
      coverage: 0.8, // Would be calculated based on content analysis
      subdomains: [], // Would be identified from content
      relatedConcepts: [], // Would be extracted from concept map
      prerequisites: [], // Would be inferred from domain knowledge
      applications: [] // Would be identified from diagrams and examples
    }
  }
  
  private identifyMathematicalDomains(formulas: MathFormula[]): KnowledgeDomain[] {
    // Simplified mathematical domain identification
    return []
  }
  
  private identifyApplicationDomains(diagrams: DiagramElement[], tables: TableStructure[]): KnowledgeDomain[] {
    // Simplified application domain identification
    return []
  }
  
  private extractTextConcepts(textBlock: TextBlock, domains: KnowledgeDomain[]): ConceptNode[] {
    // Simplified text concept extraction
    return []
  }
  
  private extractTableConcepts(table: TableStructure): ConceptNode[] {
    // Simplified table concept extraction
    return []
  }
  
  private buildConceptRelationships(nodes: ConceptNode[], stemDocument: STEMDocument): ConceptEdge[] {
    // Simplified relationship building
    return []
  }
  
  private clusterConcepts(nodes: ConceptNode[], edges: ConceptEdge[]): ConceptCluster[] {
    // Simplified concept clustering
    return []
  }
  
  private buildConceptHierarchy(nodes: ConceptNode[], edges: ConceptEdge[], domains: KnowledgeDomain[]): ConceptHierarchy {
    // Simplified hierarchy building
    return {
      levels: [],
      dependencies: []
    }
  }
  
  private analyzeMathematicalRelationships(formulas: MathFormula[], conceptMap: ConceptMap): SemanticRelationship[] {
    // Simplified mathematical relationship analysis
    return []
  }
  
  private analyzeLogicalRelationships(textBlocks: TextBlock[], conceptMap: ConceptMap): SemanticRelationship[] {
    // Simplified logical relationship analysis
    return []
  }
  
  private analyzeCausalRelationships(stemDocument: STEMDocument, conceptMap: ConceptMap): SemanticRelationship[] {
    // Simplified causal relationship analysis
    return []
  }
  
  private analyzeComparativeRelationships(tables: TableStructure[], diagrams: DiagramElement[], conceptMap: ConceptMap): SemanticRelationship[] {
    // Simplified comparative relationship analysis
    return []
  }
  
  private detectAnomalies(stemDocument: STEMDocument, conceptMap: ConceptMap): IntelligentInsight[] {
    // Simplified anomaly detection
    return []
  }
  
  private identifyKnowledgeGaps(conceptMap: ConceptMap, relationships: SemanticRelationship[]): IntelligentInsight[] {
    // Simplified knowledge gap identification
    return []
  }
  
  private identifyOptimizationOpportunities(stemDocument: STEMDocument, conceptMap: ConceptMap): IntelligentInsight[] {
    // Simplified optimization opportunity identification
    return []
  }
  
  private verifyContentConsistency(stemDocument: STEMDocument, relationships: SemanticRelationship[]): IntelligentInsight[] {
    // Simplified content consistency verification
    return []
  }
  
  private generateContentEnhancements(insights: IntelligentInsight[], context: DocumentContext): ActionableRecommendation[] {
    // Simplified content enhancement generation
    return []
  }
  
  private generateStructureImprovements(stemDocument: STEMDocument, insights: IntelligentInsight[]): ActionableRecommendation[] {
    // Simplified structure improvement generation
    return []
  }
  
  private generateClarityBoosts(stemDocument: STEMDocument, insights: IntelligentInsight[]): ActionableRecommendation[] {
    // Simplified clarity boost generation
    return []
  }
  
  private generateCompletenessChecks(insights: IntelligentInsight[], context: DocumentContext): ActionableRecommendation[] {
    // Simplified completeness check generation
    return []
  }
  
  private calculateFormulaImportance(formula: MathFormula): number {
    // Calculate importance based on formula characteristics
    let importance = 0.5
    
    if (formula.type === 'equation') importance += 0.3
    if (formula.variables.length > 3) importance += 0.1
    if (formula.operators.length > 2) importance += 0.1
    
    return Math.min(importance, 1.0)
  }
  
  private identifyVariableConcept(variable: string, formula: MathFormula): ConceptNode | null {
    // Identify if variable represents a well-known concept
    const knownVariables: Record<string, string> = {
      'E': 'energy',
      'F': 'force',
      'v': 'velocity',
      't': 'time',
      'm': 'mass',
      'x': 'position',
      'y': 'position',
      'z': 'position'
    }
    
    if (knownVariables[variable]) {
      return {
        id: `variable_${variable}_${formula.id}`,
        label: knownVariables[variable],
        type: 'definition',
        importance: 0.6,
        confidence: 0.7,
        sourceElements: [formula.id],
        properties: {
          symbol: variable,
          context: formula.rawText
        }
      }
    }
    
    return null
  }
  
  private findCommonOperators(formulaNodes: ConceptNode[]): string[] {
    const operatorCounts = new Map<string, number>()
    
    formulaNodes.forEach(node => {
      const operators = node.properties.operators || []
      operators.forEach((op: string) => {
        operatorCounts.set(op, (operatorCounts.get(op) || 0) + 1)
      })
    })
    
    return Array.from(operatorCounts.entries())
      .filter(([, count]) => count >= 3)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([op]) => op)
  }
  
  async cleanup(): Promise<void> {
    this.knowledgeBase.clear()
    this.conceptGraph.clear()
    this.domainModels.clear()
    console.log('🧹 Semantic Intelligence Engine cleaned up')
  }
}

// Export singleton instance
export const semanticIntelligenceEngine = new SemanticIntelligenceEngine()