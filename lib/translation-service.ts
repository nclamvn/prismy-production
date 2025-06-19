import { Translate } from '@google-cloud/translate/build/src/v2'
import { translationCache } from './translation-cache'
import { redisTranslationCache } from './redis-translation-cache'

interface TranslationRequest {
  text: string
  sourceLang: string
  targetLang: string
  qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  abTestVariant?: 'cache_enabled' | 'cache_disabled'
}

interface TranslationResponse {
  translatedText: string
  sourceLang: string
  targetLang: string
  confidence: number
  qualityScore: number
  timestamp: string
  cached?: boolean
  detectedSourceLanguage?: string
}

export class PrismyTranslationService {
  private translate: Translate

  constructor() {
    // Initialize Google Translate with credentials
    this.translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      // Fallback to API key if service account not available
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
    })
  }

  async translateText({
    text,
    sourceLang,
    targetLang,
    qualityTier = 'standard',
    abTestVariant = 'cache_enabled'
  }: TranslationRequest): Promise<TranslationResponse> {
    try {
      // Check cache based on A/B test variant (skip for auto-detect and cache-disabled variant)
      if (sourceLang !== 'auto' && abTestVariant === 'cache_enabled') {
        const redisCached = await redisTranslationCache.get(text, sourceLang, targetLang, qualityTier)
        if (redisCached) {
          console.log('✅ Redis cache hit for translation')
          return {
            ...redisCached,
            timestamp: new Date().toISOString(),
            cached: true
          }
        }

        // Fallback to in-memory cache
        const memoryCached = translationCache.get(text, sourceLang, targetLang, qualityTier)
        if (memoryCached) {
          console.log('✅ Memory cache hit for translation')
          return {
            ...memoryCached,
            timestamp: new Date().toISOString(),
            cached: true
          }
        }
      }

      // Handle auto-detection
      const from = sourceLang === 'auto' ? undefined : sourceLang
      
      // Perform translation
      const [translation, metadata] = await this.translate.translate(text, {
        from,
        to: targetLang,
        format: 'text',
        model: this.getModelForQuality(qualityTier)
      })

      // Calculate quality metrics
      const confidence = this.calculateConfidence(text, translation, metadata)
      const qualityScore = this.calculateQualityScore(qualityTier, confidence)

      const result = {
        translatedText: Array.isArray(translation) ? translation[0] : translation,
        sourceLang: metadata?.detectedSourceLanguage || sourceLang,
        targetLang,
        confidence,
        qualityScore,
        qualityTier,
        timestamp: new Date().toISOString(),
        cached: false,
        detectedSourceLanguage: metadata?.detectedSourceLanguage
      }

      // Cache the result in both Redis and memory (use detected source language if available)
      // Only cache if the A/B test variant allows caching
      const cacheSourceLang = result.sourceLang || sourceLang
      if (cacheSourceLang !== 'auto' && abTestVariant === 'cache_enabled') {
        // Store in Redis cache first
        await redisTranslationCache.set(text, cacheSourceLang, targetLang, result, qualityTier)
        
        // Also store in memory cache as fallback
        translationCache.set(text, cacheSourceLang, targetLang, qualityTier, result)
        
        console.log(`🔄 Translation cached: ${text.substring(0, 50)}... (${cacheSourceLang} → ${targetLang})`)
      } else if (abTestVariant === 'cache_disabled') {
        console.log(`🚫 Cache disabled for A/B test: ${text.substring(0, 50)}... (${cacheSourceLang} → ${targetLang})`)
      }

      return result
    } catch (error) {
      console.error('Translation error:', error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const [detection] = await this.translate.detect(text)
      return Array.isArray(detection) ? detection[0].language : detection.language
    } catch (error) {
      console.error('Language detection error:', error)
      return 'unknown'
    }
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      // Check Redis cache first
      const cachedLanguages = await redisTranslationCache.getCachedLanguages()
      if (cachedLanguages) {
        console.log('✅ Redis cache hit for supported languages')
        return cachedLanguages
      }

      // Fetch from Google Translate API
      const [languages] = await this.translate.getLanguages()
      const formattedLanguages = languages.map(lang => ({
        code: lang.code,
        name: lang.name
      }))

      // Cache the result
      await redisTranslationCache.cacheLanguages(formattedLanguages)
      console.log(`🔄 Cached ${formattedLanguages.length} supported languages`)

      return formattedLanguages
    } catch (error) {
      console.error('Error fetching supported languages:', error)
      return this.getFallbackLanguages()
    }
  }

  private getModelForQuality(qualityTier: string): string {
    switch (qualityTier) {
      case 'enterprise':
      case 'premium':
        return 'nmt' // Neural Machine Translation
      case 'standard':
        return 'base'
      case 'free':
      default:
        return 'base'
    }
  }

  private calculateConfidence(
    originalText: string,
    translatedText: string,
    metadata: any
  ): number {
    // Implement confidence calculation based on:
    // - Text length and complexity
    // - Google's confidence scores if available
    // - Quality tier used
    
    const baseConfidence = 0.85
    const lengthFactor = Math.min(originalText.length / 100, 1)
    const complexityFactor = this.calculateTextComplexity(originalText)
    
    return Math.min(baseConfidence + (lengthFactor * 0.1) - (complexityFactor * 0.1), 0.99)
  }

  private calculateQualityScore(qualityTier: string, confidence: number): number {
    const tierMultipliers = {
      free: 0.7,
      standard: 0.85,
      premium: 0.95,
      enterprise: 0.99
    }
    
    const multiplier = tierMultipliers[qualityTier as keyof typeof tierMultipliers] || 0.85
    return Math.round((confidence * multiplier) * 100) / 100
  }

  private calculateTextComplexity(text: string): number {
    // Simple complexity calculation based on:
    // - Sentence length
    // - Special characters
    // - Technical terms
    
    const avgSentenceLength = text.split(/[.!?]+/).reduce((sum, sentence) => 
      sum + sentence.trim().split(' ').length, 0) / text.split(/[.!?]+/).length
    
    const specialCharRatio = (text.match(/[^\w\s]/g) || []).length / text.length
    
    return Math.min((avgSentenceLength / 20) + (specialCharRatio * 2), 1)
  }

  private getFallbackLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'vi', name: 'Vietnamese' },
    ]
  }
}

// Export singleton instance
export const translationService = new PrismyTranslationService()