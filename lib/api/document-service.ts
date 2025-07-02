import { createServerClient, createServiceClient } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase-client'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

interface DocumentProcessingResult {
  documentId: string
  extractedText: string
  metadata: {
    pageCount?: number
    wordCount: number
    characterCount: number
    language?: string
    fileType: string
    fileSize: number
  }
}

interface DocumentTranslationResult {
  documentId: string
  translatedContent: string
  metadata: {
    processingTime: number
    qualityScore: number
    characterCount: number
  }
}

export class DocumentService {
  private client: ReturnType<typeof createServerClient> | null = null
  private serviceClient: ReturnType<typeof createServiceClient>

  constructor(cookieStore?: () => any) {
    if (cookieStore) {
      this.client = createServerClient(cookieStore)
    }
    this.serviceClient = createServiceClient()
  }

  async processDocument(
    file: File,
    userId: string,
    sourceLanguage = 'auto'
  ): Promise<DocumentProcessingResult> {
    try {
      // Extract text based on file type
      let extractedText = ''
      const metadata: any = {
        fileType: file.type,
        fileSize: file.size,
        wordCount: 0,
        characterCount: 0,
      }

      switch (file.type) {
        case 'text/plain':
          extractedText = await this.extractTextFromTxt(file)
          break
        case 'application/pdf':
          const pdfResult = await this.extractTextFromPdf(file)
          extractedText = pdfResult.text
          metadata.pageCount = pdfResult.pageCount
          break
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          extractedText = await this.extractTextFromDocx(file)
          break
        default:
          throw new Error(`Unsupported file type: ${file.type}`)
      }

      // Calculate text statistics
      metadata.characterCount = extractedText.length
      metadata.wordCount = extractedText
        .split(/\s+/)
        .filter(word => word.length > 0).length

      // Detect language if not specified
      if (sourceLanguage === 'auto') {
        metadata.language = await this.detectLanguage(extractedText)
      } else {
        metadata.language = sourceLanguage
      }

      // Save document to database
      const document: DocumentInsert = {
        user_id: userId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        original_content: extractedText,
        source_language: metadata.language,
        processing_status: 'completed',
      }

      const savedDocument = await this.saveDocument(document)

      return {
        documentId: savedDocument.id,
        extractedText,
        metadata,
      }
    } catch (error) {
      console.error('Document processing error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Document processing failed'
      )
    }
  }

  private async extractTextFromTxt(file: File): Promise<string> {
    return await file.text()
  }

  private async extractTextFromPdf(
    file: File
  ): Promise<{ text: string; pageCount: number }> {
    // For PDF processing, we'll use a simple fallback
    // In production, you'd want to use a proper PDF parser like pdf-parse
    try {
      const arrayBuffer = await file.arrayBuffer()

      // Simple PDF text extraction (this is a placeholder)
      // You should implement proper PDF parsing here
      const text = 'PDF text extraction requires proper implementation'

      return {
        text,
        pageCount: 1,
      }
    } catch (error) {
      throw new Error('PDF processing failed')
    }
  }

  private async extractTextFromDocx(file: File): Promise<string> {
    // For DOCX processing, we'll use a simple fallback
    // In production, you'd want to use a proper DOCX parser like mammoth
    try {
      const arrayBuffer = await file.arrayBuffer()

      // Simple DOCX text extraction (this is a placeholder)
      // You should implement proper DOCX parsing here
      const text = 'DOCX text extraction requires proper implementation'

      return text
    } catch (error) {
      throw new Error('DOCX processing failed')
    }
  }

  private async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text.slice(0, 1000), // Use first 1000 characters for detection
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Language detection failed')
      }

      const data = await response.json()
      return data.data?.detections?.[0]?.[0]?.language || 'en'
    } catch (error) {
      console.warn('Language detection failed, defaulting to English:', error)
      return 'en'
    }
  }

  async translateDocument(
    documentId: string,
    targetLanguage: string,
    userId: string
  ): Promise<DocumentTranslationResult> {
    const startTime = Date.now()

    try {
      // Get document from database
      const document = await this.getDocument(documentId, userId)

      if (!document) {
        throw new Error('Document not found')
      }

      // Update status to processing
      await this.updateDocument(documentId, userId, {
        processing_status: 'processing',
        target_language: targetLanguage,
      })

      // Translate content using Google Translate
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: document.original_content,
            source: document.source_language,
            target: targetLanguage,
            format: 'text',
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      const translatedContent = data.data?.translations?.[0]?.translatedText

      if (!translatedContent) {
        throw new Error('Invalid translation response')
      }

      // Update document with translation
      await this.updateDocument(documentId, userId, {
        translated_content: translatedContent,
        processing_status: 'completed',
      })

      const processingTime = Date.now() - startTime

      return {
        documentId,
        translatedContent,
        metadata: {
          processingTime,
          qualityScore: 85, // Default quality score
          characterCount: translatedContent.length,
        },
      }
    } catch (error) {
      // Update status to failed
      await this.updateDocument(documentId, userId, {
        processing_status: 'failed',
      })

      console.error('Document translation error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Document translation failed'
      )
    }
  }

  async saveDocument(document: DocumentInsert): Promise<Document> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { data, error } = await this.client
      .from('documents')
      .insert(document)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async getDocument(
    documentId: string,
    userId: string
  ): Promise<Document | null> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(error.message)
    }

    return data
  }

  async updateDocument(
    documentId: string,
    userId: string,
    updates: DocumentUpdate
  ): Promise<Document> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { data, error } = await this.client
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async getUserDocuments(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<Document[]> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Database client not available')
    }

    const { error } = await this.client
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }

  async getDocumentStats(userId: string): Promise<{
    totalDocuments: number
    totalSize: number
    processingStatus: Record<string, number>
    languageBreakdown: Record<string, number>
  }> {
    if (!this.serviceClient) {
      throw new Error('Service client not available')
    }

    const { data, error } = await this.serviceClient
      .from('documents')
      .select('file_size, processing_status, source_language, target_language')
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    const totalDocuments = data.length
    const totalSize = data.reduce((sum, doc) => sum + doc.file_size, 0)

    const processingStatus: Record<string, number> = {}
    const languageBreakdown: Record<string, number> = {}

    data.forEach(doc => {
      processingStatus[doc.processing_status] =
        (processingStatus[doc.processing_status] || 0) + 1
      languageBreakdown[doc.source_language] =
        (languageBreakdown[doc.source_language] || 0) + 1
    })

    return {
      totalDocuments,
      totalSize,
      processingStatus,
      languageBreakdown,
    }
  }
}

// Factory function for creating document service instances
export const createDocumentService = (cookieStore?: () => any) => {
  return new DocumentService(cookieStore)
}
