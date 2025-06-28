import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple test endpoint to verify translation pipeline is working
 * This bypasses authentication and complex logic for basic testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, sourceLang = 'auto', targetLang = 'vi' } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Mock translation for testing (replace with actual service call)
    const mockTranslation = {
      translatedText: `[TEST TRANSLATION] ${text} → ${targetLang}`,
      sourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
      targetLang,
      confidence: 0.95,
      qualityScore: 0.9,
      cached: false,
      detectedSourceLanguage: sourceLang === 'auto' ? 'en' : undefined,
    }

    return NextResponse.json({
      success: true,
      result: mockTranslation,
      message: 'Test translation completed successfully',
    })
  } catch (error) {
    console.error('Test translation error:', error)
    return NextResponse.json(
      {
        error: 'Test translation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Translation test endpoint is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
}
