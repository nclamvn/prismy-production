// Translation Worker - Mock Implementation with 10s Response Time
// This simulates a real translation service with realistic processing time

export interface TranslationJob {
  id: string
  documentId: string
  userId: string
  sourceLanguage: string
  targetLanguage: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
}

export interface TranslationResult {
  success: boolean
  translatedText?: string
  resultPath?: string
  error?: string
}

export class TranslationWorker {
  private static readonly MOCK_PROCESSING_TIME = 10000 // 10 seconds
  private static readonly PROGRESS_INTERVAL = 500 // Update every 500ms

  static async startTranslation(
    documentId: string,
    sourceLanguage: string,
    targetLanguage: string,
    onProgress?: (progress: number) => void
  ): Promise<TranslationResult> {
    try {
      console.log(`Starting translation: ${sourceLanguage} → ${targetLanguage}`)
      
      // Simulate progress updates
      let progress = 0
      const progressIncrement = 100 / (this.MOCK_PROCESSING_TIME / this.PROGRESS_INTERVAL)
      
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + progressIncrement, 95) // Cap at 95% until completion
        onProgress?.(Math.round(progress))
      }, this.PROGRESS_INTERVAL)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, this.MOCK_PROCESSING_TIME))

      // Clear progress interval
      clearInterval(progressInterval)
      onProgress?.(100)

      // Generate mock translated content
      const mockTranslation = this.generateMockTranslation(targetLanguage)
      
      // Simulate file path where translated document would be stored
      const resultPath = `translations/${documentId}_${targetLanguage}_${Date.now()}.txt`

      console.log(`Translation completed: ${resultPath}`)

      return {
        success: true,
        translatedText: mockTranslation,
        resultPath
      }
    } catch (error) {
      console.error('Translation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      }
    }
  }

  static async getJobStatus(jobId: string): Promise<TranslationJob | null> {
    // In a real implementation, this would query the database
    // For now, return mock data
    return {
      id: jobId,
      documentId: 'mock-doc-id',
      userId: 'mock-user-id',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      status: 'processing',
      progress: 50,
      startedAt: new Date()
    }
  }

  static getSupportedLanguages(): { code: string; name: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸' },
      { code: 'fr', name: 'French', flag: '🇫🇷' },
      { code: 'de', name: 'German', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺' },
      { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', flag: '🇰🇷' },
      { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
      { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
      { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
      { code: 'th', name: 'Thai', flag: '🇹🇭' }
    ]
  }

  private static generateMockTranslation(targetLanguage: string): string {
    const mockTranslations: Record<string, string> = {
      vi: `Đây là một bản dịch mô phỏng sang tiếng Việt.
      
Hệ thống dịch thuật Prismy v2 đã xử lý tài liệu này và tạo ra nội dung dịch chất lượng cao.

Các tính năng chính:
• Dịch thuật tự động với AI
• Hỗ trợ nhiều định dạng file
• Giao diện hiện đại và thân thiện
• Xử lý file lớn đến 1GB

Thời gian xử lý: ~10 giây
Trạng thái: Hoàn thành`,

      es: `Esta es una traducción simulada al español.
      
El sistema de traducción Prismy v2 ha procesado este documento y generado contenido traducido de alta calidad.

Características principales:
• Traducción automática con IA
• Soporte para múltiples formatos de archivo
• Interfaz moderna y amigable
• Procesamiento de archivos grandes hasta 1GB

Tiempo de procesamiento: ~10 segundos
Estado: Completado`,

      fr: `Ceci est une traduction simulée en français.
      
Le système de traduction Prismy v2 a traité ce document et généré du contenu traduit de haute qualité.

Fonctionnalités principales:
• Traduction automatique avec IA
• Support de multiples formats de fichiers
• Interface moderne et conviviale
• Traitement de gros fichiers jusqu'à 1GB

Temps de traitement: ~10 secondes
Statut: Terminé`,

      de: `Dies ist eine simulierte Übersetzung ins Deutsche.
      
Das Prismy v2 Übersetzungssystem hat dieses Dokument verarbeitet und hochwertigen übersetzten Inhalt erstellt.

Hauptfunktionen:
• Automatische Übersetzung mit KI
• Unterstützung mehrerer Dateiformate
• Moderne und benutzerfreundliche Oberfläche
• Verarbeitung großer Dateien bis zu 1GB

Verarbeitungszeit: ~10 Sekunden
Status: Abgeschlossen`,

      default: `This is a mock translation to ${targetLanguage}.
      
The Prismy v2 translation system has processed this document and generated high-quality translated content.

Key features:
• Automatic translation with AI
• Support for multiple file formats
• Modern and user-friendly interface
• Large file processing up to 1GB

Processing time: ~10 seconds
Status: Completed`
    }

    return mockTranslations[targetLanguage] || mockTranslations.default
  }

  static estimateProcessingTime(fileSize: number): number {
    // Mock estimation: 1 second per MB + base 5 seconds
    const fileSizeMB = fileSize / (1024 * 1024)
    return Math.max(5, Math.round(fileSizeMB + 5))
  }

  static async validateTranslationRequest(
    documentId: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Basic validation
    if (!documentId) {
      return { valid: false, error: 'Document ID is required' }
    }

    if (sourceLanguage === targetLanguage) {
      return { valid: false, error: 'Source and target languages must be different' }
    }

    const supportedLangs = this.getSupportedLanguages().map(l => l.code)
    if (!supportedLangs.includes(targetLanguage)) {
      return { valid: false, error: `Target language '${targetLanguage}' is not supported` }
    }

    if (sourceLanguage !== 'auto' && !supportedLangs.includes(sourceLanguage)) {
      return { valid: false, error: `Source language '${sourceLanguage}' is not supported` }
    }

    return { valid: true }
  }
}