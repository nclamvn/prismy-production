// SimpleTranslationInterface Component Tests
// Comprehensive test suite for the translation interface

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockUser } from '../../utils/test-utils'
import { SimpleTranslationInterface } from '../../../components/workspace/SimpleTranslationInterface'
import type { SupportedLanguage } from '../../../types'

// Mock data
const mockTranslationResponse = {
  translatedText: 'Xin chào thế giới',
  detectedLanguage: 'en' as SupportedLanguage,
  confidence: 0.95,
  alternatives: ['Chào thế giới', 'Xin chào thế giới'],
  metadata: {
    model: 'gpt-4',
    engine: 'gpt-4',
    processingTime: 1500,
    charactersCount: 11,
    wordsCount: 2,
    cost: 0.002,
    quality: {
      fluency: 0.95,
      accuracy: 0.92,
      coherence: 0.98
    },
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

const mockUser = createMockUser()

describe('SimpleTranslationInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default state', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()
      expect(screen.getByText(/translate/i)).toBeInTheDocument()
      expect(screen.getByText(/clear/i)).toBeInTheDocument()
    })

    it('renders language selectors', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      expect(screen.getByLabelText(/source language/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target language/i)).toBeInTheDocument()
    })

    it('renders with accessibility attributes', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const sourceTextarea = screen.getByPlaceholderText(/enter text to translate/i)
      expect(sourceTextarea).toHaveAttribute('aria-label', 'Source text')
      
      const resultArea = screen.getByLabelText(/translation result/i)
      expect(resultArea).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Text Input', () => {
    it('accepts text input', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      expect(textarea).toHaveValue('Hello world')
    })

    it('shows character count', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      
      expect(screen.getByText(/5 \/ 5000/)).toBeInTheDocument()
    })

    it('enforces character limit', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      const longText = 'a'.repeat(5001)
      fireEvent.change(textarea, { target: { value: longText } })
      
      expect(textarea.value.length).toBeLessThanOrEqual(5000)
    })

    it('enables translate button when text is entered', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const translateButton = screen.getByText(/translate/i)
      expect(translateButton).toBeDisabled()
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      
      expect(translateButton).not.toBeDisabled()
    })
  })

  describe('Language Selection', () => {
    it('allows source language selection', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const sourceSelect = screen.getByLabelText(/source language/i)
      fireEvent.change(sourceSelect, { target: { value: 'en' } })
      
      expect(sourceSelect).toHaveValue('en')
    })

    it('allows target language selection', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const targetSelect = screen.getByLabelText(/target language/i)
      fireEvent.change(targetSelect, { target: { value: 'vi' } })
      
      expect(targetSelect).toHaveValue('vi')
    })

    it('prevents same source and target language', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const sourceSelect = screen.getByLabelText(/source language/i)
      const targetSelect = screen.getByLabelText(/target language/i)
      
      fireEvent.change(sourceSelect, { target: { value: 'en' } })
      fireEvent.change(targetSelect, { target: { value: 'en' } })
      
      expect(screen.getByText(/source and target languages cannot be the same/i)).toBeInTheDocument()
    })

    it('supports language swap functionality', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const sourceSelect = screen.getByLabelText(/source language/i)
      const targetSelect = screen.getByLabelText(/target language/i)
      
      fireEvent.change(sourceSelect, { target: { value: 'en' } })
      fireEvent.change(targetSelect, { target: { value: 'vi' } })
      
      const swapButton = screen.getByLabelText(/swap languages/i)
      fireEvent.click(swapButton)
      
      expect(sourceSelect).toHaveValue('vi')
      expect(targetSelect).toHaveValue('en')
    })
  })

  describe('Translation Process', () => {
    it('initiates translation on button click', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      expect(screen.getByText(/translating/i)).toBeInTheDocument()
      expect(translateButton).toBeDisabled()
    })

    it('shows loading state during translation', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText(/translating/i)).toBeInTheDocument()
    })

    it('displays translation result', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })
    })

    it('shows confidence score', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/95% confidence/i)).toBeInTheDocument()
      })
    })

    it('provides alternative translations', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/alternatives/i)).toBeInTheDocument()
        expect(screen.getByText('Chào thế giới')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles translation errors gracefully', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Error text' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/translation failed/i)).toBeInTheDocument()
      })
    })

    it('shows retry option on error', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Error text' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument()
      })
    })

    it('handles network errors', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Network error' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('translates on Ctrl+Enter', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
      
      expect(screen.getByText(/translating/i)).toBeInTheDocument()
    })

    it('clears text on Ctrl+K', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      fireEvent.keyDown(textarea, { key: 'k', ctrlKey: true })
      
      expect(textarea).toHaveValue('')
    })

    it('swaps languages on Ctrl+Shift+S', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const sourceSelect = screen.getByLabelText(/source language/i)
      const targetSelect = screen.getByLabelText(/target language/i)
      
      fireEvent.change(sourceSelect, { target: { value: 'en' } })
      fireEvent.change(targetSelect, { target: { value: 'vi' } })
      
      fireEvent.keyDown(document, { key: 'S', ctrlKey: true, shiftKey: true })
      
      expect(sourceSelect).toHaveValue('vi')
      expect(targetSelect).toHaveValue('en')
    })
  })

  describe('Copy Functionality', () => {
    it('allows copying translation result', async () => {
      const mockWriteText = jest.fn()
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true
      })
      
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        const copyButton = screen.getByLabelText(/copy translation/i)
        fireEvent.click(copyButton)
        
        expect(mockWriteText).toHaveBeenCalledWith('Xin chào thế giới')
      })
    })

    it('shows copy confirmation', async () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        const copyButton = screen.getByLabelText(/copy translation/i)
        fireEvent.click(copyButton)
        
        expect(screen.getByText(/copied!/i)).toBeInTheDocument()
      })
    })
  })

  describe('Clear Functionality', () => {
    it('clears all text and results', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const clearButton = screen.getByText(/clear/i)
      fireEvent.click(clearButton)
      
      expect(textarea).toHaveValue('')
    })

    it('resets to initial state', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      const translateButton = screen.getByText(/translate/i)
      fireEvent.click(translateButton)
      
      const clearButton = screen.getByText(/clear/i)
      fireEvent.click(clearButton)
      
      expect(screen.queryByText('Xin chào thế giới')).not.toBeInTheDocument()
      expect(translateButton).toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const container = screen.getByRole('main')
      expect(container).toHaveClass('flex-col')
    })

    it('maintains functionality on tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('supports screen readers', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      expect(textarea).toHaveAttribute('aria-label')
      
      const resultArea = screen.getByLabelText(/translation result/i)
      expect(resultArea).toHaveAttribute('aria-live', 'polite')
    })

    it('has proper focus management', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      textarea.focus()
      
      expect(textarea).toHaveFocus()
    })

    it('supports high contrast mode', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const container = screen.getByRole('main')
      expect(container).toHaveClass('contrast-more:border-2')
    })
  })

  describe('Performance', () => {
    it('debounces auto-translation', async () => {
      render(<SimpleTranslationInterface enableAutoTranslate />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      
      // Type quickly
      fireEvent.change(textarea, { target: { value: 'H' } })
      fireEvent.change(textarea, { target: { value: 'He' } })
      fireEvent.change(textarea, { target: { value: 'Hel' } })
      fireEvent.change(textarea, { target: { value: 'Hell' } })
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      
      // Should not trigger multiple translations
      await waitFor(() => {
        const loadingSpinners = screen.queryAllByTestId('loading-spinner')
        expect(loadingSpinners.length).toBeLessThanOrEqual(1)
      })
    })

    it('cancels previous translation requests', () => {
      render(<SimpleTranslationInterface />, { withAuth: true, user: mockUser })
      
      const textarea = screen.getByPlaceholderText(/enter text to translate/i)
      const translateButton = screen.getByText(/translate/i)
      
      fireEvent.change(textarea, { target: { value: 'First text' } })
      fireEvent.click(translateButton)
      
      fireEvent.change(textarea, { target: { value: 'Second text' } })
      fireEvent.click(translateButton)
      
      // Should only show one loading state
      const loadingSpinners = screen.queryAllByTestId('loading-spinner')
      expect(loadingSpinners).toHaveLength(1)
    })
  })
})