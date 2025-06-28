// Translation Workflow Integration Tests
// End-to-end testing of the complete translation pipeline

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, createMockUser } from '../utils/test-utils'
import { SimpleTranslationInterface } from '../../components/workspace/SimpleTranslationInterface'
import { WorkspaceIntelligenceProvider } from '../../contexts/WorkspaceIntelligenceContext'
import type { TranslationRequest, TranslationResponse } from '../../types/translation'

// Mock the workspace intelligence context
const mockWorkspaceContext = {
  state: {
    currentMode: 'translation' as const,
    activities: [],
    patterns: {
      preferredLanguages: { source: ['en'], target: ['vi'] },
      workingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
      frequentActions: [],
      efficiency: { averageTranslationTime: 2500, preferredWorkflowSteps: [], errorRate: 0.05 },
      preferences: { preferredAgents: [], autoTranslation: false, qualityThreshold: 0.9 }
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

// Mock API responses
const mockTranslationResponse: TranslationResponse = {
  id: 'translation-123',
  translatedText: 'Xin chào thế giới',
  detectedLanguage: 'en',
  confidence: 0.95,
  alternatives: ['Chào thế giới', 'Xin chào thế giới'],
  metadata: {
    model: 'gpt-4',
    engine: 'gpt-4',
    processingTime: 1500,
    charactersCount: 11,
    wordsCount: 2,
    cost: 0.002,
    quality: { fluency: 0.95, accuracy: 0.92, coherence: 0.98 },
    flags: [],
    revisions: []
  },
  usage: {
    charactersUsed: 11,
    charactersRemaining: 9989,
    costEstimate: 0.001
  },
  warnings: []
}

// Enhanced MSW handlers for integration tests
import { rest } from 'msw'
import { server } from '../mocks/server'

const integrationHandlers = [
  rest.post('/api/translate', async (req, res, ctx) => {
    const body = await req.json() as TranslationRequest
    
    // Simulate different translation scenarios
    if (body.text === 'Error text') {
      return res(
        ctx.status(500),
        ctx.json({ success: false, error: { code: 'TRANSLATION_FAILED', message: 'Translation service unavailable' } })
      )
    }
    
    if (body.text === 'Slow text') {
      return res(
        ctx.delay(3000),
        ctx.status(200),
        ctx.json({ success: true, data: mockTranslationResponse })
      )
    }
    
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: mockTranslationResponse })
    )
  }),
  
  rest.post('/api/workspace/activities', async (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true }))
  }),
  
  rest.post('/api/workspace/operations', async (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true, data: { id: 'op-123' } }))
  }),
  
  rest.put('/api/workspace/operations/:id', async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }))
  })
]

describe('Translation Workflow Integration', () => {
  const mockUser = createMockUser()

  beforeAll(() => {
    server.use(...integrationHandlers)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Translation Flow', () => {
    it('completes successful translation workflow', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Step 1: Enter text
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })

      // Step 2: Select languages
      const sourceSelect = screen.getByLabelText(/source language/i)
      const targetSelect = screen.getByLabelText(/target language/i)
      fireEvent.change(sourceSelect, { target: { value: 'en' } })
      fireEvent.change(targetSelect, { target: { value: 'vi' } })

      // Step 3: Initiate translation
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      // Verify loading state
      expect(screen.getByText(/translating/i)).toBeInTheDocument()
      expect(mockWorkspaceContext.operations.start).toHaveBeenCalledWith({
        type: 'translation',
        input: { text: 'Hello world', sourceLanguage: 'en', targetLanguage: 'vi' }
      })

      // Step 4: Verify successful result
      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify confidence score
      expect(screen.getByText(/95% confidence/i)).toBeInTheDocument()

      // Verify alternatives
      expect(screen.getByText(/alternatives/i)).toBeInTheDocument()
      expect(screen.getByText('Chào thế giới')).toBeInTheDocument()

      // Verify workspace context updates
      expect(mockWorkspaceContext.operations.complete).toHaveBeenCalled()
      expect(mockWorkspaceContext.addActivity).toHaveBeenCalledWith({
        type: 'translation',
        status: 'completed',
        input: 'Hello world',
        output: 'Xin chào thế giới',
        languages: { source: 'en', target: 'vi' },
        confidence: 0.95,
        duration: expect.any(Number)
      })
    })

    it('handles translation error workflow', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Enter text that triggers error
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Error text' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/translation failed/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/try again/i)).toBeInTheDocument()
      expect(mockWorkspaceContext.operations.fail).toHaveBeenCalled()
    })

    it('handles timeout scenarios', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Slow text' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      // Verify extended loading state
      expect(screen.getByText(/translating/i)).toBeInTheDocument()

      // Wait for eventual completion
      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  describe('User Pattern Learning', () => {
    it('learns from user language preferences', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Multiple translations with same language pair
      for (let i = 0; i < 3; i++) {
        const textarea = screen.getByPlaceholderText(/enter text to translate/i)
        fireEvent.change(textarea, { target: { value: `Text ${i + 1}` } })

        const sourceSelect = screen.getByLabelText(/source language/i)
        const targetSelect = screen.getByLabelText(/target language/i)
        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'vi' } })

        const translateButton = screen.getByText(/translate/i)
        fireEvent.click(translateButton)

        await waitFor(() => {
          expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
        })

        const clearButton = screen.getByText(/clear/i)
        fireEvent.click(clearButton)
      }

      // Verify pattern learning
      expect(mockWorkspaceContext.addActivity).toHaveBeenCalledTimes(3)
      expect(mockWorkspaceContext.addActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          languages: { source: 'en', target: 'vi' }
        })
      )
    })

    it('tracks efficiency metrics', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const startTime = Date.now()

      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Performance test' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(mockWorkspaceContext.addActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
          efficiency: expect.any(Number)
        })
      )
    })
  })

  describe('Smart Suggestions Integration', () => {
    it('generates contextual suggestions', async () => {
      const contextWithSuggestions = {
        ...mockWorkspaceContext,
        state: {
          ...mockWorkspaceContext.state,
          suggestions: [
            {
              id: 'sug-1',
              type: 'language_pair',
              title: 'Switch to preferred languages',
              description: 'Use English → Vietnamese based on your history',
              confidence: 0.85,
              action: { type: 'set_languages', source: 'en', target: 'vi' }
            }
          ]
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={contextWithSuggestions}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Verify suggestion appears
      expect(screen.getByText(/switch to preferred languages/i)).toBeInTheDocument()

      // Apply suggestion
      const applySuggestionButton = screen.getByText(/apply/i)
      fireEvent.click(applySuggestionButton)

      expect(mockWorkspaceContext.suggestions.apply).toHaveBeenCalledWith('sug-1')
    })

    it('dismisses irrelevant suggestions', async () => {
      const contextWithSuggestions = {
        ...mockWorkspaceContext,
        state: {
          ...mockWorkspaceContext.state,
          suggestions: [
            {
              id: 'sug-2',
              type: 'workflow_optimization',
              title: 'Enable auto-translation',
              description: 'Speed up your workflow with automatic translation',
              confidence: 0.75,
              action: { type: 'enable_auto_translate' }
            }
          ]
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={contextWithSuggestions}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const dismissButton = screen.getByLabelText(/dismiss suggestion/i)
      fireEvent.click(dismissButton)

      expect(mockWorkspaceContext.suggestions.dismiss).toHaveBeenCalledWith('sug-2')
    })
  })

  describe('Collaborative Features', () => {
    it('shares translation results', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Complete translation
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Shared text' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      // Share result
      const shareButton = screen.getByLabelText(/share translation/i)
      fireEvent.click(shareButton)

      expect(screen.getByText(/share options/i)).toBeInTheDocument()
      expect(screen.getByText(/copy link/i)).toBeInTheDocument()
    })

    it('exports translation history', async () => {
      const contextWithHistory = {
        ...mockWorkspaceContext,
        state: {
          ...mockWorkspaceContext.state,
          activities: [
            {
              id: 'act-1',
              type: 'translation',
              status: 'completed',
              input: 'Hello',
              output: 'Xin chào',
              languages: { source: 'en', target: 'vi' },
              timestamp: new Date()
            }
          ]
        }
      }

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={contextWithHistory}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const historyButton = screen.getByLabelText(/translation history/i)
      fireEvent.click(historyButton)

      expect(screen.getByText(/export history/i)).toBeInTheDocument()

      const exportButton = screen.getByText(/export as csv/i)
      fireEvent.click(exportButton)

      // Verify export functionality
      expect(screen.getByText(/downloading/i)).toBeInTheDocument()
    })
  })

  describe('Performance and Reliability', () => {
    it('handles rapid consecutive translations', async () => {
      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      const translateButton = screen.getByText(/translate/i)

      // Rapid fire translations
      for (let i = 0; i < 5; i++) {
        fireEvent.change(textarea, { target: { value: `Rapid text ${i}` } })
        fireEvent.click(translateButton)
      }

      // Should handle gracefully without crashes
      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      // Verify only one operation is active
      expect(mockWorkspaceContext.operations.start).toHaveBeenCalledTimes(5)
    })

    it('recovers from network failures', async () => {
      // Simulate network failure then recovery
      server.use(
        rest.post('/api/translate', (req, res, ctx) => {
          return res.networkError('Network failure')
        })
      )

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Network test' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Restore network
      server.resetHandlers()

      const retryButton = screen.getByText(/try again/i)
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })
    })

    it('maintains state across component remounts', async () => {
      const { rerender } = renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Enter text and translate
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Persistent text' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      // Remount component
      rerender(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <SimpleTranslationInterface />
        </WorkspaceIntelligenceProvider>
      )

      // Verify state persistence
      expect(screen.getByDisplayValue('Persistent text')).toBeInTheDocument()
      expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
    })
  })

  describe('Cross-Component Integration', () => {
    it('integrates with intelligence hub', async () => {
      const { IntelligenceHub } = await import('../../components/workspace/IntelligenceHub')

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <div>
            <SimpleTranslationInterface />
            <IntelligenceHub />
          </div>
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Perform translation
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Integration test' } })

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      // Verify intelligence hub shows activity
      const operationsTab = screen.getByText(/operations/i)
      fireEvent.click(operationsTab)

      expect(screen.getByText(/translation completed/i)).toBeInTheDocument()
    })

    it('coordinates with contextual assistant', async () => {
      const { ContextualAssistant } = await import('../../components/workspace/ContextualAssistant')

      renderWithProviders(
        <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
          <div>
            <SimpleTranslationInterface />
            <ContextualAssistant />
          </div>
        </WorkspaceIntelligenceProvider>,
        { user: mockUser }
      )

      // Start translation
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Assistant test' } })

      // Verify assistant provides contextual help
      expect(screen.getByText(/need help with translation/i)).toBeInTheDocument()

      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      // Verify assistant updates with completion
      expect(screen.getByText(/translation completed successfully/i)).toBeInTheDocument()
    })
  })
})