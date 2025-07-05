import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; format: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id, format } = params
    
    // Validate format
    const allowedFormats = ['txt', 'pdf', 'docx']
    if (!allowedFormats.includes(format)) {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
    
    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    if (document.status !== 'completed') {
      return NextResponse.json({ error: 'Document not ready for download' }, { status: 400 })
    }
    
    // Generate file content based on format
    let content: string | Buffer
    let mimeType: string
    let filename: string
    
    const translatedText = document.translated_text || document.extracted_text
    const baseFilename = document.filename.replace(/\.[^/.]+$/, '')
    
    switch (format) {
      case 'txt':
        content = translatedText
        mimeType = 'text/plain'
        filename = `${baseFilename}_translated.txt`
        break
        
      case 'pdf':
        // For now, just return text content with PDF mime type
        // In production, you'd use a PDF generation library
        content = translatedText
        mimeType = 'application/pdf'
        filename = `${baseFilename}_translated.pdf`
        break
        
      case 'docx':
        // For now, just return text content with DOCX mime type
        // In production, you'd use a DOCX generation library
        content = translatedText
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `${baseFilename}_translated.docx`
        break
        
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
    
    // Return file
    const response = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
    
    return response
    
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}