// DocumentPreview Component Tests
// Comprehensive test suite for document preview functionality

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockUser } from '../../utils/test-utils'
import { DocumentPreview } from '../../../components/documents/DocumentPreview'
import type { Document } from '../../../types/documents'

// Mock document data
const mockDocument: Document = {
  id: 'doc-123',
  name: 'test-document.pdf',
  originalName: 'test-document.pdf',
  type: 'pdf',
  format: 'pdf',
  size: 1024000,
  url: 'https://example.com/documents/test-document.pdf',
  status: 'completed',
  targetLanguages: ['vi', 'es'],
  content: {
    extractedText: 'This is a test document with multiple lines.\nSecond line of content.\nThird line with more text.',
    structure: {
      type: 'linear',
      outline: [
        { level: 1, title: 'Chapter 1', page: 1 },
        { level: 2, title: 'Section 1.1', page: 1 },
        { level: 1, title: 'Chapter 2', page: 2 }
      ],
      navigation: {
        totalPages: 3,
        bookmarks: [
          { title: 'Introduction', page: 1 },
          { title: 'Conclusion', page: 3 }
        ],
        hyperlinks: [
          { text: 'Link 1', url: 'https://example.com', page: 1 }
        ]
      },
      formatting: {
        fonts: ['Arial', 'Times New Roman'],
        colors: ['#000000', '#0066CC'],
        styles: ['bold', 'italic']
      }
    },
    elements: [
      {
        id: 'elem-1',
        type: 'text',
        content: 'This is a test document',
        position: { x: 100, y: 100, width: 200, height: 20 },
        page: 1,
        style: { fontSize: 12, fontFamily: 'Arial' }
      },
      {
        id: 'elem-2',
        type: 'image',
        content: 'image-placeholder',
        position: { x: 100, y: 150, width: 300, height: 200 },
        page: 1,
        style: {}
      }
    ],
    pages: [
      {
        number: 1,
        width: 595,
        height: 842,
        elements: ['elem-1', 'elem-2'],
        thumbnail: 'https://example.com/thumbnails/page-1.jpg'
      },
      {
        number: 2,
        width: 595,
        height: 842,
        elements: [],
        thumbnail: 'https://example.com/thumbnails/page-2.jpg'
      }
    ],
    sections: [
      {
        id: 'section-1',
        title: 'Introduction',
        startPage: 1,
        endPage: 1,
        elements: ['elem-1']
      }
    ]
  },
  metadata: {
    originalSize: 1024000,
    pageCount: 3,
    wordCount: 150,
    characterCount: 750,
    language: 'en',
    security: {
      encrypted: false,
      passwordProtected: false,
      permissions: ['read', 'copy']
    },
    quality: {
      score: 0.9,
      issues: []
    }
  },
  processing: {
    stages: [
      { name: 'upload', status: 'completed', duration: 1000 },
      { name: 'extraction', status: 'completed', duration: 5000 },
      { name: 'analysis', status: 'completed', duration: 3000 }
    ],
    progress: 100,
    errors: [],
    warnings: [],
    resources: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0
    }
  },
  translations: [],
  analyses: [],
  userId: 'user-123',
  tags: ['important', 'draft'],
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
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
}

const mockUser = createMockUser()

describe('DocumentPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders document preview with basic information', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText(/3 pages/i)).toBeInTheDocument()
      expect(screen.getByText(/150 words/i)).toBeInTheDocument()
    })

    it('shows document status', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })

    it('displays document metadata', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByText(/1.0 MB/i)).toBeInTheDocument()
      expect(screen.getByText(/pdf/i)).toBeInTheDocument()
    })

    it('shows processing information', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const processingTab = screen.getByText(/processing/i)
      fireEvent.click(processingTab)
      
      expect(screen.getByText(/upload/i)).toBeInTheDocument()
      expect(screen.getByText(/extraction/i)).toBeInTheDocument()
      expect(screen.getByText(/analysis/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('displays page navigation controls', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByLabelText(/previous page/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/next page/i)).toBeInTheDocument()
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    })

    it('navigates between pages', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const nextButton = screen.getByLabelText(/next page/i)
      fireEvent.click(nextButton)
      
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
    })

    it('disables navigation buttons at boundaries', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const prevButton = screen.getByLabelText(/previous page/i)
      expect(prevButton).toBeDisabled()
      
      // Navigate to last page
      const nextButton = screen.getByLabelText(/next page/i)
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      
      expect(nextButton).toBeDisabled()
    })

    it('supports keyboard navigation', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const container = screen.getByRole('main')
      
      fireEvent.keyDown(container, { key: 'ArrowRight' })
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
      
      fireEvent.keyDown(container, { key: 'ArrowLeft' })
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    })
  })

  describe('Zoom and View Controls', () => {
    it('displays zoom controls', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fit to width/i)).toBeInTheDocument()
    })

    it('adjusts zoom level', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const zoomInButton = screen.getByLabelText(/zoom in/i)
      fireEvent.click(zoomInButton)
      
      expect(screen.getByText(/125%/i)).toBeInTheDocument()
    })

    it('fits document to width', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const fitToWidthButton = screen.getByLabelText(/fit to width/i)
      fireEvent.click(fitToWidthButton)
      
      expect(screen.getByText(/fit width/i)).toBeInTheDocument()
    })

    it('supports full screen mode', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const fullscreenButton = screen.getByLabelText(/full screen/i)
      fireEvent.click(fullscreenButton)
      
      expect(screen.getByLabelText(/exit full screen/i)).toBeInTheDocument()
    })
  })

  describe('Content Display', () => {
    it('shows document outline', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const outlineTab = screen.getByText(/outline/i)
      fireEvent.click(outlineTab)
      
      expect(screen.getByText('Chapter 1')).toBeInTheDocument()
      expect(screen.getByText('Section 1.1')).toBeInTheDocument()
      expect(screen.getByText('Chapter 2')).toBeInTheDocument()
    })

    it('navigates to outline items', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const outlineTab = screen.getByText(/outline/i)
      fireEvent.click(outlineTab)
      
      const chapter2 = screen.getByText('Chapter 2')
      fireEvent.click(chapter2)
      
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
    })

    it('displays extracted text', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const textTab = screen.getByText(/text/i)
      fireEvent.click(textTab)
      
      expect(screen.getByText(/this is a test document/i)).toBeInTheDocument()
    })

    it('highlights search results in text', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const searchInput = screen.getByPlaceholderText(/search in document/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })
      
      const highlightedText = screen.getByText('test')
      expect(highlightedText).toHaveClass('bg-yellow-200')
    })
  })

  describe('Search Functionality', () => {
    it('performs document search', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const searchInput = screen.getByPlaceholderText(/search in document/i)
      fireEvent.change(searchInput, { target: { value: 'document' } })
      
      expect(screen.getByText(/2 results/i)).toBeInTheDocument()
    })

    it('navigates between search results', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const searchInput = screen.getByPlaceholderText(/search in document/i)
      fireEvent.change(searchInput, { target: { value: 'line' } })
      
      const nextResultButton = screen.getByLabelText(/next result/i)
      fireEvent.click(nextResultButton)
      
      expect(screen.getByText(/result 2 of 2/i)).toBeInTheDocument()
    })

    it('clears search results', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const searchInput = screen.getByPlaceholderText(/search in document/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })
      
      const clearButton = screen.getByLabelText(/clear search/i)
      fireEvent.click(clearButton)
      
      expect(searchInput).toHaveValue('')
      expect(screen.queryByText(/results/i)).not.toBeInTheDocument()
    })
  })

  describe('Document Actions', () => {
    it('allows document download', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const downloadButton = screen.getByLabelText(/download document/i)
      fireEvent.click(downloadButton)
      
      expect(screen.getByText(/downloading/i)).toBeInTheDocument()
    })

    it('enables document sharing', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const shareButton = screen.getByLabelText(/share document/i)
      fireEvent.click(shareButton)
      
      expect(screen.getByText(/share document/i)).toBeInTheDocument()
      expect(screen.getByText(/generate link/i)).toBeInTheDocument()
    })

    it('supports document printing', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const printButton = screen.getByLabelText(/print document/i)
      fireEvent.click(printButton)
      
      // Verify print dialog would open
      expect(window.print).toHaveBeenCalled()
    })

    it('allows adding annotations', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const annotateButton = screen.getByLabelText(/add annotation/i)
      fireEvent.click(annotateButton)
      
      expect(screen.getByText(/annotation mode/i)).toBeInTheDocument()
    })
  })

  describe('Translation Integration', () => {
    it('shows translation options', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      expect(screen.getByText(/target language/i)).toBeInTheDocument()
      expect(screen.getByText(/vietnamese/i)).toBeInTheDocument()
      expect(screen.getByText(/spanish/i)).toBeInTheDocument()
    })

    it('initiates document translation', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      const vietnameseOption = screen.getByText(/vietnamese/i)
      fireEvent.click(vietnameseOption)
      
      expect(screen.getByText(/translating document/i)).toBeInTheDocument()
    })

    it('displays translation progress', async () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      const vietnameseOption = screen.getByText(/vietnamese/i)
      fireEvent.click(vietnameseOption)
      
      await waitFor(() => {
        expect(screen.getByText(/25% translated/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles loading errors gracefully', () => {
      const errorDocument = { ...mockDocument, url: 'invalid-url' }
      render(<DocumentPreview document={errorDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByText(/failed to load document/i)).toBeInTheDocument()
      expect(screen.getByText(/try again/i)).toBeInTheDocument()
    })

    it('shows processing errors', () => {
      const processingErrorDoc = {
        ...mockDocument,
        processing: {
          ...mockDocument.processing,
          errors: [{ message: 'Extraction failed', code: 'EXTRACTION_ERROR' }]
        }
      }
      
      render(<DocumentPreview document={processingErrorDoc} />, { withAuth: true, user: mockUser })
      
      const processingTab = screen.getByText(/processing/i)
      fireEvent.click(processingTab)
      
      expect(screen.getByText(/extraction failed/i)).toBeInTheDocument()
    })

    it('handles missing document content', () => {
      const emptyDoc = { ...mockDocument, content: null }
      render(<DocumentPreview document={emptyDoc} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByText(/no content available/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const container = screen.getByRole('main')
      container.focus()
      
      expect(container).toHaveFocus()
      
      fireEvent.keyDown(container, { key: 'Tab' })
      expect(screen.getByLabelText(/next page/i)).toHaveFocus()
    })

    it('provides screen reader announcements', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const liveRegion = screen.getByLabelText(/document status/i)
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('has proper ARIA labels', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      expect(screen.getByLabelText(/document preview/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/page navigation/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zoom controls/i)).toBeInTheDocument()
    })

    it('supports high contrast mode', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const container = screen.getByRole('main')
      expect(container).toHaveClass('contrast-more:border-2')
    })
  })

  describe('Performance', () => {
    it('lazy loads page content', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      // Only first page should be rendered initially
      expect(screen.getByTestId('page-1')).toBeInTheDocument()
      expect(screen.queryByTestId('page-2')).not.toBeInTheDocument()
    })

    it('preloads adjacent pages', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const nextButton = screen.getByLabelText(/next page/i)
      fireEvent.click(nextButton)
      
      // Should preload next page
      expect(screen.getByTestId('page-2')).toBeInTheDocument()
    })

    it('caches rendered pages', () => {
      render(<DocumentPreview document={mockDocument} />, { withAuth: true, user: mockUser })
      
      const nextButton = screen.getByLabelText(/next page/i)
      const prevButton = screen.getByLabelText(/previous page/i)
      
      fireEvent.click(nextButton)
      fireEvent.click(prevButton)
      
      // First page should still be cached
      expect(screen.getByTestId('page-1')).toBeInTheDocument()
    })
  })
})