import { createWorker, Worker, RecognizeResult } from 'tesseract.js'

export interface OCRProgress {
  status: string
  progress: number
  message?: string
}

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
    words: Array<{
      text: string
      confidence: number
    }>
  }>
  paragraphs: Array<{
    text: string
    confidence: number
    lines: Array<{
      text: string
      confidence: number
    }>
  }>
}

export interface OCROptions {
  language?: string | string[]
  psm?: number // Page segmentation mode
  oem?: number // OCR Engine mode
  whitelist?: string
  blacklist?: string
  preserve_interword_spaces?: string
}

class OCRService {
  private workers: Map<string, Worker> = new Map()
  private workerPromises: Map<string, Promise<Worker>> = new Map()

  /**
   * Get or create a worker for the specified language
   */
  private async getWorker(language: string = 'eng'): Promise<Worker> {
    // Check if we already have a worker for this language
    if (this.workers.has(language)) {
      return this.workers.get(language)!
    }

    // Check if we're already creating a worker for this language
    if (this.workerPromises.has(language)) {
      return this.workerPromises.get(language)!
    }

    // Create a new worker
    const workerPromise = this.createWorker(language)
    this.workerPromises.set(language, workerPromise)

    try {
      const worker = await workerPromise
      this.workers.set(language, worker)
      this.workerPromises.delete(language)
      return worker
    } catch (error) {
      this.workerPromises.delete(language)
      throw error
    }
  }

  /**
   * Create and initialize a new Tesseract worker
   */
  private async createWorker(language: string): Promise<Worker> {
    const worker = await createWorker({
      logger: (m) => {
        // Optional: log progress to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[OCR]', m)
        }
      }
    })

    await worker.loadLanguage(language)
    await worker.initialize(language)

    return worker
  }

  /**
   * Perform OCR on an image file
   */
  async recognizeFromFile(
    file: File,
    options: OCROptions = {},
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const language = Array.isArray(options.language) 
      ? options.language.join('+') 
      : options.language || 'eng'

    try {
      const worker = await this.getWorker(language)

      // Set Tesseract parameters
      if (options.psm !== undefined) {
        await worker.setParameters({
          tessedit_pageseg_mode: options.psm
        })
      }

      if (options.oem !== undefined) {
        await worker.setParameters({
          tessedit_ocr_engine_mode: options.oem
        })
      }

      if (options.whitelist) {
        await worker.setParameters({
          tessedit_char_whitelist: options.whitelist
        })
      }

      if (options.blacklist) {
        await worker.setParameters({
          tessedit_char_blacklist: options.blacklist
        })
      }

      if (options.preserve_interword_spaces) {
        await worker.setParameters({
          preserve_interword_spaces: options.preserve_interword_spaces
        })
      }

      // Perform OCR
      const result = await worker.recognize(file, {
        logger: onProgress ? (m) => {
          onProgress({
            status: m.status,
            progress: m.progress || 0,
            message: m.userJobId || m.status
          })
        } : undefined
      })

      return this.processResult(result)

    } catch (error) {
      console.error('[OCR] Recognition failed:', error)
      throw new Error(`OCR recognition failed: ${error}`)
    }
  }

  /**
   * Perform OCR on an image URL or base64 string
   */
  async recognizeFromImage(
    imageSource: string | HTMLImageElement | HTMLCanvasElement,
    options: OCROptions = {},
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const language = Array.isArray(options.language) 
      ? options.language.join('+') 
      : options.language || 'eng'

    try {
      const worker = await this.getWorker(language)

      const result = await worker.recognize(imageSource, {
        logger: onProgress ? (m) => {
          onProgress({
            status: m.status,
            progress: m.progress || 0,
            message: m.userJobId || m.status
          })
        } : undefined
      })

      return this.processResult(result)

    } catch (error) {
      console.error('[OCR] Recognition failed:', error)
      throw new Error(`OCR recognition failed: ${error}`)
    }
  }

  /**
   * Process Tesseract result into our OCRResult format
   */
  private processResult(result: RecognizeResult): OCRResult {
    const { data } = result

    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        }
      })),
      lines: data.lines.map(line => ({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x0: line.bbox.x0,
          y0: line.bbox.y0,
          x1: line.bbox.x1,
          y1: line.bbox.y1
        },
        words: line.words.map(word => ({
          text: word.text,
          confidence: word.confidence
        }))
      })),
      paragraphs: data.paragraphs.map(paragraph => ({
        text: paragraph.text,
        confidence: paragraph.confidence,
        lines: paragraph.lines.map(line => ({
          text: line.text,
          confidence: line.confidence
        }))
      }))
    }
  }

  /**
   * Auto-detect language in an image
   */
  async detectLanguage(
    imageSource: File | string | HTMLImageElement,
    candidateLanguages: string[] = ['eng', 'vie', 'fra', 'deu', 'spa', 'jpn', 'chi_sim']
  ): Promise<{ language: string; confidence: number }[]> {
    try {
      const results: { language: string; confidence: number }[] = []

      // Test each candidate language and measure confidence
      for (const lang of candidateLanguages) {
        try {
          const worker = await this.getWorker(lang)
          const result = await worker.recognize(imageSource, {
            logger: () => {} // Silent for language detection
          })

          results.push({
            language: lang,
            confidence: result.data.confidence
          })
        } catch (error) {
          console.warn(`[OCR] Language detection failed for ${lang}:`, error)
          results.push({
            language: lang,
            confidence: 0
          })
        }
      }

      // Sort by confidence (highest first)
      return results.sort((a, b) => b.confidence - a.confidence)

    } catch (error) {
      console.error('[OCR] Language detection failed:', error)
      throw new Error(`Language detection failed: ${error}`)
    }
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): { code: string; name: string }[] {
    return [
      { code: 'afr', name: 'Afrikaans' },
      { code: 'amh', name: 'Amharic' },
      { code: 'ara', name: 'Arabic' },
      { code: 'asm', name: 'Assamese' },
      { code: 'aze', name: 'Azerbaijani' },
      { code: 'aze_cyrl', name: 'Azerbaijani - Cyrillic' },
      { code: 'bel', name: 'Belarusian' },
      { code: 'ben', name: 'Bengali' },
      { code: 'bod', name: 'Tibetan' },
      { code: 'bos', name: 'Bosnian' },
      { code: 'bre', name: 'Breton' },
      { code: 'bul', name: 'Bulgarian' },
      { code: 'cat', name: 'Catalan; Valencian' },
      { code: 'ceb', name: 'Cebuano' },
      { code: 'ces', name: 'Czech' },
      { code: 'chi_sim', name: 'Chinese - Simplified' },
      { code: 'chi_tra', name: 'Chinese - Traditional' },
      { code: 'chr', name: 'Cherokee' },
      { code: 'cos', name: 'Corsican' },
      { code: 'cym', name: 'Welsh' },
      { code: 'dan', name: 'Danish' },
      { code: 'deu', name: 'German' },
      { code: 'dzo', name: 'Dzongkha' },
      { code: 'ell', name: 'Greek, Modern' },
      { code: 'eng', name: 'English' },
      { code: 'enm', name: 'English, Middle' },
      { code: 'epo', name: 'Esperanto' },
      { code: 'est', name: 'Estonian' },
      { code: 'eus', name: 'Basque' },
      { code: 'fao', name: 'Faroese' },
      { code: 'fas', name: 'Persian' },
      { code: 'fil', name: 'Filipino' },
      { code: 'fin', name: 'Finnish' },
      { code: 'fra', name: 'French' },
      { code: 'frk', name: 'German - Fraktur' },
      { code: 'frm', name: 'French, Middle' },
      { code: 'fry', name: 'Western Frisian' },
      { code: 'gla', name: 'Scottish Gaelic' },
      { code: 'gle', name: 'Irish' },
      { code: 'glg', name: 'Galician' },
      { code: 'grc', name: 'Greek, Ancient' },
      { code: 'guj', name: 'Gujarati' },
      { code: 'hat', name: 'Haitian; Haitian Creole' },
      { code: 'heb', name: 'Hebrew' },
      { code: 'hin', name: 'Hindi' },
      { code: 'hrv', name: 'Croatian' },
      { code: 'hun', name: 'Hungarian' },
      { code: 'hye', name: 'Armenian' },
      { code: 'iku', name: 'Inuktitut' },
      { code: 'ind', name: 'Indonesian' },
      { code: 'isl', name: 'Icelandic' },
      { code: 'ita', name: 'Italian' },
      { code: 'ita_old', name: 'Italian - Old' },
      { code: 'jav', name: 'Javanese' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kan', name: 'Kannada' },
      { code: 'kat', name: 'Georgian' },
      { code: 'kat_old', name: 'Georgian - Old' },
      { code: 'kaz', name: 'Kazakh' },
      { code: 'khm', name: 'Central Khmer' },
      { code: 'kir', name: 'Kirghiz; Kyrgyz' },
      { code: 'kor', name: 'Korean' },
      { code: 'lao', name: 'Lao' },
      { code: 'lat', name: 'Latin' },
      { code: 'lav', name: 'Latvian' },
      { code: 'lit', name: 'Lithuanian' },
      { code: 'ltz', name: 'Luxembourgish' },
      { code: 'mal', name: 'Malayalam' },
      { code: 'mar', name: 'Marathi' },
      { code: 'mkd', name: 'Macedonian' },
      { code: 'mlt', name: 'Maltese' },
      { code: 'mon', name: 'Mongolian' },
      { code: 'mri', name: 'Maori' },
      { code: 'msa', name: 'Malay' },
      { code: 'mya', name: 'Burmese' },
      { code: 'nep', name: 'Nepali' },
      { code: 'nld', name: 'Dutch; Flemish' },
      { code: 'nor', name: 'Norwegian' },
      { code: 'oci', name: 'Occitan' },
      { code: 'ori', name: 'Oriya' },
      { code: 'pan', name: 'Panjabi; Punjabi' },
      { code: 'pol', name: 'Polish' },
      { code: 'por', name: 'Portuguese' },
      { code: 'pus', name: 'Pushto; Pashto' },
      { code: 'que', name: 'Quechua' },
      { code: 'ron', name: 'Romanian; Moldavian; Moldovan' },
      { code: 'rus', name: 'Russian' },
      { code: 'san', name: 'Sanskrit' },
      { code: 'sin', name: 'Sinhala; Sinhalese' },
      { code: 'slk', name: 'Slovak' },
      { code: 'slv', name: 'Slovenian' },
      { code: 'snd', name: 'Sindhi' },
      { code: 'spa', name: 'Spanish; Castilian' },
      { code: 'spa_old', name: 'Spanish; Castilian - Old' },
      { code: 'sqi', name: 'Albanian' },
      { code: 'srp', name: 'Serbian' },
      { code: 'srp_latn', name: 'Serbian - Latin' },
      { code: 'sun', name: 'Sundanese' },
      { code: 'swa', name: 'Swahili' },
      { code: 'swe', name: 'Swedish' },
      { code: 'syr', name: 'Syriac' },
      { code: 'tam', name: 'Tamil' },
      { code: 'tat', name: 'Tatar' },
      { code: 'tel', name: 'Telugu' },
      { code: 'tgk', name: 'Tajik' },
      { code: 'tha', name: 'Thai' },
      { code: 'tir', name: 'Tigrinya' },
      { code: 'ton', name: 'Tonga' },
      { code: 'tur', name: 'Turkish' },
      { code: 'uig', name: 'Uighur; Uyghur' },
      { code: 'ukr', name: 'Ukrainian' },
      { code: 'urd', name: 'Urdu' },
      { code: 'uzb', name: 'Uzbek' },
      { code: 'uzb_cyrl', name: 'Uzbek - Cyrillic' },
      { code: 'vie', name: 'Vietnamese' },
      { code: 'yid', name: 'Yiddish' },
      { code: 'yor', name: 'Yoruba' }
    ]
  }

  /**
   * Cleanup workers to free memory
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.workers.values()).map(worker => 
      worker.terminate().catch(err => 
        console.warn('[OCR] Worker cleanup error:', err)
      )
    )

    await Promise.all(cleanupPromises)
    this.workers.clear()
    this.workerPromises.clear()
  }

  /**
   * Cleanup a specific language worker
   */
  async cleanupWorker(language: string): Promise<void> {
    const worker = this.workers.get(language)
    if (worker) {
      await worker.terminate()
      this.workers.delete(language)
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService()

// Export utility functions
export const getLanguageFromCode = (code: string): string => {
  const languages = ocrService.getAvailableLanguages()
  const language = languages.find(lang => lang.code === code)
  return language?.name || code
}

export const getSupportedLanguageCodes = (): string[] => {
  return ocrService.getAvailableLanguages().map(lang => lang.code)
}

export const isLanguageSupported = (code: string): boolean => {
  return getSupportedLanguageCodes().includes(code)
}