// import { logger, performanceLogger } from '../logger' // Replaced with console equivalents
import { analytics } from '../analytics'

export interface DocumentClassificationRequest {
  documentId: string
  content: string
  filename?: string
  metadata?: DocumentMetadata
  options?: ClassificationOptions
}

export interface DocumentMetadata {
  fileSize?: number
  pageCount?: number
  language?: string
  createdAt?: Date
  modifiedAt?: Date
  author?: string
  source?: string
  originalFormat?: string
}

export interface ClassificationOptions {
  includeHierarchical?: boolean
  generateTags?: boolean
  analyzeSentiment?: boolean
  extractTopics?: boolean
  assessComplexity?: boolean
  detectLanguage?: boolean
  identifyDomain?: boolean
  confidenceThreshold?: number
  maxTags?: number
  includeRecommendations?: boolean
}

export interface DocumentClassificationResult {
  documentId: string
  primaryClassification: Classification
  hierarchicalClassifications?: HierarchicalClassification[]
  tags: Tag[]
  topics: Topic[]
  sentiment?: SentimentAnalysis
  complexity?: ComplexityAssessment
  language?: LanguageDetection
  domain?: DomainClassification
  recommendations?: ClassificationRecommendation[]
  confidence: number
  processingTime: number
  metadata: ClassificationMetadata
}

export interface Classification {
  type: string
  subtype?: string
  category: string
  confidence: number
  evidence: string[]
  alternativeTypes?: { type: string, confidence: number }[]
}

export interface HierarchicalClassification {
  level: number
  classification: string
  parent?: string
  children: string[]
  confidence: number
  path: string[]
}

export interface Tag {
  id: string
  text: string
  type: 'automatic' | 'suggested' | 'manual'
  category: 'content' | 'format' | 'domain' | 'metadata' | 'entity' | 'concept'
  confidence: number
  frequency?: number
  importance: number
  source: string
  relatedTags?: string[]
}

export interface Topic {
  id: string
  name: string
  keywords: string[]
  relevance: number
  category: string
  description?: string
  relatedTopics?: string[]
  parentTopic?: string
  confidenceLevel: number
}

export interface SentimentAnalysis {
  overall: number // -1 to 1
  polarity: 'positive' | 'negative' | 'neutral' | 'mixed'
  confidence: number
  aspects?: AspectSentiment[]
  emotionalTone?: EmotionalTone
}

export interface AspectSentiment {
  aspect: string
  sentiment: number
  confidence: number
  mentions: number
}

export interface EmotionalTone {
  joy: number
  sadness: number
  anger: number
  fear: number
  surprise: number
  trust: number
  anticipation: number
  disgust: number
}

export interface ComplexityAssessment {
  overall: 'low' | 'medium' | 'high' | 'very_high'
  score: number // 0-1
  factors: ComplexityFactor[]
  readabilityIndex: number
  technicalLevel: 'basic' | 'intermediate' | 'advanced' | 'expert'
  targetAudience: string[]
}

export interface ComplexityFactor {
  factor: string
  value: number
  weight: number
  description: string
}

export interface LanguageDetection {
  primary: string
  confidence: number
  alternatives?: { language: string, confidence: number }[]
  isMultilingual: boolean
  languageDistribution?: Record<string, number>
}

export interface DomainClassification {
  primary: string
  subdomains: string[]
  confidence: number
  evidence: string[]
  relatedDomains?: { domain: string, confidence: number }[]
  domainSpecificTerms: string[]
}

export interface ClassificationRecommendation {
  type: 'reclassify' | 'add_tags' | 'merge_similar' | 'split_document' | 'review_accuracy'
  priority: 'low' | 'medium' | 'high'
  description: string
  rationale: string
  suggestedAction: string
  confidence: number
}

export interface ClassificationMetadata {
  modelsUsed: string[]
  classificationRules: string[]
  featuresExtracted: string[]
  processingSteps: string[]
  alternatives: Classification[]
  reviewRequired: boolean
  qualityScore: number
}

export interface TaggingProfile {
  id: string
  name: string
  domain?: string
  language?: string
  tagCategories: TagCategory[]
  rules: TaggingRule[]
  confidence: number
  usage: number
  lastUpdated: Date
}

export interface TagCategory {
  name: string
  description: string
  priority: number
  maxTags: number
  autoGenerate: boolean
  requiresReview: boolean
}

export interface TaggingRule {
  id: string
  condition: string
  action: string
  priority: number
  confidence: number
  examples: string[]
}

export interface AutoTaggingResult {
  suggestedTags: Tag[]
  rulesApplied: string[]
  confidence: number
  reviewRequired: boolean
}

export class DocumentClassificationEngine {
  private classificationModels: Map<string, any> = new Map()
  private taggingProfiles: Map<string, TaggingProfile> = new Map()
  private domainClassifiers: Map<string, any> = new Map()
  private languageDetector: any
  private sentimentAnalyzer: any
  private complexityAnalyzer: any
  private topicExtractor: any
  private tagGenerator: any
  private isInitialized: boolean = false

  constructor() {
    this.initializeModels()
  }

  private async initializeModels(): Promise<void> {
    console.info('Initializing document classification engine')

    try {
      // Initialize classification models
      this.classificationModels.set('document_type', {
        model: 'document_type_classifier_v2',
        accuracy: 0.91,
        categories: ['contract', 'report', 'manual', 'presentation', 'form', 'email', 'article', 'thesis', 'other']
      })

      this.classificationModels.set('content_category', {
        model: 'content_category_classifier_v1',
        accuracy: 0.88,
        categories: ['legal', 'financial', 'technical', 'academic', 'marketing', 'hr', 'compliance', 'general']
      })

      // Initialize domain classifiers
      const domains = ['legal', 'financial', 'technical', 'academic', 'healthcare', 'education', 'government']
      domains.forEach(domain => {
        this.domainClassifiers.set(domain, {
          model: `${domain}_classifier_v1`,
          accuracy: 0.85,
          vocabulary: new Set(),
          patterns: []
        })
      })

      // Initialize supporting models
      this.languageDetector = {
        model: 'language_detector_v1',
        accuracy: 0.95,
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'vi', 'ar', 'hi']
      }

      this.sentimentAnalyzer = {
        model: 'sentiment_analyzer_v1',
        accuracy: 0.87,
        granularity: 'aspect'
      }

      this.complexityAnalyzer = {
        model: 'complexity_analyzer_v1',
        metrics: ['readability', 'vocabulary', 'structure', 'technical_terms'],
        accuracy: 0.83
      }

      this.topicExtractor = {
        model: 'topic_extractor_v1',
        algorithm: 'LDA',
        maxTopics: 10,
        accuracy: 0.79
      }

      this.tagGenerator = {
        model: 'auto_tagger_v1',
        strategies: ['keyword_extraction', 'entity_recognition', 'topic_modeling', 'rule_based'],
        maxTags: 20
      }

      // Initialize default tagging profiles
      this.initializeDefaultTaggingProfiles()

      this.isInitialized = true
      console.info('Document classification engine initialized successfully')

    } catch (error) {
      console.error({ error }, 'Failed to initialize document classification engine')
      throw error
    }
  }

  async classifyDocument(request: DocumentClassificationRequest): Promise<DocumentClassificationResult> {
    if (!this.isInitialized) {
      await this.initializeModels()
    }

    const startTime = Date.now()
    
    console.info('Classifying document', {
      documentId: request.documentId,
      contentLength: request.content.length,
      filename: request.filename,
      options: request.options
    })

    try {
      // Detect language if requested
      const language = request.options?.detectLanguage
        ? await this.detectLanguage(request.content)
        : undefined

      // Classify document type and category
      const primaryClassification = await this.classifyDocumentType(
        request.content,
        request.filename,
        request.metadata
      )

      // Generate hierarchical classifications if requested
      const hierarchicalClassifications = request.options?.includeHierarchical
        ? await this.generateHierarchicalClassifications(request.content, primaryClassification)
        : undefined

      // Identify domain if requested
      const domain = request.options?.identifyDomain
        ? await this.classifyDomain(request.content, language?.primary)
        : undefined

      // Generate tags if requested
      const tags = request.options?.generateTags
        ? await this.generateTags(request.content, primaryClassification, domain, request.options)
        : []

      // Extract topics if requested
      const topics = request.options?.extractTopics
        ? await this.extractTopics(request.content, language?.primary)
        : []

      // Analyze sentiment if requested
      const sentiment = request.options?.analyzeSentiment
        ? await this.analyzeSentiment(request.content, language?.primary)
        : undefined

      // Assess complexity if requested
      const complexity = request.options?.assessComplexity
        ? await this.assessComplexity(request.content, language?.primary)
        : undefined

      // Generate recommendations if requested
      const recommendations = request.options?.includeRecommendations
        ? await this.generateRecommendations(
            primaryClassification,
            tags,
            topics,
            complexity,
            request.content
          )
        : undefined

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(
        primaryClassification,
        hierarchicalClassifications,
        domain,
        language,
        tags,
        topics
      )

      const processingTime = Date.now() - startTime

      const result: DocumentClassificationResult = {
        documentId: request.documentId,
        primaryClassification,
        hierarchicalClassifications,
        tags,
        topics,
        sentiment,
        complexity,
        language,
        domain,
        recommendations,
        confidence,
        processingTime,
        metadata: {
          modelsUsed: this.getModelsUsed(request.options),
          classificationRules: this.getAppliedRules(),
          featuresExtracted: this.getExtractedFeatures(request.options),
          processingSteps: this.getProcessingSteps(request.options),
          alternatives: [], // Could include alternative classifications
          reviewRequired: confidence < (request.options?.confidenceThreshold || 0.8),
          qualityScore: confidence
        }
      }

      console.info({
        documentId: request.documentId,
        primaryType: primaryClassification.type,
        tagsGenerated: tags.length,
        topicsExtracted: topics.length,
        confidence,
        processingTime
      }, 'Document classification completed')

      analytics.track('document_classified', {
        documentId: request.documentId,
        documentType: primaryClassification.type,
        domain: domain?.primary,
        language: language?.primary,
        tagsCount: tags.length,
        topicsCount: topics.length,
        confidence,
        processingTime
      })

      return result

    } catch (error) {
      console.error({ error, documentId: request.documentId }, 'Document classification failed')
      throw error
    }
  }

  async autoTagDocument(
    documentId: string,
    content: string,
    profile?: string,
    options?: {
      maxTags?: number
      confidenceThreshold?: number
      includeCategories?: string[]
      excludeCategories?: string[]
    }
  ): Promise<AutoTaggingResult> {
    console.info('Auto-tagging document', {
      documentId,
      profile,
      contentLength: content.length
    })

    try {
      const taggingProfile = profile ? this.taggingProfiles.get(profile) : undefined
      const suggestedTags: Tag[] = []
      const rulesApplied: string[] = []

      // Apply keyword extraction
      const keywordTags = await this.extractKeywordTags(content, options)
      suggestedTags.push(...keywordTags)

      // Apply entity recognition
      const entityTags = await this.extractEntityTags(content, options)
      suggestedTags.push(...entityTags)

      // Apply topic modeling
      const topicTags = await this.extractTopicTags(content, options)
      suggestedTags.push(...topicTags)

      // Apply rule-based tagging
      if (taggingProfile) {
        const ruleTags = await this.applyTaggingRules(content, taggingProfile, options)
        suggestedTags.push(...ruleTags.tags)
        rulesApplied.push(...ruleTags.rulesApplied)
      }

      // Filter and rank tags
      const filteredTags = this.filterAndRankTags(
        suggestedTags,
        options?.maxTags || 10,
        options?.confidenceThreshold || 0.5
      )

      const confidence = this.calculateTaggingConfidence(filteredTags)
      const reviewRequired = confidence < 0.7 || filteredTags.length === 0

      return {
        suggestedTags: filteredTags,
        rulesApplied,
        confidence,
        reviewRequired
      }

    } catch (error) {
      console.error({ error, documentId }, 'Auto-tagging failed')
      throw error
    }
  }

  async createTaggingProfile(
    name: string,
    domain?: string,
    language?: string,
    categories?: TagCategory[],
    rules?: TaggingRule[]
  ): Promise<TaggingProfile> {
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const profile: TaggingProfile = {
      id: profileId,
      name,
      domain,
      language,
      tagCategories: categories || this.getDefaultTagCategories(),
      rules: rules || [],
      confidence: 0.8,
      usage: 0,
      lastUpdated: new Date()
    }

    this.taggingProfiles.set(profileId, profile)
    
    console.info('Tagging profile created', {
      profileId,
      name,
      domain,
      language
    })

    return profile
  }

  // Private helper methods
  private async classifyDocumentType(
    content: string,
    filename?: string,
    metadata?: DocumentMetadata
  ): Promise<Classification> {
    // Mock document type classification - replace with actual classifier
    const features = this.extractClassificationFeatures(content, filename, metadata)
    
    // Simple rule-based classification for demo
    const contentLower = content.toLowerCase()
    
    if (contentLower.includes('agreement') || contentLower.includes('contract')) {
      return {
        type: 'contract',
        subtype: 'service_agreement',
        category: 'legal',
        confidence: 0.89,
        evidence: ['Contains agreement terminology', 'Legal structure detected'],
        alternativeTypes: [
          { type: 'policy', confidence: 0.15 }
        ]
      }
    } else if (contentLower.includes('financial') || contentLower.includes('revenue')) {
      return {
        type: 'report',
        subtype: 'financial_report',
        category: 'financial',
        confidence: 0.85,
        evidence: ['Financial terminology detected', 'Report structure identified'],
        alternativeTypes: [
          { type: 'analysis', confidence: 0.12 }
        ]
      }
    } else if (contentLower.includes('procedure') || contentLower.includes('steps')) {
      return {
        type: 'manual',
        subtype: 'procedure_manual',
        category: 'technical',
        confidence: 0.82,
        evidence: ['Procedural language detected', 'Step-by-step structure'],
        alternativeTypes: [
          { type: 'guide', confidence: 0.18 }
        ]
      }
    } else {
      return {
        type: 'document',
        category: 'general',
        confidence: 0.65,
        evidence: ['Generic document structure'],
        alternativeTypes: [
          { type: 'article', confidence: 0.25 },
          { type: 'memo', confidence: 0.20 }
        ]
      }
    }
  }

  private extractClassificationFeatures(
    content: string,
    filename?: string,
    metadata?: DocumentMetadata
  ): Record<string, any> {
    return {
      wordCount: content.split(/\s+/).length,
      paragraphCount: content.split(/\n\s*\n/).length,
      hasNumberedSections: /^\d+\./.test(content),
      hasHeaders: /^[A-Z\s]+$/m.test(content),
      hasBulletPoints: /^\s*[•\-\*]/.test(content),
      filename: filename?.toLowerCase(),
      fileExtension: filename?.split('.').pop()?.toLowerCase(),
      averageSentenceLength: this.calculateAverageSentenceLength(content),
      formalityScore: this.calculateFormalityScore(content),
      technicalTermDensity: this.calculateTechnicalTermDensity(content)
    }
  }

  private calculateAverageSentenceLength(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length === 0) return 0
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).length
    }, 0)
    
    return totalWords / sentences.length
  }

  private calculateFormalityScore(content: string): number {
    const formalWords = ['therefore', 'furthermore', 'consequently', 'nevertheless', 'moreover']
    const informalWords = ['really', 'basically', 'actually', 'pretty', 'quite']
    
    const contentLower = content.toLowerCase()
    const formalCount = formalWords.filter(word => contentLower.includes(word)).length
    const informalCount = informalWords.filter(word => contentLower.includes(word)).length
    
    return (formalCount - informalCount + 5) / 10 // Normalize to 0-1
  }

  private calculateTechnicalTermDensity(content: string): number {
    const technicalPatterns = [
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\w+\.\w+\b/g,  // Dotted notation (API.method)
      /\b\d+\.\d+\b/g   // Version numbers
    ]
    
    let technicalTerms = 0
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      technicalTerms += matches ? matches.length : 0
    })
    
    const totalWords = content.split(/\s+/).length
    return totalWords > 0 ? technicalTerms / totalWords : 0
  }

  private async generateHierarchicalClassifications(
    content: string,
    primary: Classification
  ): Promise<HierarchicalClassification[]> {
    // Mock hierarchical classification - replace with actual hierarchical classifier
    return [
      {
        level: 0,
        classification: primary.category,
        children: [primary.type],
        confidence: primary.confidence,
        path: [primary.category]
      },
      {
        level: 1,
        classification: primary.type,
        parent: primary.category,
        children: primary.subtype ? [primary.subtype] : [],
        confidence: primary.confidence * 0.9,
        path: [primary.category, primary.type]
      }
    ]
  }

  private async detectLanguage(content: string): Promise<LanguageDetection> {
    // Mock language detection - replace with actual language detector
    const sample = content.substring(0, 1000)
    
    // Simple language detection based on character patterns
    const englishScore = (sample.match(/[a-zA-Z]/g) || []).length / sample.length
    const chineseScore = (sample.match(/[\u4e00-\u9fff]/g) || []).length / sample.length
    const arabicScore = (sample.match(/[\u0600-\u06ff]/g) || []).length / sample.length
    
    let primary = 'en'
    let confidence = englishScore
    
    if (chineseScore > confidence) {
      primary = 'zh'
      confidence = chineseScore
    }
    
    if (arabicScore > confidence) {
      primary = 'ar'
      confidence = arabicScore
    }

    return {
      primary,
      confidence: Math.min(0.95, confidence + 0.2),
      alternatives: [
        { language: 'es', confidence: 0.1 },
        { language: 'fr', confidence: 0.05 }
      ],
      isMultilingual: false,
      languageDistribution: {
        [primary]: confidence,
        'other': 1 - confidence
      }
    }
  }

  private async classifyDomain(
    content: string,
    language?: string
  ): Promise<DomainClassification> {
    // Mock domain classification - replace with actual domain classifier
    const contentLower = content.toLowerCase()
    
    const domainKeywords = {
      legal: ['contract', 'agreement', 'liability', 'clause', 'party', 'jurisdiction'],
      financial: ['revenue', 'profit', 'investment', 'financial', 'budget', 'cost'],
      technical: ['system', 'software', 'technology', 'implementation', 'configuration'],
      academic: ['research', 'study', 'analysis', 'methodology', 'conclusion', 'hypothesis'],
      healthcare: ['patient', 'medical', 'diagnosis', 'treatment', 'clinical', 'health'],
      education: ['student', 'curriculum', 'learning', 'education', 'course', 'academic']
    }

    const scores: Record<string, number> = {}
    
    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      const matches = keywords.filter(keyword => contentLower.includes(keyword)).length
      scores[domain] = matches / keywords.length
    })

    const sortedDomains = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    const primaryDomain = sortedDomains[0]
    
    return {
      primary: primaryDomain[0],
      subdomains: [],
      confidence: Math.min(0.9, primaryDomain[1] + 0.3),
      evidence: domainKeywords[primaryDomain[0] as keyof typeof domainKeywords].slice(0, 3),
      relatedDomains: sortedDomains.slice(1).map(([domain, score]) => ({
        domain,
        confidence: Math.min(0.8, score + 0.2)
      })),
      domainSpecificTerms: domainKeywords[primaryDomain[0] as keyof typeof domainKeywords]
    }
  }

  private async generateTags(
    content: string,
    classification: Classification,
    domain?: DomainClassification,
    options?: ClassificationOptions
  ): Promise<Tag[]> {
    const tags: Tag[] = []
    
    // Add classification-based tags
    tags.push({
      id: `tag_type_${classification.type}`,
      text: classification.type,
      type: 'automatic',
      category: 'content',
      confidence: classification.confidence,
      importance: 0.9,
      source: 'classification'
    })

    if (classification.subtype) {
      tags.push({
        id: `tag_subtype_${classification.subtype}`,
        text: classification.subtype,
        type: 'automatic',
        category: 'content',
        confidence: classification.confidence * 0.9,
        importance: 0.8,
        source: 'classification'
      })
    }

    // Add domain-based tags
    if (domain) {
      tags.push({
        id: `tag_domain_${domain.primary}`,
        text: domain.primary,
        type: 'automatic',
        category: 'domain',
        confidence: domain.confidence,
        importance: 0.85,
        source: 'domain_classification'
      })

      // Add domain-specific term tags
      domain.domainSpecificTerms.slice(0, 3).forEach((term, index) => {
        if (content.toLowerCase().includes(term)) {
          tags.push({
            id: `tag_term_${term}`,
            text: term,
            type: 'automatic',
            category: 'concept',
            confidence: 0.7,
            importance: 0.6 - (index * 0.1),
            source: 'domain_terms'
          })
        }
      })
    }

    // Extract keyword-based tags
    const keywordTags = await this.extractKeywordTags(content, options)
    tags.push(...keywordTags.slice(0, 5))

    return tags.slice(0, options?.maxTags || 15)
  }

  private async extractKeywordTags(
    content: string,
    options?: any
  ): Promise<Tag[]> {
    // Mock keyword extraction - replace with actual keyword extraction
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^\d+$/.test(word))

    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })

    const sortedWords = Array.from(wordFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)

    return sortedWords.map(([word, freq], index) => ({
      id: `tag_keyword_${word}`,
      text: word,
      type: 'automatic' as const,
      category: 'content' as const,
      confidence: Math.min(0.9, freq / words.length * 100),
      frequency: freq,
      importance: 0.7 - (index * 0.05),
      source: 'keyword_extraction'
    }))
  }

  private async extractEntityTags(
    content: string,
    options?: any
  ): Promise<Tag[]> {
    // Mock entity extraction - replace with actual NER
    const mockEntities = [
      { text: 'artificial intelligence', type: 'concept' },
      { text: 'machine learning', type: 'concept' },
      { text: 'data analysis', type: 'concept' }
    ]

    return mockEntities
      .filter(entity => content.toLowerCase().includes(entity.text))
      .map((entity, index) => ({
        id: `tag_entity_${entity.text.replace(/\s+/g, '_')}`,
        text: entity.text,
        type: 'automatic' as const,
        category: 'entity' as const,
        confidence: 0.85,
        importance: 0.8 - (index * 0.1),
        source: 'entity_recognition'
      }))
  }

  private async extractTopicTags(
    content: string,
    options?: any
  ): Promise<Tag[]> {
    // Mock topic extraction - replace with actual topic modeling
    const mockTopics = ['technology', 'business', 'innovation', 'strategy']
    
    return mockTopics.slice(0, 3).map((topic, index) => ({
      id: `tag_topic_${topic}`,
      text: topic,
      type: 'automatic' as const,
      category: 'concept' as const,
      confidence: 0.75 - (index * 0.1),
      importance: 0.6,
      source: 'topic_modeling'
    }))
  }

  private async extractTopics(content: string, language?: string): Promise<Topic[]> {
    // Mock topic extraction - replace with actual topic modeling
    return [
      {
        id: 'topic_1',
        name: 'Technology Implementation',
        keywords: ['technology', 'implementation', 'system', 'software'],
        relevance: 0.85,
        category: 'technical',
        description: 'Topics related to technology implementation and systems',
        confidenceLevel: 0.82
      },
      {
        id: 'topic_2',
        name: 'Business Process',
        keywords: ['business', 'process', 'workflow', 'management'],
        relevance: 0.72,
        category: 'business',
        description: 'Topics related to business processes and management',
        confidenceLevel: 0.75
      }
    ]
  }

  private async analyzeSentiment(content: string, language?: string): Promise<SentimentAnalysis> {
    // Mock sentiment analysis - replace with actual sentiment analyzer
    const positiveWords = ['good', 'excellent', 'great', 'positive', 'successful', 'beneficial']
    const negativeWords = ['bad', 'poor', 'negative', 'failed', 'problematic', 'difficult']
    
    const contentLower = content.toLowerCase()
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length
    
    const overall = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1)
    
    let polarity: 'positive' | 'negative' | 'neutral' | 'mixed'
    if (overall > 0.2) polarity = 'positive'
    else if (overall < -0.2) polarity = 'negative'
    else if (positiveCount > 0 && negativeCount > 0) polarity = 'mixed'
    else polarity = 'neutral'

    return {
      overall,
      polarity,
      confidence: 0.75,
      aspects: [
        {
          aspect: 'quality',
          sentiment: overall * 0.8,
          confidence: 0.7,
          mentions: positiveCount + negativeCount
        }
      ],
      emotionalTone: {
        joy: Math.max(0, overall * 0.8),
        sadness: Math.max(0, -overall * 0.6),
        anger: Math.max(0, -overall * 0.4),
        fear: 0.1,
        surprise: 0.2,
        trust: Math.max(0, overall * 0.7),
        anticipation: 0.3,
        disgust: Math.max(0, -overall * 0.3)
      }
    }
  }

  private async assessComplexity(content: string, language?: string): Promise<ComplexityAssessment> {
    // Mock complexity assessment - replace with actual complexity analyzer
    const wordCount = content.split(/\s+/).length
    const sentenceCount = content.split(/[.!?]+/).length
    const avgWordsPerSentence = wordCount / sentenceCount
    
    const complexWords = content.split(/\s+/).filter(word => word.length > 8).length
    const complexityRatio = complexWords / wordCount
    
    // Simple complexity scoring
    let score = 0
    score += Math.min(0.3, avgWordsPerSentence / 50) // Sentence length factor
    score += Math.min(0.4, complexityRatio * 10) // Complex word factor
    score += Math.min(0.3, wordCount / 10000) // Document length factor
    
    let overall: 'low' | 'medium' | 'high' | 'very_high'
    if (score < 0.3) overall = 'low'
    else if (score < 0.6) overall = 'medium'
    else if (score < 0.8) overall = 'high'
    else overall = 'very_high'

    return {
      overall,
      score,
      factors: [
        {
          factor: 'sentence_length',
          value: avgWordsPerSentence,
          weight: 0.3,
          description: 'Average words per sentence'
        },
        {
          factor: 'vocabulary_complexity',
          value: complexityRatio,
          weight: 0.4,
          description: 'Ratio of complex words'
        },
        {
          factor: 'document_length',
          value: wordCount,
          weight: 0.3,
          description: 'Total word count'
        }
      ],
      readabilityIndex: Math.max(0, 100 - (score * 100)),
      technicalLevel: score < 0.4 ? 'basic' : score < 0.7 ? 'intermediate' : score < 0.9 ? 'advanced' : 'expert',
      targetAudience: score < 0.4 ? ['general_public'] : score < 0.7 ? ['professionals'] : ['experts', 'specialists']
    }
  }

  private async applyTaggingRules(
    content: string,
    profile: TaggingProfile,
    options?: any
  ): Promise<{ tags: Tag[], rulesApplied: string[] }> {
    const tags: Tag[] = []
    const rulesApplied: string[] = []

    // Mock rule application - replace with actual rule engine
    for (const rule of profile.rules) {
      // Simple rule evaluation (replace with proper rule engine)
      if (content.toLowerCase().includes(rule.condition.toLowerCase())) {
        tags.push({
          id: `tag_rule_${rule.id}`,
          text: rule.action,
          type: 'automatic',
          category: 'content',
          confidence: rule.confidence,
          importance: 0.7,
          source: `rule_${rule.id}`
        })
        rulesApplied.push(rule.id)
      }
    }

    return { tags, rulesApplied }
  }

  private filterAndRankTags(
    tags: Tag[],
    maxTags: number,
    confidenceThreshold: number
  ): Tag[] {
    return tags
      .filter(tag => tag.confidence >= confidenceThreshold)
      .sort((a, b) => {
        // Rank by importance * confidence
        const scoreA = a.importance * a.confidence
        const scoreB = b.importance * b.confidence
        return scoreB - scoreA
      })
      .slice(0, maxTags)
  }

  private calculateTaggingConfidence(tags: Tag[]): number {
    if (tags.length === 0) return 0
    return tags.reduce((sum, tag) => sum + tag.confidence, 0) / tags.length
  }

  private async generateRecommendations(
    classification: Classification,
    tags: Tag[],
    topics: Topic[],
    complexity?: ComplexityAssessment,
    content?: string
  ): Promise<ClassificationRecommendation[]> {
    const recommendations: ClassificationRecommendation[] = []

    // Review recommendation if confidence is low
    if (classification.confidence < 0.7) {
      recommendations.push({
        type: 'review_accuracy',
        priority: 'high',
        description: 'Review classification accuracy',
        rationale: `Classification confidence is low (${classification.confidence.toFixed(2)})`,
        suggestedAction: 'Manual review recommended to verify classification',
        confidence: 0.9
      })
    }

    // Tag suggestions
    if (tags.length < 5) {
      recommendations.push({
        type: 'add_tags',
        priority: 'medium',
        description: 'Consider adding more tags',
        rationale: 'Document has fewer than 5 tags, which may limit discoverability',
        suggestedAction: 'Add more descriptive tags based on content analysis',
        confidence: 0.7
      })
    }

    // Complexity-based recommendations
    if (complexity && complexity.overall === 'very_high') {
      recommendations.push({
        type: 'review_accuracy',
        priority: 'medium',
        description: 'Review document complexity',
        rationale: 'Document has very high complexity, may need specialized handling',
        suggestedAction: 'Consider if document should be split or requires expert review',
        confidence: 0.8
      })
    }

    return recommendations
  }

  private calculateOverallConfidence(
    classification: Classification,
    hierarchical?: HierarchicalClassification[],
    domain?: DomainClassification,
    language?: LanguageDetection,
    tags?: Tag[],
    topics?: Topic[]
  ): number {
    const confidences = [classification.confidence]
    
    if (domain) confidences.push(domain.confidence)
    if (language) confidences.push(language.confidence)
    if (tags && tags.length > 0) {
      const avgTagConfidence = tags.reduce((sum, tag) => sum + tag.confidence, 0) / tags.length
      confidences.push(avgTagConfidence)
    }
    if (topics && topics.length > 0) {
      const avgTopicConfidence = topics.reduce((sum, topic) => sum + topic.confidenceLevel, 0) / topics.length
      confidences.push(avgTopicConfidence)
    }

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  }

  private getModelsUsed(options?: ClassificationOptions): string[] {
    const models = ['document_type_classifier_v2']
    
    if (options?.detectLanguage) models.push('language_detector_v1')
    if (options?.identifyDomain) models.push('domain_classifier_v1')
    if (options?.analyzeSentiment) models.push('sentiment_analyzer_v1')
    if (options?.assessComplexity) models.push('complexity_analyzer_v1')
    if (options?.extractTopics) models.push('topic_extractor_v1')
    if (options?.generateTags) models.push('auto_tagger_v1')

    return models
  }

  private getAppliedRules(): string[] {
    return ['rule_document_type', 'rule_content_category']
  }

  private getExtractedFeatures(options?: ClassificationOptions): string[] {
    const features = ['word_count', 'structure_analysis', 'vocabulary_analysis']
    
    if (options?.detectLanguage) features.push('character_distribution')
    if (options?.analyzeSentiment) features.push('sentiment_keywords')
    if (options?.assessComplexity) features.push('readability_metrics')

    return features
  }

  private getProcessingSteps(options?: ClassificationOptions): string[] {
    const steps = ['preprocessing', 'feature_extraction', 'classification']
    
    if (options?.generateTags) steps.push('tag_generation')
    if (options?.extractTopics) steps.push('topic_extraction')
    if (options?.includeHierarchical) steps.push('hierarchical_classification')

    return steps
  }

  private initializeDefaultTaggingProfiles(): void {
    // Create default profiles for common domains
    const domains = ['legal', 'financial', 'technical', 'academic']
    
    domains.forEach(domain => {
      this.createTaggingProfile(
        `Default ${domain}`,
        domain,
        'en',
        this.getDefaultTagCategories(),
        this.getDefaultRulesForDomain(domain)
      )
    })
  }

  private getDefaultTagCategories(): TagCategory[] {
    return [
      {
        name: 'Content',
        description: 'Tags describing document content',
        priority: 1,
        maxTags: 10,
        autoGenerate: true,
        requiresReview: false
      },
      {
        name: 'Domain',
        description: 'Domain-specific tags',
        priority: 2,
        maxTags: 5,
        autoGenerate: true,
        requiresReview: false
      },
      {
        name: 'Metadata',
        description: 'Document metadata tags',
        priority: 3,
        maxTags: 3,
        autoGenerate: true,
        requiresReview: false
      }
    ]
  }

  private getDefaultRulesForDomain(domain: string): TaggingRule[] {
    const rules: Record<string, TaggingRule[]> = {
      legal: [
        {
          id: 'legal_contract',
          condition: 'contract',
          action: 'legal_contract',
          priority: 1,
          confidence: 0.9,
          examples: ['service contract', 'employment contract']
        }
      ],
      financial: [
        {
          id: 'financial_report',
          condition: 'financial',
          action: 'financial_document',
          priority: 1,
          confidence: 0.85,
          examples: ['financial report', 'budget analysis']
        }
      ],
      technical: [
        {
          id: 'tech_manual',
          condition: 'procedure',
          action: 'technical_manual',
          priority: 1,
          confidence: 0.8,
          examples: ['installation procedure', 'user manual']
        }
      ],
      academic: [
        {
          id: 'research_paper',
          condition: 'research',
          action: 'academic_research',
          priority: 1,
          confidence: 0.9,
          examples: ['research paper', 'academic study']
        }
      ]
    }

    return rules[domain] || []
  }

  // Public utility methods
  getAvailableProfiles(): TaggingProfile[] {
    return Array.from(this.taggingProfiles.values())
  }

  getClassificationStatistics(): {
    totalClassifications: number
    averageConfidence: number
    topTypes: string[]
    topDomains: string[]
  } {
    // Mock statistics - in production, this would track actual usage
    return {
      totalClassifications: 1000,
      averageConfidence: 0.84,
      topTypes: ['contract', 'report', 'manual', 'presentation'],
      topDomains: ['legal', 'financial', 'technical', 'academic']
    }
  }
}

// Singleton instance
export const documentClassificationEngine = new DocumentClassificationEngine()

// Types are already exported above with their declarations