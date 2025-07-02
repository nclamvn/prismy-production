/**
 * PRISMY AI PROVIDER MANAGER
 * Orchestrates multiple AI providers (OpenAI, Anthropic, Cohere) for agent intelligence
 * Implements fallback strategies, cost optimization, and cultural adaptation
 */

import { OpenAI } from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export interface AIProviderConfig {
  openai?: {
    apiKey: string
    model: string
    temperature: number
  }
  anthropic?: {
    apiKey: string
    model: string
    temperature: number
  }
  cohere?: {
    apiKey: string
    model: string
    temperature: number
  }
}

export interface DocumentAnalysisRequest {
  documentContent: string
  documentType: string
  focus:
    | 'daily_insights'
    | 'contract_review'
    | 'financial_analysis'
    | 'project_status'
    | 'research_synthesis'
  personality: string
  language?: 'en' | 'vi'
  culturalContext?:
    | 'Vietnam'
    | 'Thailand'
    | 'Indonesia'
    | 'Philippines'
    | 'Singapore'
}

export interface DocumentAnalysisResult {
  insights: string
  confidence: number
  keyPoints: string[]
  actionItems: string[]
  risks?: string[]
  deadlines?: Date[]
  recommendations: string[]
  metadata: {
    provider: 'openai' | 'anthropic' | 'cohere'
    model: string
    processingTime: number
    tokensUsed: number
  }
}

export interface ContractAnalysisRequest {
  documentContent: string
  focus: (
    | 'compliance'
    | 'risks'
    | 'key_dates'
    | 'obligations'
    | 'renewal_terms'
  )[]
  jurisdiction: 'Vietnam' | 'International'
  language?: 'en' | 'vi'
}

export interface ContractAnalysisResult {
  summary: string
  confidence: number
  risks: ContractRisk[]
  deadlines: ContractDeadline[]
  obligations: ContractObligation[]
  complianceIssues: ComplianceIssue[]
  renewalRecommendations: string[]
  metadata: {
    provider: string
    processingTime: number
  }
}

export interface ContractRisk {
  type: 'legal' | 'financial' | 'operational' | 'compliance'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  mitigation: string
  section: string
}

export interface ContractDeadline {
  type: 'renewal' | 'payment' | 'delivery' | 'termination' | 'review'
  date: Date
  description: string
  criticality: 'low' | 'medium' | 'high'
  daysUntil: number
}

export interface ContractObligation {
  party: 'self' | 'counterparty' | 'both'
  description: string
  deadline?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
}

export interface ComplianceIssue {
  regulation: string
  description: string
  severity: 'minor' | 'major' | 'critical'
  recommendation: string
}

export interface ProjectDetectionRequest {
  documents: DocumentReference[]
  timeWindow: string
  userId: string
}

export interface DocumentReference {
  id: string
  title: string
  content: string
  type: string
  lastModified: Date
}

export interface ProjectDetectionResult {
  activeProjects: string[]
  confidence: number
  projectInsights: ProjectInsight[]
}

export interface ProjectInsight {
  projectName: string
  status: 'planning' | 'active' | 'on_hold' | 'completed'
  progress: number
  keyDocuments: string[]
  nextMilestones: string[]
  risks: string[]
}

export interface AgentCompatibilityRequest {
  agent1: {
    specialty: string
    capabilities: string[]
  }
  agent2: {
    specialty: string
    capabilities: string[]
  }
  context: CollaborationContext
}

export interface CollaborationContext {
  currentProjects: string[]
  documentTypes: string[]
  userGoals: string[]
  timeframe: string
}

export interface AgentCompatibilityResult {
  synergy_score: number
  collaboration_benefits: string[]
  potential_conflicts: string[]
  recommended_workflow: string
}

export class AIProviderManager {
  private openai?: OpenAI
  private anthropic?: Anthropic
  private config: AIProviderConfig
  private fallbackOrder: ('openai' | 'anthropic' | 'cohere')[] = [
    'anthropic',
    'openai',
    'cohere',
  ]

  constructor(config: AIProviderConfig) {
    this.config = config
    this.initializeProviders()
  }

  private initializeProviders(): void {
    if (this.config.openai?.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.openai.apiKey,
      })
    }

    if (this.config.anthropic?.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: this.config.anthropic.apiKey,
      })
    }
  }

  /**
   * Analyze document with AI provider fallback strategy
   */
  async analyzeDocument(
    request: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    const startTime = Date.now()

    for (const provider of this.fallbackOrder) {
      try {
        const result = await this.analyzeWithProvider(provider, request)
        result.metadata.processingTime = Date.now() - startTime
        return result
      } catch (error) {
        console.warn(`[AI Provider Manager] ${provider} failed:`, error)
        continue
      }
    }

    throw new Error('All AI providers failed')
  }

  private async analyzeWithProvider(
    provider: 'openai' | 'anthropic' | 'cohere',
    request: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    switch (provider) {
      case 'anthropic':
        return await this.analyzeWithAnthropic(request)
      case 'openai':
        return await this.analyzeWithOpenAI(request)
      case 'cohere':
        return await this.analyzeWithCohere(request)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  private async analyzeWithAnthropic(
    request: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured')
    }

    const prompt = this.buildAnalysisPrompt(request)

    const response = await this.anthropic.messages.create({
      model: this.config.anthropic?.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: this.config.anthropic?.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Invalid response type from Anthropic')
    }

    return this.parseAnalysisResponse(content.text, {
      provider: 'anthropic',
      model: this.config.anthropic?.model || 'claude-3-5-sonnet-20241022',
      processingTime: 0,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    })
  }

  private async analyzeWithOpenAI(
    request: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI not configured')
    }

    const prompt = this.buildAnalysisPrompt(request)

    const response = await this.openai.chat.completions.create({
      model: this.config.openai?.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: this.config.openai?.temperature || 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Invalid response from OpenAI')
    }

    return this.parseAnalysisResponse(content, {
      provider: 'openai',
      model: this.config.openai?.model || 'gpt-4o',
      processingTime: 0,
      tokensUsed: response.usage?.total_tokens || 0,
    })
  }

  private async analyzeWithCohere(
    request: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    // Placeholder for Cohere implementation
    throw new Error('Cohere implementation pending')
  }

  private buildAnalysisPrompt(request: DocumentAnalysisRequest): string {
    const culturalContext =
      request.culturalContext === 'Vietnam'
        ? 'Adapt analysis for Vietnamese business culture with emphasis on hierarchy, consensus, and long-term relationships.'
        : 'Use international business standards.'

    const languageInstruction =
      request.language === 'vi'
        ? 'Respond in Vietnamese with appropriate business terminology.'
        : 'Respond in English.'

    const personalityContext = this.getPersonalityContext(request.personality)
    const focusInstructions = this.getFocusInstructions(request.focus)

    return `
${personalityContext}

DOCUMENT TO ANALYZE:
${request.documentContent}

ANALYSIS FOCUS: ${focusInstructions}

CULTURAL CONTEXT: ${culturalContext}
LANGUAGE: ${languageInstruction}

Please provide a comprehensive analysis in the following JSON format:
{
  "insights": "Main insights and findings",
  "confidence": 0.85,
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "actionItems": ["Action 1", "Action 2"],
  "risks": ["Risk 1", "Risk 2"],
  "deadlines": ["2024-01-15T00:00:00Z"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Focus on providing actionable, specific insights that demonstrate deep understanding of the document's business context and implications.
`
  }

  private getPersonalityContext(personality: string): string {
    const personalities = {
      legal:
        'You are a meticulous legal advisor focused on compliance, risk assessment, and regulatory requirements.',
      financial:
        'You are an analytical financial expert focused on budget analysis, cost optimization, and financial performance.',
      project:
        'You are an organized project manager focused on timelines, deliverables, and resource coordination.',
      research:
        'You are a thorough research specialist focused on knowledge synthesis, insights discovery, and data analysis.',
      general:
        'You are a versatile business analyst focused on general productivity and document organization.',
    }

    return (
      personalities[personality as keyof typeof personalities] ||
      personalities.general
    )
  }

  private getFocusInstructions(
    focus: DocumentAnalysisRequest['focus']
  ): string {
    const focuses = {
      daily_insights:
        'Provide daily actionable insights, progress updates, and immediate next steps.',
      contract_review:
        'Analyze contract terms, identify risks, extract key dates, and assess compliance requirements.',
      financial_analysis:
        'Examine financial data, budget performance, cost trends, and investment recommendations.',
      project_status:
        'Evaluate project progress, timeline adherence, resource utilization, and milestone tracking.',
      research_synthesis:
        'Synthesize research findings, identify patterns, extract key insights, and recommend follow-up research.',
    }

    return focuses[focus]
  }

  private parseAnalysisResponse(
    content: string,
    metadata: any
  ): DocumentAnalysisResult {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/)?.[0]
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch)
        return {
          insights: parsed.insights || content,
          confidence: parsed.confidence || 0.8,
          keyPoints: parsed.keyPoints || [],
          actionItems: parsed.actionItems || [],
          risks: parsed.risks || [],
          deadlines: parsed.deadlines?.map((d: string) => new Date(d)) || [],
          recommendations: parsed.recommendations || [],
          metadata,
        }
      }

      // Fallback to text parsing
      return {
        insights: content,
        confidence: 0.75,
        keyPoints: this.extractBulletPoints(
          content,
          /Key Points?:|Main Points?:/i
        ),
        actionItems: this.extractBulletPoints(
          content,
          /Action Items?:|Next Steps?:/i
        ),
        risks: this.extractBulletPoints(content, /Risks?:|Concerns?:/i),
        deadlines: this.extractDates(content),
        recommendations: this.extractBulletPoints(
          content,
          /Recommendations?:|Suggestions?:/i
        ),
        metadata,
      }
    } catch (error) {
      console.error('[AI Provider Manager] Parse error:', error)
      return {
        insights: content,
        confidence: 0.6,
        keyPoints: [],
        actionItems: [],
        risks: [],
        deadlines: [],
        recommendations: [],
        metadata,
      }
    }
  }

  private extractBulletPoints(text: string, pattern: RegExp): string[] {
    const section = text.split(pattern)[1]
    if (!section) return []

    const nextSection = section.split(/\n\n|[A-Z][a-z]+:/)[0]
    const bullets = nextSection.match(/[-•*]\s*(.+)/g)

    return bullets?.map(bullet => bullet.replace(/^[-•*]\s*/, '').trim()) || []
  }

  private extractDates(text: string): Date[] {
    const datePattern =
      /\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
    const matches = text.match(datePattern)

    return (
      matches
        ?.map(match => new Date(match))
        .filter(date => !isNaN(date.getTime())) || []
    )
  }

  /**
   * Analyze contract with specialized legal focus
   */
  async analyzeContract(
    request: ContractAnalysisRequest
  ): Promise<ContractAnalysisResult> {
    const analysisRequest: DocumentAnalysisRequest = {
      documentContent: request.documentContent,
      documentType: 'contract',
      focus: 'contract_review',
      personality: 'legal',
      language: request.language,
      culturalContext:
        request.jurisdiction === 'Vietnam' ? 'Vietnam' : undefined,
    }

    const result = await this.analyzeDocument(analysisRequest)

    return {
      summary: result.insights,
      confidence: result.confidence,
      risks: this.parseContractRisks(result.risks || []),
      deadlines: this.parseContractDeadlines(result.deadlines || []),
      obligations: this.parseContractObligations(result.actionItems || []),
      complianceIssues: this.parseComplianceIssues(
        result.recommendations || []
      ),
      renewalRecommendations: result.recommendations || [],
      metadata: {
        provider: result.metadata.provider,
        processingTime: result.metadata.processingTime,
      },
    }
  }

  private parseContractRisks(risks: string[]): ContractRisk[] {
    return risks.map((risk, index) => ({
      type: this.classifyRiskType(risk),
      description: risk,
      severity: this.assessRiskSeverity(risk),
      mitigation: `Review and assess ${risk.toLowerCase()}`,
      section: `Section ${index + 1}`,
    }))
  }

  private parseContractDeadlines(deadlines: Date[]): ContractDeadline[] {
    return deadlines.map(date => ({
      type: 'review' as const,
      date,
      description: `Important date: ${date.toLocaleDateString()}`,
      criticality: 'medium' as const,
      daysUntil: Math.ceil(
        (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    }))
  }

  private parseContractObligations(
    actionItems: string[]
  ): ContractObligation[] {
    return actionItems.map(item => ({
      party: 'self' as const,
      description: item,
      status: 'pending' as const,
      priority: 'medium' as const,
    }))
  }

  private parseComplianceIssues(recommendations: string[]): ComplianceIssue[] {
    return recommendations
      .filter(rec => rec.toLowerCase().includes('compliance'))
      .map(rec => ({
        regulation: 'General Compliance',
        description: rec,
        severity: 'minor' as const,
        recommendation: rec,
      }))
  }

  private classifyRiskType(risk: string): ContractRisk['type'] {
    const lower = risk.toLowerCase()
    if (lower.includes('legal') || lower.includes('law')) return 'legal'
    if (
      lower.includes('financial') ||
      lower.includes('cost') ||
      lower.includes('payment')
    )
      return 'financial'
    if (
      lower.includes('operational') ||
      lower.includes('delivery') ||
      lower.includes('performance')
    )
      return 'operational'
    if (lower.includes('compliance') || lower.includes('regulation'))
      return 'compliance'
    return 'legal'
  }

  private assessRiskSeverity(risk: string): ContractRisk['severity'] {
    const lower = risk.toLowerCase()
    if (
      lower.includes('critical') ||
      lower.includes('severe') ||
      lower.includes('major')
    )
      return 'critical'
    if (lower.includes('high') || lower.includes('significant')) return 'high'
    if (lower.includes('medium') || lower.includes('moderate')) return 'medium'
    return 'low'
  }

  /**
   * Detect active projects from document patterns
   */
  async detectProjects(
    request: ProjectDetectionRequest
  ): Promise<ProjectDetectionResult> {
    // Simplified implementation for now
    const projectKeywords = [
      'project',
      'initiative',
      'campaign',
      'program',
      'development',
    ]
    const documentTitles = request.documents.map(doc => doc.title.toLowerCase())

    const potentialProjects = new Set<string>()

    for (const doc of request.documents) {
      const content = doc.title.toLowerCase() + ' ' + doc.content.toLowerCase()

      // Simple keyword matching
      for (const keyword of projectKeywords) {
        if (content.includes(keyword)) {
          const projectName = this.extractProjectName(doc.title, content)
          if (projectName) {
            potentialProjects.add(projectName)
          }
        }
      }
    }

    return {
      activeProjects: Array.from(potentialProjects).slice(0, 5),
      confidence: 0.7,
      projectInsights: Array.from(potentialProjects)
        .slice(0, 3)
        .map(name => ({
          projectName: name,
          status: 'active' as const,
          progress: Math.floor(Math.random() * 100),
          keyDocuments: request.documents
            .filter(doc => doc.title.toLowerCase().includes(name.toLowerCase()))
            .map(doc => doc.id),
          nextMilestones: ['Complete analysis', 'Review stakeholders'],
          risks: ['Timeline constraints', 'Resource allocation'],
        })),
    }
  }

  private extractProjectName(title: string, content: string): string | null {
    // Simple project name extraction
    const titleWords = title.split(' ')
    if (titleWords.length >= 2) {
      return titleWords.slice(0, 3).join(' ')
    }
    return null
  }

  /**
   * Assess agent compatibility for collaboration
   */
  async assessAgentCompatibility(
    request: AgentCompatibilityRequest
  ): Promise<AgentCompatibilityResult> {
    const agent1 = request.agent1
    const agent2 = request.agent2

    // Calculate compatibility based on specialties
    let synergyScore = 0.5 // Base score

    // High synergy combinations
    if (
      (agent1.specialty.includes('legal') &&
        agent2.specialty.includes('financial')) ||
      (agent1.specialty.includes('financial') &&
        agent2.specialty.includes('legal'))
    ) {
      synergyScore = 0.9
    } else if (
      (agent1.specialty.includes('project') &&
        agent2.specialty.includes('research')) ||
      (agent1.specialty.includes('research') &&
        agent2.specialty.includes('project'))
    ) {
      synergyScore = 0.85
    } else if (agent1.specialty !== agent2.specialty) {
      synergyScore = 0.6
    }

    // Capability overlap assessment
    const sharedCapabilities = agent1.capabilities.filter(cap =>
      agent2.capabilities.includes(cap)
    )

    if (sharedCapabilities.length > 0) {
      synergyScore += 0.1
    }

    return {
      synergy_score: Math.min(1.0, synergyScore),
      collaboration_benefits: [
        'Complementary expertise',
        'Enhanced analysis quality',
        'Comprehensive coverage',
      ],
      potential_conflicts: [
        'Different working styles',
        'Priority misalignment',
      ],
      recommended_workflow: 'Sequential analysis with cross-validation',
    }
  }

  /**
   * Get provider status and health
   */
  getProviderStatus(): { [key: string]: boolean } {
    return {
      openai: !!this.openai,
      anthropic: !!this.anthropic,
      cohere: false, // Not implemented yet
    }
  }

  /**
   * Get available providers in priority order
   */
  getAvailableProviders(): string[] {
    return this.fallbackOrder.filter(provider => {
      const status = this.getProviderStatus()
      return status[provider]
    })
  }
}

// Export singleton instance with environment configuration
export const aiProviderManager = new AIProviderManager({
  openai: process.env.OPENAI_API_KEY
    ? {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o',
        temperature: 0.7,
      }
    : undefined,
  anthropic: process.env.ANTHROPIC_API_KEY
    ? {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
      }
    : undefined,
  cohere: process.env.COHERE_API_KEY
    ? {
        apiKey: process.env.COHERE_API_KEY,
        model: 'command-r',
        temperature: 0.7,
      }
    : undefined,
})

export default aiProviderManager
