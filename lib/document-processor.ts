export interface ProcessedDocument {
  id: string
  fileName: string
  fileType: string
  originalText: string
  chunks: DocumentChunk[]
  metadata: DocumentMetadata
  createdAt: Date
}

export interface DocumentChunk {
  id: string
  text: string
  startIndex: number
  endIndex: number
  wordCount: number
}

export interface DocumentMetadata {
  pageCount?: number
  wordCount: number
  characterCount: number
  language?: string
  encoding?: string
}

export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 5000 // characters per chunk
  private static readonly OVERLAP_SIZE = 200 // overlap between chunks

  static async processFile(file: File): Promise<ProcessedDocument> {
    const fileType = this.getFileType(file)
    let text = ''

    switch (fileType) {
      case 'txt':
        text = await this.processTxtFile(file)
        break
      case 'pdf':
        text = await this.processPdfFile(file)
        break
      case 'docx':
      case 'doc':
        text = await this.processDocxFile(file)
        break
      case 'csv':
        text = await this.processCsvFile(file)
        break
      case 'xlsx':
      case 'xls':
        text = await this.processExcelFile(file)
        break
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'tiff':
      case 'webp':
        text = await this.processImageFile(file)
        break
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }

    const chunks = this.createChunks(text)
    const metadata = this.extractMetadata(text, chunks)

    return {
      id: this.generateId(),
      fileName: file.name,
      fileType,
      originalText: text,
      chunks,
      metadata,
      createdAt: new Date(),
    }
  }

  private static getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const mimeTypeMap: Record<string, string> = {
      'text/plain': 'txt',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/msword': 'doc',
      'text/csv': 'csv',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/webp': 'webp',
    }

    return mimeTypeMap[file.type] || extension
  }

  private static async processTxtFile(file: File): Promise<string> {
    return await file.text()
  }

  private static async processPdfFile(file: File): Promise<string> {
    try {
      // Use OCR service for PDF processing
      const { ocrService } = await import('./ocr/ocr-service')

      // Convert PDF to image and perform OCR
      // Note: In a real implementation, you'd want to render PDF pages to canvas first
      const result = await ocrService.processImage(file, {
        languages: ['en', 'vi'], // Support both English and Vietnamese
        enableDocumentTextDetection: true,
        confidence: 0.6,
      })

      if (!result.text || result.text.trim().length === 0) {
        return `[No text detected in PDF: ${file.name}]`
      }

      return result.text
    } catch (error) {
      console.error('[Document Processor] PDF processing failed:', error)
      return `[PDF processing failed for: ${file.name}. Error: ${error}]`
    }
  }

  private static async processDocxFile(file: File): Promise<string> {
    try {
      // Use mammoth.js to extract text from DOCX files
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()

      const result = await mammoth.extractRawText({ arrayBuffer })

      if (!result.value || result.value.trim().length === 0) {
        return `[No text content found in DOCX: ${file.name}]`
      }

      return result.value
    } catch (error) {
      console.error('[Document Processor] DOCX processing failed:', error)
      return `[DOCX processing failed for: ${file.name}. Error: ${error}]`
    }
  }

  private static async processCsvFile(file: File): Promise<string> {
    const text = await file.text()
    // Convert CSV to readable text format
    const lines = text.split('\n')
    return lines.map(line => line.split(',').join(' | ')).join('\n')
  }

  private static async processExcelFile(file: File): Promise<string> {
    try {
      // Use xlsx library to process Excel files
      const XLSX = await import('xlsx')
      const arrayBuffer = await file.arrayBuffer()

      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      let extractedText = ''

      // Process each worksheet
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        })

        if (index > 0) extractedText += '\n\n'
        extractedText += `=== ${sheetName} ===\n`

        // Convert each row to text
        jsonData.forEach((row: any[]) => {
          if (Array.isArray(row) && row.some(cell => cell !== '')) {
            extractedText +=
              row.map(cell => String(cell || '')).join(' | ') + '\n'
          }
        })
      })

      if (!extractedText.trim()) {
        return `[No content found in Excel file: ${file.name}]`
      }

      return extractedText.trim()
    } catch (error) {
      console.error('[Document Processor] Excel processing failed:', error)
      return `[Excel processing failed for: ${file.name}. Error: ${error}]`
    }
  }

  private static async processImageFile(file: File): Promise<string> {
    try {
      const { ocrService } = await import('./ocr/ocr-service')

      // Perform OCR on the image using the OCR service
      const result = await ocrService.processImage(file, {
        languages: ['en', 'vi'], // Support both English and Vietnamese
        enableTextDetection: true,
        enableHandwritingDetection: true,
        confidence: 0.6,
      })

      if (!result.text || result.text.trim().length === 0) {
        return `[No text detected in image: ${file.name}]`
      }

      return result.text
    } catch (error) {
      console.error('[Document Processor] Image OCR failed:', error)
      return `[OCR processing failed for image: ${file.name}. Error: ${error}]`
    }
  }

  private static createChunks(text: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const words = text.split(/\s+/)
    let currentChunk = ''
    let currentIndex = 0
    let chunkStartIndex = 0

    words.forEach((word, index) => {
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word

      if (potentialChunk.length > this.CHUNK_SIZE && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          id: this.generateId(),
          text: currentChunk,
          startIndex: chunkStartIndex,
          endIndex: currentIndex,
          wordCount: currentChunk.split(/\s+/).filter(w => w.length > 0).length,
        })

        // Start new chunk with overlap
        const overlapWords = currentChunk.split(/\s+/).slice(-20) // Last 20 words
        currentChunk = [...overlapWords, word].join(' ')
        chunkStartIndex = currentIndex - overlapWords.join(' ').length
      } else {
        currentChunk = potentialChunk
      }

      currentIndex += word.length + 1
    })

    // Add the last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        id: this.generateId(),
        text: currentChunk,
        startIndex: chunkStartIndex,
        endIndex: text.length,
        wordCount: currentChunk.split(/\s+/).filter(w => w.length > 0).length,
      })
    }

    return chunks
  }

  private static extractMetadata(
    text: string,
    chunks: DocumentChunk[]
  ): DocumentMetadata {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const totalWordCount = words.length
    const characterCount = text.length

    // Simple language detection (in production, use a proper library)
    const hasVietnamese =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
        text
      )
    const language = hasVietnamese ? 'vi' : 'en'

    return {
      wordCount: totalWordCount,
      characterCount,
      language,
      encoding: 'UTF-8',
    }
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  static estimateTranslationTime(document: ProcessedDocument): number {
    // Estimate based on word count (roughly 100 words per second)
    const wordsPerSecond = 100
    return Math.ceil(document.metadata.wordCount / wordsPerSecond)
  }

  static async exportTranslatedDocument(
    originalDocument: ProcessedDocument,
    translatedChunks: Map<string, string>,
    targetLanguage: string,
    outputFormat?: string
  ): Promise<Blob> {
    let translatedText = originalDocument.originalText

    // Replace each chunk with its translation
    originalDocument.chunks.forEach(chunk => {
      const translation = translatedChunks.get(chunk.id)
      if (translation) {
        translatedText = translatedText.replace(chunk.text, translation)
      }
    })

    // Determine output format (use original format if not specified)
    const exportFormat = outputFormat || originalDocument.fileType

    switch (exportFormat) {
      case 'txt':
        return new Blob([translatedText], { type: 'text/plain;charset=utf-8' })

      case 'csv':
        return new Blob([translatedText], { type: 'text/csv;charset=utf-8' })

      case 'docx':
        return await this.exportAsDocx(
          translatedText,
          originalDocument.fileName
        )

      case 'xlsx':
        return await this.exportAsExcel(
          translatedText,
          originalDocument.fileName
        )

      case 'pdf':
        // For now, return as text. In production, use jsPDF or similar
        return new Blob([translatedText], { type: 'text/plain;charset=utf-8' })

      default:
        // Default to text format
        return new Blob([translatedText], { type: 'text/plain;charset=utf-8' })
    }
  }

  private static async exportAsDocx(
    translatedText: string,
    originalFileName: string
  ): Promise<Blob> {
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx')

      // Split text into paragraphs
      const paragraphs = translatedText.split('\n').map(
        paragraph =>
          new Paragraph({
            children: [new TextRun(paragraph)],
          })
      )

      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      })

      const buffer = await Packer.toBuffer(doc)
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    } catch (error) {
      console.error('[Document Processor] DOCX export failed:', error)
      // Fallback to text
      return new Blob([translatedText], { type: 'text/plain;charset=utf-8' })
    }
  }

  private static async exportAsExcel(
    translatedText: string,
    originalFileName: string
  ): Promise<Blob> {
    try {
      const XLSX = await import('xlsx')

      // Convert text to rows (split by lines)
      const rows = translatedText.split('\n').map(line => [line])

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Translated')

      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    } catch (error) {
      console.error('[Document Processor] Excel export failed:', error)
      // Fallback to text
      return new Blob([translatedText], { type: 'text/plain;charset=utf-8' })
    }
  }
}
