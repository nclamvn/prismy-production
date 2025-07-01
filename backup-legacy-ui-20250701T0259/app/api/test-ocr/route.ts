import { NextRequest, NextResponse } from 'next/server'
import { ocrService } from '@/lib/ocr/ocr-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Test OCR processing
    const result = await ocrService.processImage(file, {
      languages: ['en', 'vi'],
      confidence: 0.6,
      enableTextDetection: true,
      enableDocumentTextDetection: true
    })

    return NextResponse.json({
      success: true,
      result: {
        text: result.text,
        confidence: result.confidence,
        language: result.language,
        method: result.method,
        processingTime: result.processingTime,
        blocks: result.blocks?.length || 0
      }
    })

  } catch (error) {
    console.error('[Test OCR] Error:', error)
    
    return NextResponse.json(
      { error: 'OCR processing failed', details: error },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'OCR Test API',
      usage: 'POST with file in FormData',
      supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'pdf']
    }
  )
}