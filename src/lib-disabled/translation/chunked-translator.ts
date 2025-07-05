/**
 * Chunked Translation Service
 * 
 * Splits text into chunks and translates using LLM APIs (GPT-4o, Claude)
 * Handles token limits and maintains context across chunks
 */

interface TranslationChunk {
  id: string
  index: number
  sourceText: string
  translatedText?: string
  status: 'pending' | 'translating' | 'completed' | 'failed'
  tokens: number
}

interface TranslationProgress {
  totalChunks: number
  completedChunks: number
  failedChunks: number
  progress: number
  estimatedTimeRemaining?: number
}

interface TranslationOptions {
  provider: 'openai' | 'anthropic'
  model: string
  maxTokensPerChunk: number
  temperature: number
  systemPrompt?: string
}

const DEFAULT_OPTIONS: TranslationOptions = {
  provider: 'openai',
  model: 'gpt-4o',
  maxTokensPerChunk: 3000, // Conservative limit to leave room for prompt
  temperature: 0.1, // Low temperature for consistent translations
  systemPrompt: `You are a professional translator. Translate the text accurately while preserving:
- Original formatting and structure
- Technical terms and proper nouns where appropriate
- Tone and style of the original text
- Line breaks and paragraph structure

Provide only the translation without explanations or additional text.`
}

/**
 * Estimates tokens for text (rough approximation)
 * @param text - Text to estimate
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for most languages
  // More conservative for non-English languages
  return Math.ceil(text.length / 3)
}

/**
 * Splits text into chunks respecting sentence boundaries
 * @param text - Text to split
 * @param maxTokensPerChunk - Maximum tokens per chunk
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string, maxTokensPerChunk: number = 3000): string[] {
  // Handle empty or whitespace-only text
  const trimmedText = text.trim()
  if (trimmedText.length === 0) {
    return []
  }

  if (estimateTokens(trimmedText) <= maxTokensPerChunk) {
    return [trimmedText]
  }

  const chunks: string[] = []
  const sentences = trimmedText.split(/(?<=[.!?])\s+/)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence
    
    if (estimateTokens(testChunk) <= maxTokensPerChunk) {
      currentChunk = testChunk
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        // Single sentence is too long, split by words
        const words = sentence.split(' ')
        let wordChunk = ''
        
        for (const word of words) {
          const testWordChunk = wordChunk + (wordChunk ? ' ' : '') + word
          
          if (estimateTokens(testWordChunk) <= maxTokensPerChunk) {
            wordChunk = testWordChunk
          } else {
            if (wordChunk) {
              chunks.push(wordChunk.trim())
              wordChunk = word
            } else {
              // Single word is too long, split by characters
              chunks.push(word)
            }
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk
        }
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Translates a single chunk using OpenAI GPT-4o
 * @param text - Text to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @param options - Translation options
 * @returns Translated text
 */
async function translateChunkWithOpenAI(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslationOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    vi: 'Vietnamese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean'
  }

  const sourceLangName = languageNames[sourceLanguage as keyof typeof languageNames] || sourceLanguage
  const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage

  const prompt = `${options.systemPrompt}

Translate the following text from ${sourceLangName} to ${targetLangName}:

${text}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No translation returned from OpenAI API')
  }

  return data.choices[0].message.content.trim()
}

/**
 * Translates a single chunk using Anthropic Claude
 * @param text - Text to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @param options - Translation options
 * @returns Translated text
 */
async function translateChunkWithClaude(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslationOptions
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    vi: 'Vietnamese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean'
  }

  const sourceLangName = languageNames[sourceLanguage as keyof typeof languageNames] || sourceLanguage
  const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage

  const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}:

${text}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model || 'claude-3-haiku-20240307',
      max_tokens: 4000,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  
  if (!data.content || data.content.length === 0) {
    throw new Error('No translation returned from Anthropic API')
  }

  return data.content[0].text.trim()
}

/**
 * Translates a single text chunk
 * @param text - Text to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @param options - Translation options
 * @returns Translated text
 */
async function translateSingleChunk(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslationOptions
): Promise<string> {
  switch (options.provider) {
    case 'openai':
      return translateChunkWithOpenAI(text, sourceLanguage, targetLanguage, options)
    case 'anthropic':
      return translateChunkWithClaude(text, sourceLanguage, targetLanguage, options)
    default:
      throw new Error(`Unsupported translation provider: ${options.provider}`)
  }
}

/**
 * Translates text by splitting into chunks and processing in parallel
 * @param text - Text to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @param options - Translation options
 * @param onProgress - Progress callback
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: Partial<TranslationOptions> = {},
  onProgress?: (progress: TranslationProgress) => void
): Promise<string> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }
  
  // Split text into chunks
  const textChunks = splitTextIntoChunks(text, finalOptions.maxTokensPerChunk)
  
  const chunks: TranslationChunk[] = textChunks.map((chunk, index) => ({
    id: `chunk-${index}`,
    index,
    sourceText: chunk,
    status: 'pending',
    tokens: estimateTokens(chunk)
  }))

  const totalChunks = chunks.length
  let completedChunks = 0
  let failedChunks = 0

  // Process chunks with controlled concurrency (max 3 parallel requests)
  const maxConcurrency = 3
  const results: string[] = new Array(totalChunks)
  
  const processChunk = async (chunk: TranslationChunk): Promise<void> => {
    try {
      chunk.status = 'translating'
      
      const translated = await translateSingleChunk(
        chunk.sourceText,
        sourceLanguage,
        targetLanguage,
        finalOptions
      )
      
      chunk.translatedText = translated
      chunk.status = 'completed'
      results[chunk.index] = translated
      completedChunks++
      
      // Report progress
      if (onProgress) {
        const progress = Math.round((completedChunks / totalChunks) * 100)
        onProgress({
          totalChunks,
          completedChunks,
          failedChunks,
          progress
        })
      }
      
    } catch (error) {
      chunk.status = 'failed'
      failedChunks++
      console.error(`Failed to translate chunk ${chunk.index}:`, error)
      
      // Use original text as fallback
      results[chunk.index] = `[Translation failed: ${chunk.sourceText}]`
      
      if (onProgress) {
        const progress = Math.round(((completedChunks + failedChunks) / totalChunks) * 100)
        onProgress({
          totalChunks,
          completedChunks,
          failedChunks,
          progress
        })
      }
    }
  }

  // Process chunks with limited concurrency
  const processInBatches = async () => {
    for (let i = 0; i < chunks.length; i += maxConcurrency) {
      const batch = chunks.slice(i, i + maxConcurrency)
      await Promise.all(batch.map(processChunk))
    }
  }

  await processInBatches()
  
  // Join results
  const translatedText = results.join(' ')
  
  if (failedChunks > 0) {
    console.warn(`Translation completed with ${failedChunks} failed chunks out of ${totalChunks}`)
  }
  
  return translatedText
}

/**
 * Estimates translation cost and time
 * @param text - Text to translate
 * @param options - Translation options
 * @returns Cost and time estimates
 */
export function estimateTranslation(
  text: string,
  options: Partial<TranslationOptions> = {}
): {
  estimatedTokens: number
  estimatedChunks: number
  estimatedCostUSD: number
  estimatedTimeMinutes: number
} {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }
  const tokens = estimateTokens(text)
  const chunks = Math.ceil(tokens / finalOptions.maxTokensPerChunk)
  
  // Cost estimates (approximate)
  const costPerToken = {
    'gpt-4o': 0.000015, // $15 per 1M tokens (output)
    'claude-3-haiku-20240307': 0.000001, // $1 per 1M tokens (output)
  }
  
  const modelCost = costPerToken[finalOptions.model as keyof typeof costPerToken] || 0.000015
  const estimatedCost = Math.max(tokens * modelCost, 0.01) // Minimum 1 cent
  
  // Time estimates (conservative)
  const timePerChunk = 3 // seconds
  const estimatedTime = (chunks * timePerChunk) / 60 // minutes
  
  return {
    estimatedTokens: tokens,
    estimatedChunks: chunks,
    estimatedCostUSD: Math.round(estimatedCost * 100) / 100,
    estimatedTimeMinutes: Math.round(estimatedTime * 10) / 10
  }
}