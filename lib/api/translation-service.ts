import { createServerClient, createServiceClient } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase-client'

type TranslationHistory = Database['public']['Tables']['translation_history']['Row']
type TranslationHistoryInsert = Database['public']['Tables']['translation_history']['Insert']

interface TranslationRequest {
  text: string
  sourceLang: string
  targetLang: string
  userId?: string
  qualityTier?: 'free' | 'premium' | 'enterprise'
}

interface TranslationResult {
  translatedText: string
  detectedSourceLanguage?: string
  confidence?: number
  characterCount: number
  qualityScore: number
  processingTime: number
}

export class TranslationService {
  private client: ReturnType<typeof createServerClient> | null = null
  private serviceClient: ReturnType<typeof createServiceClient> | null = null

  constructor(cookieStore?: () => any) {
    if (cookieStore) {
      this.client = createServerClient(cookieStore)
    }
    this.serviceClient = createServiceClient()
  }

  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now()

    try {
      // Call Google Translate API
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: request.text,
            source: request.sourceLang === 'auto' ? undefined : request.sourceLang,
            target: request.targetLang,
            format: 'text',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.data?.translations?.[0]) {
        throw new Error('Invalid translation response')
      }

      const translation = data.data.translations[0]
      const processingTime = Date.now() - startTime

      const result: TranslationResult = {
        translatedText: translation.translatedText,
        detectedSourceLanguage: translation.detectedSourceLanguage,
        characterCount: request.text.length,
        qualityScore: this.calculateQualityScore(request.qualityTier || 'free'),
        processingTime,
      }

      // Save translation history if user is authenticated
      if (request.userId && this.client) {
        await this.saveTranslationHistory({
          user_id: request.userId,
          source_text: request.text,
          translated_text: result.translatedText,
          source_language: result.detectedSourceLanguage || request.sourceLang,
          target_language: request.targetLang,
          quality_tier: request.qualityTier || 'free',
          quality_score: result.qualityScore,
          character_count: result.characterCount,
        })
      }

      return result
    } catch (error) {
      console.error('Translation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Translation failed')
    }
  }

  async translateLongText(request: TranslationRequest): Promise<TranslationResult> {
    const MAX_CHUNK_SIZE = 5000 // Google Translate limit
    const text = request.text

    if (text.length <= MAX_CHUNK_SIZE) {
      return this.translateText(request)
    }

    // Intelligent chunking
    const chunks = this.intelligentChunk(text, MAX_CHUNK_SIZE)
    const translatedChunks: string[] = []
    let totalProcessingTime = 0
    let detectedLanguage: string | undefined

    for (const chunk of chunks) {
      const chunkResult = await this.translateText({
        ...request,
        text: chunk,
        userId: undefined, // Don't save individual chunks
      })

      translatedChunks.push(chunkResult.translatedText)
      totalProcessingTime += chunkResult.processingTime

      if (!detectedLanguage && chunkResult.detectedSourceLanguage) {
        detectedLanguage = chunkResult.detectedSourceLanguage
      }
    }

    const result: TranslationResult = {
      translatedText: translatedChunks.join(''),
      detectedSourceLanguage: detectedLanguage,
      characterCount: text.length,
      qualityScore: this.calculateQualityScore(request.qualityTier || 'free'),
      processingTime: totalProcessingTime,
    }

    // Save complete translation history
    if (request.userId && this.client) {
      await this.saveTranslationHistory({
        user_id: request.userId,
        source_text: text,
        translated_text: result.translatedText,
        source_language: result.detectedSourceLanguage || request.sourceLang,
        target_language: request.targetLang,
        quality_tier: request.qualityTier || 'free',
        quality_score: result.qualityScore,
        character_count: result.characterCount,
      })
    }

    return result
  }

  private intelligentChunk(text: string, maxSize: number): string[] {
    const chunks: string[] = []
    let currentChunk = ''

    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/)

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length <= maxSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      } else {
        if (currentChunk) {
          chunks.push(currentChunk)
          currentChunk = ''
        }

        // If paragraph is still too long, split by sentences
        if (paragraph.length > maxSize) {
          const sentences = paragraph.split(/(?<=[.!?])\s+/)
          
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length <= maxSize) {
              currentChunk += (currentChunk ? ' ' : '') + sentence
            } else {
              if (currentChunk) {
                chunks.push(currentChunk)
                currentChunk = ''
              }
              
              // If sentence is still too long, split by words
              if (sentence.length > maxSize) {
                const words = sentence.split(' ')
                for (const word of words) {
                  if (currentChunk.length + word.length + 1 <= maxSize) {
                    currentChunk += (currentChunk ? ' ' : '') + word
                  } else {
                    if (currentChunk) {
                      chunks.push(currentChunk)
                      currentChunk = word
                    } else {
                      // Single word longer than maxSize - force split
                      chunks.push(word.slice(0, maxSize))
                      currentChunk = word.slice(maxSize)
                    }
                  }
                }
              } else {
                currentChunk = sentence
              }
            }
          }
        } else {
          currentChunk = paragraph
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    return chunks
  }

  private calculateQualityScore(tier: string): number {
    switch (tier) {
      case 'enterprise':
        return 95
      case 'premium':
        return 90
      case 'free':
      default:
        return 85
    }
  }

  async saveTranslationHistory(history: TranslationHistoryInsert): Promise<TranslationHistory> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { data, error } = await this.client
      .from('translation_history')
      .insert(history)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async getTranslationHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<TranslationHistory[]> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { data, error } = await this.client
      .from('translation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async deleteTranslationHistory(userId: string, historyId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { error } = await this.client
      .from('translation_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }

  async getUsageStats(userId: string): Promise<{
    totalTranslations: number
    totalCharacters: number
    averageQuality: number
    lastTranslation: string | null
  }> {
    if (!this.serviceClient) {
      throw new Error('Service client not available')
    }

    const { data, error } = await this.serviceClient
      .from('translation_history')
      .select('character_count, quality_score, created_at')
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    const totalTranslations = data.length
    const totalCharacters = data.reduce((sum, item) => sum + item.character_count, 0)
    const averageQuality = data.length > 0 
      ? data.reduce((sum, item) => sum + item.quality_score, 0) / data.length 
      : 0
    const lastTranslation = data.length > 0 
      ? Math.max(...data.map(item => new Date(item.created_at).getTime()))
      : null

    return {
      totalTranslations,
      totalCharacters,
      averageQuality: Math.round(averageQuality * 100) / 100,
      lastTranslation: lastTranslation ? new Date(lastTranslation).toISOString() : null,
    }
  }
}

// Factory function for creating translation service instances
export const createTranslationService = (cookieStore?: () => any) => {
  return new TranslationService(cookieStore)
}