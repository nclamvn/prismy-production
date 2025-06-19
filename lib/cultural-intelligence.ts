// Vietnamese Cultural Intelligence Engine
// Advanced AI system for Vietnamese cultural context adaptation

import { 
  VIETNAMESE_TERMINOLOGY, 
  VIETNAMESE_ADDRESSING, 
  DIALECT_VARIATIONS, 
  CULTURAL_CONTEXTS,
  getTerminology,
  getAddressing,
  getDialectVariation 
} from './vietnamese-terminology'

export interface CulturalProfile {
  formality: 'very_formal' | 'formal' | 'semi_formal' | 'informal'
  dialect: 'northern' | 'southern' | 'central'
  businessSector: 'technology' | 'finance' | 'manufacturing' | 'retail' | 'government' | 'education'
  relationship: 'superior' | 'peer' | 'subordinate' | 'client' | 'vendor'
  age_context: 'younger' | 'same' | 'older'
  gender_context: 'male' | 'female' | 'neutral'
}

export interface TranslationContext {
  source_language: string
  target_language: string
  document_type: 'email' | 'report' | 'presentation' | 'contract' | 'marketing' | 'technical'
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  audience: 'internal' | 'external' | 'public' | 'confidential'
  tone: 'professional' | 'friendly' | 'authoritative' | 'collaborative'
}

export interface CulturalAdaptation {
  addressing_forms: string[]
  terminology_adjustments: Record<string, string>
  sentence_structure: string
  cultural_notes: string[]
  formality_score: number
  confidence_score: number
}

export class VietnameseCulturalIntelligence {
  private terminology = VIETNAMESE_TERMINOLOGY
  private addressing = VIETNAMESE_ADDRESSING
  private dialects = DIALECT_VARIATIONS
  private contexts = CULTURAL_CONTEXTS

  // Analyze text for cultural context requirements
  analyzeText(text: string, profile: CulturalProfile): CulturalAdaptation {
    const words = text.toLowerCase().split(/\s+/)
    const terminologyAdjustments: Record<string, string> = {}
    const culturalNotes: string[] = []
    
    // Analyze terminology needs
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '')
      const terminology = this.terminology.find(t => 
        t.english.toLowerCase().includes(cleanWord) ||
        cleanWord.includes(t.english.toLowerCase())
      )
      
      if (terminology) {
        const appropriateForm = this.selectAppropriateTerminology(terminology, profile)
        terminologyAdjustments[terminology.english] = appropriateForm
        
        // Add cultural context notes
        if (terminology.usage) {
          culturalNotes.push(`"${terminology.english}" requires ${terminology.usage}`)
        }
      }
    })

    // Determine addressing forms
    const addressingForms = this.getAddressingForms(profile)
    
    // Calculate formality score based on profile
    const formalityScore = this.calculateFormalityScore(profile)
    
    // Generate sentence structure guidance
    const sentenceStructure = this.getSentenceStructure(profile)
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(text, profile)

    return {
      addressing_forms: addressingForms,
      terminology_adjustments: terminologyAdjustments,
      sentence_structure: sentenceStructure,
      cultural_notes: culturalNotes,
      formality_score: formalityScore,
      confidence_score: confidenceScore
    }
  }

  // Select appropriate terminology based on cultural profile
  private selectAppropriateTerminology(terminology: any, profile: CulturalProfile): string {
    // Prioritize based on formality level
    switch (profile.formality) {
      case 'very_formal':
        return terminology.vietnamese.formal || terminology.vietnamese.business
      case 'formal':
        return terminology.vietnamese.business || terminology.vietnamese.formal
      case 'semi_formal':
        return terminology.vietnamese.informal || terminology.vietnamese.business
      case 'informal':
        return terminology.vietnamese.informal || terminology.vietnamese.formal
      default:
        return terminology.vietnamese.formal
    }
  }

  // Get appropriate addressing forms
  private getAddressingForms(profile: CulturalProfile): string[] {
    const contextMap = {
      'very_formal': 'formal' as const,
      'formal': 'formal' as const,
      'semi_formal': 'business' as const,
      'informal': 'casual' as const
    }

    const relationshipMap = {
      'superior': 'business_superior',
      'peer': 'business_peer',
      'subordinate': 'business_subordinate',
      'client': 'customer_service',
      'vendor': 'business_peer'
    }

    const context = contextMap[profile.formality]
    const relationship = relationshipMap[profile.relationship] || 'business_peer'

    return getAddressing(context, relationship, false)
  }

  // Calculate formality score (0-100)
  private calculateFormalityScore(profile: CulturalProfile): number {
    let score = 50 // Base score

    // Adjust based on formality level
    switch (profile.formality) {
      case 'very_formal': score += 40; break
      case 'formal': score += 25; break
      case 'semi_formal': score += 10; break
      case 'informal': score -= 10; break
    }

    // Adjust based on relationship
    switch (profile.relationship) {
      case 'superior': score += 20; break
      case 'client': score += 15; break
      case 'peer': score += 5; break
      case 'subordinate': score -= 5; break
    }

    // Adjust based on business sector
    switch (profile.businessSector) {
      case 'government': score += 15; break
      case 'finance': score += 10; break
      case 'education': score += 8; break
      case 'technology': score -= 5; break
      case 'retail': score -= 10; break
    }

    return Math.max(0, Math.min(100, score))
  }

  // Get sentence structure guidance
  private getSentenceStructure(profile: CulturalProfile): string {
    const formalityStructures = this.contexts.formality_levels
    
    switch (profile.formality) {
      case 'very_formal':
        return formalityStructures.very_formal.sentence_structure
      case 'formal':
        return formalityStructures.formal.sentence_structure
      case 'semi_formal':
        return formalityStructures.semi_formal.sentence_structure
      case 'informal':
        return formalityStructures.informal.sentence_structure
      default:
        return formalityStructures.formal.sentence_structure
    }
  }

  // Calculate confidence score based on available cultural data
  private calculateConfidenceScore(text: string, profile: CulturalProfile): number {
    let score = 70 // Base confidence

    const words = text.toLowerCase().split(/\s+/)
    let recognizedTerms = 0

    // Check how many terms we have cultural data for
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '')
      const hasTerminology = this.terminology.some(t => 
        t.english.toLowerCase().includes(cleanWord) ||
        cleanWord.includes(t.english.toLowerCase())
      )
      if (hasTerminology) recognizedTerms++
    })

    // Boost confidence based on terminology coverage
    const coverageRatio = recognizedTerms / Math.max(words.length, 1)
    score += coverageRatio * 20

    // Adjust based on profile completeness
    if (profile.dialect && profile.businessSector && profile.relationship) {
      score += 10
    }

    return Math.max(60, Math.min(100, score))
  }

  // Generate cultural adaptation suggestions
  generateAdaptationSuggestions(text: string, profile: CulturalProfile): string[] {
    const suggestions: string[] = []
    
    // Formality suggestions
    if (profile.formality === 'very_formal' || profile.relationship === 'superior') {
      suggestions.push('Sử dụng ngôn ngữ trang trọng và lịch sự')
      suggestions.push('Thêm các từ xưng hô phù hợp (kính thưa, dạ thưa)')
    }

    // Dialect suggestions
    if (profile.dialect !== 'northern') {
      suggestions.push(`Điều chỉnh từ vựng theo phương ngữ ${DIALECT_VARIATIONS[profile.dialect].name}`)
    }

    // Business sector suggestions
    const sectorContext = this.contexts.business_sectors[profile.businessSector]
    if (sectorContext) {
      suggestions.push(`Áp dụng phong cách giao tiếp ${sectorContext.communication_style}`)
      suggestions.push(`Sử dụng thuật ngữ chuyên ngành ${profile.businessSector}`)
    }

    // Relationship suggestions
    switch (profile.relationship) {
      case 'client':
        suggestions.push('Sử dụng "Quý khách hàng" và ngôn ngữ phục vụ')
        break
      case 'superior':
        suggestions.push('Thể hiện sự tôn trọng qua cách xưng hô')
        break
      case 'subordinate':
        suggestions.push('Sử dụng giọng điệu hướng dẫn và hỗ trợ')
        break
    }

    return suggestions
  }

  // Vietnamese Business Etiquette Rules
  getBusinessEtiquette(context: TranslationContext): string[] {
    const rules: string[] = []

    // Email etiquette
    if (context.document_type === 'email') {
      rules.push('Bắt đầu bằng lời chào phù hợp với mối quan hệ')
      rules.push('Sử dụng "Kính gửi" cho email trang trọng')
      rules.push('Kết thúc bằng "Trân trọng" hoặc "Thân ái"')
    }

    // Report etiquette
    if (context.document_type === 'report') {
      rules.push('Sử dụng cấu trúc rõ ràng với tiêu đề phân cấp')
      rules.push('Đảm bảo tính khách quan và chính xác')
      rules.push('Sử dụng số liệu và bằng chứng cụ thể')
    }

    // Contract etiquette
    if (context.document_type === 'contract') {
      rules.push('Sử dụng ngôn ngữ pháp lý chính xác')
      rules.push('Đảm bảo tính minh bạch và công bằng')
      rules.push('Tuân thủ các quy định pháp luật Việt Nam')
    }

    // Urgency considerations
    if (context.urgency === 'urgent') {
      rules.push('Thể hiện tính khẩn cấp một cách lịch sự')
      rules.push('Đề xuất thời gian phản hồi cụ thể')
    }

    return rules
  }
}

// Export singleton instance
export const culturalIntelligence = new VietnameseCulturalIntelligence()

// Helper functions for quick access
export function analyzeCulturalContext(
  text: string, 
  profile: CulturalProfile
): CulturalAdaptation {
  return culturalIntelligence.analyzeText(text, profile)
}

export function getBusinessEtiquette(context: TranslationContext): string[] {
  return culturalIntelligence.getBusinessEtiquette(context)
}

export function generateCulturalSuggestions(
  text: string, 
  profile: CulturalProfile
): string[] {
  return culturalIntelligence.generateAdaptationSuggestions(text, profile)
}