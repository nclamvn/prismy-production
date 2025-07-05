/**
 * Language Detection Utility
 * 
 * Detects the language of input text using pattern matching and statistical analysis.
 * This is a simplified implementation for MVP - in production, you might use a service like Google Translate API.
 */

// Common word patterns for different languages
const LANGUAGE_PATTERNS = {
  en: {
    common_words: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could'],
    patterns: [/\bthe\b/gi, /\band\b/gi, /\bor\b/gi, /\bis\b/gi, /\bare\b/gi],
    name: 'English'
  },
  es: {
    common_words: ['hola', 'el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'del', 'los', 'las', 'al', 'como', 'le', 'si', 'ya', 'todo', 'esta'],
    patterns: [/\bel\b/gi, /\bla\b/gi, /\bde\b/gi, /\bque\b/gi, /\bes\b/gi],
    name: 'Spanish'
  },
  fr: {
    common_words: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'me', 'bien', 'où', 'sans'],
    patterns: [/\ble\b/gi, /\bde\b/gi, /\bet\b/gi, /\bun\b/gi, /\bune\b/gi],
    name: 'French'
  },
  de: {
    common_words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach'],
    patterns: [/\bder\b/gi, /\bdie\b/gi, /\bund\b/gi, /\bdas\b/gi, /\bist\b/gi],
    name: 'German'
  },
  it: {
    common_words: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del', 'da', 'una', 'su', 'le', 'si', 'come', 'lo', 'a', 'ha', 'non', 'più', 'o', 'sono', 'al', 'ma', 'se', 'nella', 'anche', 'tutto', 'questa'],
    patterns: [/\bil\b/gi, /\bdi\b/gi, /\bche\b/gi, /\bla\b/gi, /\bper\b/gi],
    name: 'Italian'
  },
  pt: {
    common_words: ['o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu'],
    patterns: [/\bo\b/gi, /\bde\b/gi, /\ba\b/gi, /\bdo\b/gi, /\bda\b/gi],
    name: 'Portuguese'
  },
  vi: {
    common_words: ['chào', 'xin', 'và', 'của', 'có', 'trong', 'là', 'được', 'một', 'cho', 'với', 'này', 'để', 'các', 'tại', 'từ', 'như', 'đã', 'theo', 'về', 'người', 'sẽ', 'đó', 'những', 'khi', 'sau', 'nhiều', 'năm', 'trên', 'cũng', 'thì', 'ra'],
    patterns: [/\bvà\b/gi, /\bcủa\b/gi, /\bcó\b/gi, /\blà\b/gi, /\bđược\b/gi],
    name: 'Vietnamese'
  },
  zh: {
    common_words: ['的', '是', '在', '有', '我', '了', '你', '他', '也', '这', '就', '不', '人', '都', '一', '个', '上', '来', '说', '要', '去', '会', '可以', '没有', '什么', '看', '能', '好', '现在', '知道'],
    patterns: [/的/g, /是/g, /在/g, /有/g, /了/g],
    name: 'Chinese'
  },
  ja: {
    common_words: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる', 'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ'],
    patterns: [/の/g, /に/g, /は/g, /を/g, /た/g],
    name: 'Japanese'
  },
  ko: {
    common_words: ['이', '의', '를', '에', '는', '가', '과', '한', '로', '으로', '와', '도', '해', '하는', '있는', '된', '하고', '하지', '않는', '같은', '많은', '없는', '대한', '위한', '통해', '따라', '위해', '또한', '그리고', '하나'],
    patterns: [/이/g, /의/g, /를/g, /에/g, /는/g],
    name: 'Korean'
  }
}

// Character set patterns for additional detection
const CHARACTER_PATTERNS = {
  zh: /[\u4e00-\u9fff]/g,  // Chinese characters
  ja: /[\u3040-\u309f\u30a0-\u30ff]/g,  // Hiragana and Katakana
  ko: /[\uac00-\ud7af]/g,  // Korean characters
  ar: /[\u0600-\u06ff]/g,  // Arabic characters
  ru: /[\u0400-\u04ff]/g,  // Cyrillic characters
  th: /[\u0e00-\u0e7f]/g,  // Thai characters
}

/**
 * Detects the language of the input text
 * @param text - The text to analyze
 * @returns Promise<string> - The detected language code (e.g., 'en', 'es', 'fr')
 */
export async function detectLanguage(text: string): Promise<string> {
  // Normalize text for analysis
  const normalizedText = text.toLowerCase().trim()
  
  // Handle empty text
  if (normalizedText.length === 0) {
    return 'en' // Default to English for empty text
  }

  // First, check for specific character sets
  for (const [langCode, pattern] of Object.entries(CHARACTER_PATTERNS)) {
    const matches = normalizedText.match(pattern)
    if (matches && matches.length > 5) { // Threshold for character-based detection
      return langCode
    }
  }

  // Special handling for short text - check for exact common words
  if (normalizedText.length < 50) {
    // Clean words by removing punctuation
    const words = normalizedText.split(/\s+/).map(word => 
      word.replace(/[^\w\u00C0-\u017F\u1E00-\u1EFF]/g, '')
    ).filter(word => word.length > 0)
    
    // Check for language-specific unique words first
    const uniqueWords = {
      'vi': ['chào', 'xin', 'bạn', 'không', 'đây', 'khỏe', 'việt'],
      'es': ['hola', 'cómo', 'estás', 'español', 'gracias', 'señor'],
      'fr': ['bonjour', 'comment', 'français', 'allez', 'vous'],
      'de': ['hallo', 'wie', 'geht', 'deutsch', 'ihnen'],
      'pt': ['olá', 'como', 'está', 'português', 'obrigado']
    }
    
    for (const word of words) {
      for (const [langCode, uniqueWordList] of Object.entries(uniqueWords)) {
        if (uniqueWordList.includes(word)) {
          return langCode
        }
      }
    }
    
    // Then check for common words
    for (const word of words) {
      // Check for exact matches with common words in each language
      for (const [langCode, langData] of Object.entries(LANGUAGE_PATTERNS)) {
        if (langData.common_words.includes(word)) {
          return langCode
        }
      }
    }
  }

  // Score each language based on word patterns
  const scores: Record<string, number> = {}
  
  for (const [langCode, langData] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0
    
    // Check common words
    for (const word of langData.common_words) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = normalizedText.match(regex)
      if (matches) {
        score += matches.length
      }
    }
    
    // Check specific patterns
    for (const pattern of langData.patterns) {
      const matches = normalizedText.match(pattern)
      if (matches) {
        score += matches.length * 2 // Weight patterns higher
      }
    }
    
    scores[langCode] = score
  }

  // Find the language with the highest score
  let maxScore = 0
  let detectedLang = 'en' // Default to English
  
  for (const [langCode, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detectedLang = langCode
    }
  }

  // If no language has a significant score, try other heuristics
  if (maxScore < 3) {
    // Check for common English patterns as fallback
    const englishIndicators = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi
    const englishMatches = normalizedText.match(englishIndicators)
    
    if (englishMatches && englishMatches.length > 0) {
      return 'en'
    }
    
    // Check for Romance language patterns
    const romanceIndicators = /\b(el|la|de|que|y|es|le|et|il|der|die|und)\b/gi
    const romanceMatches = normalizedText.match(romanceIndicators)
    
    if (romanceMatches && romanceMatches.length > 0) {
      // More specific detection needed - for now return Spanish as most common
      return 'es'
    }
  }

  return detectedLang
}

/**
 * Get the full language name from language code
 * @param langCode - Language code (e.g., 'en', 'es')
 * @returns string - Full language name
 */
export function getLanguageName(langCode: string): string {
  const langData = LANGUAGE_PATTERNS[langCode as keyof typeof LANGUAGE_PATTERNS]
  return langData?.name || 'Unknown'
}

/**
 * Get confidence score for language detection
 * @param text - The text to analyze
 * @param detectedLang - The detected language code
 * @returns Promise<number> - Confidence score between 0 and 1
 */
export async function getDetectionConfidence(text: string, detectedLang: string): Promise<number> {
  const normalizedText = text.toLowerCase().trim()
  
  if (normalizedText.length < 3) {
    return 0.1 // Low confidence for very short text
  }

  const langData = LANGUAGE_PATTERNS[detectedLang as keyof typeof LANGUAGE_PATTERNS]
  if (!langData) {
    return 0.1
  }

  let matches = 0
  let totalChecks = 0
  
  // Check common words
  for (const word of langData.common_words.slice(0, 10)) { // Check top 10 words
    totalChecks++
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const wordMatches = normalizedText.match(regex)
    if (wordMatches && wordMatches.length > 0) {
      matches += wordMatches.length
    }
  }
  
  // Calculate confidence based on matches per check
  const confidence = totalChecks > 0 ? matches / totalChecks : 0.1
  return Math.min(confidence, 1) // Cap at 1
}