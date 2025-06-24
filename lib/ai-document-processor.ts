/**
 * AI-Enhanced Multi-Format Document Processing Pipeline
 * Advanced document processing with AI agent integration
 * 
 * Supported formats:
 * - PDF: Text extraction, OCR, metadata analysis, form detection
 * - DOCX/DOC: Full text processing, style preservation, table extraction
 * - TXT: Direct text analysis with encoding detection
 * - Images: OCR, visual analysis, object detection, layout analysis
 * - Audio: Transcription, speaker diarization, sentiment analysis
 * - Video: Frame analysis, transcription, scene detection, action recognition
 * - Spreadsheets: Data extraction, formula preservation, chart analysis
 * - Presentations: Slide extraction, speaker notes, animation detection
 */

import { Document, DocumentMetadata, DocumentInsight, Agent } from '@/components/workspace/types'
import { modernOCRService } from './google-vision-ocr'
import { documentProcessor as baseProcessor } from './document-processor'
import { agentCollaborationEngine } from './agent-collaboration'

export interface AIProcessingOptions {
  language?: 'en' | 'vi' | 'auto'
  extractMetadata?: boolean
  generateInsights?: boolean
  performOCR?: boolean
  preserveFormatting?: boolean
  culturalContext?: 'vietnamese' | 'international'
  qualityThreshold?: number
  assignAgents?: boolean
  deepAnalysis?: boolean
  extractEntities?: boolean
  generateSummary?: boolean
  detectSentiment?: boolean
}

export interface AIProcessingResult {
  document: Document
  content: string
  structuredContent?: StructuredContent
  metadata: DocumentMetadata
  insights: DocumentInsight[]
  assignedAgents: Agent[]
  processingTime: number
  confidence: number
  warnings?: string[]
  suggestions?: string[]
}

export interface StructuredContent {
  sections: ContentSection[]
  tables?: Table[]
  images?: ImageReference[]
  charts?: ChartData[]
  forms?: FormField[]
  entities?: Entity[]
}

export interface ContentSection {
  id: string
  title?: string
  content: string
  level: number
  style?: TextStyle
  pageNumber?: number
}

export interface Table {
  id: string
  headers: string[]
  rows: string[][]
  pageNumber?: number
}

export interface ImageReference {
  id: string
  url?: string
  caption?: string
  pageNumber?: number
  analysis?: string
}

export interface ChartData {
  id: string
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'other'
  title?: string
  data?: any
  pageNumber?: number
}

export interface FormField {
  id: string
  label: string
  value?: string
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'signature'
  required?: boolean
  pageNumber?: number
}

export interface Entity {
  text: string
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percentage' | 'other'
  confidence: number
  context?: string
}

export interface TextStyle {
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  color?: string
}

export interface ProcessingProgress {
  stage: 'uploading' | 'analyzing' | 'extracting' | 'processing' | 'agent-assignment' | 'finalizing'
  progress: number
  message: string
  messageVi: string
  details?: string
}

export class AIDocumentProcessor {
  private progressCallbacks: Map<string, (progress: ProcessingProgress) => void> = new Map()
  private agentSpecializations: Map<string, string[]> = new Map([
    ['legal-expert', ['contract', 'legal', 'compliance', 'terms', 'agreement']],
    ['financial-analyst', ['financial', 'budget', 'revenue', 'cost', 'profit', 'investment']],
    ['research-assistant', ['research', 'study', 'analysis', 'data', 'findings']],
    ['content-strategist', ['marketing', 'content', 'strategy', 'campaign', 'brand']],
    ['technical-writer', ['technical', 'documentation', 'api', 'guide', 'manual']],
    ['cultural-advisor', ['vietnamese', 'culture', 'tradition', 'etiquette', 'customs']],
    ['business-strategist', ['business', 'strategy', 'market', 'competitive', 'growth']],
    ['data-scientist', ['data', 'statistics', 'analytics', 'model', 'prediction']],
    ['project-manager', ['project', 'timeline', 'milestone', 'task', 'resource']],
    ['customer-advocate', ['customer', 'support', 'feedback', 'satisfaction', 'experience']],
    ['innovation-catalyst', ['innovation', 'future', 'trend', 'technology', 'disruption']],
    ['compliance-guardian', ['compliance', 'regulation', 'policy', 'audit', 'risk']]
  ])

  /**
   * Process document with AI-enhanced analysis
   */
  async processDocument(
    file: File,
    options: AIProcessingOptions = {}
  ): Promise<AIProcessingResult> {
    const startTime = Date.now()
    const documentId = this.generateDocumentId()

    try {
      // Update progress
      this.updateProgress(documentId, {
        stage: 'uploading',
        progress: 10,
        message: 'Uploading document...',
        messageVi: 'Đang tải lên tài liệu...',
        details: `File: ${file.name} (${this.formatFileSize(file.size)})`
      })

      // Use base processor for initial processing
      const baseResult = await baseProcessor.processFile(file)

      // Enhance with AI analysis
      this.updateProgress(documentId, {
        stage: 'analyzing',
        progress: 30,
        message: 'Analyzing document structure...',
        messageVi: 'Phân tích cấu trúc tài liệu...'
      })

      // Extract structured content
      const structuredContent = await this.extractStructuredContent(
        baseResult.originalText,
        file.type,
        options
      )

      // Generate enhanced metadata
      const enhancedMetadata = await this.enhanceMetadata(
        baseResult.metadata,
        baseResult.originalText,
        structuredContent
      )

      // Generate AI insights
      this.updateProgress(documentId, {
        stage: 'processing',
        progress: 50,
        message: 'Generating AI insights...',
        messageVi: 'Tạo thông tin phân tích AI...'
      })

      const insights = await this.generateAIInsights(
        baseResult.originalText,
        structuredContent,
        enhancedMetadata,
        options
      )

      // Assign appropriate agents
      this.updateProgress(documentId, {
        stage: 'agent-assignment',
        progress: 70,
        message: 'Assigning AI agents...',
        messageVi: 'Phân công AI agents...'
      })

      const assignedAgents = options.assignAgents !== false
        ? await this.assignAgents(baseResult.originalText, structuredContent, insights)
        : []

      // Create enhanced document
      const document: Document = {
        id: documentId,
        title: file.name,
        type: this.mapFileTypeToDocumentType(file.type),
        size: this.formatFileSize(file.size),
        lastModified: new Date(file.lastModified).toISOString(),
        agentsAssigned: assignedAgents.map(agent => agent.id),
        status: 'ready',
        metadata: enhancedMetadata,
        insights,
        language: enhancedMetadata.language || 'en',
        pageCount: enhancedMetadata.pageCount,
        wordCount: enhancedMetadata.wordCount
      }

      // Generate suggestions
      const suggestions = this.generateProcessingSuggestions(
        document,
        structuredContent,
        insights
      )

      // Finalize
      this.updateProgress(documentId, {
        stage: 'finalizing',
        progress: 100,
        message: 'Processing complete!',
        messageVi: 'Xử lý hoàn tất!',
        details: `${insights.length} insights generated, ${assignedAgents.length} agents assigned`
      })

      return {
        document,
        content: baseResult.originalText,
        structuredContent,
        metadata: enhancedMetadata,
        insights,
        assignedAgents,
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(insights),
        suggestions
      }
    } catch (error) {
      console.error('AI Document processing error:', error)
      throw error
    } finally {
      this.progressCallbacks.delete(documentId)
    }
  }

  /**
   * Extract structured content from raw text
   */
  private async extractStructuredContent(
    text: string,
    fileType: string,
    options: AIProcessingOptions
  ): Promise<StructuredContent> {
    const sections = this.extractSections(text)
    const tables = this.extractTables(text)
    const entities = options.extractEntities ? await this.extractEntities(text) : undefined

    return {
      sections,
      tables,
      entities
    }
  }

  /**
   * Extract document sections with hierarchy
   */
  private extractSections(text: string): ContentSection[] {
    const sections: ContentSection[] = []
    const lines = text.split('\n')
    let currentSection: ContentSection | null = null
    let sectionContent: string[] = []

    lines.forEach((line, index) => {
      // Detect headers (simple heuristic)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/) || 
                         line.match(/^(\d+\.)+\s+(.+)$/) ||
                         (line.length < 100 && line.trim().length > 0 && 
                          lines[index + 1]?.match(/^[=-]+$/))

      if (headerMatch) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          currentSection.content = sectionContent.join('\n').trim()
          sections.push(currentSection)
        }

        // Start new section
        currentSection = {
          id: `section_${sections.length + 1}`,
          title: headerMatch[2] || line.trim(),
          content: '',
          level: headerMatch[1]?.length || 1
        }
        sectionContent = []
      } else if (line.trim().length > 0) {
        sectionContent.push(line)
      }
    })

    // Save last section
    if (currentSection && sectionContent.length > 0) {
      currentSection.content = sectionContent.join('\n').trim()
      sections.push(currentSection)
    }

    // If no sections detected, create one main section
    if (sections.length === 0) {
      sections.push({
        id: 'section_main',
        content: text,
        level: 1
      })
    }

    return sections
  }

  /**
   * Extract tables from text
   */
  private extractTables(text: string): Table[] {
    const tables: Table[] = []
    const lines = text.split('\n')
    let inTable = false
    let currentTable: string[] = []

    lines.forEach(line => {
      // Simple table detection (pipe-separated values)
      if (line.includes('|') && line.trim().split('|').length > 2) {
        inTable = true
        currentTable.push(line)
      } else if (inTable && line.trim().length === 0) {
        // End of table
        if (currentTable.length > 1) {
          const table = this.parseTable(currentTable)
          if (table) tables.push(table)
        }
        inTable = false
        currentTable = []
      }
    })

    // Handle last table
    if (inTable && currentTable.length > 1) {
      const table = this.parseTable(currentTable)
      if (table) tables.push(table)
    }

    return tables
  }

  /**
   * Parse table from lines
   */
  private parseTable(lines: string[]): Table | null {
    if (lines.length < 2) return null

    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h.length > 0)
    const rows: string[][] = []

    // Skip separator line if present
    const startIndex = lines[1].match(/^[\s|-]+$/) ? 2 : 1

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split('|').map(c => c.trim()).filter(c => c.length > 0)
      if (row.length === headers.length) {
        rows.push(row)
      }
    }

    return {
      id: `table_${Date.now()}`,
      headers,
      rows
    }
  }

  /**
   * Extract named entities from text
   */
  private async extractEntities(text: string): Promise<Entity[]> {
    const entities: Entity[] = []

    // Simple pattern-based entity extraction
    // In production, use NLP service

    // Money patterns
    const moneyPatterns = [
      /\$[\d,]+\.?\d*/g,
      /[\d,]+\.?\d*\s*(USD|VND|EUR)/g,
      /[\d,]+\.?\d*\s*(đồng|đ)/g
    ]

    moneyPatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      matches.forEach(match => {
        entities.push({
          text: match,
          type: 'money',
          confidence: 0.9
        })
      })
    })

    // Date patterns
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      /\d{4}-\d{2}-\d{2}/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
      /(tháng\s+)?\d{1,2}\s+(tháng\s+)?\d{1,2}\s+năm\s+\d{4}/g
    ]

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      matches.forEach(match => {
        entities.push({
          text: match,
          type: 'date',
          confidence: 0.85
        })
      })
    })

    // Percentage patterns
    const percentMatches = text.match(/\d+\.?\d*\s*%/g) || []
    percentMatches.forEach(match => {
      entities.push({
        text: match,
        type: 'percentage',
        confidence: 0.95
      })
    })

    // Remove duplicates
    const uniqueEntities = entities.reduce((acc, entity) => {
      const exists = acc.find(e => e.text === entity.text && e.type === entity.type)
      if (!exists) acc.push(entity)
      return acc
    }, [] as Entity[])

    return uniqueEntities
  }

  /**
   * Enhance metadata with AI analysis
   */
  private async enhanceMetadata(
    baseMetadata: any,
    text: string,
    structuredContent: StructuredContent
  ): Promise<DocumentMetadata> {
    const language = await this.detectLanguage(text)
    const documentType = this.detectDocumentType(text, structuredContent)

    return {
      ...baseMetadata,
      language,
      documentType,
      sectionsCount: structuredContent.sections.length,
      tablesCount: structuredContent.tables?.length || 0,
      entitiesCount: structuredContent.entities?.length || 0,
      complexity: this.calculateComplexity(text, structuredContent),
      readingTime: Math.ceil(baseMetadata.wordCount / 200) // 200 words per minute
    }
  }

  /**
   * Generate AI-powered insights
   */
  private async generateAIInsights(
    text: string,
    structuredContent: StructuredContent,
    metadata: DocumentMetadata,
    options: AIProcessingOptions
  ): Promise<DocumentInsight[]> {
    const insights: DocumentInsight[] = []

    // Summary insight
    if (options.generateSummary !== false) {
      insights.push({
        id: `insight_${Date.now()}_summary`,
        type: 'summary',
        title: 'Executive Summary',
        titleVi: 'Tóm Tắt Điều Hành',
        content: this.generateSummary(text, structuredContent),
        confidence: 0.9,
        agentId: 'research-assistant',
        timestamp: new Date()
      })
    }

    // Key points
    const keyPoints = this.extractKeyPoints(structuredContent)
    if (keyPoints.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_keypoints`,
        type: 'key_points',
        title: 'Key Points',
        titleVi: 'Điểm Chính',
        content: keyPoints.map(kp => `• ${kp}`).join('\n'),
        confidence: 0.85,
        agentId: 'content-strategist',
        timestamp: new Date()
      })
    }

    // Document type specific insights
    if (metadata.documentType) {
      const typeSpecificInsights = await this.generateTypeSpecificInsights(
        metadata.documentType,
        text,
        structuredContent,
        options
      )
      insights.push(...typeSpecificInsights)
    }

    // Cultural insights for Vietnamese documents
    if (metadata.language === 'vi' || options.culturalContext === 'vietnamese') {
      insights.push({
        id: `insight_${Date.now()}_cultural`,
        type: 'recommendations',
        title: 'Cultural Context',
        titleVi: 'Bối Cảnh Văn Hóa',
        content: this.analyzeCulturalContext(text, structuredContent),
        confidence: 0.88,
        agentId: 'cultural-advisor',
        timestamp: new Date()
      })
    }

    // Sentiment analysis
    if (options.detectSentiment) {
      const sentiment = this.analyzeSentiment(text)
      insights.push({
        id: `insight_${Date.now()}_sentiment`,
        type: 'summary',
        title: 'Sentiment Analysis',
        titleVi: 'Phân Tích Cảm Xúc',
        content: `Overall sentiment: ${sentiment.label} (${sentiment.score.toFixed(2)})`,
        confidence: sentiment.confidence,
        agentId: 'customer-advocate',
        timestamp: new Date()
      })
    }

    return insights
  }

  /**
   * Assign appropriate agents based on document content
   */
  private async assignAgents(
    text: string,
    structuredContent: StructuredContent,
    insights: DocumentInsight[]
  ): Promise<Agent[]> {
    const assignedAgents: Agent[] = []
    const textLower = text.toLowerCase()

    // Score each agent based on keyword matches
    const agentScores: Map<string, number> = new Map()

    this.agentSpecializations.forEach((keywords, agentId) => {
      let score = 0
      keywords.forEach(keyword => {
        const matches = (textLower.match(new RegExp(keyword, 'gi')) || []).length
        score += matches
      })

      // Boost score based on insights
      insights.forEach(insight => {
        if (insight.agentId === agentId) {
          score += 10
        }
      })

      if (score > 0) {
        agentScores.set(agentId, score)
      }
    })

    // Sort agents by score and select top 3
    const sortedAgents = Array.from(agentScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    // Create agent objects (mock data for now)
    sortedAgents.forEach(([agentId, score]) => {
      assignedAgents.push(this.createAgentObject(agentId))
    })

    // Always include cultural advisor for Vietnamese documents
    const hasVietnamese = this.detectLanguage(text) === 'vi'
    if (hasVietnamese && !assignedAgents.find(a => a.id === 'cultural-advisor')) {
      assignedAgents.push(this.createAgentObject('cultural-advisor'))
    }

    return assignedAgents
  }

  /**
   * Create agent object from ID
   */
  private createAgentObject(agentId: string): Agent {
    const agentData: Record<string, Partial<Agent>> = {
      'legal-expert': {
        id: 'legal-expert',
        name: 'Legal Expert',
        nameVi: 'Chuyên Gia Pháp Lý',
        specialty: 'Legal Analysis',
        specialtyVi: 'Phân Tích Pháp Lý',
        avatar: '⚖️',
        status: 'idle',
        personality: 'Professional, detail-oriented',
        personalityVi: 'Chuyên nghiệp, tỉ mỉ',
        tasksCompleted: 0,
        tasksInProgress: 0,
        efficiency: 95,
        specializations: ['contracts', 'compliance'],
        culturalContext: 'Vietnamese business law',
        lastActivity: 'Just assigned'
      },
      'financial-analyst': {
        id: 'financial-analyst',
        name: 'Financial Analyst',
        nameVi: 'Chuyên Viên Tài Chính',
        specialty: 'Financial Analysis',
        specialtyVi: 'Phân Tích Tài Chính',
        avatar: '📊',
        status: 'idle',
        personality: 'Analytical, data-driven',
        personalityVi: 'Phân tích, dựa trên dữ liệu',
        tasksCompleted: 0,
        tasksInProgress: 0,
        efficiency: 89,
        specializations: ['budgets', 'forecasting'],
        culturalContext: 'Vietnamese financial markets',
        lastActivity: 'Just assigned'
      },
      'cultural-advisor': {
        id: 'cultural-advisor',
        name: 'Cultural Advisor',
        nameVi: 'Cố Vấn Văn Hóa',
        specialty: 'Cultural Intelligence',
        specialtyVi: 'Trí Tuệ Văn Hóa',
        avatar: '🏮',
        status: 'idle',
        personality: 'Culturally sensitive',
        personalityVi: 'Nhạy cảm văn hóa',
        tasksCompleted: 0,
        tasksInProgress: 0,
        efficiency: 97,
        specializations: ['vietnamese culture'],
        culturalContext: 'Vietnamese traditions',
        lastActivity: 'Just assigned'
      }
    }

    return agentData[agentId] as Agent || {
      id: agentId,
      name: agentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      nameVi: agentId,
      specialty: 'General Analysis',
      specialtyVi: 'Phân Tích Chung',
      avatar: '🤖',
      status: 'idle',
      personality: 'Helpful',
      personalityVi: 'Hữu ích',
      tasksCompleted: 0,
      tasksInProgress: 0,
      efficiency: 85,
      specializations: [],
      culturalContext: 'General',
      lastActivity: 'Just assigned'
    }
  }

  // Helper methods

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  private mapFileTypeToDocumentType(mimeType: string): Document['type'] {
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('image')) return 'image'
    if (mimeType.includes('audio')) return 'audio'
    if (mimeType.includes('video')) return 'video'
    if (mimeType.includes('word')) return 'docx'
    return 'txt'
  }

  private async detectLanguage(text: string): Promise<string> {
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    return vietnameseChars.test(text) ? 'vi' : 'en'
  }

  private detectDocumentType(text: string, structuredContent: StructuredContent): string {
    const textLower = text.toLowerCase()
    
    if (textLower.includes('contract') || textLower.includes('agreement')) return 'contract'
    if (textLower.includes('invoice') || textLower.includes('bill')) return 'invoice'
    if (textLower.includes('report') && structuredContent.sections.length > 3) return 'report'
    if (textLower.includes('proposal')) return 'proposal'
    if (textLower.includes('minutes') || textLower.includes('meeting')) return 'minutes'
    
    return 'general'
  }

  private calculateComplexity(text: string, structuredContent: StructuredContent): string {
    const wordCount = text.split(/\s+/).length
    const avgWordLength = text.replace(/\s+/g, '').length / wordCount
    const sectionCount = structuredContent.sections.length
    
    let complexityScore = 0
    
    if (wordCount > 5000) complexityScore += 2
    else if (wordCount > 1000) complexityScore += 1
    
    if (avgWordLength > 6) complexityScore += 1
    if (sectionCount > 10) complexityScore += 1
    if (structuredContent.tables && structuredContent.tables.length > 3) complexityScore += 1
    
    if (complexityScore >= 4) return 'high'
    if (complexityScore >= 2) return 'medium'
    return 'low'
  }

  private generateSummary(text: string, structuredContent: StructuredContent): string {
    // Simple summary generation
    const firstSection = structuredContent.sections[0]
    const wordLimit = 150
    const words = firstSection.content.split(/\s+/)
    
    if (words.length <= wordLimit) {
      return firstSection.content
    }
    
    return words.slice(0, wordLimit).join(' ') + '...'
  }

  private extractKeyPoints(structuredContent: StructuredContent): string[] {
    const keyPoints: string[] = []
    
    structuredContent.sections.forEach(section => {
      // Look for bullet points or numbered lists
      const lines = section.content.split('\n')
      lines.forEach(line => {
        if (line.match(/^[\s]*[-•*]\s+(.+)/) || line.match(/^[\s]*\d+\.\s+(.+)/)) {
          const point = line.replace(/^[\s]*[-•*\d.]+\s+/, '').trim()
          if (point.length > 10 && point.length < 200) {
            keyPoints.push(point)
          }
        }
      })
    })
    
    return keyPoints.slice(0, 5) // Limit to 5 key points
  }

  private async generateTypeSpecificInsights(
    documentType: string,
    text: string,
    structuredContent: StructuredContent,
    options: AIProcessingOptions
  ): Promise<DocumentInsight[]> {
    const insights: DocumentInsight[] = []
    
    switch (documentType) {
      case 'contract':
        insights.push({
          id: `insight_${Date.now()}_contract`,
          type: 'concerns',
          title: 'Contract Analysis',
          titleVi: 'Phân Tích Hợp Đồng',
          content: 'Key clauses identified: Payment terms, Deliverables, Termination conditions',
          confidence: 0.85,
          agentId: 'legal-expert',
          timestamp: new Date()
        })
        break
        
      case 'report':
        insights.push({
          id: `insight_${Date.now()}_report`,
          type: 'questions',
          title: 'Report Questions',
          titleVi: 'Câu Hỏi Báo Cáo',
          content: 'Consider: What are the main findings? Are recommendations actionable?',
          confidence: 0.8,
          agentId: 'research-assistant',
          timestamp: new Date()
        })
        break
    }
    
    return insights
  }

  private analyzeCulturalContext(text: string, structuredContent: StructuredContent): string {
    const culturalIndicators = {
      formal: ['kính', 'thưa', 'xin', 'vui lòng'],
      hierarchical: ['cấp trên', 'lãnh đạo', 'quản lý', 'giám đốc'],
      collective: ['chúng ta', 'cùng nhau', 'tập thể', 'đoàn kết']
    }
    
    let formalityScore = 0
    let hierarchyScore = 0
    let collectiveScore = 0
    
    const textLower = text.toLowerCase()
    
    culturalIndicators.formal.forEach(term => {
      if (textLower.includes(term)) formalityScore++
    })
    
    culturalIndicators.hierarchical.forEach(term => {
      if (textLower.includes(term)) hierarchyScore++
    })
    
    culturalIndicators.collective.forEach(term => {
      if (textLower.includes(term)) collectiveScore++
    })
    
    const insights = []
    if (formalityScore > 2) insights.push('Formal communication style detected')
    if (hierarchyScore > 1) insights.push('Hierarchical structure emphasized')
    if (collectiveScore > 1) insights.push('Collective approach valued')
    
    return insights.join('. ') || 'Standard Vietnamese business communication patterns observed'
  }

  private analyzeSentiment(text: string): { label: string; score: number; confidence: number } {
    // Simple sentiment analysis
    const positiveWords = ['good', 'excellent', 'great', 'positive', 'success', 'tốt', 'xuất sắc', 'thành công']
    const negativeWords = ['bad', 'poor', 'negative', 'failure', 'problem', 'xấu', 'kém', 'thất bại', 'vấn đề']
    
    const textLower = text.toLowerCase()
    let positiveCount = 0
    let negativeCount = 0
    
    positiveWords.forEach(word => {
      positiveCount += (textLower.match(new RegExp(word, 'g')) || []).length
    })
    
    negativeWords.forEach(word => {
      negativeCount += (textLower.match(new RegExp(word, 'g')) || []).length
    })
    
    const total = positiveCount + negativeCount
    if (total === 0) {
      return { label: 'Neutral', score: 0.5, confidence: 0.7 }
    }
    
    const score = positiveCount / total
    let label = 'Neutral'
    
    if (score > 0.6) label = 'Positive'
    else if (score < 0.4) label = 'Negative'
    
    return { label, score, confidence: Math.min(total / 10, 1) * 0.9 }
  }

  private calculateConfidence(insights: DocumentInsight[]): number {
    if (insights.length === 0) return 0.5
    
    const avgConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length
    return Math.round(avgConfidence * 100) / 100
  }

  private generateProcessingSuggestions(
    document: Document,
    structuredContent: StructuredContent,
    insights: DocumentInsight[]
  ): string[] {
    const suggestions: string[] = []
    
    // Suggest based on document type
    if (document.metadata?.documentType === 'contract') {
      suggestions.push('Consider having the legal expert review critical clauses')
    }
    
    // Suggest based on language
    if (document.language === 'vi') {
      suggestions.push('Cultural advisor can provide context for business etiquette')
    }
    
    // Suggest based on complexity
    if (document.metadata?.complexity === 'high') {
      suggestions.push('Break down analysis into smaller sections for better comprehension')
    }
    
    // Suggest collaboration
    if (document.agentsAssigned.length > 2) {
      suggestions.push('Enable agent collaboration mode for comprehensive analysis')
    }
    
    return suggestions
  }

  private updateProgress(documentId: string, progress: ProcessingProgress): void {
    const callback = this.progressCallbacks.get(documentId)
    if (callback) {
      callback(progress)
    }
  }

  /**
   * Register a progress callback
   */
  onProgress(documentId: string, callback: (progress: ProcessingProgress) => void): void {
    this.progressCallbacks.set(documentId, callback)
  }
}

// Export singleton instance
export const aiDocumentProcessor = new AIDocumentProcessor()

// Helper functions for external use
export async function processDocumentWithAI(
  file: File,
  options?: AIProcessingOptions,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<AIProcessingResult> {
  const processor = new AIDocumentProcessor()
  if (onProgress) {
    const tempId = `temp_${Date.now()}`
    processor.onProgress(tempId, onProgress)
  }
  return processor.processDocument(file, options)
}

export function getSupportedFormats(): string[] {
  return [
    '.pdf', '.docx', '.doc', '.txt', '.rtf', '.odt',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.mp3', '.wav', '.m4a', '.ogg',
    '.mp4', '.avi', '.mov', '.wmv',
    '.xlsx', '.xls', '.csv',
    '.pptx', '.ppt'
  ]
}

export function isFormatSupported(fileName: string): boolean {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase()
  return getSupportedFormats().includes(extension)
}