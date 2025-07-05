/**
 * Unit tests for document rebuilder
 */

import { 
  detectDocumentFormat, 
  estimateDocumentRebuild, 
  rebuildDocument, 
  canRebuildDocument,
  createDocumentPreview,
  getSupportedFormats
} from '../document-rebuilder'

describe('Document Rebuilder', () => {
  
  describe('detectDocumentFormat', () => {
    test('should detect PDF format by header', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n')
      const format = detectDocumentFormat(pdfBuffer)
      expect(format).toBe('pdf')
    })

    test('should detect format by filename extension', () => {
      const buffer = Buffer.from('test content')
      
      expect(detectDocumentFormat(buffer, 'document.pdf')).toBe('pdf')
      expect(detectDocumentFormat(buffer, 'document.docx')).toBe('docx')
      expect(detectDocumentFormat(buffer, 'document.txt')).toBe('txt')
      expect(detectDocumentFormat(buffer, 'document.md')).toBe('md')
    })

    test('should default to txt for unknown formats', () => {
      const buffer = Buffer.from('unknown content')
      const format = detectDocumentFormat(buffer)
      expect(format).toBe('txt')
    })

    test('should handle DOCX ZIP signature', () => {
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04])
      const format = detectDocumentFormat(docxBuffer)
      expect(format).toBe('docx')
    })
  })

  describe('estimateDocumentRebuild', () => {
    test('should estimate PDF rebuild correctly', () => {
      const buffer = Buffer.alloc(150000) // 150KB - should be medium complexity
      const translatedText = 'This is translated text.'
      
      const estimate = estimateDocumentRebuild(buffer, translatedText, 'pdf')
      
      expect(estimate.estimatedTimeMinutes).toBeGreaterThan(0)
      expect(estimate.estimatedOutputSize).toBeGreaterThan(0)
      expect(estimate.estimatedComplexity).toBe('medium')
      expect(estimate.supportedFeatures).toContain('Text replacement')
      expect(estimate.limitations).toContain('Images are not preserved in MVP')
    })

    test('should estimate DOCX rebuild correctly', () => {
      const buffer = Buffer.alloc(60000) // 60KB - should be medium complexity
      const translatedText = 'Translated DOCX content.'
      
      const estimate = estimateDocumentRebuild(buffer, translatedText, 'docx')
      
      expect(estimate.estimatedTimeMinutes).toBeGreaterThan(0)
      expect(estimate.estimatedComplexity).toBe('medium')
      expect(estimate.supportedFeatures).toContain('Text replacement')
      expect(estimate.limitations).toContain('Tables not preserved in MVP')
    })

    test('should estimate text file rebuild correctly', () => {
      const buffer = Buffer.from('Simple text content')
      const translatedText = 'Translated text content.'
      
      const estimate = estimateDocumentRebuild(buffer, translatedText, 'txt')
      
      expect(estimate.estimatedTimeMinutes).toBe(0.1)
      expect(estimate.estimatedComplexity).toBe('simple')
      expect(estimate.limitations).toHaveLength(0)
    })
  })

  describe('rebuildDocument', () => {
    test('should rebuild PDF document successfully', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nSample PDF content')
      const translatedText = 'This is the translated content of the PDF document.'
      
      const result = await rebuildDocument(pdfBuffer, translatedText, { format: 'pdf' })
      
      expect(result.success).toBe(true)
      expect(result.outputFormat).toBe('pdf')
      expect(result.outputBuffer.length).toBeGreaterThan(0)
      expect(result.metadata.originalSize).toBe(pdfBuffer.length)
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0)
      expect(result.preview).toBeDefined()
    })

    test('should rebuild DOCX document successfully', async () => {
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP signature
      const translatedText = 'This is the translated DOCX content with multiple paragraphs.'
      
      const result = await rebuildDocument(docxBuffer, translatedText, { format: 'docx' })
      
      expect(result.success).toBe(true)
      expect(result.outputFormat).toBe('docx')
      expect(result.outputBuffer.length).toBeGreaterThan(0)
      expect(result.metadata.wordCount).toBeGreaterThan(0)
    })

    test('should rebuild text document successfully', async () => {
      const textBuffer = Buffer.from('Original text content')
      const translatedText = 'Translated text content'
      
      const result = await rebuildDocument(textBuffer, translatedText, { format: 'txt' })
      
      expect(result.success).toBe(true)
      expect(result.outputFormat).toBe('txt')
      expect(result.outputBuffer.toString()).toBe(translatedText)
      expect(result.preview).toContain(translatedText)
    })

    test('should rebuild markdown document with structure', async () => {
      const mdBuffer = Buffer.from('# Original\nContent here')
      const translatedText = 'Translated content here'
      
      const result = await rebuildDocument(mdBuffer, translatedText, { format: 'md' })
      
      expect(result.success).toBe(true)
      expect(result.outputFormat).toBe('md')
      expect(result.outputBuffer.toString()).toContain('# Translated Document')
      expect(result.outputBuffer.toString()).toContain(translatedText)
      expect(result.outputBuffer.toString()).toContain('*Translated using Prismy v2*')
    })

    test('should auto-detect format when not specified', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nContent')
      const translatedText = 'Translated content'
      
      const result = await rebuildDocument(pdfBuffer, translatedText) // No format specified
      
      expect(result.outputFormat).toBe('pdf')
    })

    test('should handle rebuild errors gracefully', async () => {
      // Create an invalid buffer that will cause PDF rebuild to fail
      const invalidBuffer = Buffer.from('Invalid PDF content that will fail processing')
      const translatedText = 'Some text'
      
      // Force an error by passing an invalid format
      const result = await rebuildDocument(invalidBuffer, translatedText, { format: 'unknown' as any })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.outputBuffer.length).toBe(0)
    })
  })

  describe('canRebuildDocument', () => {
    test('should validate document size limits', () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024) // 20MB - too large
      const result = canRebuildDocument(largeBuffer)
      
      expect(result.canRebuild).toBe(false)
      expect(result.reason).toContain('File too large')
    })

    test('should validate minimum file size', () => {
      const tinyBuffer = Buffer.alloc(5) // Too small
      const result = canRebuildDocument(tinyBuffer)
      
      expect(result.canRebuild).toBe(false)
      expect(result.reason).toContain('File too small')
    })

    test('should validate PDF format', () => {
      const invalidPdfBuffer = Buffer.from('Not a PDF - this is long enough')
      const result = canRebuildDocument(invalidPdfBuffer, 'pdf')
      
      expect(result.canRebuild).toBe(false)
      expect(result.reason).toContain('Invalid PDF format')
      expect(result.suggestedFormat).toBe('txt')
    })

    test('should allow valid documents', () => {
      const validBuffer = Buffer.from('%PDF-1.4\nValid PDF content')
      const result = canRebuildDocument(validBuffer, 'pdf')
      
      expect(result.canRebuild).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  describe('createDocumentPreview', () => {
    test('should create PDF preview', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nContent')
      const translatedText = 'This is translated PDF content with multiple sentences.'
      
      const preview = await createDocumentPreview(pdfBuffer, translatedText, 'pdf')
      
      expect(preview).toContain('PDF PREVIEW')
      expect(preview).toContain('Page 1')
    })

    test('should create DOCX preview', async () => {
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04])
      const translatedText = 'This is translated DOCX content.'
      
      const preview = await createDocumentPreview(docxBuffer, translatedText, 'docx')
      
      expect(preview).toContain('DOCX PREVIEW')
    })

    test('should create text preview', async () => {
      const textBuffer = Buffer.from('Original')
      const translatedText = 'This is a long translated text that should be truncated if it exceeds the preview limit of characters to ensure the preview remains manageable.'
      
      const preview = await createDocumentPreview(textBuffer, translatedText, 'txt')
      
      expect(preview).toContain('This is a long translated text')
    })

    test('should handle preview errors', async () => {
      const invalidBuffer = Buffer.alloc(0)
      const translatedText = 'Text'
      
      const preview = await createDocumentPreview(invalidBuffer, translatedText, 'unknown' as any)
      
      expect(preview).toContain('Preview not available')
    })
  })

  describe('getSupportedFormats', () => {
    test('should return all supported formats', () => {
      const formats = getSupportedFormats()
      
      expect(formats).toHaveProperty('pdf')
      expect(formats).toHaveProperty('docx')
      expect(formats).toHaveProperty('txt')
      expect(formats).toHaveProperty('md')
      
      expect(formats.pdf.name).toBe('PDF Document')
      expect(formats.pdf.extensions).toContain('.pdf')
      expect(formats.pdf.capabilities).toContain('Text replacement')
      expect(formats.pdf.limitations).toContain('No image preservation (MVP)')
    })

    test('should provide comprehensive format information', () => {
      const formats = getSupportedFormats()
      
      Object.values(formats).forEach(format => {
        expect(format.name).toBeDefined()
        expect(Array.isArray(format.extensions)).toBe(true)
        expect(Array.isArray(format.capabilities)).toBe(true)
        expect(Array.isArray(format.limitations)).toBe(true)
      })
    })
  })

  describe('MVP integration scenarios', () => {
    test('should handle typical business document workflow', async () => {
      // Simulate a typical business PDF
      const businessPdf = Buffer.from('%PDF-1.4\nBusiness Report Content')
      const translatedContent = `Translated Business Report
      
      Executive Summary
      This document contains the translated version of the quarterly business report.
      
      Key Findings
      - Revenue increased by 15%
      - Customer satisfaction improved
      - Market expansion successful`
      
      // Test estimation
      const estimate = estimateDocumentRebuild(businessPdf, translatedContent, 'pdf')
      expect(estimate.estimatedComplexity).toBe('simple')
      
      // Test validation
      const validation = canRebuildDocument(businessPdf, 'pdf')
      expect(validation.canRebuild).toBe(true)
      
      // Test rebuild
      const result = await rebuildDocument(businessPdf, translatedContent, { 
        preserveFormatting: true,
        fontSize: 12
      })
      
      expect(result.success).toBe(true)
      expect(result.metadata.wordCount).toBeGreaterThan(10)
      expect(result.preview).toContain('Business Report')
    })

    test('should handle performance requirements', async () => {
      const testDoc = Buffer.from('Test document content')
      const translatedText = 'Translated test content'
      
      const startTime = Date.now()
      const result = await rebuildDocument(testDoc, translatedText, { format: 'txt' })
      const processingTime = Date.now() - startTime
      
      // Should complete quickly for simple formats
      expect(processingTime).toBeLessThan(1000) // Under 1 second
      expect(result.success).toBe(true)
      expect(result.metadata.processingTimeMs).toBeLessThan(1000)
    })
  })
})