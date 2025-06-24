/**
 * PRISMY BATCH TRANSLATION API
 * High-performance batch translation with Translation Memory integration
 * Supports multiple texts, caching, and real-time progress tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { translationService } from '@/lib/translation-service'
import { translationMemory } from '@/lib/translation-memory'
import { redisTranslationCache as cacheService } from '@/lib/redis-translation-cache'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { resultsStorage } from './[batchId]/results/route'

export interface BatchTranslationRequest {
  texts: string[]
  sourceLang: string
  targetLang: string
  
  // Processing options
  useTranslationMemory?: boolean
  preserveOrder?: boolean
  enableCache?: boolean
  qualityTier?: 'free' | 'standard' | 'premium' | 'enterprise'
  
  // Context for better translations
  context?: string
  domain?: string
  
  // Progress tracking
  batchId?: string
  webhookUrl?: string
}

export interface BatchTranslationResponse {
  batchId: string
  status: 'processing' | 'completed' | 'failed' | 'partial'
  
  // Results
  translations: Array<{
    index: number
    sourceText: string
    translatedText: string
    confidence: number
    
    // Translation Memory info
    fromMemory?: boolean
    memoryMatch?: {
      matchScore: number
      matchType: 'exact' | 'fuzzy' | 'context'
    }
    
    // Processing info
    processingTime: number
    cacheHit?: boolean
    error?: string
  }>
  
  // Summary statistics
  summary: {
    totalTexts: number
    successful: number
    failed: number
    memoryHits: number
    cacheHits: number
    totalProcessingTime: number
    averageConfidence: number
  }
  
  // Usage tracking
  usage: {
    charactersProcessed: number
    creditsUsed: number
    remainingCredits: number
  }
}

export interface BatchProgress {
  batchId: string
  completed: number
  total: number
  progress: number
  estimatedTimeRemaining: number
  currentlyProcessing: string[]
  errors: Array<{
    index: number
    error: string
  }>
}

// In-memory progress tracking (in production, use Redis)
const progressTracker = new Map<string, BatchProgress>()

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentication check
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: BatchTranslationRequest = await request.json()
    
    // Validation
    const validation = validateBatchRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Rate limiting check
    const userProfile = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single()

    const subscriptionTier = userProfile.data?.subscription_tier || 'free'
    const rateLimit = getRateLimitForTier(subscriptionTier)

    if (body.texts.length > rateLimit.requestsPerHour) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          limit: rateLimit.requestsPerHour,
          requested: body.texts.length
        },
        { status: 429 }
      )
    }

    // Generate batch ID
    const batchId = body.batchId || generateBatchId()

    // Initialize progress tracking
    progressTracker.set(batchId, {
      batchId,
      completed: 0,
      total: body.texts.length,
      progress: 0,
      estimatedTimeRemaining: 0,
      currentlyProcessing: [],
      errors: []
    })

    // Process batch asynchronously
    processBatchTranslation(batchId, body, session.user.id)
      .catch(error => {
        console.error('[Batch Translation] Processing failed:', error)
        // Update progress with error status
        const progress = progressTracker.get(batchId)
        if (progress) {
          progress.errors.push({
            index: -1,
            error: error.message
          })
          progressTracker.set(batchId, progress)
        }
      })

    // Return immediate response with batch ID
    return NextResponse.json({
      batchId,
      status: 'processing',
      message: 'Batch translation started',
      progressEndpoint: `/api/translate/batch/${batchId}/progress`,
      estimatedCompletionTime: estimateCompletionTime(body.texts.length, body.qualityTier || 'standard')
    })

  } catch (error) {
    console.error('[Batch Translation API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processBatchTranslation(
  batchId: string,
  request: BatchTranslationRequest,
  userId: string
): Promise<void> {
  const startTime = Date.now()
  const results: BatchTranslationResponse['translations'] = []
  
  let memoryHits = 0
  let cacheHits = 0
  let successful = 0
  let failed = 0
  let totalCharacters = 0

  try {
    // Process texts in batches for better performance
    const batchSize = getBatchSize(request.qualityTier || 'standard')
    const textBatches = createTextBatches(request.texts, batchSize)

    for (let batchIndex = 0; batchIndex < textBatches.length; batchIndex++) {
      const textBatch = textBatches[batchIndex]
      
      // Process batch concurrently
      const batchPromises = textBatch.map(async (text, localIndex) => {
        const globalIndex = batchIndex * batchSize + localIndex
        return processSingleTranslation(
          text,
          globalIndex,
          request,
          batchId,
          userId
        )
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      // Process results
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i]
        const globalIndex = batchIndex * batchSize + i
        
        if (result.status === 'fulfilled') {
          results[globalIndex] = result.value
          successful++
          
          if (result.value.fromMemory) memoryHits++
          if (result.value.cacheHit) cacheHits++
          
          totalCharacters += textBatch[i].length
        } else {
          failed++
          results[globalIndex] = {
            index: globalIndex,
            sourceText: textBatch[i],
            translatedText: '',
            confidence: 0,
            processingTime: 0,
            error: result.reason.message
          }
        }
      }

      // Update progress
      updateProgress(batchId, globalIndex + 1, request.texts.length)
    }

    // Calculate final statistics
    const totalProcessingTime = Date.now() - startTime
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length || 0

    // Store final results (in production, store in database)
    const finalResponse: BatchTranslationResponse = {
      batchId,
      status: failed === 0 ? 'completed' : (successful > 0 ? 'partial' : 'failed'),
      translations: request.preserveOrder ? results : results.sort((a, b) => a.index - b.index),
      summary: {
        totalTexts: request.texts.length,
        successful,
        failed,
        memoryHits,
        cacheHits,
        totalProcessingTime,
        averageConfidence
      },
      usage: {
        charactersProcessed: totalCharacters,
        creditsUsed: calculateCreditsUsed(totalCharacters, request.qualityTier || 'standard'),
        remainingCredits: 0 // Would be calculated from user's subscription
      }
    }

    // Store results for retrieval
    resultsStorage.set(batchId, finalResponse)

    // Send webhook notification if configured
    if (request.webhookUrl) {
      await sendWebhookNotification(request.webhookUrl, finalResponse)
    }

    console.info('[Batch Translation] Completed:', {
      batchId,
      successful,
      failed,
      totalTime: totalProcessingTime
    })

  } catch (error) {
    console.error('[Batch Translation] Processing error:', error)
    
    // Update progress with error
    const progress = progressTracker.get(batchId)
    if (progress) {
      progress.errors.push({
        index: -1,
        error: error instanceof Error ? error.message : String(error)
      })
      progressTracker.set(batchId, progress)
    }
  }
}

async function processSingleTranslation(
  text: string,
  index: number,
  request: BatchTranslationRequest,
  batchId: string,
  userId: string
): Promise<BatchTranslationResponse['translations'][0]> {
  const startTime = Date.now()
  
  try {
    // Update progress
    updateCurrentlyProcessing(batchId, text, true)

    // 1. Check Translation Memory first
    if (request.useTranslationMemory !== false) {
      const memoryMatches = await translationMemory.findMatches(
        text,
        request.sourceLang,
        request.targetLang,
        request.context,
        {
          minScore: 0.95, // High threshold for batch operations
          maxResults: 1,
          enableContextMatching: true,
          enableDomainFiltering: !!request.domain,
          preferApproved: true,
          weightByUsage: true
        }
      )

      if (memoryMatches.length > 0 && memoryMatches[0].matchScore >= 0.95) {
        const match = memoryMatches[0]
        
        // Store as approved translation memory entry
        await translationMemory.addEntry({
          sourceText: text,
          targetText: match.entry.targetText,
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
          context: request.context,
          domain: request.domain,
          confidence: match.matchScore,
          qualityScore: match.entry.qualityScore,
          source: 'ai',
          approved: match.entry.approved,
          userId
        })

        return {
          index,
          sourceText: text,
          translatedText: match.entry.targetText,
          confidence: match.matchScore,
          fromMemory: true,
          memoryMatch: {
            matchScore: match.matchScore,
            matchType: match.matchType
          },
          processingTime: Date.now() - startTime
        }
      }
    }

    // 2. Check cache
    if (request.enableCache !== false) {
      const cacheKey = cacheService.generateCacheKey(
        text,
        request.sourceLang,
        request.targetLang,
        request.qualityTier || 'standard'
      )
      
      const cachedResult = await cacheService.get(cacheKey)
      if (cachedResult) {
        return {
          index,
          sourceText: text,
          translatedText: cachedResult.translatedText,
          confidence: cachedResult.confidence,
          cacheHit: true,
          processingTime: Date.now() - startTime
        }
      }
    }

    // 3. Perform actual translation
    const translationResult = await translationService.translateText(
      text,
      request.sourceLang,
      request.targetLang,
      {
        qualityTier: request.qualityTier || 'standard',
        context: request.context,
        domain: request.domain
      }
    )

    // 4. Cache the result
    if (request.enableCache !== false) {
      const cacheKey = cacheService.generateCacheKey(
        text,
        request.sourceLang,
        request.targetLang,
        request.qualityTier || 'standard'
      )
      
      await cacheService.set(cacheKey, {
        translatedText: translationResult.translatedText,
        confidence: translationResult.confidence,
        qualityScore: translationResult.qualityScore || 0.8
      })
    }

    // 5. Add to Translation Memory
    if (request.useTranslationMemory !== false && translationResult.confidence >= 0.7) {
      await translationMemory.addEntry({
        sourceText: text,
        targetText: translationResult.translatedText,
        sourceLang: request.sourceLang,
        targetLang: request.targetLang,
        context: request.context,
        domain: request.domain,
        confidence: translationResult.confidence,
        qualityScore: translationResult.qualityScore || 0.8,
        source: 'ai',
        approved: false,
        userId
      })
    }

    return {
      index,
      sourceText: text,
      translatedText: translationResult.translatedText,
      confidence: translationResult.confidence,
      processingTime: Date.now() - startTime
    }

  } finally {
    // Update progress
    updateCurrentlyProcessing(batchId, text, false)
  }
}

// Helper functions

function validateBatchRequest(body: BatchTranslationRequest): { valid: boolean; error?: string } {
  if (!body.texts || !Array.isArray(body.texts) || body.texts.length === 0) {
    return { valid: false, error: 'texts array is required and must not be empty' }
  }

  if (body.texts.length > 100) {
    return { valid: false, error: 'Maximum 100 texts per batch' }
  }

  if (!body.sourceLang || !body.targetLang) {
    return { valid: false, error: 'sourceLang and targetLang are required' }
  }

  if (body.sourceLang === body.targetLang) {
    return { valid: false, error: 'sourceLang and targetLang must be different' }
  }

  const totalCharacters = body.texts.reduce((sum, text) => sum + text.length, 0)
  if (totalCharacters > 100000) {
    return { valid: false, error: 'Total characters exceed limit (100,000)' }
  }

  return { valid: true }
}

function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function estimateCompletionTime(textCount: number, qualityTier: string): number {
  const baseTimePerText = {
    free: 2,      // 2 seconds per text
    standard: 3,  // 3 seconds per text
    premium: 4,   // 4 seconds per text
    enterprise: 5 // 5 seconds per text
  }

  return textCount * (baseTimePerText[qualityTier as keyof typeof baseTimePerText] || 3)
}

function getBatchSize(qualityTier: string): number {
  const batchSizes = {
    free: 5,
    standard: 10,
    premium: 15,
    enterprise: 20
  }

  return batchSizes[qualityTier as keyof typeof batchSizes] || 10
}

function createTextBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}

function updateProgress(batchId: string, completed: number, total: number): void {
  const progress = progressTracker.get(batchId)
  if (progress) {
    progress.completed = completed
    progress.progress = (completed / total) * 100
    progress.estimatedTimeRemaining = Math.ceil((total - completed) * 3) // 3 seconds per remaining text
    progressTracker.set(batchId, progress)
  }
}

function updateCurrentlyProcessing(batchId: string, text: string, isProcessing: boolean): void {
  const progress = progressTracker.get(batchId)
  if (progress) {
    if (isProcessing) {
      progress.currentlyProcessing.push(text.substring(0, 50) + '...')
    } else {
      const index = progress.currentlyProcessing.findIndex(p => p.startsWith(text.substring(0, 50)))
      if (index >= 0) {
        progress.currentlyProcessing.splice(index, 1)
      }
    }
    progressTracker.set(batchId, progress)
  }
}

function calculateCreditsUsed(characters: number, qualityTier: string): number {
  const creditsPerCharacter = {
    free: 0.001,
    standard: 0.002,
    premium: 0.003,
    enterprise: 0.004
  }

  return Math.ceil(characters * (creditsPerCharacter[qualityTier as keyof typeof creditsPerCharacter] || 0.002))
}


async function sendWebhookNotification(webhookUrl: string, results: BatchTranslationResponse): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Prismy-Batch-Translation/1.0'
      },
      body: JSON.stringify(results)
    })
  } catch (error) {
    console.error('[Batch Translation] Webhook notification failed:', error)
  }
}

// Export progress tracker for the progress endpoint
export { progressTracker }