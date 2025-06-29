import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Chunked processing configuration for enterprise-scale documents
const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB chunks
const MAX_CHUNKS = 50 // Support up to 2.5GB files (50 * 50MB)
const PROCESSING_TIMEOUT = 600000 // 10 minutes

interface ChunkMetadata {
  chunkId: string
  chunkIndex: number
  totalChunks: number
  fileName: string
  fileType: string
  originalFileSize: number
  chunkSize: number
  documentId: string
}

interface ChunkProcessingSession {
  documentId: string
  fileName: string
  fileType: string
  totalSize: number
  totalChunks: number
  processedChunks: number
  chunks: Map<number, { text: string; metadata: any }>
  createdAt: number
  lastActivity: number
}

// In-memory session storage (for production, use Redis or database)
const processingSessions = new Map<string, ChunkProcessingSession>()

// Cleanup old sessions every hour
setInterval(() => {
  const now = Date.now()
  const sessionTimeout = 3600000 // 1 hour

  for (const [sessionId, session] of processingSessions.entries()) {
    if (now - session.lastActivity > sessionTimeout) {
      console.log(`🧹 Cleaning up expired session: ${sessionId}`)
      processingSessions.delete(sessionId)
    }
  }
}, 3600000)

async function extractTextFromPDFChunk(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  // Reuse the same PDF extraction logic from process-simple
  // This is a simplified version - in production, optimize for chunk processing

  console.log('📖 Processing PDF chunk, buffer size:', buffer.length)

  // Check PDF signature
  const pdfSignature = buffer.slice(0, 4).toString('latin1')
  if (pdfSignature !== '%PDF') {
    throw new Error('INVALID_PDF_FORMAT')
  }

  const errors: string[] = []

  // Try unpdf first (most reliable for chunks)
  try {
    const { extractText } = await import('unpdf')
    const result = await extractText(buffer)

    if (result?.text && result.text.trim().length > 0) {
      return {
        text: result.text,
        pageCount: result.totalPages || 1,
      }
    }
    throw new Error('No text extracted')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errors.push(`unpdf: ${errorMsg}`)
    console.log('❌ unpdf failed for chunk:', errorMsg)
  }

  // Fallback to pdf-parse
  try {
    const pdf = (await import('pdf-parse')).default
    const data = await pdf(buffer)

    if (data?.text && data.text.trim().length > 0) {
      return {
        text: data.text,
        pageCount: data.numpages || 1,
      }
    }
    throw new Error('No text extracted')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errors.push(`pdf-parse: ${errorMsg}`)
  }

  throw new Error('CHUNK_PROCESSING_FAILED')
}

async function extractTextFromDOCXChunk(
  buffer: Buffer
): Promise<{ text: string; html?: string }> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid or empty DOCX chunk buffer')
    }

    // Check DOCX signature (ZIP file signature)
    const zipSignature = buffer.slice(0, 4)
    const isZip = zipSignature[0] === 0x50 && zipSignature[1] === 0x4b
    if (!isZip) {
      throw new Error('Invalid DOCX chunk: Not a valid ZIP archive')
    }

    const mammoth = await import('mammoth')
    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ])

    const text = textResult.value.trim()
    return {
      text,
      html: htmlResult.value,
    }
  } catch (error) {
    console.error('DOCX chunk parsing error:', error)
    throw new Error('Failed to parse DOCX chunk')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession()

    if (!authSession?.user) {
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
    const chunk = formData.get('chunk') as File
    const chunkMetadata = JSON.parse(
      formData.get('metadata') as string
    ) as ChunkMetadata

    if (!chunk || !chunkMetadata) {
      return NextResponse.json(
        { error: 'Missing chunk or metadata' },
        { status: 400 }
      )
    }

    console.log(
      `🔄 Processing chunk ${chunkMetadata.chunkIndex + 1}/${chunkMetadata.totalChunks} for ${chunkMetadata.fileName}`
    )

    // Validate chunk size
    if (chunk.size > CHUNK_SIZE * 1.1) {
      // Allow 10% overhead
      return NextResponse.json(
        { error: 'Chunk size exceeds maximum allowed size' },
        { status: 400 }
      )
    }

    // Get or create processing session
    let session = processingSessions.get(chunkMetadata.documentId)
    if (!session) {
      session = {
        documentId: chunkMetadata.documentId,
        fileName: chunkMetadata.fileName,
        fileType: chunkMetadata.fileType,
        totalSize: chunkMetadata.originalFileSize,
        totalChunks: chunkMetadata.totalChunks,
        processedChunks: 0,
        chunks: new Map(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
      }
      processingSessions.set(chunkMetadata.documentId, session)
    }

    // Update session activity
    session.lastActivity = Date.now()

    // Convert chunk to buffer
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())

    // Process chunk based on file type
    let extractedText = ''
    const formatData: any = {}

    if (chunkMetadata.fileType === 'text/plain') {
      extractedText = chunkBuffer.toString('utf-8')
    } else if (chunkMetadata.fileType === 'application/pdf') {
      const result = await extractTextFromPDFChunk(chunkBuffer)
      extractedText = result.text
      formatData.pageCount = result.pageCount
    } else if (
      chunkMetadata.fileType.includes('wordprocessingml') ||
      chunkMetadata.fileType.includes('msword')
    ) {
      const result = await extractTextFromDOCXChunk(chunkBuffer)
      extractedText = result.text
      formatData.html = result.html
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Store chunk result
    session.chunks.set(chunkMetadata.chunkIndex, {
      text: extractedText,
      metadata: formatData,
    })
    session.processedChunks++

    console.log(
      `✅ Chunk ${chunkMetadata.chunkIndex + 1}/${chunkMetadata.totalChunks} processed successfully`
    )

    // Check if all chunks are processed
    const isComplete = session.processedChunks === session.totalChunks

    if (isComplete) {
      console.log(`🎉 All chunks processed for ${chunkMetadata.fileName}`)

      // Reassemble document
      let fullText = ''
      let totalPageCount = 0

      // Process chunks in order
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkData = session.chunks.get(i)
        if (chunkData) {
          fullText += chunkData.text + '\n\n'
          if (chunkData.metadata.pageCount) {
            totalPageCount += chunkData.metadata.pageCount
          }
        }
      }

      // Final cleanup
      fullText = fullText.trim()

      // Clean up session
      processingSessions.delete(chunkMetadata.documentId)

      return NextResponse.json({
        success: true,
        complete: true,
        documentId: chunkMetadata.documentId,
        extractedText: fullText,
        metadata: {
          fileName: chunkMetadata.fileName,
          fileType: chunkMetadata.fileType,
          fileSize: chunkMetadata.originalFileSize,
          fileSizeMB:
            Math.round((chunkMetadata.originalFileSize / (1024 * 1024)) * 100) /
            100,
          textLength: fullText.length,
          wordCount: fullText.split(/\s+/).length,
          totalChunks: chunkMetadata.totalChunks,
          processingMode: 'chunked-enterprise',
          pageCount: totalPageCount || undefined,
        },
        processing: {
          method: 'chunked',
          chunksProcessed: session.processedChunks,
          totalChunks: session.totalChunks,
          processingTime: Date.now() - session.createdAt,
        },
      })
    }

    // Return partial progress
    return NextResponse.json({
      success: true,
      complete: false,
      documentId: chunkMetadata.documentId,
      progress: {
        processedChunks: session.processedChunks,
        totalChunks: session.totalChunks,
        percentage: Math.round(
          (session.processedChunks / session.totalChunks) * 100
        ),
        currentChunk: chunkMetadata.chunkIndex + 1,
      },
      processing: {
        method: 'chunked',
        status: 'in-progress',
        estimatedTimeRemaining: Math.round(
          ((Date.now() - session.createdAt) / session.processedChunks) *
            (session.totalChunks - session.processedChunks)
        ),
      },
    })
  } catch (error) {
    console.error('Chunked document processing error:', error)

    let errorMessage = 'Chunked document processing failed'
    let errorCode = 'CHUNK_PROCESSING_FAILED'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('INVALID_PDF_FORMAT')) {
        errorMessage = 'Invalid PDF chunk format'
        errorCode = 'INVALID_PDF_CHUNK'
        statusCode = 400
      } else if (error.message.includes('CHUNK_PROCESSING_FAILED')) {
        errorMessage = 'Failed to process document chunk'
        errorCode = 'CHUNK_PROCESSING_FAILED'
        statusCode = 500
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        chunkProcessing: true,
      },
      { status: statusCode }
    )
  }
}

// GET endpoint to check processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      )
    }

    const session = processingSessions.get(documentId)
    if (!session) {
      return NextResponse.json(
        { error: 'Processing session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      documentId,
      status: 'processing',
      progress: {
        processedChunks: session.processedChunks,
        totalChunks: session.totalChunks,
        percentage: Math.round(
          (session.processedChunks / session.totalChunks) * 100
        ),
      },
      processing: {
        method: 'chunked',
        startTime: new Date(session.createdAt).toISOString(),
        lastActivity: new Date(session.lastActivity).toISOString(),
        elapsedTime: Date.now() - session.createdAt,
      },
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 })
  }
}
