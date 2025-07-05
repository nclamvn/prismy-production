import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload API called')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fromLang = formData.get('fromLang') as string
    const toLang = formData.get('toLang') as string
    
    console.log('📁 File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      fromLang,
      toLang
    })
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Check file size (max 10MB for now)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    
    // Read file content
    const fileText = await file.text()
    console.log('📄 File text preview:', fileText.substring(0, 100) + '...')
    
    // Return success without database operations
    return NextResponse.json({
      success: true,
      documentId: 'demo-' + Date.now(),
      conversationId: 'conv-' + Date.now(),
      filename: file.name,
      detectedLanguage: fromLang === 'auto' ? 'en' : fromLang,
      status: 'completed',
      message: 'File uploaded successfully (simple mode)',
      fileSize: file.size,
      extractedText: fileText.substring(0, 200) + '...'
    })
    
  } catch (error) {
    console.error('❌ Upload API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}