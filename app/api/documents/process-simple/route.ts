import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  // Validate buffer first
  if (!buffer || buffer.length === 0) {
    throw new Error('INVALID_PDF_FORMAT')
  }

  // Check PDF signature
  const pdfSignature = buffer.slice(0, 4).toString('latin1')
  if (pdfSignature !== '%PDF') {
    throw new Error('INVALID_PDF_FORMAT')
  }

  console.log(
    '🔍 PDF processing with fallback chain, buffer size:',
    buffer.length
  )

  // Fallback chain: Try multiple libraries
  const errors: string[] = []

  // Method 1: Try unpdf (modern serverless-optimized)
  try {
    console.log('📖 Trying Method 1: unpdf')
    const { extractText } = await import('unpdf')

    const result = await extractText(buffer)

    if (result?.text && result.text.trim().length > 0) {
      console.log('✅ unpdf succeeded')
      return {
        text: result.text,
        pageCount: result.totalPages || 1,
      }
    }

    throw new Error('No text extracted')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errors.push(`unpdf: ${errorMsg}`)
    console.log('❌ unpdf failed:', errorMsg)
  }

  // Method 2: Try pdf-parse (traditional reliable library)
  try {
    console.log('📖 Trying Method 2: pdf-parse')
    const pdf = (await import('pdf-parse')).default

    const data = await pdf(buffer)

    if (data?.text && data.text.trim().length > 0) {
      console.log('✅ pdf-parse succeeded')
      return {
        text: data.text,
        pageCount: data.numpages || 1,
      }
    }

    throw new Error('No text extracted')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errors.push(`pdf-parse: ${errorMsg}`)
    console.log('❌ pdf-parse failed:', errorMsg)
  }

  // Method 3: Try pdf2json (JSON-based extraction)
  try {
    console.log('📖 Trying Method 3: pdf2json')
    const PDFParser = (await import('pdf2json')).default

    const result = await new Promise<{ text: string; pageCount: number }>(
      (resolve, reject) => {
        const pdfParser = new (PDFParser as any)(null, 1)

        pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData))

        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            let text = ''
            let pageCount = 0

            if (pdfData?.Pages) {
              pageCount = pdfData.Pages.length

              for (const page of pdfData.Pages) {
                if (page.Texts) {
                  for (const textItem of page.Texts) {
                    if (textItem.R) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          text += decodeURIComponent(run.T) + ' '
                        }
                      }
                    }
                  }
                }
                text += '\n'
              }
            }

            text = text.trim()
            if (text.length > 0) {
              resolve({ text, pageCount })
            } else {
              reject(new Error('No text extracted'))
            }
          } catch (err) {
            reject(err)
          }
        })

        // Set timeout for parsing
        setTimeout(() => reject(new Error('Parsing timeout')), 30000)

        pdfParser.parseBuffer(buffer)
      }
    )

    if (result.text && result.text.trim().length > 0) {
      console.log('✅ pdf2json succeeded')
      return result
    }

    throw new Error('No text extracted')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errors.push(`pdf2json: ${errorMsg}`)
    console.log('❌ pdf2json failed:', errorMsg)
  }

  // All methods failed
  console.error('🚨 All PDF extraction methods failed:', errors)

  // Analyze errors to provide specific feedback
  const allErrors = errors.join('; ')
  if (
    allErrors.includes('password') ||
    allErrors.includes('encrypted') ||
    allErrors.includes('decrypt')
  ) {
    throw new Error('PDF_PASSWORD_PROTECTED')
  } else if (
    allErrors.includes('corrupt') ||
    allErrors.includes('invalid') ||
    allErrors.includes('damaged')
  ) {
    throw new Error('PDF_CORRUPTED')
  } else {
    throw new Error('PDF_PROCESSING_FAILED')
  }
}

async function extractTextFromDOCX(
  buffer: Buffer
): Promise<{ text: string; html?: string }> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid or empty DOCX buffer')
    }

    // Check DOCX signature (ZIP file signature)
    const zipSignature = buffer.slice(0, 4)
    const isZip = zipSignature[0] === 0x50 && zipSignature[1] === 0x4b
    if (!isZip) {
      throw new Error('Invalid DOCX file: Not a valid ZIP archive')
    }

    const mammoth = await import('mammoth')

    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ])

    // Validate extraction results
    if (!textResult.value && !htmlResult.value) {
      throw new Error(
        'DOCX appears to be empty or contains no extractable content'
      )
    }

    const text = textResult.value.trim()

    if (text.length === 0) {
      throw new Error('DOCX contains no readable text')
    }

    return {
      text,
      html: htmlResult.value,
    }
  } catch (error) {
    console.error('DOCX parsing error:', error)

    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ZIP') || error.message.includes('archive')) {
        throw new Error('Invalid DOCX file format')
      } else if (error.message.includes('empty')) {
        throw new Error('DOCX file is empty or contains no text')
      } else if (
        error.message.includes('password') ||
        error.message.includes('protected')
      ) {
        throw new Error('DOCX file is password-protected')
      }
    }

    throw new Error(
      'Failed to parse DOCX file. Please ensure it is a valid Word document.'
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to process documents',
        },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Enhanced file validation
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Unsupported file type. Please upload TXT, PDF, or DOCX files.',
          supportedTypes: allowedTypes,
        },
        { status: 400 }
      )
    }

    // Enterprise-scale file size handling with intelligent routing
    const smallFileLimit = 50 * 1024 * 1024 // 50MB - Direct processing
    const enterpriseFileLimit = 1024 * 1024 * 1024 // 1GB - Enterprise processing

    // Route enterprise-scale files to specialized processing
    if (file.size > enterpriseFileLimit) {
      return NextResponse.json(
        {
          error: 'Enterprise file processing required',
          message:
            'Files larger than 1GB require enterprise processing. Please contact support for enterprise-scale document processing.',
          fileSize: file.size,
          enterpriseRequired: true,
          supportContact: 'enterprise@prismy.in',
        },
        { status: 413 }
      )
    }

    // Large files (50MB - 1GB) get chunked processing notification
    const isLargeFile = file.size > smallFileLimit
    if (isLargeFile) {
      // TODO: Implement chunked processing for large files
      console.log(
        `🚀 Large file processing initiated: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      )
    }

    // Convert to buffer with error handling
    let buffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)

      if (buffer.length === 0) {
        return NextResponse.json({ error: 'File is empty' }, { status: 400 })
      }
    } catch (error) {
      console.error('Buffer conversion error:', error)
      return NextResponse.json(
        { error: 'Failed to read file data' },
        { status: 400 }
      )
    }

    let extractedText = ''
    const formatData: any = {}

    // Extract text based on file type
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    } else if (file.type === 'application/pdf') {
      const result = await extractTextFromPDF(buffer)
      extractedText = result.text
      formatData.pageCount = result.pageCount
    } else if (
      file.type.includes('wordprocessingml') ||
      file.type.includes('msword')
    ) {
      const result = await extractTextFromDOCX(buffer)
      extractedText = result.text
      formatData.html = result.html
    }

    // Basic cleanup
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!extractedText || extractedText.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from document' },
        { status: 400 }
      )
    }

    // Create a simple document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Enhanced response with enterprise processing information
    return NextResponse.json({
      success: true,
      documentId,
      extractedText,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileSizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
        textLength: extractedText.length,
        wordCount: extractedText.split(/\s+/).length,
        processingMode: isLargeFile ? 'large-file' : 'standard',
        isEnterpriseScale: file.size > smallFileLimit,
        processingCapability: {
          current: 'up-to-1gb',
          enterprise: 'unlimited',
        },
        ...formatData,
      },
      processing: {
        isLargeFile,
        fileCategory:
          file.size > enterpriseFileLimit
            ? 'enterprise'
            : file.size > smallFileLimit
              ? 'large'
              : 'standard',
        recommendedProcessing:
          file.size > smallFileLimit ? 'chunked' : 'direct',
      },
    })
  } catch (error) {
    console.error('Document processing error:', error)

    // Enhanced error handling with specific messages and debugging info
    let errorMessage = 'Document processing failed'
    let errorCode = 'PROCESSING_FAILED'
    let statusCode = 500

    if (error instanceof Error) {
      // Authentication errors
      if (
        error.message.includes('Authentication') ||
        error.message.includes('Unauthorized')
      ) {
        errorMessage =
          'Authentication required. Please sign in to process documents.'
        errorCode = 'AUTH_REQUIRED'
        statusCode = 401
      }
      // PDF-specific errors (using new error codes)
      else if (error.message.includes('INVALID_PDF_FORMAT')) {
        errorMessage =
          'Invalid PDF file format. Please ensure you are uploading a valid PDF.'
        errorCode = 'INVALID_PDF_FORMAT'
        statusCode = 400
      } else if (error.message.includes('PDF_NO_TEXT')) {
        errorMessage =
          'PDF file contains no extractable text. It may be image-based or corrupted.'
        errorCode = 'PDF_NO_TEXT'
        statusCode = 400
      } else if (error.message.includes('PDF_PASSWORD_PROTECTED')) {
        errorMessage =
          'PDF file is password-protected. Please provide an unprotected PDF.'
        errorCode = 'PDF_PROTECTED'
        statusCode = 400
      } else if (error.message.includes('PDF_CORRUPTED')) {
        errorMessage =
          'PDF file appears to be corrupted or damaged. Please try a different file.'
        errorCode = 'PDF_CORRUPTED'
        statusCode = 400
      } else if (error.message.includes('PDF_PROCESSING_FAILED')) {
        errorMessage =
          'Unable to process PDF file. This may be due to an unsupported PDF format or technical issue.'
        errorCode = 'PDF_PROCESSING_FAILED'
        statusCode = 500
      }
      // Legacy PDF error handling (fallback)
      else if (error.message.includes('PDF') || error.message.includes('pdf')) {
        errorMessage =
          'Failed to process PDF file. Please try a different file or contact support.'
        errorCode = 'PDF_UNKNOWN_ERROR'
        statusCode = 500
      }
      // DOCX-specific errors
      else if (
        error.message.includes('DOCX') ||
        error.message.includes('docx')
      ) {
        if (
          error.message.includes('ZIP') ||
          error.message.includes('archive')
        ) {
          errorMessage = 'Invalid DOCX file format. The file may be corrupted.'
          errorCode = 'INVALID_DOCX_FORMAT'
        } else if (
          error.message.includes('empty') ||
          error.message.includes('no text')
        ) {
          errorMessage = 'DOCX file contains no readable text.'
          errorCode = 'DOCX_NO_TEXT'
        } else if (
          error.message.includes('password') ||
          error.message.includes('protected')
        ) {
          errorMessage =
            'DOCX file is password-protected. Please provide an unprotected document.'
          errorCode = 'DOCX_PROTECTED'
        } else {
          errorMessage =
            'Failed to process DOCX file. Please try a different file.'
          errorCode = 'DOCX_PROCESSING_FAILED'
        }
        statusCode = 400
      }
      // File size or validation errors
      else if (
        error.message.includes('too large') ||
        error.message.includes('size')
      ) {
        errorMessage = error.message
        errorCode = 'FILE_TOO_LARGE'
        statusCode = 400
      }
      // General errors
      else {
        errorMessage = error.message
      }
    }

    // Log detailed error information for debugging
    console.error('📋 Document processing failed:', {
      errorMessage,
      errorCode,
      originalError: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      requestId: Date.now(),
      timestamp: new Date().toISOString(),
    })

    // Add debugging info in development/testing
    const debugInfo =
      process.env.NODE_ENV === 'development' ||
      process.env.VERCEL_ENV === 'preview'
        ? {
            originalError:
              error instanceof Error ? error.message : String(error),
            requestId: Date.now(),
          }
        : {}

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        ...debugInfo,
      },
      { status: statusCode }
    )
  }
}
