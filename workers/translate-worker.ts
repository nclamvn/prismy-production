/**
 * Translation Worker with LLM Router - Phase 3.3-C
 * Translates text chunks using multiple AI providers (GPT-4o, Claude 3, etc.)
 * 
 * Pipeline Flow:
 * 1. Receive text chunks from Phase 3.3-B (40% progress)
 * 2. Route to appropriate LLM based on language pair and quality tier
 * 3. Process chunks with context preservation
 * 4. Handle retries with exponential backoff
 * 5. Store translated results with confidence scores
 * 6. Update job progress 40% → 85%
 * 7. Queue next pipeline step (document rebuild)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-placeholder'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder'
const MAX_RETRIES = parseInt(process.env.TRANSLATION_MAX_RETRIES || '3')
const TRANSLATION_TIMEOUT = parseInt(process.env.TRANSLATION_TIMEOUT || '30000')
const MAX_CONCURRENT_TRANSLATIONS = parseInt(process.env.MAX_CONCURRENT_TRANSLATIONS || '5')
const PRIMARY_MODEL = process.env.PRIMARY_TRANSLATION_MODEL || 'gpt-4o'
const FALLBACK_MODEL = process.env.FALLBACK_TRANSLATION_MODEL || 'claude-3-5-sonnet-20241022'

interface TranslationJob {
  id: string
  type: 'file-processing' | 'document-translation'
  payload: {
    jobId: string
    fileName: string
    targetLanguage: string
    sourceLang?: string
    qualityTier?: 'standard' | 'premium' | 'enterprise'
    preserveFormatting?: boolean
    glossary?: Record<string, string>
  }
}

interface TextChunk {
  id: string
  job_id: string
  page_number: number
  chunk_index: number
  text: string
  token_count: number
  language: {
    code: string
    name: string
    confidence: number
  }
  translation_status: string
  translated_text?: string
  translation_tokens?: number
  translation_model?: string
  translation_confidence?: number
}

interface TranslationResult {
  translatedText: string
  model: string
  tokenCount: number
  confidence: number
  processingTime: number
  metadata?: {
    detectedSourceLang?: string
    alternativeTranslations?: string[]
    glossaryMatches?: number
  }
}

interface LLMProvider {
  name: string
  models: string[]
  translate: (text: string, sourceLang: string, targetLang: string, context?: any) => Promise<TranslationResult>
  isAvailable: () => boolean
}

export class TranslationWorker {
  private supabase: ReturnType<typeof createClient>
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private providers: Map<string, LLMProvider> = new Map()
  private isInitialized = false

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  /**
   * Initialize LLM providers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[TRANSLATE] Initializing translation worker with LLM providers...')
    
    // Initialize OpenAI
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-placeholder') {
      this.openai = new OpenAI({ apiKey: OPENAI_API_KEY })
      this.providers.set('openai', {
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        translate: this.translateWithOpenAI.bind(this),
        isAvailable: () => !!this.openai
      })
      console.log('[TRANSLATE] OpenAI provider initialized')
    }

    // Initialize Anthropic
    if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'sk-ant-placeholder') {
      this.anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
      this.providers.set('anthropic', {
        name: 'Anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        translate: this.translateWithAnthropic.bind(this),
        isAvailable: () => !!this.anthropic
      })
      console.log('[TRANSLATE] Anthropic provider initialized')
    }

    // Add mock provider for testing
    this.providers.set('mock', {
      name: 'Mock',
      models: ['mock-translator'],
      translate: this.translateWithMock.bind(this),
      isAvailable: () => true
    })

    this.isInitialized = true
    console.log(`[TRANSLATE] Initialization complete with ${this.providers.size} providers`)
  }

  /**
   * Process translation job
   */
  async processJob(job: TranslationJob): Promise<void> {
    const startTime = Date.now()
    console.log(`[TRANSLATE] Processing job ${job.id}:`, {
      fileName: job.payload.fileName,
      targetLanguage: job.payload.targetLanguage,
      qualityTier: job.payload.qualityTier || 'standard'
    })

    try {
      // Update job status
      await this.updateJobProgress(job.id, {
        status: 'processing',
        progress: 40,
        message: 'Starting translation processing...',
        currentStep: 'translate-init',
        totalSteps: 5
      })

      // Step 1: Get text chunks from previous phase (40-45%)
      const chunks = await this.getTextChunks(job.payload.jobId)
      await this.updateJobProgress(job.id, {
        progress: 45,
        message: `Retrieved ${chunks.length} text chunks for translation`,
        currentStep: 'load-chunks'
      })

      // Step 2: Prepare translation batches (45-50%)
      const batches = this.prepareBatches(chunks, MAX_CONCURRENT_TRANSLATIONS)
      await this.updateJobProgress(job.id, {
        progress: 50,
        message: `Prepared ${batches.length} translation batches`,
        currentStep: 'prepare-batches'
      })

      // Step 3: Process translations (50-80%)
      const translationResults = await this.processTranslations(
        job,
        batches,
        job.payload.targetLanguage,
        job.payload.sourceLang
      )
      
      // Step 4: Store translation results (80-85%)
      await this.storeTranslationResults(translationResults)
      await this.updateJobProgress(job.id, {
        progress: 85,
        message: `Translation completed for ${translationResults.length} chunks`,
        currentStep: 'store-translations'
      })

      const processingTime = Date.now() - startTime
      console.log(`[TRANSLATE] Job ${job.id} completed in ${processingTime}ms`)

      // Job is ready for next pipeline step (document rebuild)
      await this.updateJobProgress(job.id, {
        progress: 85,
        message: 'Translation complete - ready for document rebuild',
        currentStep: 'translate-complete'
      })

    } catch (error) {
      console.error(`[TRANSLATE] Job ${job.id} failed:`, error)
      
      await this.updateJobProgress(job.id, {
        status: 'failed',
        message: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorMessage: error instanceof Error ? error.stack : String(error)
      })

      throw error
    }
  }

  /**
   * Get text chunks from previous pipeline phase
   */
  private async getTextChunks(jobId: string): Promise<TextChunk[]> {
    console.log(`[TRANSLATE] Loading text chunks for job ${jobId}`)
    
    const { data: chunks, error } = await this.supabase
      .from('text_chunks')
      .select('*')
      .eq('job_id', jobId)
      .eq('translation_status', 'pending')
      .order('page_number')
      .order('chunk_index')

    if (error) {
      throw new Error(`Failed to load text chunks: ${error.message}`)
    }

    if (!chunks || chunks.length === 0) {
      throw new Error('No text chunks found - language detection phase must complete first')
    }

    console.log(`[TRANSLATE] Loaded ${chunks.length} chunks for translation`)
    return chunks
  }

  /**
   * Prepare chunks into batches for concurrent processing
   */
  private prepareBatches(chunks: TextChunk[], batchSize: number): TextChunk[][] {
    const batches: TextChunk[][] = []
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      batches.push(chunks.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * Process translation batches with progress tracking
   */
  private async processTranslations(
    job: TranslationJob,
    batches: TextChunk[][],
    targetLang: string,
    sourceLang?: string
  ): Promise<Array<{ chunk: TextChunk; result: TranslationResult }>> {
    console.log(`[TRANSLATE] Processing ${batches.length} batches`)
    
    const allResults: Array<{ chunk: TextChunk; result: TranslationResult }> = []
    const baseProgress = 50
    const progressRange = 30 // 50% to 80%
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const batchStartTime = Date.now()
      
      // Update progress for this batch
      const progress = baseProgress + Math.floor((batchIndex / batches.length) * progressRange)
      await this.updateJobProgress(job.id, {
        progress,
        message: `Translating batch ${batchIndex + 1}/${batches.length}...`,
        currentStep: 'translate-batch'
      })

      // Process batch chunks in parallel
      const batchPromises = batch.map(async (chunk) => {
        try {
          // Mark chunk as processing
          await this.updateChunkStatus(chunk.id, 'processing')
          
          // Select model based on quality tier
          const model = this.selectModel(job.payload.qualityTier || 'standard')
          
          // Translate with retry logic
          const result = await this.translateWithRetry(
            chunk.text,
            sourceLang || chunk.language.code,
            targetLang,
            model,
            {
              glossary: job.payload.glossary,
              preserveFormatting: job.payload.preserveFormatting,
              pageContext: `Page ${chunk.page_number}, Chunk ${chunk.chunk_index}`
            }
          )
          
          return { chunk, result }
        } catch (error) {
          console.error(`[TRANSLATE] Failed to translate chunk ${chunk.id}:`, error)
          
          // Mark chunk as failed
          await this.updateChunkStatus(chunk.id, 'failed')
          
          // Return error result
          return {
            chunk,
            result: {
              translatedText: chunk.text, // Fallback to original
              model: 'fallback',
              tokenCount: chunk.token_count,
              confidence: 0,
              processingTime: 0,
              metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            }
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      allResults.push(...batchResults)
      
      const batchTime = Date.now() - batchStartTime
      console.log(`[TRANSLATE] Batch ${batchIndex + 1} completed in ${batchTime}ms`)
    }

    return allResults
  }

  /**
   * Select AI model based on quality tier
   */
  private selectModel(qualityTier: 'standard' | 'premium' | 'enterprise'): string {
    switch (qualityTier) {
      case 'enterprise':
        return 'gpt-4o' // Best quality
      case 'premium':
        return 'claude-3-5-sonnet-20241022' // Good balance
      case 'standard':
      default:
        return 'gpt-3.5-turbo' // Cost effective
    }
  }

  /**
   * Translate text with retry logic
   */
  private async translateWithRetry(
    text: string,
    sourceLang: string,
    targetLang: string,
    model: string,
    context?: any,
    retryCount = 0
  ): Promise<TranslationResult> {
    try {
      // Determine provider from model
      const provider = this.getProviderForModel(model)
      if (!provider) {
        throw new Error(`No provider available for model: ${model}`)
      }

      const result = await provider.translate(text, sourceLang, targetLang, context)
      return result

    } catch (error) {
      console.error(`[TRANSLATE] Translation attempt ${retryCount + 1} failed:`, error)
      
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Try with fallback model if primary fails
        const fallbackModel = retryCount > 0 ? FALLBACK_MODEL : model
        return this.translateWithRetry(text, sourceLang, targetLang, fallbackModel, context, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Get provider for a specific model
   */
  private getProviderForModel(model: string): LLMProvider | null {
    for (const provider of this.providers.values()) {
      if (provider.models.includes(model) && provider.isAvailable()) {
        return provider
      }
    }
    
    // Fallback to mock provider
    return this.providers.get('mock') || null
  }

  /**
   * Translate using OpenAI
   */
  private async translateWithOpenAI(
    text: string,
    sourceLang: string,
    targetLang: string,
    context?: any
  ): Promise<TranslationResult> {
    const startTime = Date.now()
    
    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }

    const systemPrompt = this.buildSystemPrompt(sourceLang, targetLang, context)
    const userPrompt = this.buildUserPrompt(text, context)

    const completion = await this.openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: Math.min(text.length * 2, 4096), // Approximate max tokens needed
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}')
    
    return {
      translatedText: response.translation || text,
      model: PRIMARY_MODEL,
      tokenCount: completion.usage?.total_tokens || 0,
      confidence: response.confidence || 0.9,
      processingTime: Date.now() - startTime,
      metadata: {
        detectedSourceLang: response.detected_language,
        alternativeTranslations: response.alternatives,
        glossaryMatches: response.glossary_matches
      }
    }
  }

  /**
   * Translate using Anthropic Claude
   */
  private async translateWithAnthropic(
    text: string,
    sourceLang: string,
    targetLang: string,
    context?: any
  ): Promise<TranslationResult> {
    const startTime = Date.now()
    
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized')
    }

    const systemPrompt = this.buildSystemPrompt(sourceLang, targetLang, context)
    const userPrompt = this.buildUserPrompt(text, context)

    const completion = await this.anthropic.messages.create({
      model: FALLBACK_MODEL,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      max_tokens: Math.min(text.length * 2, 4096),
      temperature: 0.3
    })

    // Parse Claude's response
    const responseText = completion.content[0].type === 'text' ? completion.content[0].text : ''
    let response: any = {}
    
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Fallback to plain text
      response = { translation: responseText }
    }

    return {
      translatedText: response.translation || responseText || text,
      model: FALLBACK_MODEL,
      tokenCount: completion.usage?.input_tokens + completion.usage?.output_tokens || 0,
      confidence: response.confidence || 0.85,
      processingTime: Date.now() - startTime,
      metadata: {
        detectedSourceLang: response.detected_language,
        alternativeTranslations: response.alternatives
      }
    }
  }

  /**
   * Mock translation for testing
   */
  private async translateWithMock(
    text: string,
    sourceLang: string,
    targetLang: string,
    context?: any
  ): Promise<TranslationResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500))
    
    // Simple mock translation
    const mockTranslation = `[${targetLang.toUpperCase()}] ${text} [TRANSLATED]`
    
    return {
      translatedText: mockTranslation,
      model: 'mock-translator',
      tokenCount: Math.ceil(text.length / 4),
      confidence: 0.95,
      processingTime: 1000,
      metadata: {
        detectedSourceLang: sourceLang,
        glossaryMatches: context?.glossary ? Object.keys(context.glossary).length : 0
      }
    }
  }

  /**
   * Build system prompt for translation
   */
  private buildSystemPrompt(sourceLang: string, targetLang: string, context?: any): string {
    let prompt = `You are a professional translator specializing in ${sourceLang} to ${targetLang} translation. 
Your task is to provide accurate, natural-sounding translations that preserve the original meaning and tone.

Instructions:
- Translate the given text from ${sourceLang} to ${targetLang}
- Maintain the original formatting (line breaks, paragraphs, etc.)
- Preserve any technical terms, proper nouns, or specialized vocabulary
- Ensure the translation sounds natural in ${targetLang}
- Return the response in JSON format with the following structure:
{
  "translation": "translated text here",
  "confidence": 0.95,
  "detected_language": "auto-detected source language if different",
  "alternatives": ["alternative translation 1", "alternative translation 2"],
  "glossary_matches": 0
}`

    if (context?.glossary) {
      prompt += `\n\nGlossary terms (use these exact translations):\n`
      for (const [term, translation] of Object.entries(context.glossary)) {
        prompt += `- "${term}" → "${translation}"\n`
      }
    }

    if (context?.preserveFormatting) {
      prompt += `\n\nIMPORTANT: Preserve all formatting including spaces, line breaks, and special characters exactly as they appear in the source text.`
    }

    return prompt
  }

  /**
   * Build user prompt for translation
   */
  private buildUserPrompt(text: string, context?: any): string {
    let prompt = `Translate the following text:\n\n${text}`
    
    if (context?.pageContext) {
      prompt = `[Context: ${context.pageContext}]\n\n${prompt}`
    }
    
    return prompt
  }

  /**
   * Update chunk translation status
   */
  private async updateChunkStatus(chunkId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('text_chunks')
      .update({ 
        translation_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', chunkId)

    if (error) {
      console.error(`[TRANSLATE] Failed to update chunk status:`, error)
    }
  }

  /**
   * Store translation results in database
   */
  private async storeTranslationResults(
    results: Array<{ chunk: TextChunk; result: TranslationResult }>
  ): Promise<void> {
    console.log(`[TRANSLATE] Storing ${results.length} translation results`)
    
    // Prepare updates
    const updates = results.map(({ chunk, result }) => ({
      id: chunk.id,
      translation_status: result.confidence > 0 ? 'completed' : 'failed',
      translated_text: result.translatedText,
      translation_tokens: result.tokenCount,
      translation_model: result.model,
      translation_confidence: result.confidence,
      translated_at: new Date().toISOString()
    }))

    // Batch update chunks
    for (const update of updates) {
      const { error } = await this.supabase
        .from('text_chunks')
        .update(update)
        .eq('id', update.id)

      if (error) {
        console.error(`[TRANSLATE] Failed to update chunk ${update.id}:`, error)
      }
    }

    console.log(`[TRANSLATE] Successfully stored translation results`)
  }

  /**
   * Update job progress in queue
   */
  private async updateJobProgress(jobId: string, update: {
    status?: string
    progress?: number
    message?: string
    currentStep?: string
    totalSteps?: number
    errorMessage?: string
  }): Promise<void> {
    const { error } = await this.supabase.rpc('update_job_progress', {
      p_job_id: jobId,
      p_status: update.status,
      p_progress: update.progress,
      p_message: update.message,
      p_current_step: update.currentStep,
      p_total_steps: update.totalSteps,
      p_error_message: update.errorMessage
    })

    if (error) {
      console.error(`[TRANSLATE] Failed to update job progress:`, error)
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('[TRANSLATE] Cleaning up translation worker...')
    this.providers.clear()
    this.openai = null
    this.anthropic = null
    this.isInitialized = false
  }
}

// CLI interface for running as standalone worker
if (require.main === module) {
  const worker = new TranslationWorker()
  
  async function processJob() {
    await worker.initialize()
    
    // Example job for testing
    const testJob: TranslationJob = {
      id: 'test-translate-job-' + Date.now(),
      type: 'document-translation',
      payload: {
        jobId: 'test-job-123',
        fileName: 'sample-document.pdf',
        targetLanguage: 'es',
        sourceLang: 'en',
        qualityTier: 'standard',
        preserveFormatting: true
      }
    }
    
    try {
      await worker.processJob(testJob)
      console.log('✅ Translation Worker test completed successfully')
    } catch (error) {
      console.error('❌ Translation Worker test failed:', error)
    } finally {
      await worker.cleanup()
    }
  }
  
  processJob().catch(console.error)
}

export default TranslationWorker