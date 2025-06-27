import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, validateAndRefreshSession, withAuthRetry } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
// Dynamic import to avoid build-time issues
// import pdf from 'pdf-parse'

// Credit costs for document processing
const CREDITS_PER_PAGE = {
  google_translate: 30,
  llm: 500
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
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

    // Dynamic import to avoid build issues
    const pdf = (await import('pdf-parse')).default
    const data = await pdf(buffer, {
      // Limit processing for safety
      max: 100, // Max 100 pages
      version: 'v2.0.550' // Specify version for consistency
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
      pageCount: data.numpages || 1
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF document.')
      }
      if (error.message.includes('password')) {
        throw new Error('Password-protected PDFs are not supported. Please provide an unprotected PDF.')
      }
      if (error.message.includes('corrupted')) {
        throw new Error('The PDF file appears to be corrupted. Please try with a different file.')
      }
      throw new Error(`PDF processing failed: ${error.message}`)
    }
    
    throw new Error('Failed to parse PDF document')
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid or empty DOCX buffer')
    }

    // Check if buffer starts with ZIP signature (DOCX is a ZIP file)
    const zipSignature = buffer.slice(0, 4)
    const isValidZip = zipSignature[0] === 0x50 && zipSignature[1] === 0x4B
    
    if (!isValidZip) {
      throw new Error('Invalid DOCX file: Missing ZIP signature')
    }

    // For now, return a basic text extraction. In production, use mammoth.js
    // Try to extract some meaningful text from the beginning
    let text = ''
    
    // Look for readable text in the buffer
    const bufferStr = buffer.toString('utf-8')
    const textMatches = bufferStr.match(/[a-zA-Z\s.,!?]+/g)
    
    if (textMatches && textMatches.length > 0) {
      text = textMatches.join(' ').substring(0, 5000) // Limit to 5KB
      text = text.replace(/\s+/g, ' ').trim()
    }
    
    if (text.length === 0) {
      text = 'Document uploaded successfully. Content extraction requires additional processing.'
    }
    
    const wordCount = text.split(/\s+/).length
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 500)) // ~500 words per page
    
    return {
      text: text,
      pageCount: estimatedPages
    }
  } catch (error) {
    console.error('DOCX parsing error:', error)
    
    if (error instanceof Error) {
      throw new Error(`DOCX processing failed: ${error.message}`)
    }
    
    throw new Error('Failed to parse DOCX document')
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
          code: 'AUTH_REQUIRED'
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
          code: 'INVALID_FORM_DATA'
        },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File
    const targetLang = formData.get('targetLang') as string || 'en'
    const serviceType = formData.get('serviceType') as 'google_translate' | 'llm' || 'google_translate'

    // Enhanced file validation
    if (!file) {
      return NextResponse.json(
        { 
          error: 'No file provided', 
          message: 'Please select a file to upload',
          code: 'NO_FILE'
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
          code: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type', 
          message: 'Only PDF and DOCX files are supported. Please upload a valid document.',
          code: 'INVALID_FILE_TYPE',
          allowedTypes: ['PDF', 'DOCX']
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
          code: 'INVALID_FILE_NAME'
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

    const { text, pageCount } = extractedData
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
          throw { status: 401, message: 'Unauthorized access to credit balance' }
        }
        throw { status: 500, message: 'Failed to check credit balance', details: error.message }
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
          message: 'You need more credits to process this document. Please upgrade your plan.',
          code: 'INSUFFICIENT_CREDITS',
          required: requiredCredits,
          current: currentBalance,
          pageCount,
          upgrade_url: '/billing'
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
            wordCount
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Task creation error:', error)
        if (error.code === 'PGRST301') {
          throw { status: 401, message: 'Unauthorized access to create task' }
        }
        throw { status: 500, message: 'Failed to create document processing task', details: error.message }
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
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            text: text.substring(0, 50000), // Limit for MVP
            targetLang,
            serviceType,
            qualityTier: 'standard'
          })
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
          upsert: false
        })

      if (uploadError) throw uploadError

      // For MVP, create a simple text file with translation
      // In production, you'd preserve document formatting
      const translatedContent = `
Original Document: ${file.name}
Translated to: ${targetLang}
Pages: ${pageCount}
Words: ${wordCount}
Service: ${serviceType}

========== TRANSLATION ==========

${translationResult.result.translatedText}
`

      const translatedBuffer = Buffer.from(translatedContent, 'utf-8')
      const translatedFileName = `${task.id}-translated-${file.name}.txt`
      
      const { data: translatedUpload, error: translatedError } = await supabase.storage
        .from('processed-documents')
        .upload(`translated/${translatedFileName}`, translatedBuffer, {
          contentType: 'text/plain',
          upsert: false
        })

      if (translatedError) throw translatedError

      // Get public URLs
      const { data: { publicUrl: translatedUrl } } = supabase.storage
        .from('processed-documents')
        .getPublicUrl(`translated/${translatedFileName}`)

      // Deduct credits (already done by authenticated translation API)
      
      // Update task status
      await supabase
        .from('tasks')
        .update({
          status: 'done',
          metadata: {
            ...task.metadata,
            translatedUrl,
            processingTime: Date.now() - new Date(task.created_at).getTime()
          }
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
        message: 'Document processed successfully'
      })

    } catch (processingError) {
      // Update task status to error
      await supabase
        .from('tasks')
        .update({
          status: 'error',
          metadata: {
            ...task.metadata,
            error: processingError instanceof Error ? processingError.message : 'Unknown error'
          }
        })
        .eq('id', task.id)

      // Refund credits
      await supabase
        .from('credits')
        .insert({
          user_id: user.id,
          change: requiredCredits,
          reason: `Refund for failed document task ${task.id}`,
          created_at: new Date().toISOString()
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
        userMessage = error.message || 'Authentication required. Please sign in and try again.'
      }
      // Handle insufficient credits
      else if (error.status === 402) {
        statusCode = 402
        errorCode = 'INSUFFICIENT_CREDITS'
        userMessage = error.message || 'Insufficient credits to process this document.'
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
          userMessage = 'Document translation failed. Please try again with a different service type.'
        } else if (error.message.includes('Network')) {
          errorCode = 'NETWORK_ERROR'
          userMessage = 'Network error occurred. Please check your connection and try again.'
        }
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Document processing failed',
        message: userMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' 
          ? {
              originalError: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              timestamp: new Date().toISOString()
            }
          : undefined,
        suggestions: [
          'Check that your file is a valid PDF or DOCX document',
          'Ensure you have sufficient credits for processing',
          'Try uploading a smaller file if the current one is large',
          'Contact support if the problem persists'
        ]
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