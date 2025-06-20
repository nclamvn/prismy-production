import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/documents/intelligence/route'
import { createRouteHandlerClient } from '@/lib/supabase'
import { backgroundQueue } from '@/src/lib/background-processing-queue'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/src/lib/background-processing-queue')
jest.mock('@/lib/rate-limiter')
jest.mock('@/lib/csrf')
jest.mock('@/src/lib/ai/ai-orchestrator')
jest.mock('@/src/lib/analytics')

const mockSupabase = {
  auth: {
    getSession: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

describe('/api/documents/intelligence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('POST', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }))

      const request = new NextRequest('http://localhost:3000/api/documents/intelligence', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required for document intelligence')
    })

    it('should validate file type and size', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        }
      })

      // Mock CSRF validation
      const { validateCSRFMiddleware } = await import('@/lib/csrf')
      ;(validateCSRFMiddleware as jest.Mock).mockResolvedValue({ valid: true })

      // Mock rate limiting
      const { getRateLimitForTier } = await import('@/lib/rate-limiter')
      ;(getRateLimitForTier as jest.Mock).mockResolvedValue({ success: true, remaining: 100 })

      // Mock user profile
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'free' }
            })
          })
        })
      })

      // Test with invalid file type
      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.exe', { type: 'application/exe' }))
      formData.append('options', JSON.stringify({ analysisDepth: 'standard' }))

      const request = new NextRequest('http://localhost:3000/api/documents/intelligence', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should process valid document and return quick insights', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        }
      })

      // Mock CSRF validation
      const { validateCSRFMiddleware } = await import('@/lib/csrf')
      ;(validateCSRFMiddleware as jest.Mock).mockResolvedValue({ valid: true })

      // Mock rate limiting
      const { getRateLimitForTier } = await import('@/lib/rate-limiter')
      ;(getRateLimitForTier as jest.Mock).mockResolvedValue({ success: true, remaining: 100 })

      // Mock user profile
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'premium' }
            })
          })
        })
      })

      // Mock background job creation
      ;(backgroundQueue.addJob as jest.Mock).mockResolvedValue('job_123')

      // Create a valid PDF file
      const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // PDF header
      const file = new File([pdfContent], 'test.pdf', { type: 'application/pdf' })
      
      // Mock the arrayBuffer method for test environment
      file.arrayBuffer = jest.fn().mockResolvedValue(pdfContent.buffer)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('options', JSON.stringify({ 
        analysisDepth: 'standard',
        enablePredictiveInsights: true 
      }))

      // Create request with manually mocked formData method
      const request = new NextRequest('http://localhost:3000/api/documents/intelligence', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': 'test-token'
        }
      })
      
      // Mock the formData method to return our test data
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.intelligence).toBeDefined()
      expect(data.intelligence.quickInsights).toBeDefined()
      expect(data.intelligence.backgroundJobId).toBeDefined()
      expect(data.intelligence.documentId).toBeDefined()
    })
  })

  describe('GET', () => {
    it('should return job status for valid job ID', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'processing',
        progress: 50,
        estimatedDuration: 120000,
        result: null,
        error: null
      };

      (backgroundQueue.getJob as jest.Mock).mockResolvedValue(mockJob)

      const request = new NextRequest('http://localhost:3000/api/documents/intelligence?jobId=job_123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.job.id).toBe('job_123')
      expect(data.job.status).toBe('processing')
      expect(data.job.progress).toBe(50)
    })

    it('should return 404 for non-existent job', async () => {
      ;(backgroundQueue.getJob as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/documents/intelligence?jobId=invalid_job')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Processing job not found')
    })

    it('should require job ID or document ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/intelligence')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Job ID or Document ID required')
    })
  })
})

describe('Intelligence Job Processing Integration', () => {
  it('should create and process intelligence job', async () => {
    const { intelligenceJobProcessor } = await import('@/src/lib/ai/intelligence-job-processor')
    
    const mockJob = {
      id: 'job_123',
      type: 'document_intelligence' as const,
      status: 'pending' as const,
      priority: 'medium' as const,
      userId: 'test-user-id',
      data: {
        documentId: 'doc_123',
        fileBuffer: Buffer.from('test pdf content').toString('base64'),
        filename: 'test.pdf',
        fileType: 'application/pdf',
        options: {
          analysisDepth: 'standard',
          userId: 'test-user-id',
          userTier: 'premium',
          userContext: {
            recentDocuments: [],
            queryHistory: [],
            expertiseDomains: [],
            commonTopics: []
          }
        }
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      metadata: {
        filename: 'test.pdf',
        fileSize: 1024,
        analysisDepth: 'standard'
      }
    }

    // Mock AI Orchestrator
    const { aiOrchestrator } = await import('@/src/lib/ai/ai-orchestrator')
    ;(aiOrchestrator.processDocumentIntelligence as jest.Mock).mockResolvedValue({
      documentId: 'doc_123',
      structure: {
        metadata: {
          filename: 'test.pdf',
          wordCount: 100,
          pageCount: 1,
          language: 'en'
        }
      },
      content: {
        fullText: 'Test document content',
        keyEntities: [],
        concepts: [],
        relationships: []
      },
      insights: {
        summary: 'Test summary',
        topics: [],
        classification: {
          documentType: 'document',
          domain: 'general'
        }
      },
      queryable: {
        embeddings: [[0.1, 0.2, 0.3]]
      }
    })

    // Mock Supabase for saving results
    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ data: null, error: null })
    })

    const result = await intelligenceJobProcessor.processIntelligenceJob(mockJob)

    expect(result).toBeDefined()
    expect(result.documentId).toBe('doc_123')
    expect(result.documentIntelligence).toBeDefined()
    expect(result.processingMetrics).toBeDefined()
    expect(result.processingMetrics.totalTime).toBeGreaterThan(0)
  })
})