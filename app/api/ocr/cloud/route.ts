import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type {
  OCRProvider,
  OCRConfig,
  OCRResult,
} from '@/lib/ocr/hybrid-ocr-service'

// Cloud OCR Provider Configurations
const PROVIDER_CONFIGS = {
  'google-vision': {
    apiKey: process.env.GOOGLE_VISION_API_KEY,
    endpoint: 'https://vision.googleapis.com/v1/images:annotate',
    enabled: !!process.env.GOOGLE_VISION_API_KEY,
  },
  'azure-cv': {
    apiKey: process.env.AZURE_CV_API_KEY,
    endpoint: process.env.AZURE_CV_ENDPOINT,
    enabled: !!(process.env.AZURE_CV_API_KEY && process.env.AZURE_CV_ENDPOINT),
  },
  'aws-textract': {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    enabled: !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ),
  },
} as const

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { provider, config, imageData } = await request.json()

    if (!provider || !imageData) {
      return NextResponse.json(
        { error: 'Missing required parameters: provider, imageData' },
        { status: 400 }
      )
    }

    // Validate provider (tesseract is client-side only)
    if (provider === 'tesseract') {
      return NextResponse.json(
        { error: 'Tesseract is client-side only' },
        { status: 400 }
      )
    }

    if (!Object.keys(PROVIDER_CONFIGS).includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      )
    }

    const providerConfig =
      PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]
    if (!providerConfig.enabled) {
      return NextResponse.json(
        { error: `Provider ${provider} is not configured` },
        { status: 503 }
      )
    }

    logger.info(
      {
        provider,
        configuredProviders: Object.keys(PROVIDER_CONFIGS).filter(
          p => PROVIDER_CONFIGS[p as keyof typeof PROVIDER_CONFIGS].enabled
        ),
      },
      'Processing cloud OCR request'
    )

    // Process based on provider
    let result: OCRResult

    switch (provider) {
      case 'google-vision':
        result = await processWithGoogleVision(
          imageData,
          config,
          providerConfig
        )
        break
      case 'azure-cv':
        result = await processWithAzureCV(imageData, config, providerConfig)
        break
      case 'aws-textract':
        result = await processWithAWSTextract(imageData, config, providerConfig)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    const processingTime = Date.now() - startTime
    result.processingTime = processingTime

    logger.info(
      {
        provider,
        confidence: result.confidence,
        processingTime,
        textLength: result.text.length,
      },
      'Cloud OCR completed successfully'
    )

    return NextResponse.json(result)
  } catch (error) {
    const processingTime = Date.now() - startTime
    logger.error({ error, processingTime }, 'Cloud OCR processing failed')

    return NextResponse.json(
      {
        error: 'OCR processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Google Vision API Processing
 */
async function processWithGoogleVision(
  imageData: string,
  config: OCRConfig,
  providerConfig: any
): Promise<OCRResult> {
  const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '')

  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image,
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: Array.isArray(config.language)
            ? config.language
            : [config.language],
        },
      },
    ],
  }

  const response = await fetch(
    `${providerConfig.endpoint}?key=${providerConfig.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.statusText}`)
  }

  const data = await response.json()
  const annotation = data.responses[0]?.fullTextAnnotation

  if (!annotation) {
    throw new Error('No text detected by Google Vision')
  }

  // Convert Google Vision format to our format
  const words =
    annotation.pages?.[0]?.blocks?.flatMap((block: any) =>
      block.paragraphs?.flatMap((para: any) =>
        para.words?.map((word: any) => ({
          text: word.symbols?.map((s: any) => s.text).join('') || '',
          confidence: word.confidence || 0,
          bbox: {
            x: Math.min(...word.boundingBox.vertices.map((v: any) => v.x || 0)),
            y: Math.min(...word.boundingBox.vertices.map((v: any) => v.y || 0)),
            width:
              Math.max(...word.boundingBox.vertices.map((v: any) => v.x || 0)) -
              Math.min(...word.boundingBox.vertices.map((v: any) => v.x || 0)),
            height:
              Math.max(...word.boundingBox.vertices.map((v: any) => v.y || 0)) -
              Math.min(...word.boundingBox.vertices.map((v: any) => v.y || 0)),
          },
        }))
      )
    ) || []

  return {
    text: annotation.text || '',
    confidence: annotation.confidence || 85,
    provider: 'google-vision',
    processingTime: 0, // Will be set by caller
    words,
    lines: [], // Google Vision doesn't provide line-level data in the same format
    metadata: {
      imageWidth: 0,
      imageHeight: 0,
      detectedLanguages: config.language as string[],
      processingSteps: ['google-vision-api'],
    },
  }
}

/**
 * Azure Computer Vision Processing
 */
async function processWithAzureCV(
  imageData: string,
  config: OCRConfig,
  providerConfig: any
): Promise<OCRResult> {
  const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
  const imageBuffer = Buffer.from(base64Image, 'base64')

  const response = await fetch(
    `${providerConfig.endpoint}/vision/v3.2/read/analyze`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': providerConfig.apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    }
  )

  if (!response.ok) {
    throw new Error(`Azure CV API error: ${response.statusText}`)
  }

  // Azure Read API is async, get operation location
  const operationLocation = response.headers.get('Operation-Location')
  if (!operationLocation) {
    throw new Error('No operation location from Azure CV')
  }

  // Poll for results
  let result: any
  let attempts = 0
  const maxAttempts = 30 // 30 seconds max wait

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const statusResponse = await fetch(operationLocation, {
      headers: {
        'Ocp-Apim-Subscription-Key': providerConfig.apiKey,
      },
    })

    if (!statusResponse.ok) {
      throw new Error(
        `Azure CV status check failed: ${statusResponse.statusText}`
      )
    }

    result = await statusResponse.json()

    if (result.status === 'succeeded') break
    if (result.status === 'failed') {
      throw new Error('Azure CV processing failed')
    }

    attempts++
  }

  if (!result || result.status !== 'succeeded') {
    throw new Error('Azure CV processing timeout')
  }

  // Convert Azure format to our format
  const pages = result.analyzeResult?.readResults || []
  const lines = pages.flatMap((page: any) => page.lines || [])
  const words = lines.flatMap((line: any) => line.words || [])

  return {
    text: lines.map((line: any) => line.text).join('\n'),
    confidence: 90, // Azure doesn't provide overall confidence
    provider: 'azure-cv',
    processingTime: 0,
    words: words.map((word: any) => ({
      text: word.text,
      confidence: word.confidence || 90,
      bbox: {
        x: word.boundingBox[0],
        y: word.boundingBox[1],
        width: word.boundingBox[4] - word.boundingBox[0],
        height: word.boundingBox[5] - word.boundingBox[1],
      },
    })),
    lines: lines.map((line: any) => ({
      text: line.text,
      confidence: 90,
      bbox: {
        x: line.boundingBox[0],
        y: line.boundingBox[1],
        width: line.boundingBox[4] - line.boundingBox[0],
        height: line.boundingBox[5] - line.boundingBox[1],
      },
    })),
    metadata: {
      imageWidth: pages[0]?.width || 0,
      imageHeight: pages[0]?.height || 0,
      detectedLanguages: config.language as string[],
      processingSteps: ['azure-computer-vision'],
    },
  }
}

/**
 * AWS Textract Processing (Premium Feature)
 */
async function processWithAWSTextract(
  imageData: string,
  config: OCRConfig,
  providerConfig: any
): Promise<OCRResult> {
  // Note: This would require AWS SDK implementation
  // For now, return a placeholder implementation
  throw new Error('AWS Textract integration requires AWS SDK setup')
}

/**
 * Health check endpoint for each provider
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')

  if (!provider) {
    // Return overall health status
    const health = Object.entries(PROVIDER_CONFIGS).reduce(
      (acc, [key, config]) => {
        acc[key] = config.enabled
        return acc
      },
      {} as Record<string, boolean>
    )

    return NextResponse.json(health)
  }

  if (!Object.keys(PROVIDER_CONFIGS).includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  const isEnabled =
    PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]?.enabled ||
    false
  return NextResponse.json({ [provider]: isEnabled })
}
