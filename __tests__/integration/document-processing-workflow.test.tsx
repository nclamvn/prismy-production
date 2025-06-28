// Document Processing Workflow Integration Tests
// End-to-end testing of document upload, analysis, and translation pipeline

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, createMockUser, createMockFile } from '../utils/test-utils'
import { BatchUpload } from '../../components/documents/BatchUpload'
import { DocumentPreview } from '../../components/documents/DocumentPreview'
import { WorkspaceIntelligenceProvider } from '../../contexts/WorkspaceIntelligenceContext'
import type { Document, DocumentUploadResponse } from '../../types/documents'

// Mock workspace context for document processing
const mockWorkspaceContext = {
  state: {
    currentMode: 'document_processing' as const,
    activities: [],
    patterns: {
      preferredLanguages: { source: ['en'], target: ['vi', 'es'] },
      workingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
      frequentActions: ['upload', 'translate', 'download'],
      efficiency: { averageProcessingTime: 5000, preferredWorkflowSteps: [], errorRate: 0.03 },
      preferences: { preferredAgents: ['document-analyzer'], autoTranslation: true, qualityThreshold: 0.85 }
    },
    activeOperations: [],
    suggestions: [],
    insights: [],
    isProcessing: false,
    connectionStatus: 'connected' as const
  },
  setMode: jest.fn(),
  updateContext: jest.fn(),
  addActivity: jest.fn(),
  operations: {
    start: jest.fn(),
    update: jest.fn(),
    complete: jest.fn(),
    fail: jest.fn()
  },
  suggestions: {
    add: jest.fn(),
    dismiss: jest.fn(),
    apply: jest.fn()
  },
  insights: {
    add: jest.fn(),
    getByCategory: jest.fn()
  },
  sync: jest.fn()
}

// Mock document processing responses
const mockUploadResponse: DocumentUploadResponse = {
  document: {
    id: 'doc-456',
    name: 'test-document.pdf',
    originalName: 'test-document.pdf',
    type: 'pdf',
    format: 'pdf',
    size: 2048000,
    url: 'https://example.com/documents/test-document.pdf',
    status: 'uploading',
    targetLanguages: [],
    content: null,
    metadata: {
      originalSize: 2048000,
      pageCount: 0,
      wordCount: 0,
      characterCount: 0,
      language: 'unknown',
      security: { encrypted: false, passwordProtected: false, permissions: [] },
      quality: { score: 0, issues: [] }
    },
    processing: {
      stages: [{ name: 'upload', status: 'in_progress', duration: 0 }],
      progress: 10,
      errors: [],
      warnings: [],
      resources: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0 }
    },
    translations: [],
    analyses: [],
    userId: 'user-123',
    tags: [],
    isPublic: false,
    shareSettings: {
      isPublic: false,
      allowDownload: true,
      allowCopy: true,
      allowPrint: true,
      permissions: []
    },
    version: 1,
    revisions: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  uploadUrl: 'https://example.com/upload-endpoint',
  processingJobId: 'job-456'
}

const mockProcessedDocument: Document = {
  ...mockUploadResponse.document,
  status: 'completed',
  content: {
    extractedText: 'This is the extracted text from the document. It contains multiple paragraphs and sections.',
    structure: {
      type: 'hierarchical',
      outline: [
        { level: 1, title: 'Introduction', page: 1 },
        { level: 2, title: 'Overview', page: 1 },
        { level: 1, title: 'Main Content', page: 2 },
        { level: 2, title: 'Details', page: 3 }
      ],
      navigation: {
        totalPages: 5,
        bookmarks: [
          { title: 'Introduction', page: 1 },
          { title: 'Main Content', page: 2 },
          { title: 'Conclusion', page: 5 }
        ],
        hyperlinks: []
      },
      formatting: {
        fonts: ['Arial', 'Times New Roman'],
        colors: ['#000000', '#333333'],
        styles: ['bold', 'italic', 'underline']
      }
    },
    elements: [
      {
        id: 'elem-1',
        type: 'text',
        content: 'Introduction',
        position: { x: 100, y: 100, width: 400, height: 30 },
        page: 1,
        style: { fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold' }
      },
      {
        id: 'elem-2',
        type: 'text',
        content: 'This is the main content of the document.',
        position: { x: 100, y: 150, width: 400, height: 200 },
        page: 1,
        style: { fontSize: 12, fontFamily: 'Arial' }
      }
    ],
    pages: [
      {
        number: 1,
        width: 595,
        height: 842,
        elements: ['elem-1', 'elem-2'],
        thumbnail: 'https://example.com/thumbnails/page-1.jpg'
      }
    ],
    sections: [
      {
        id: 'section-1',
        title: 'Introduction',
        startPage: 1,
        endPage: 1,
        elements: ['elem-1', 'elem-2']
      }
    ]
  },
  metadata: {
    originalSize: 2048000,
    pageCount: 5,
    wordCount: 450,
    characterCount: 2500,
    language: 'en',
    security: { encrypted: false, passwordProtected: false, permissions: ['read', 'copy'] },
    quality: { score: 0.92, issues: [] }
  },
  processing: {
    stages: [
      { name: 'upload', status: 'completed', duration: 2000 },
      { name: 'extraction', status: 'completed', duration: 8000 },
      { name: 'analysis', status: 'completed', duration: 5000 }
    ],
    progress: 100,
    errors: [],
    warnings: [],
    resources: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0 }
  }
}

// Enhanced MSW handlers for document processing
import { rest } from 'msw'
import { server } from '../mocks/server'

const documentProcessingHandlers = [
  rest.post('/api/documents/upload', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: mockUploadResponse })
    )
  }),
  
  rest.get('/api/documents/:id', async (req, res, ctx) => {
    const { id } = req.params
    
    if (id === 'doc-456') {
      return res(
        ctx.status(200),
        ctx.json({ success: true, data: mockProcessedDocument })
      )
    }
    
    return res(
      ctx.status(404),
      ctx.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } })
    )
  }),
  
  rest.get('/api/documents/:id/status', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          status: 'completed',
          progress: 100,
          stages: mockProcessedDocument.processing.stages
        }
      })
    )
  }),
  
  rest.post('/api/documents/:id/translate', async (req, res, ctx) => {
    const body = await req.json()
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          jobId: 'translate-job-123',
          estimatedDuration: 30000,
          targetLanguage: body.targetLanguage
        }
      })
    )
  }),
  
  rest.get('/api/documents/:id/translations/:lang', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          translatedText: 'Đây là văn bản được dịch từ tài liệu.',
          confidence: 0.89,
          status: 'completed'
        }
      })
    )
  }),
  
  rest.post('/api/documents/batch', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          batchId: 'batch-789',
          documents: [mockUploadResponse.document],
          totalFiles: 1,
          estimatedDuration: 60000
        }
      })
    )
  })
]

describe('Document Processing Workflow Integration', () => {
  const mockUser = createMockUser()

  beforeAll(() => {
    server.use(...documentProcessingHandlers)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Single Document Upload and Processing', () => {
    it('completes full document processing pipeline', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Step 1: File selection
      const fileInput = screen.getByLabelText(/choose files/i)
      const testFile = createMockFile('test-document.pdf', 'PDF content', 'application/pdf')
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      // Verify file preview
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText(/pdf/i)).toBeInTheDocument()

      // Step 2: Configure processing options
      const targetLanguageSelect = screen.getByLabelText(/target languages/i)
      fireEvent.change(targetLanguageSelect, { target: { value: 'vi' } })

      const addLanguageButton = screen.getByText(/add language/i)
      fireEvent.click(addLanguageButton)

      expect(screen.getByText(/vietnamese/i)).toBeInTheDocument()

      // Step 3: Start upload
      const uploadButton = screen.getByText(/upload and process/i)
      fireEvent.click(uploadButton)

      // Verify upload initiation
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      expect(mockWorkspaceContext.operations.start).toHaveBeenCalledWith({
        type: 'document_upload',
        input: { files: [testFile], targetLanguages: ['vi'] }
      })

      // Step 4: Monitor processing progress
      await waitFor(() => {
        expect(screen.getByText(/processing document/i)).toBeInTheDocument()
      })

      // Verify progress updates
      expect(screen.getByText(/10%/)).toBeInTheDocument()

      // Step 5: Complete processing
      await waitFor(() => {
        expect(screen.getByText(/processing completed/i)).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(mockWorkspaceContext.operations.complete).toHaveBeenCalled()
      expect(mockWorkspaceContext.addActivity).toHaveBeenCalledWith({
        type: 'document_processing',
        status: 'completed',
        input: 'test-document.pdf',
        output: expect.objectContaining({
          id: 'doc-456',
          status: 'completed'
        }),
        duration: expect.any(Number)
      })
    })

    it('handles upload errors gracefully', async () => {
      // Mock upload failure
      server.use(
        rest.post('/api/documents/upload', (req, res, ctx) => {
          return res(
            ctx.status(413),
            ctx.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds limit' } })
          )
        })
      )

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const fileInput = screen.getByLabelText(/choose files/i)
      const largeFile = createMockFile('large-document.pdf', 'PDF content', 'application/pdf')
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      const uploadButton = screen.getByText(/upload and process/i)
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds limit/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/try again/i)).toBeInTheDocument()
      expect(mockWorkspaceContext.operations.fail).toHaveBeenCalled()
    })

    it('handles processing timeouts', async () => {
      // Mock slow processing
      server.use(
        rest.get('/api/documents/:id/status', (req, res, ctx) => {
          return res(
            ctx.delay(5000),
            ctx.status(200),
            ctx.json({
              success: true,
              data: { status: 'processing', progress: 50 }
            })
          )
        })
      )

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const fileInput = screen.getByLabelText(/choose files/i)
      const testFile = createMockFile('slow-document.pdf', 'PDF content', 'application/pdf')
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      const uploadButton = screen.getByText(/upload and process/i)
      fireEvent.click(uploadButton)

      // Verify extended processing time handling
      await waitFor(() => {
        expect(screen.getByText(/processing is taking longer than expected/i)).toBeInTheDocument()
      }, { timeout: 15000 })

      expect(screen.getByText(/continue waiting/i)).toBeInTheDocument()
      expect(screen.getByText(/cancel processing/i)).toBeInTheDocument()
    })
  })

  describe('Batch Document Processing', () => {
    it('processes multiple documents simultaneously', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Select multiple files
      const fileInput = screen.getByLabelText(/choose files/i)
      const files = [
        createMockFile('document1.pdf', 'PDF content 1', 'application/pdf'),
        createMockFile('document2.docx', 'DOCX content 2', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        createMockFile('document3.txt', 'Text content 3', 'text/plain')
      ]
      
      fireEvent.change(fileInput, { target: { files } })

      // Verify batch preview
      expect(screen.getByText('3 files selected')).toBeInTheDocument()
      expect(screen.getByText('document1.pdf')).toBeInTheDocument()
      expect(screen.getByText('document2.docx')).toBeInTheDocument()
      expect(screen.getByText('document3.txt')).toBeInTheDocument()

      // Configure batch settings
      const batchModeToggle = screen.getByLabelText(/batch processing mode/i)
      fireEvent.click(batchModeToggle)

      const targetLanguageSelect = screen.getByLabelText(/target languages/i)
      fireEvent.change(targetLanguageSelect, { target: { value: 'vi' } })

      // Start batch processing
      const uploadButton = screen.getByText(/upload and process all/i)
      fireEvent.click(uploadButton)

      // Verify batch operation tracking
      expect(mockWorkspaceContext.operations.start).toHaveBeenCalledWith({
        type: 'batch_document_processing',
        input: { files, targetLanguages: ['vi'], batchMode: true }
      })

      // Monitor batch progress
      await waitFor(() => {
        expect(screen.getByText(/processing 3 documents/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/batch progress: 33%/i)).toBeInTheDocument()
    })

    it('handles partial batch failures', async () => {
      // Mock mixed success/failure responses
      server.use(
        rest.post('/api/documents/batch', (req, res, ctx) => {
          return res(
            ctx.status(207), // Multi-status
            ctx.json({
              success: true,
              data: {
                batchId: 'batch-mixed',
                results: [
                  { file: 'document1.pdf', status: 'completed', documentId: 'doc-1' },
                  { file: 'document2.docx', status: 'failed', error: 'Unsupported format' },
                  { file: 'document3.txt', status: 'completed', documentId: 'doc-3' }
                ],
                summary: { total: 3, succeeded: 2, failed: 1 }
              }
            })
          )
        })
      )

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const fileInput = screen.getByLabelText(/choose files/i)
      const files = [
        createMockFile('document1.pdf', 'PDF content 1', 'application/pdf'),
        createMockFile('document2.docx', 'DOCX content 2', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        createMockFile('document3.txt', 'Text content 3', 'text/plain')
      ]
      
      fireEvent.change(fileInput, { target: { files } })

      const uploadButton = screen.getByText(/upload and process all/i)
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/batch completed with partial success/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/2 succeeded, 1 failed/i)).toBeInTheDocument()
      expect(screen.getByText(/unsupported format/i)).toBeInTheDocument()
    })
  })

  describe('Document Analysis and Translation Integration', () => {
    it('completes document translation workflow', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <DocumentPreview document={mockProcessedDocument} />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify document is loaded
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText(/5 pages/i)).toBeInTheDocument()

      // Start translation
      const translateButton = screen.getByText(/translate document/i)
      fireEvent.click(translateButton)

      // Select target language
      const vietnameseOption = screen.getByText(/vietnamese/i)
      fireEvent.click(vietnameseOption)

      // Confirm translation
      const confirmButton = screen.getByText(/start translation/i)
      fireEvent.click(confirmButton)

      // Verify translation tracking
      expect(mockWorkspaceContext.operations.start).toHaveBeenCalledWith({
        type: 'document_translation',
        input: {
          documentId: 'doc-456',
          targetLanguage: 'vi',
          sourceLanguage: 'en'
        }
      })

      // Monitor translation progress
      await waitFor(() => {
        expect(screen.getByText(/translating document/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/0% translated/i)).toBeInTheDocument()

      // Complete translation
      await waitFor(() => {
        expect(screen.getByText(/translation completed/i)).toBeInTheDocument()
      }, { timeout: 15000 })

      expect(screen.getByText(/view translated version/i)).toBeInTheDocument()
      expect(mockWorkspaceContext.operations.complete).toHaveBeenCalled()
    })

    it('provides document insights and suggestions', async () => {
      const contextWithInsights = {
        ...mockWorkspaceContext,
        state: {
          ...mockWorkspaceContext.state,
          insights: [
            {
              id: 'insight-1',
              type: 'document_quality',
              title: 'High quality document detected',
              description: 'This document has excellent OCR quality (92%)',
              confidence: 0.92,
              metadata: { qualityScore: 0.92, pageCount: 5 }
            },
            {
              id: 'insight-2',
              type: 'translation_suggestion',
              title: 'Multiple languages recommended',
              description: 'Based on content analysis, consider translating to Spanish and French',
              confidence: 0.78,
              metadata: { recommendedLanguages: ['es', 'fr'] }
            }
          ]
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={contextWithInsights}>
          <DocumentPreview document={mockProcessedDocument} />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify insights panel
      const insightsTab = screen.getByText(/insights/i)
      fireEvent.click(insightsTab)

      expect(screen.getByText(/high quality document detected/i)).toBeInTheDocument()
      expect(screen.getByText(/multiple languages recommended/i)).toBeInTheDocument()

      // Apply suggestion
      const applyButton = screen.getByText(/apply suggestion/i)
      fireEvent.click(applyButton)

      expect(mockWorkspaceContext.suggestions.apply).toHaveBeenCalled()
    })

    it('handles large document processing efficiently', async () => {
      const largeDocument = {
        ...mockProcessedDocument,
        metadata: {
          ...mockProcessedDocument.metadata,
          pageCount: 50,
          wordCount: 10000,
          characterCount: 65000
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <DocumentPreview document={largeDocument} />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify large document handling
      expect(screen.getByText(/50 pages/i)).toBeInTheDocument()
      expect(screen.getByText(/10,000 words/i)).toBeInTheDocument()

      // Check lazy loading
      expect(screen.getByTestId('page-1')).toBeInTheDocument()
      expect(screen.queryByTestId('page-10')).not.toBeInTheDocument()

      // Navigate and verify lazy loading
      const pageInput = screen.getByLabelText(/go to page/i)
      fireEvent.change(pageInput, { target: { value: '10' } })
      fireEvent.keyDown(pageInput, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByTestId('page-10')).toBeInTheDocument()
      })
    })
  })

  describe('Collaborative Document Workflows', () => {
    it('shares documents with team members', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <DocumentPreview document={mockProcessedDocument} />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Open sharing options
      const shareButton = screen.getByLabelText(/share document/i)
      fireEvent.click(shareButton)

      expect(screen.getByText(/share with team/i)).toBeInTheDocument()

      // Generate sharing link
      const generateLinkButton = screen.getByText(/generate sharing link/i)
      fireEvent.click(generateLinkButton)

      await waitFor(() => {
        expect(screen.getByText(/link generated/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/copy link/i)).toBeInTheDocument()

      // Set permissions
      const permissionsSelect = screen.getByLabelText(/permissions/i)
      fireEvent.change(permissionsSelect, { target: { value: 'view_only' } })

      expect(screen.getByText(/view only access/i)).toBeInTheDocument()
    })

    it('tracks document collaboration history', async () => {
      const documentWithHistory = {
        ...mockProcessedDocument,
        revisions: [
          {
            id: 'rev-1',
            version: 1,
            author: 'user-123',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            changes: ['Translation added: Vietnamese'],
            description: 'Initial translation'
          },
          {
            id: 'rev-2',
            version: 2,
            author: 'user-456',
            timestamp: new Date('2024-01-01T14:00:00Z'),
            changes: ['Annotations added', 'Quality review completed'],
            description: 'Quality review and annotations'
          }
        ]
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <DocumentPreview document={documentWithHistory} />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // View revision history
      const historyTab = screen.getByText(/history/i)
      fireEvent.click(historyTab)

      expect(screen.getByText(/initial translation/i)).toBeInTheDocument()
      expect(screen.getByText(/quality review and annotations/i)).toBeInTheDocument()

      // Compare revisions
      const compareButton = screen.getByText(/compare versions/i)
      fireEvent.click(compareButton)

      expect(screen.getByText(/version comparison/i)).toBeInTheDocument()
    })
  })

  describe('Performance and Scalability', () => {
    it('handles concurrent document operations', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Start multiple operations simultaneously
      const fileInput = screen.getByLabelText(/choose files/i)
      
      // Upload first batch
      const batch1 = [createMockFile('doc1.pdf', 'Content 1', 'application/pdf')]
      fireEvent.change(fileInput, { target: { files: batch1 } })
      const upload1 = screen.getByText(/upload and process/i)
      fireEvent.click(upload1)

      // Immediately start second batch
      const batch2 = [createMockFile('doc2.pdf', 'Content 2', 'application/pdf')]
      fireEvent.change(fileInput, { target: { files: batch2 } })
      const upload2 = screen.getByText(/upload and process/i)
      fireEvent.click(upload2)

      // Verify concurrent operations are handled
      await waitFor(() => {
        expect(screen.getByText(/2 operations in progress/i)).toBeInTheDocument()
      })

      expect(mockWorkspaceContext.operations.start).toHaveBeenCalledTimes(2)
    })

    it('manages memory efficiently with large files', async () => {
      const performanceObserver = jest.fn()
      global.PerformanceObserver = jest.fn().mockImplementation(() => ({
        observe: performanceObserver,
        disconnect: jest.fn()
      }))

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Simulate large file upload
      const largeFile = createMockFile('large-document.pdf', 'x'.repeat(10000000), 'application/pdf')
      const fileInput = screen.getByLabelText(/choose files/i)
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      // Verify memory management warnings
      expect(screen.getByText(/large file detected/i)).toBeInTheDocument()
      expect(screen.getByText(/processing may take longer/i)).toBeInTheDocument()

      const uploadButton = screen.getByText(/upload and process/i)
      fireEvent.click(uploadButton)

      // Verify chunked upload
      await waitFor(() => {
        expect(screen.getByText(/uploading in chunks/i)).toBeInTheDocument()
      })
    })

    it('provides real-time progress updates', async () => {
      // Mock progressive status updates
      let progressCount = 0
      server.use(
        rest.get('/api/documents/:id/status', (req, res, ctx) => {
          progressCount += 20
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                status: progressCount >= 100 ? 'completed' : 'processing',
                progress: Math.min(progressCount, 100),
                currentStage: progressCount < 40 ? 'extraction' : 'analysis'
              }
            })
          )
        })
      )

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <BatchUpload />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const fileInput = screen.getByLabelText(/choose files/i)
      const testFile = createMockFile('progress-test.pdf', 'PDF content', 'application/pdf')
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      const uploadButton = screen.getByText(/upload and process/i)
      fireEvent.click(uploadButton)

      // Verify progress updates
      await waitFor(() => {
        expect(screen.getByText(/20%/)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/extraction/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/analysis/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/100%/)).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })
})