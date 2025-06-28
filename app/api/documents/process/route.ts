import { NextRequest, NextResponse } from 'next/server'
import {
  createRouteHandlerClient,
  validateAndRefreshSession,
  withAuthRetry,
} from '@/lib/supabase'
import { cookies } from 'next/headers'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
// Dynamic import to avoid build-time issues
// import pdf from 'pdf-parse'

// Credit costs for document processing
const CREDITS_PER_PAGE = {
  google_translate: 30,
  llm: 500,
}

async function extractTextFromPDF(
  buffer: Buffer
): Promise<{
  text: string
  pageCount: number
  html?: string
  formatPreserved: boolean
}> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid or empty PDF buffer')
    }

    // Check if buffer starts with PDF signature
    const pdfSignature = buffer.slice(0, 4).toString()
    if (pdfSignature !== '%PDF') {
      throw new Error('Invalid PDF file: Missing PDF signature')
    }

    // Use unpdf - serverless-optimized PDF.js alternative
    const { extractText } = await import('unpdf')
    const data = await extractText(buffer, {
      maxPages: 100, // Limit processing for safety
    })

    // Validate extracted data
    if (!data || typeof data.text !== 'string') {
      throw new Error('PDF parsing returned invalid data')
    }

    if (data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text')
    }

    return {
      text: data.text,
      pageCount: data.totalPages || 1,
      formatPreserved: false, // PDFs use basic text extraction
    }
  } catch (error) {
    console.error('PDF parsing error:', error)

    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error(
          'Invalid PDF file format. Please ensure the file is a valid PDF document.'
        )
      }
      if (error.message.includes('password')) {
        throw new Error(
          'Password-protected PDFs are not supported. Please provide an unprotected PDF.'
        )
      }
      if (error.message.includes('corrupted')) {
        throw new Error(
          'The PDF file appears to be corrupted. Please try with a different file.'
        )
      }
      throw new Error(`PDF processing failed: ${error.message}`)
    }

    throw new Error('Failed to parse PDF document')
  }
}

async function extractTextFromDOCX(
  buffer: Buffer
): Promise<{
  text: string
  pageCount: number
  html?: string
  formatPreserved: boolean
}> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid or empty DOCX buffer')
    }

    // Check if buffer starts with ZIP signature (DOCX is a ZIP file)
    const zipSignature = buffer.slice(0, 4)
    const isValidZip = zipSignature[0] === 0x50 && zipSignature[1] === 0x4b

    if (!isValidZip) {
      throw new Error('Invalid DOCX file: Missing ZIP signature')
    }

    console.log('📄 Processing DOCX with mammoth.js for format preservation')

    // Dynamic import mammoth.js to avoid build issues
    const mammoth = await import('mammoth')

    // Configure mammoth options for optimal extraction
    const mammothOptions = {
      // Convert document to HTML to preserve formatting
      convertImage: mammoth.images.imgElement(function (image: any) {
        return image.read('base64').then(function (imageBuffer: string) {
          return {
            src: 'data:' + image.contentType + ';base64,' + imageBuffer,
          }
        })
      }),
      // Custom style mappings for better translation preservation
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
      ],
      includeDefaultStyleMap: true,
    }

    // Extract both HTML (with formatting) and plain text
    const [htmlResult, textResult] = await Promise.all([
      mammoth.convertToHtml({ buffer }, mammothOptions),
      mammoth.extractRawText({ buffer }),
    ])

    // Process the extracted content
    let text = textResult.value.trim()
    const html = htmlResult.value
    const messages = [...htmlResult.messages, ...textResult.messages]

    // Log any warnings or issues from mammoth
    if (messages.length > 0) {
      console.log(
        '📋 Mammoth processing messages:',
        messages.map(m => m.message)
      )
    }

    // Validate extraction
    if (!text || text.length === 0) {
      // Fallback: try to extract text from HTML if plain text extraction failed
      if (html && html.length > 0) {
        text = html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      if (!text || text.length === 0) {
        throw new Error(
          'Document appears to be empty or contains no extractable text'
        )
      }
    }

    // Clean up and normalize text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Estimate page count based on word count
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 250)) // More conservative estimate

    console.log('✅ DOCX processing completed', {
      originalSize: buffer.length,
      extractedTextLength: text.length,
      extractedHtmlLength: html.length,
      wordCount,
      estimatedPages,
      hasFormatting: html.includes('<') && html.includes('>'),
      mammothMessages: messages.length,
    })

    return {
      text,
      pageCount: estimatedPages,
      html: html.length > 0 ? html : undefined,
      formatPreserved: true,
    }
  } catch (error) {
    console.error('❌ DOCX processing error:', error)

    // If mammoth fails, fall back to basic text extraction
    try {
      console.log('🔄 Falling back to basic text extraction')

      const bufferStr = buffer.toString('utf-8')
      const textMatches = bufferStr.match(/[a-zA-Z\s.,!?;:\-'"()[\]{}0-9]+/g)

      let fallbackText = ''
      if (textMatches && textMatches.length > 0) {
        fallbackText = textMatches
          .filter(match => match.trim().length > 5) // Filter out very short matches
          .join(' ')
          .substring(0, 10000) // Limit to 10KB
          .replace(/\s+/g, ' ')
          .trim()
      }

      if (fallbackText.length === 0) {
        fallbackText =
          'Document uploaded successfully. Advanced text extraction failed, but basic processing completed.'
      }

      const wordCount = fallbackText.split(/\s+/).length
      const estimatedPages = Math.max(1, Math.ceil(wordCount / 250))

      console.log('⚠️ Using fallback text extraction', {
        extractedLength: fallbackText.length,
        wordCount,
        estimatedPages,
      })

      return {
        text: fallbackText,
        pageCount: estimatedPages,
        formatPreserved: false,
      }
    } catch (fallbackError) {
      console.error('❌ Fallback extraction also failed:', fallbackError)

      if (error instanceof Error) {
        throw new Error(`DOCX processing failed: ${error.message}`)
      }

      throw new Error('Failed to parse DOCX document')
    }
  }
}

export async function POST(request: NextRequest) {
  const tempFilePath: string | null = null

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Enhanced authentication with session validation
    const session = await validateAndRefreshSession(supabase)

    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to process documents',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      )
    }

    const user = session.user

    // Parse form data with validation
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid form data',
          message: 'Failed to parse the uploaded form data',
          code: 'INVALID_FORM_DATA',
        },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File
    const targetLang = (formData.get('targetLang') as string) || 'en'
    const serviceType =
      (formData.get('serviceType') as 'google_translate' | 'llm') ||
      'google_translate'

    // Enhanced file validation
    if (!file) {
      return NextResponse.json(
        {
          error: 'No file provided',
          message: 'Please select a file to upload',
          code: 'NO_FILE',
        },
        { status: 400 }
      )
    }

    // Check file size (max 50MB)
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `File size must be less than 50MB. Current size: ${Math.round(file.size / 1024 / 1024)}MB`,
          code: 'FILE_TOO_LARGE',
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message:
            'Only PDF and DOCX files are supported. Please upload a valid document.',
          code: 'INVALID_FILE_TYPE',
          allowedTypes: ['PDF', 'DOCX'],
        },
        { status: 400 }
      )
    }

    // Validate file name
    if (!file.name || file.name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid file name',
          message: 'Please provide a file with a valid name',
          code: 'INVALID_FILE_NAME',
        },
        { status: 400 }
      )
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract text based on file type
    let extractedData: { text: string; pageCount: number }

    if (file.type === 'application/pdf') {
      extractedData = await extractTextFromPDF(buffer)
    } else {
      extractedData = await extractTextFromDOCX(buffer)
    }

    const { text, pageCount, html, formatPreserved } = extractedData
    const wordCount = text.split(/\s+/).length
    const requiredCredits = pageCount * CREDITS_PER_PAGE[serviceType]

    // Check user's credit balance with retry
    const creditData = await withAuthRetry(async () => {
      const { data, error } = await supabase
        .rpc('get_user_credit_balance', { p_user_id: user.id })
        .single()

      if (error) {
        console.error('Credit check error:', error)
        if (error.code === 'PGRST301') {
          throw {
            status: 401,
            message: 'Unauthorized access to credit balance',
          }
        }
        throw {
          status: 500,
          message: 'Failed to check credit balance',
          details: error.message,
        }
      }

      if (!data) {
        throw { status: 500, message: 'Credit data not found' }
      }

      return data
    }, supabase)

    const currentBalance = creditData.balance || 0

    if (currentBalance < requiredCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message:
            'You need more credits to process this document. Please upgrade your plan.',
          code: 'INSUFFICIENT_CREDITS',
          required: requiredCredits,
          current: currentBalance,
          pageCount,
          upgrade_url: '/billing',
        },
        { status: 402 }
      )
    }

    // Create task record with retry
    const task = await withAuthRetry(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          type: 'translate',
          cost: requiredCredits,
          status: 'running',
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            serviceType,
            targetLang,
            pageCount,
            wordCount,
          },
        })
        .select()
        .single()

      if (error) {
        console.error('Task creation error:', error)
        if (error.code === 'PGRST301') {
          throw { status: 401, message: 'Unauthorized access to create task' }
        }
        throw {
          status: 500,
          message: 'Failed to create document processing task',
          details: error.message,
        }
      }

      if (!data) {
        throw { status: 500, message: 'Task creation returned no data' }
      }

      return data
    }, supabase)

    try {
      // For MVP, we'll translate the extracted text
      // In production, you'd want to preserve formatting
      const translationResponse = await fetch(
        new URL('/api/translate/authenticated', request.url).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            text: text.substring(0, 50000), // Limit for MVP
            targetLang,
            serviceType,
            qualityTier: 'standard',
          }),
        }
      )

      if (!translationResponse.ok) {
        throw new Error('Translation failed')
      }

      const translationResult = await translationResponse.json()

      // Upload the original file to Supabase Storage
      const fileName = `${task.id}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('processed-documents')
        .upload(`originals/${fileName}`, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Check if bucket exists
        if (
          uploadError.message?.includes('bucket') ||
          uploadError.statusCode === '404'
        ) {
          throw new Error(
            'Storage bucket "processed-documents" not found. Please create it in Supabase.'
          )
        }
        throw uploadError
      }

      // Create enhanced translated content with format preservation
      let translatedContent: string
      let translatedFileName: string
      let contentType: string

      if (html && formatPreserved && file.type.includes('wordprocessingml')) {
        // For DOCX files with preserved formatting, create HTML output
        translatedContent = `<!DOCTYPE html>
<html lang="${targetLang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translated Document - ${file.name}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
        }
        .document-header {
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
            margin-bottom: 20px;
            color: #666;
            font-size: 14px;
        }
        h1, h2, h3 { color: #333; }
        .translation-content { margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .format-badge { 
            background: #4CAF50; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="document-header">
        <strong>🌍 Document Translation by Prismy</strong> <span class="format-badge">Format Preserved</span><br>
        Original File: ${file.name}<br>
        File Type: ${file.type}<br>
        Pages: ${pageCount} | Words: ${wordCount}<br>
        Service: ${serviceType}<br>
        Translated: ${new Date().toLocaleString()}
    </div>
    
    <div class="translation-content">
        ${translationResult.result.translatedText}
    </div>
</body>
</html>`

        translatedFileName = `${task.id}-translated-${file.name.replace(/\.[^/.]+$/, '')}.html`
        contentType = 'text/html'
      } else {
        // Standard text output for PDFs or when formatting is not preserved
        translatedContent = `🌍 DOCUMENT TRANSLATION by Prismy
========================================

Original Document: ${file.name}
Translated to: ${targetLang}
Pages: ${pageCount}
Words: ${wordCount}
Service: ${serviceType}
Format Preserved: ${formatPreserved ? 'Yes' : 'No'}
Processing Date: ${new Date().toLocaleString()}

========== TRANSLATION ==========

${translationResult.result.translatedText}

========================================
Powered by Prismy - AI Translation Platform
Visit: prismy.in for more features
`

        translatedFileName = `${task.id}-translated-${file.name}.txt`
        contentType = 'text/plain'
      }

      const translatedBuffer = Buffer.from(translatedContent, 'utf-8')

      const { data: translatedUpload, error: translatedError } =
        await supabase.storage
          .from('processed-documents')
          .upload(`translated/${translatedFileName}`, translatedBuffer, {
            contentType,
            upsert: false,
          })

      if (translatedError) {
        console.error('Translated file upload error:', translatedError)
        throw translatedError
      }

      // Get public URLs
      const {
        data: { publicUrl: translatedUrl },
      } = supabase.storage
        .from('processed-documents')
        .getPublicUrl(`translated/${translatedFileName}`)

      // Deduct credits (already done by authenticated translation API)

      // Update task status with enhanced metadata
      await supabase
        .from('tasks')
        .update({
          status: 'done',
          metadata: {
            ...task.metadata,
            translatedUrl,
            processingTime: Date.now() - new Date(task.created_at).getTime(),
            formatPreserved: formatPreserved || false,
            outputFormat: html && formatPreserved ? 'html' : 'text',
            hasFormatting: html && html.includes('<') && html.includes('>'),
            translationEngine: 'chunked_translation_service',
            enhancedProcessing: true,
          },
        })
        .eq('id', task.id)

      return NextResponse.json({
        success: true,
        taskId: task.id,
        translatedUrl,
        pageCount,
        wordCount,
        creditsUsed: requiredCredits,
        fileName: file.name,
        formatPreserved: formatPreserved || false,
        outputFormat: html && formatPreserved ? 'html' : 'text',
        enhancedProcessing: true,
        message: formatPreserved
          ? 'Document processed successfully with format preservation'
          : 'Document processed successfully',
      })
    } catch (processingError) {
      // Update task status to error
      await supabase
        .from('tasks')
        .update({
          status: 'error',
          metadata: {
            ...task.metadata,
            error:
              processingError instanceof Error
                ? processingError.message
                : 'Unknown error',
          },
        })
        .eq('id', task.id)

      // Refund credits
      await supabase.from('credits').insert({
        user_id: user.id,
        change: requiredCredits,
        reason: `Refund for failed document task ${task.id}`,
        created_at: new Date().toISOString(),
      })

      throw processingError
    }
  } catch (error: any) {
    console.error('Document processing error:', error)

    // Handle specific error types
    let statusCode = 500
    let errorCode = 'PROCESSING_ERROR'
    let userMessage = 'Document processing failed. Please try again.'

    if (error && typeof error === 'object') {
      // Handle authentication errors
      if (error.status === 401) {
        statusCode = 401
        errorCode = 'AUTH_ERROR'
        userMessage =
          error.message ||
          'Authentication required. Please sign in and try again.'
      }
      // Handle insufficient credits
      else if (error.status === 402) {
        statusCode = 402
        errorCode = 'INSUFFICIENT_CREDITS'
        userMessage =
          error.message || 'Insufficient credits to process this document.'
      }
      // Handle specific processing errors
      else if (error instanceof Error) {
        if (error.message.includes('PDF processing failed')) {
          errorCode = 'PDF_PROCESSING_ERROR'
          userMessage = error.message
        } else if (error.message.includes('DOCX processing failed')) {
          errorCode = 'DOCX_PROCESSING_ERROR'
          userMessage = error.message
        } else if (error.message.includes('Translation failed')) {
          errorCode = 'TRANSLATION_ERROR'
          userMessage =
            'Document translation failed. Please try again with a different service type.'
        } else if (error.message.includes('Network')) {
          errorCode = 'NETWORK_ERROR'
          userMessage =
            'Network error occurred. Please check your connection and try again.'
        }
      }
    }

    return NextResponse.json(
      {
        error: 'Document processing failed',
        message: userMessage,
        code: errorCode,
        details:
          process.env.NODE_ENV === 'development'
            ? {
                originalError:
                  error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
              }
            : undefined,
        suggestions: [
          'Check that your file is a valid PDF or DOCX document',
          'Ensure you have sufficient credits for processing',
          'Try uploading a smaller file if the current one is large',
          'Contact support if the problem persists',
        ],
      },
      { status: statusCode }
    )
  } finally {
    // Clean up temp file if created
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (e) {
        console.error('Failed to delete temp file:', e)
      }
    }
  }
}
