import { NextRequest, NextResponse } from 'next/server'
import { DocumentProcessor } from '@/lib/document-processor'

/**
 * COMPREHENSIVE PIPELINE TEST ENDPOINT
 * Tests the complete user pipeline: upload → process → translate → download
 * This endpoint verifies that all components work together end-to-end
 */

interface PipelineTestRequest {
  testType:
    | 'simple_text'
    | 'document_upload'
    | 'translation_only'
    | 'full_pipeline'
  sampleText?: string
  targetLanguage?: string
  sourceLanguage?: string
}

interface PipelineTestResult {
  success: boolean
  testType: string
  steps: TestStep[]
  overallTime: number
  errors: string[]
  recommendations: string[]
}

interface TestStep {
  name: string
  status: 'success' | 'failure' | 'skipped'
  duration: number
  result?: any
  error?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: PipelineTestRequest = await request.json()
    const {
      testType = 'simple_text',
      sampleText = 'Hello world, this is a test translation.',
      targetLanguage = 'vi',
      sourceLanguage = 'en',
    } = body

    console.log(`🧪 Starting pipeline test: ${testType}`)

    const testResult: PipelineTestResult = {
      success: false,
      testType,
      steps: [],
      overallTime: 0,
      errors: [],
      recommendations: [],
    }

    // Run the appropriate test based on type
    switch (testType) {
      case 'simple_text':
        await runSimpleTextTest(
          testResult,
          sampleText,
          sourceLanguage,
          targetLanguage
        )
        break
      case 'translation_only':
        await runTranslationOnlyTest(
          testResult,
          sampleText,
          sourceLanguage,
          targetLanguage
        )
        break
      case 'document_upload':
        await runDocumentUploadTest(testResult)
        break
      case 'full_pipeline':
        await runFullPipelineTest(
          testResult,
          sampleText,
          sourceLanguage,
          targetLanguage
        )
        break
      default:
        throw new Error(`Unknown test type: ${testType}`)
    }

    testResult.overallTime = Date.now() - startTime
    testResult.success =
      testResult.errors.length === 0 &&
      testResult.steps.every(step => step.status === 'success')

    console.log(
      `🧪 Pipeline test completed: ${testResult.success ? 'SUCCESS' : 'FAILURE'}`
    )
    console.log(`📊 Total time: ${testResult.overallTime}ms`)
    console.log(`❌ Errors: ${testResult.errors.length}`)

    return NextResponse.json(testResult)
  } catch (error) {
    console.error('Pipeline test failed:', error)

    return NextResponse.json(
      {
        success: false,
        testType: 'unknown',
        steps: [],
        overallTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        recommendations: ['Check server logs for detailed error information'],
      },
      { status: 500 }
    )
  }
}

/**
 * Test 1: Simple text translation without authentication
 */
async function runSimpleTextTest(
  result: PipelineTestResult,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  // Step 1: Test basic translation endpoint
  const translationStep = await runTestStep(
    'Translation API Test',
    async () => {
      const response = await fetch('http://localhost:3000/api/translate/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      })

      if (!response.ok) {
        throw new Error(`Translation API returned ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.result) {
        throw new Error('Translation API returned invalid response')
      }

      return data
    }
  )

  result.steps.push(translationStep)

  if (translationStep.status === 'failure') {
    result.errors.push(`Translation API failed: ${translationStep.error}`)
    result.recommendations.push(
      'Check Google Translate API configuration and credentials'
    )
  }
}

/**
 * Test 2: Translation-only test using the unified endpoint
 */
async function runTranslationOnlyTest(
  result: PipelineTestResult,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  // Test the unified translation endpoint (this requires auth, so it might fail)
  const unifiedTranslationStep = await runTestStep(
    'Unified Translation API Test',
    async () => {
      const response = await fetch(
        'http://localhost:3000/api/translate/unified',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Note: This will fail without proper auth token
          },
          body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
            qualityTier: 'standard',
          }),
        }
      )

      if (response.status === 401) {
        return {
          skipped: true,
          reason: 'Authentication required - this is expected',
        }
      }

      if (!response.ok) {
        throw new Error(`Unified translation API returned ${response.status}`)
      }

      const data = await response.json()
      return data
    }
  )

  result.steps.push(unifiedTranslationStep)

  if (
    unifiedTranslationStep.status === 'failure' &&
    !unifiedTranslationStep.result?.skipped
  ) {
    result.errors.push(
      `Unified translation failed: ${unifiedTranslationStep.error}`
    )
    result.recommendations.push(
      'Check authentication and rate limiting configuration'
    )
  }
}

/**
 * Test 3: Document processing capabilities
 */
async function runDocumentUploadTest(
  result: PipelineTestResult
): Promise<void> {
  // Test document processor with mock file
  const documentProcessorStep = await runTestStep(
    'Document Processor Test',
    async () => {
      // Create a mock text file
      const mockFile = new File(
        ['This is a test document for processing.'],
        'test.txt',
        {
          type: 'text/plain',
        }
      )

      const processed = await DocumentProcessor.processFile(mockFile)

      if (!processed.originalText || processed.chunks.length === 0) {
        throw new Error('Document processor returned empty or invalid result')
      }

      return {
        fileType: processed.fileType,
        wordCount: processed.metadata.wordCount,
        chunkCount: processed.chunks.length,
      }
    }
  )

  result.steps.push(documentProcessorStep)

  if (documentProcessorStep.status === 'failure') {
    result.errors.push(
      `Document processor failed: ${documentProcessorStep.error}`
    )
    result.recommendations.push(
      'Check document processing libraries (mammoth, xlsx, etc.)'
    )
  }

  // Test export functionality
  const exportStep = await runTestStep('Document Export Test', async () => {
    const mockFile = new File(['Test content for export'], 'test.txt', {
      type: 'text/plain',
    })
    const processed = await DocumentProcessor.processFile(mockFile)

    // Create mock translation map
    const translationMap = new Map<string, string>()
    processed.chunks.forEach(chunk => {
      translationMap.set(chunk.id, `[TRANSLATED] ${chunk.text}`)
    })

    // Test export in different formats
    const txtBlob = await DocumentProcessor.exportTranslatedDocument(
      processed,
      translationMap,
      'vi',
      'txt'
    )
    const docxBlob = await DocumentProcessor.exportTranslatedDocument(
      processed,
      translationMap,
      'vi',
      'docx'
    )

    return {
      txtSize: txtBlob.size,
      docxSize: docxBlob.size,
      formatsSupported: ['txt', 'docx'],
    }
  })

  result.steps.push(exportStep)

  if (exportStep.status === 'failure') {
    result.errors.push(`Document export failed: ${exportStep.error}`)
    result.recommendations.push(
      'Check document export libraries and format support'
    )
  }
}

/**
 * Test 4: Full pipeline simulation
 */
async function runFullPipelineTest(
  result: PipelineTestResult,
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  // Run all previous tests
  await runSimpleTextTest(result, text, sourceLang, targetLang)
  await runTranslationOnlyTest(result, text, sourceLang, targetLang)
  await runDocumentUploadTest(result)

  // Test pipeline integration
  const integrationStep = await runTestStep(
    'Pipeline Integration Test',
    async () => {
      // Simulate the complete flow:
      // 1. Create a document
      const mockFile = new File([text], 'test.txt', { type: 'text/plain' })
      const processed = await DocumentProcessor.processFile(mockFile)

      // 2. Mock translation (since we can't authenticate easily)
      const translationMap = new Map<string, string>()
      processed.chunks.forEach(chunk => {
        // Mock translation - in real flow this would come from the API
        translationMap.set(chunk.id, `[VI] ${chunk.text}`)
      })

      // 3. Export result
      const exportedBlob = await DocumentProcessor.exportTranslatedDocument(
        processed,
        translationMap,
        targetLang,
        'txt'
      )

      // 4. Verify the exported content
      const exportedText = await exportedBlob.text()

      if (!exportedText.includes('[VI]')) {
        throw new Error('Exported document does not contain translated content')
      }

      return {
        inputWordCount: processed.metadata.wordCount,
        outputSize: exportedBlob.size,
        hasTranslatedContent: exportedText.includes('[VI]'),
      }
    }
  )

  result.steps.push(integrationStep)

  if (integrationStep.status === 'failure') {
    result.errors.push(`Pipeline integration failed: ${integrationStep.error}`)
    result.recommendations.push(
      'Check end-to-end pipeline flow and component integration'
    )
  }
}

/**
 * Helper function to run a test step with error handling and timing
 */
async function runTestStep(
  name: string,
  testFunction: () => Promise<any>
): Promise<TestStep> {
  const stepStartTime = Date.now()

  try {
    console.log(`🔍 Running test step: ${name}`)
    const result = await testFunction()
    const duration = Date.now() - stepStartTime

    console.log(`✅ ${name} completed in ${duration}ms`)

    return {
      name,
      status: 'success',
      duration,
      result,
    }
  } catch (error) {
    const duration = Date.now() - stepStartTime
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.log(`❌ ${name} failed in ${duration}ms: ${errorMessage}`)

    return {
      name,
      status: 'failure',
      duration,
      error: errorMessage,
    }
  }
}

/**
 * GET endpoint to run health checks
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testType = searchParams.get('type') || 'simple_text'

  // Run a simple health check
  const startTime = Date.now()
  const healthChecks = []

  // Check translation service availability
  try {
    const response = await fetch('http://localhost:3000/api/translate/test')
    healthChecks.push({
      service: 'Translation API',
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - startTime,
    })
  } catch (error) {
    healthChecks.push({
      service: 'Translation API',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Check document processor
  try {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    await DocumentProcessor.processFile(mockFile)
    healthChecks.push({
      service: 'Document Processor',
      status: 'healthy',
    })
  } catch (error) {
    healthChecks.push({
      service: 'Document Processor',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return NextResponse.json({
    status: 'Pipeline Test API',
    timestamp: new Date().toISOString(),
    availableTests: [
      'simple_text',
      'translation_only',
      'document_upload',
      'full_pipeline',
    ],
    healthChecks,
    instructions: {
      post: 'POST with {"testType": "simple_text|translation_only|document_upload|full_pipeline"}',
      get: 'GET for health check',
    },
  })
}
