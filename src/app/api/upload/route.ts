import { NextRequest, NextResponse } from 'next/server'
import { getFeatureFlags } from '@/lib/feature-flags'
import { detectLanguage } from '@/lib/ocr/language-detector'
import { translateText } from '@/lib/translation/translation-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fromLang = formData.get('fromLang') as string
    const toLang = formData.get('toLang') as string
    
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
    
    const flags = getFeatureFlags()
    
    // MVP Mode: Process file directly without database
    if (flags.MVP_MODE) {
      // Read file content
      const fileText = await file.text()
      
      // Detect language
      const detectedLang = fromLang === 'auto' ? detectLanguage(fileText) : fromLang
      
      // Translate text
      const translatedText = await translateText(fileText, detectedLang, toLang)
      
      return NextResponse.json({
        success: true,
        mode: 'mvp',
        originalText: fileText.substring(0, 200) + '...',
        detectedLanguage: detectedLang,
        translatedText: translatedText.substring(0, 200) + '...',
        message: 'File processed successfully (MVP mode)'
      })
    }
    
    // Full mode would use Supabase here
    return NextResponse.json({
      success: true,
      mode: 'demo',
      message: 'Upload received. Full processing will be enabled when environment is configured.'
    })
    
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}