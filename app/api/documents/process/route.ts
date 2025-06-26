import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
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
    // Dynamic import to avoid build issues
    const pdf = (await import('pdf-parse')).default
    const data = await pdf(buffer)
    return {
      text: data.text,
      pageCount: data.numpages
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF document')
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // For now, return a placeholder. In production, use a library like mammoth.js
  const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000))
  const estimatedPages = Math.ceil(text.split(/\s+/).length / 500) // ~500 words per page
  
  return {
    text: text,
    pageCount: estimatedPages
  }
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetLang = formData.get('targetLang') as string || 'en'
    const serviceType = formData.get('serviceType') as 'google_translate' | 'llm' || 'google_translate'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX are supported.' },
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

    // Check user's credit balance
    const { data: creditData, error: creditError } = await supabase
      .rpc('get_user_credit_balance', { p_user_id: user.id })
      .single()

    if (creditError || !creditData) {
      console.error('Credit check error:', creditError)
      return NextResponse.json(
        { error: 'Failed to check credit balance' },
        { status: 500 }
      )
    }

    const currentBalance = creditData.balance || 0

    if (currentBalance < requiredCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: requiredCredits,
          current: currentBalance,
          pageCount,
          message: 'Please upgrade your plan to process this document'
        },
        { status: 402 }
      )
    }

    // Create task record
    const { data: task, error: taskError } = await supabase
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

    if (taskError || !task) {
      console.error('Task creation error:', taskError)
      return NextResponse.json(
        { error: 'Failed to create document processing task' },
        { status: 500 }
      )
    }

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

  } catch (error) {
    console.error('Document processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Document processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined
      },
      { status: 500 }
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