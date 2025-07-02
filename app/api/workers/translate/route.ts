import { NextRequest, NextResponse } from 'next/server'
// import { createSupabaseServerClient } from '@/lib/supabase-server'

// Mock Google Translate API (replace with actual implementation)
async function translateWithGoogle(
  text: string,
  _sourceLang: string,
  _targetLang: string
): Promise<string> {
  // Simulate translation delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Mock translation - in production, use actual Google Translate API
  const mockTranslations: Record<string, string> = {
    'Hello World': 'Xin chào thế giới',
    Document: 'Tài liệu',
    Translation: 'Dịch thuật',
    'AI-powered': 'Được hỗ trợ bởi AI',
  }

  // Return mock translation or append "[Translated]" prefix
  return mockTranslations[text] || `[Translated] ${text}`
}

// Extract text from different file types
async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // This is a simplified mock implementation
  // In production, use proper document parsing libraries:
  // - PDF: pdf-parse, pdf2pic
  // - DOCX: mammoth, docx-preview
  // - PPTX: officegen, node-pptx

  const mockContent = `# Sample Document Content

This is a mock extraction of the uploaded document.

## Key Sections
- Introduction
- Main Content  
- Conclusion

The document contains ${Math.floor(buffer.length / 1024)}KB of content that would be processed by the appropriate parser for ${mimeType}.

In a production implementation, this would be the actual extracted text from your ${mimeType} file.`

  return mockContent
}

// Split text into chunks for translation
function chunkText(text: string, maxLength: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += sentence + '. '
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(chunk => chunk.length > 0)
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      jobId,
      sourceLang = 'auto',
      targetLang = 'en',
    } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('Job not found:', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'translating') {
      return NextResponse.json(
        { error: 'Job not in translating state' },
        { status: 400 }
      )
    }

    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(job.storage_path)

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`)
      }

      // Convert to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer())

      // Extract text from document
      let extractedText: string
      try {
        extractedText = await extractTextFromFile(buffer, job.mime_type)
      } catch (extractError) {
        throw new Error(`Failed to extract text: ${extractError}`)
      }

      // Update progress to 20%
      await supabase
        .from('translation_jobs')
        .update({ progress: 20 })
        .eq('id', jobId)

      // Split text into chunks for translation
      const chunks = chunkText(extractedText, 1000)
      const totalChunks = chunks.length

      if (totalChunks === 0) {
        throw new Error('No text content found in document')
      }

      // Translate chunks
      const translatedChunks: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        // Translate chunk
        const translatedChunk = await translateWithGoogle(
          chunk,
          sourceLang,
          targetLang
        )
        translatedChunks.push(translatedChunk)

        // Update progress (20% to 80% for translation)
        const progress = 20 + Math.floor(((i + 1) / totalChunks) * 60)
        await supabase
          .from('translation_jobs')
          .update({ progress })
          .eq('id', jobId)
      }

      // Combine translated chunks
      const translatedText = translatedChunks.join('\n\n')

      // Update progress to 90%
      await supabase
        .from('translation_jobs')
        .update({ progress: 90 })
        .eq('id', jobId)

      // Save translated content to storage
      const outputPath = `translations/${job.session_id || job.user_id}/${jobId}.txt`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(outputPath, translatedText, {
          contentType: 'text/plain',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Failed to save translation: ${uploadError.message}`)
      }

      // Mark job as completed
      const { error: completeError } = await supabase
        .from('translation_jobs')
        .update({
          status: 'translated',
          progress: 100,
          output_path: outputPath,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (completeError) {
        throw new Error(`Failed to mark job complete: ${completeError.message}`)
      }

      return NextResponse.json({
        success: true,
        outputPath,
        chunks: totalChunks,
        characters: translatedText.length,
      })
    } catch (processingError) {
      console.error('Translation processing error:', processingError)

      // Mark job as failed
      await supabase
        .from('translation_jobs')
        .update({
          status: 'failed',
          error_message:
            processingError instanceof Error
              ? processingError.message
              : 'Unknown error',
        })
        .eq('id', jobId)

      return NextResponse.json(
        {
          error: 'Translation failed',
          details:
            processingError instanceof Error
              ? processingError.message
              : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Worker error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Increase max duration for translation processing
export const maxDuration = 300 // 5 minutes (Vercel hobby plan limit)
