// import { logger, performanceLogger } from './logger' // Replaced with console methods
import { translationService } from '../../lib/translation-service'

export interface TranslationProvider {
  name: string
  cost: 'free' | 'premium'
  quality: number // 0-1 scale
  speed: 'fast' | 'medium' | 'slow'
  maxCharacters: number
  languages: string[]
}

export interface TranslationResult {
  translatedText: string
  provider: TranslationProvider
  confidence: number
  processingTime: number
  alternatives?: string[]
  qualityScore: number
  cost: number // in USD
}

export interface HybridTranslationRequest {
  text: string
  sourceLang: string
  targetLang: string
  useFreeTier?: boolean
  includePremiumComparison?: boolean
  userId?: string
}

export interface HybridTranslationResponse {
  primary: TranslationResult
  comparison?: TranslationResult
  recommendation: 'free' | 'premium'
  savings: number // characters saved on free tier
  upgradeReasons: string[]
}

// Free translation provider (mock implementation - replace with actual service)
class LibreTranslateProvider {
  private provider: TranslationProvider = {
    name: 'LibreTranslate',
    cost: 'free',
    quality: 0.75,
    speed: 'medium',
    maxCharacters: 500000, // 500K characters per request
    languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'vi', 'ar']
  }

  async translate(text: string, from: string, to: string): Promise<TranslationResult> {
    const startTime = Date.now()
    
    try {
      // Mock implementation - replace with actual LibreTranslate API call
      const translatedText = await this.mockTranslate(text, from, to)
      const processingTime = Date.now() - startTime
      
      return {
        translatedText,
        provider: this.provider,
        confidence: this.calculateConfidence(text),
        processingTime,
        qualityScore: this.provider.quality,
        cost: 0
      }
    } catch (error) {
      console.error('LibreTranslate failed', { error, text: text.substring(0, 100) })
      throw error
    }
  }

  private async mockTranslate(text: string, from: string, to: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    // Mock translation (in production, replace with actual LibreTranslate API)
    return `[FREE] ${text} [Translated from ${from} to ${to}]`
  }

  private calculateConfidence(text: string): number {
    // Simulate confidence based on text complexity
    const complexity = text.length / 1000 + (text.match(/[.!?]/g) || []).length / 10
    return Math.max(0.6, Math.min(0.85, 0.8 - complexity * 0.1))
  }

  isSupported(from: string, to: string): boolean {
    return this.provider.languages.includes(from) && this.provider.languages.includes(to)
  }

  getProvider(): TranslationProvider {
    return this.provider
  }
}

// Google Translate wrapper
class GoogleTranslateProvider {
  private provider: TranslationProvider = {
    name: 'Google Translate',
    cost: 'premium',
    quality: 0.95,
    speed: 'fast',
    maxCharacters: 1000000, // 1M characters per request
    languages: ['auto', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'vi', 'ar', 'hi'] // and many more
  }

  async translate(text: string, from: string, to: string, qualityTier: string = 'standard'): Promise<TranslationResult> {
    const startTime = Date.now()
    
    try {
      const result = await translationService.translateText({
        text,
        sourceLang: from,
        targetLang: to,
        qualityTier: qualityTier as any
      })
      
      const processingTime = Date.now() - startTime
      
      // Calculate cost (approximate)
      const cost = this.calculateCost(text.length, qualityTier)
      
      return {
        translatedText: result.translatedText,
        provider: this.provider,
        confidence: result.confidence,
        processingTime,
        qualityScore: result.qualityScore,
        cost
      }
    } catch (error) {
      console.error('Google Translate failed', { error, text: text.substring(0, 100) })
      throw error
    }
  }

  private calculateCost(characterCount: number, qualityTier: string): number {
    // Google Translate pricing (approximate)
    const baseRate = 0.00002 // $20 per million characters
    const tierMultiplier = {
      'free': 0.5,
      'standard': 1.0,
      'premium': 1.5,
      'enterprise': 2.0
    }[qualityTier] || 1.0
    
    return characterCount * baseRate * tierMultiplier
  }

  isSupported(from: string, to: string): boolean {
    return true // Google Translate supports most language pairs
  }

  getProvider(): TranslationProvider {
    return this.provider
  }
}

export class HybridTranslationEngine {
  private freeProvider: LibreTranslateProvider
  private premiumProvider: GoogleTranslateProvider
  private userUsage: Map<string, { characters: number; resetDate: Date }> = new Map()

  constructor() {
    this.freeProvider = new LibreTranslateProvider()
    this.premiumProvider = new GoogleTranslateProvider()
  }

  async translate(request: HybridTranslationRequest): Promise<HybridTranslationResponse> {
    const startTime = Date.now()
    const { text, sourceLang, targetLang, useFreeTier, includePremiumComparison, userId } = request

    console.info('Hybrid translation request', {
      textLength: text.length,
      sourceLang,
      targetLang,
      useFreeTier,
      userId
    })

    try {
      // Check user's free tier usage
      const freeUsageAvailable = this.checkFreeUsageAvailable(userId, text.length)
      const shouldUseFree = (useFreeTier || freeUsageAvailable) && 
                           this.freeProvider.isSupported(sourceLang, targetLang)

      let primary: TranslationResult
      let comparison: TranslationResult | undefined

      if (shouldUseFree) {
        // Use free provider as primary
        primary = await this.freeProvider.translate(text, sourceLang, targetLang)
        
        // Update usage tracking
        if (userId) {
          this.updateUsage(userId, text.length)
        }

        // Get premium comparison if requested
        if (includePremiumComparison) {
          try {
            comparison = await this.premiumProvider.translate(text, sourceLang, targetLang, 'standard')
          } catch (error) {
            console.warn('Premium comparison failed', { error })
          }
        }
      } else {
        // Use premium provider as primary
        primary = await this.premiumProvider.translate(text, sourceLang, targetLang, 'standard')
        
        // Optionally show what free version would look like
        if (includePremiumComparison && this.freeProvider.isSupported(sourceLang, targetLang)) {
          try {
            comparison = await this.freeProvider.translate(text, sourceLang, targetLang)
          } catch (error) {
            console.warn('Free comparison failed', { error })
          }
        }
      }

      // Generate recommendation and upgrade reasons
      const recommendation = this.generateRecommendation(primary, comparison, text.length)
      const upgradeReasons = this.generateUpgradeReasons(primary, comparison)
      const savings = this.calculateSavings(userId, text.length)

      const response: HybridTranslationResponse = {
        primary,
        comparison,
        recommendation,
        savings,
        upgradeReasons
      }

      const totalTime = Date.now() - startTime
      console.info('Hybrid translation completed', {
        primaryProvider: primary.provider.name,
        comparisonProvider: comparison?.provider.name,
        textLength: text.length,
        totalTime,
        recommendation
      })

      return response

    } catch (error) {
      console.error('Hybrid translation failed', { error, request })
      throw error
    }
  }

  private checkFreeUsageAvailable(userId?: string, charactersNeeded: number = 0): boolean {
    if (!userId) return true // Anonymous users get free tier

    const usage = this.userUsage.get(userId)
    if (!usage) return true

    // Reset monthly usage if needed
    const now = new Date()
    if (now >= usage.resetDate) {
      this.userUsage.set(userId, {
        characters: 0,
        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      })
      return true
    }

    const FREE_TIER_LIMIT = 600000 // 100K words ≈ 600K characters
    return (usage.characters + charactersNeeded) <= FREE_TIER_LIMIT
  }

  private updateUsage(userId: string, characters: number): void {
    const usage = this.userUsage.get(userId) || {
      characters: 0,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    }

    usage.characters += characters
    this.userUsage.set(userId, usage)
  }

  private generateRecommendation(
    primary: TranslationResult, 
    comparison?: TranslationResult,
    textLength: number = 0
  ): 'free' | 'premium' {
    // If no comparison, recommend based on primary provider
    if (!comparison) {
      return primary.provider.cost === 'free' ? 'free' : 'premium'
    }

    // Compare quality scores
    const qualityDifference = Math.abs(primary.qualityScore - comparison.qualityScore)
    
    // For professional/business content, recommend premium if quality difference > 0.1
    if (qualityDifference > 0.1 && comparison.provider.cost === 'premium') {
      return 'premium'
    }

    // For very long texts, recommend premium for consistency
    if (textLength > 10000 && comparison.provider.cost === 'premium') {
      return 'premium'
    }

    // Default to primary provider's cost tier
    return primary.provider.cost === 'free' ? 'free' : 'premium'
  }

  private generateUpgradeReasons(primary: TranslationResult, comparison?: TranslationResult): string[] {
    const reasons: string[] = []

    if (!comparison || primary.provider.cost === 'premium') {
      return reasons
    }

    const qualityDiff = comparison.qualityScore - primary.qualityScore
    const confidenceDiff = comparison.confidence - primary.confidence

    if (qualityDiff > 0.1) {
      reasons.push(`${Math.round(qualityDiff * 100)}% higher translation quality`)
    }

    if (confidenceDiff > 0.1) {
      reasons.push(`${Math.round(confidenceDiff * 100)}% more confident translations`)
    }

    if (comparison.processingTime < primary.processingTime * 0.8) {
      reasons.push('Faster translation speed')
    }

    if (comparison.provider.languages.length > primary.provider.languages.length) {
      reasons.push('Support for more language pairs')
    }

    reasons.push('Professional accuracy for business documents')
    reasons.push('Priority support and SLA guarantees')

    return reasons
  }

  private calculateSavings(userId?: string, charactersUsed: number = 0): number {
    if (!userId) return 0

    const usage = this.userUsage.get(userId)
    if (!usage) return 600000 // Full free tier available

    const FREE_TIER_LIMIT = 600000
    return Math.max(0, FREE_TIER_LIMIT - usage.characters)
  }

  // Get user's current usage stats
  getUserUsageStats(userId: string): { used: number; remaining: number; resetDate: Date } {
    const usage = this.userUsage.get(userId) || {
      characters: 0,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    }

    const FREE_TIER_LIMIT = 600000
    return {
      used: usage.characters,
      remaining: Math.max(0, FREE_TIER_LIMIT - usage.characters),
      resetDate: usage.resetDate
    }
  }

  // Get available providers
  getAvailableProviders(): TranslationProvider[] {
    return [
      this.freeProvider.getProvider(),
      this.premiumProvider.getProvider()
    ]
  }

  // Check if language pair is supported by free tier
  isFreeTierSupported(from: string, to: string): boolean {
    return this.freeProvider.isSupported(from, to)
  }
}

// Singleton instance
export const hybridTranslationEngine = new HybridTranslationEngine()

// Types are already exported above with their declarations