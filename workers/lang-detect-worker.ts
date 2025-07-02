/**
 * Language Detection + Text Splitter Worker - Phase 3.3-B
 * Detects languages per page and splits text into LLM-optimized chunks
 * 
 * Pipeline Flow:
 * 1. Receive OCR results from Phase 3.3-A (30% progress)
 * 2. Detect language per page using multiple detection methods
 * 3. Split text into chunks ≤8k tokens for LLM processing
 * 4. Create page mapping for translation reconstruction
 * 5. Update job progress 30% → 40%
 * 6. Queue next pipeline step (translation worker)
 */

import { createClient } from '@supabase/supabase-js'
import { encode } from 'gpt-tokenizer'

// Language detection libraries
const LanguageDetect = require('languagedetect')
const franc = require('franc')

// Environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
const MAX_CHUNK_TOKENS = parseInt(process.env.MAX_CHUNK_TOKENS || '8000')
const MIN_TEXT_LENGTH = parseInt(process.env.MIN_TEXT_LENGTH || '50')
const OVERLAP_TOKENS = parseInt(process.env.OVERLAP_TOKENS || '200')

interface LangDetectJob {
  id: string
  type: 'file-processing' | 'language-detection'
  payload: {
    jobId: string
    fileName: string
    totalPages: number
  }
}

interface OCRPage {
  id: string
  job_id: string
  page_number: number
  text: string
  confidence: number
  layout: any
  processing_time_ms: number
  created_at: string
}

interface DetectedLanguage {
  code: string
  name: string
  confidence: number
  detector: 'languagedetect' | 'franc' | 'consensus'
}

interface TextChunk {
  id: string
  job_id: string
  page_number: number
  chunk_index: number
  text: string
  token_count: number
  language: DetectedLanguage
  start_position: number
  end_position: number
  overlap_start?: number
  overlap_end?: number
  created_at: string
}

interface PageLanguageMap {
  job_id: string
  page_number: number
  detected_language: DetectedLanguage
  alternative_languages: DetectedLanguage[]
  chunk_count: number
  total_tokens: number
  text_length: number
  confidence_score: number
  created_at: string
}

export class LanguageDetectionWorker {
  private supabase: ReturnType<typeof createClient>
  private languageDetector: any
  private isInitialized = false

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    this.languageDetector = new LanguageDetect()
    this.languageDetector.setLanguageType('iso2')
  }

  /**
   * Initialize the language detection worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[LANG DETECT] Initializing language detection worker...')
    
    // Configure language detector
    this.languageDetector.setLanguageType('iso2')
    
    this.isInitialized = true
    console.log('[LANG DETECT] Initialization complete')
  }

  /**
   * Process language detection job
   */
  async processJob(job: LangDetectJob): Promise<void> {
    const startTime = Date.now()
    console.log(`[LANG DETECT] Processing job ${job.id}:`, {
      fileName: job.payload.fileName,
      totalPages: job.payload.totalPages
    })

    try {
      // Update job status
      await this.updateJobProgress(job.id, {
        status: 'processing',
        progress: 30,
        message: 'Starting language detection...',
        currentStep: 'lang-detect-init',
        totalSteps: 4
      })

      // Step 1: Get OCR results from previous phase (30-32%)
      const ocrPages = await this.getOCRResults(job.payload.jobId)
      await this.updateJobProgress(job.id, {
        progress: 32,
        message: `Retrieved OCR data for ${ocrPages.length} pages`,
        currentStep: 'load-ocr-data'
      })

      // Step 2: Detect languages for each page (32-36%)
      const languageMaps = await this.detectLanguagesPerPage(job, ocrPages)
      await this.updateJobProgress(job.id, {
        progress: 36,
        message: `Language detection completed for ${languageMaps.length} pages`,
        currentStep: 'detect-languages'
      })

      // Step 3: Split text into chunks for LLM processing (36-39%)
      const textChunks = await this.splitTextIntoChunks(job, ocrPages, languageMaps)
      await this.updateJobProgress(job.id, {
        progress: 39,
        message: `Created ${textChunks.length} text chunks for translation`,
        currentStep: 'split-text'
      })

      // Step 4: Store results in database (39-40%)
      await this.storeResults(job.payload.jobId, languageMaps, textChunks)
      await this.updateJobProgress(job.id, {
        progress: 40,
        message: 'Language detection and text splitting complete',
        currentStep: 'store-results'
      })

      const processingTime = Date.now() - startTime
      console.log(`[LANG DETECT] Job ${job.id} completed in ${processingTime}ms`)

      // Job is ready for next pipeline step (translation)
      await this.updateJobProgress(job.id, {
        progress: 40,
        message: 'Ready for translation phase',
        currentStep: 'lang-detect-complete'
      })

    } catch (error) {
      console.error(`[LANG DETECT] Job ${job.id} failed:`, error)
      
      await this.updateJobProgress(job.id, {
        status: 'failed',
        message: `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorMessage: error instanceof Error ? error.stack : String(error)
      })

      throw error
    }
  }

  /**
   * Get OCR results from previous pipeline phase
   */
  private async getOCRResults(jobId: string): Promise<OCRPage[]> {
    console.log(`[LANG DETECT] Loading OCR results for job ${jobId}`)
    
    const { data: ocrPages, error } = await this.supabase
      .from('ocr_pages')
      .select('*')
      .eq('job_id', jobId)
      .order('page_number')

    if (error) {
      throw new Error(`Failed to load OCR results: ${error.message}`)
    }

    if (!ocrPages || ocrPages.length === 0) {
      throw new Error('No OCR results found - OCR phase must complete first')
    }

    console.log(`[LANG DETECT] Loaded ${ocrPages.length} OCR pages`)
    return ocrPages
  }

  /**
   * Detect languages for each page using multiple methods
   */
  private async detectLanguagesPerPage(job: LangDetectJob, ocrPages: OCRPage[]): Promise<PageLanguageMap[]> {
    console.log(`[LANG DETECT] Detecting languages for ${ocrPages.length} pages`)
    
    const languageMaps: PageLanguageMap[] = []

    for (const page of ocrPages) {
      const pageStartTime = Date.now()
      
      // Skip pages with insufficient text
      if (page.text.trim().length < MIN_TEXT_LENGTH) {
        console.warn(`[LANG DETECT] Skipping page ${page.page_number} - insufficient text (${page.text.length} chars)`)
        continue
      }

      // Detect language using multiple methods
      const detectionResults = await this.detectLanguageMultiMethod(page.text)
      
      // Count tokens for planning
      const tokenCount = this.countTokens(page.text)
      
      const languageMap: PageLanguageMap = {
        job_id: job.payload.jobId,
        page_number: page.page_number,
        detected_language: detectionResults.primary,
        alternative_languages: detectionResults.alternatives,
        chunk_count: Math.ceil(tokenCount / MAX_CHUNK_TOKENS),
        total_tokens: tokenCount,
        text_length: page.text.length,
        confidence_score: detectionResults.primary.confidence,
        created_at: new Date().toISOString()
      }

      languageMaps.push(languageMap)
      
      const processingTime = Date.now() - pageStartTime
      console.log(`[LANG DETECT] Page ${page.page_number}: ${detectionResults.primary.code} (${Math.round(detectionResults.primary.confidence * 100)}%) in ${processingTime}ms`)
    }

    return languageMaps
  }

  /**
   * Detect language using multiple detection methods for better accuracy
   */
  private async detectLanguageMultiMethod(text: string): Promise<{
    primary: DetectedLanguage
    alternatives: DetectedLanguage[]
  }> {
    const detectionResults: DetectedLanguage[] = []

    try {
      // Method 1: languagedetect library
      const ldResults = this.languageDetector.detect(text)
      if (ldResults && ldResults.length > 0) {
        detectionResults.push({
          code: ldResults[0][0],
          name: this.getLanguageName(ldResults[0][0]),
          confidence: ldResults[0][1],
          detector: 'languagedetect'
        })
      }
    } catch (error) {
      console.warn('[LANG DETECT] languagedetect failed:', error)
    }

    try {
      // Method 2: franc library
      const francResult = franc(text)
      if (francResult !== 'und') { // 'und' means undetermined
        const confidence = this.calculateFrancConfidence(text, francResult)
        detectionResults.push({
          code: francResult,
          name: this.getLanguageName(francResult),
          confidence: confidence,
          detector: 'franc'
        })
      }
    } catch (error) {
      console.warn('[LANG DETECT] franc failed:', error)
    }

    // Fallback: simple heuristics
    if (detectionResults.length === 0) {
      detectionResults.push(this.detectLanguageHeuristic(text))
    }

    // Sort by confidence and select primary
    detectionResults.sort((a, b) => b.confidence - a.confidence)
    
    const primary = detectionResults[0]
    const alternatives = detectionResults.slice(1, 3) // Top 2 alternatives

    return { primary, alternatives }
  }

  /**
   * Calculate confidence score for franc results
   */
  private calculateFrancConfidence(text: string, langCode: string): number {
    // Simple confidence based on text length and character patterns
    const baseConfidence = Math.min(text.length / 1000, 0.8) // Higher confidence for longer text
    const specificityBonus = langCode.length === 2 ? 0.1 : 0.0 // Bonus for ISO 639-1 codes
    
    return Math.min(baseConfidence + specificityBonus, 0.95)
  }

  /**
   * Heuristic language detection as fallback
   */
  private detectLanguageHeuristic(text: string): DetectedLanguage {
    // Simple heuristics based on character patterns
    const lowerText = text.toLowerCase()
    
    // Check for common English patterns
    const englishPatterns = ['the ', 'and ', 'for ', 'are ', 'but ', 'not ', 'you ', 'all ', 'can ', 'had ', 'her ', 'was ', 'one ', 'our ', 'out ', 'day ', 'get ', 'use ', 'man ', 'new ', 'now ', 'way ', 'may ', 'say ']
    const englishMatches = englishPatterns.filter(pattern => lowerText.includes(pattern)).length
    
    if (englishMatches >= 3) {
      return {
        code: 'en',
        name: 'English',
        confidence: Math.min(0.6 + (englishMatches * 0.05), 0.85),
        detector: 'languagedetect'
      }
    }

    // Default to undetermined
    return {
      code: 'und',
      name: 'Undetermined',
      confidence: 0.1,
      detector: 'languagedetect'
    }
  }

  /**
   * Get human-readable language name from code
   */
  private getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'und': 'Undetermined'
    }
    
    return languageNames[code] || `Language (${code})`
  }

  /**
   * Split text into chunks optimized for LLM processing
   */
  private async splitTextIntoChunks(job: LangDetectJob, ocrPages: OCRPage[], languageMaps: PageLanguageMap[]): Promise<TextChunk[]> {
    console.log(`[LANG DETECT] Splitting text into chunks (max ${MAX_CHUNK_TOKENS} tokens)`)
    
    const chunks: TextChunk[] = []
    let chunkId = 0

    for (const page of ocrPages) {
      const languageMap = languageMaps.find(lm => lm.page_number === page.page_number)
      if (!languageMap) continue

      const pageChunks = await this.splitPageText(
        page.text,
        job.payload.jobId,
        page.page_number,
        languageMap.detected_language,
        chunkId
      )

      chunks.push(...pageChunks)
      chunkId += pageChunks.length

      console.log(`[LANG DETECT] Page ${page.page_number}: ${pageChunks.length} chunks created`)
    }

    console.log(`[LANG DETECT] Total chunks created: ${chunks.length}`)
    return chunks
  }

  /**
   * Split individual page text into token-optimized chunks
   */
  private async splitPageText(
    text: string,
    jobId: string,
    pageNumber: number,
    language: DetectedLanguage,
    startChunkId: number
  ): Promise<TextChunk[]> {
    const chunks: TextChunk[] = []
    
    // For short text, create single chunk
    const tokenCount = this.countTokens(text)
    if (tokenCount <= MAX_CHUNK_TOKENS) {
      chunks.push({
        id: `chunk-${startChunkId}`,
        job_id: jobId,
        page_number: pageNumber,
        chunk_index: 0,
        text: text,
        token_count: tokenCount,
        language: language,
        start_position: 0,
        end_position: text.length,
        created_at: new Date().toISOString()
      })
      return chunks
    }

    // Split long text into overlapping chunks
    const sentences = this.splitIntoSentences(text)
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0
    let startPosition = 0

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceTokens = this.countTokens(sentence)

      // Check if adding this sentence would exceed limit
      if (currentTokens + sentenceTokens > MAX_CHUNK_TOKENS && currentChunk.length > 0) {
        // Create chunk with current content
        const chunkText = currentChunk.trim()
        chunks.push({
          id: `chunk-${startChunkId + chunkIndex}`,
          job_id: jobId,
          page_number: pageNumber,
          chunk_index: chunkIndex,
          text: chunkText,
          token_count: this.countTokens(chunkText),
          language: language,
          start_position: startPosition,
          end_position: startPosition + chunkText.length,
          created_at: new Date().toISOString()
        })

        // Start new chunk with overlap
        const overlapStart = Math.max(0, i - 2) // Include previous 2 sentences for context
        currentChunk = sentences.slice(overlapStart, i + 1).join(' ')
        currentTokens = this.countTokens(currentChunk)
        startPosition += chunkText.length
        chunkIndex++
      } else {
        // Add sentence to current chunk
        currentChunk += (currentChunk ? ' ' : '') + sentence
        currentTokens += sentenceTokens
      }
    }

    // Add final chunk if there's remaining content
    if (currentChunk.trim().length > 0) {
      const chunkText = currentChunk.trim()
      chunks.push({
        id: `chunk-${startChunkId + chunkIndex}`,
        job_id: jobId,
        page_number: pageNumber,
        chunk_index: chunkIndex,
        text: chunkText,
        token_count: this.countTokens(chunkText),
        language: language,
        start_position: startPosition,
        end_position: startPosition + chunkText.length,
        created_at: new Date().toISOString()
      })
    }

    return chunks
  }

  /**
   * Split text into sentences for better chunking
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - can be improved with proper NLP
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + '.')
  }

  /**
   * Count tokens using GPT tokenizer
   */
  private countTokens(text: string): number {
    try {
      return encode(text).length
    } catch (error) {
      // Fallback: approximate token count
      return Math.ceil(text.length / 4)
    }
  }

  /**
   * Store language detection and chunking results
   */
  private async storeResults(jobId: string, languageMaps: PageLanguageMap[], textChunks: TextChunk[]): Promise<void> {
    console.log(`[LANG DETECT] Storing ${languageMaps.length} language maps and ${textChunks.length} text chunks`)
    
    // Store language maps
    const { error: langError } = await this.supabase
      .from('page_language_maps')
      .insert(languageMaps)

    if (langError) {
      throw new Error(`Failed to store language maps: ${langError.message}`)
    }

    // Store text chunks
    const { error: chunkError } = await this.supabase
      .from('text_chunks')
      .insert(textChunks)

    if (chunkError) {
      throw new Error(`Failed to store text chunks: ${chunkError.message}`)
    }

    console.log(`[LANG DETECT] Successfully stored results for job ${jobId}`)
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
      console.error(`[LANG DETECT] Failed to update job progress:`, error)
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('[LANG DETECT] Cleaning up language detection worker...')
    this.isInitialized = false
  }
}

// CLI interface for running as standalone worker
if (require.main === module) {
  const worker = new LanguageDetectionWorker()
  
  async function processJob() {
    await worker.initialize()
    
    // Example job for testing
    const testJob: LangDetectJob = {
      id: 'test-lang-job-' + Date.now(),
      type: 'language-detection',
      payload: {
        jobId: 'test-job-123',
        fileName: 'sample-document.pdf',
        totalPages: 2
      }
    }
    
    try {
      await worker.processJob(testJob)
      console.log('✅ Language Detection Worker test completed successfully')
    } catch (error) {
      console.error('❌ Language Detection Worker test failed:', error)
    } finally {
      await worker.cleanup()
    }
  }
  
  processJob().catch(console.error)
}

export default LanguageDetectionWorker