import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Workbench from '@/components/Workbench'
import { AuthContext } from '@/contexts/AuthContext'

// Mock the translation API
const mockTranslate = jest.fn()
jest.mock('@/lib/translation-service', () => ({
  translateText: mockTranslate
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    subscription_tier: 'standard'
  }
}

const renderWorkbench = (user = mockUser) => {
  return render(
    <AuthContext.Provider value={{
      user,
      signIn: jest.fn(),
      signOut: jest.fn(),
      loading: false
    }}>
      <Workbench />
    </AuthContext.Provider>
  )
}

describe('Workbench Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTranslate.mockResolvedValue({
      translatedText: 'Xin chào thế giới',
      confidence: 0.95,
      model: 'google'
    })
  })

  describe('Basic Rendering', () => {
    it('should render the workbench interface', () => {
      renderWorkbench()
      
      expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()
      expect(screen.getByText(/translate/i)).toBeInTheDocument()
      expect(screen.getByText(/from/i)).toBeInTheDocument()
      expect(screen.getByText(/to/i)).toBeInTheDocument()
    })

    it('should render language selectors', () => {
      renderWorkbench()
      
      // Check for default language options
      expect(screen.getByDisplayValue(/english/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/vietnamese/i)).toBeInTheDocument()
    })

    it('should render quality tier selector', () => {
      renderWorkbench()
      
      expect(screen.getByText(/quality/i)).toBeInTheDocument()
      expect(screen.getByText(/standard/i)).toBeInTheDocument()
    })
  })

  describe('Translation Functionality', () => {
    it('should translate text successfully', async () => {
      renderWorkbench()
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      const translateButton = screen.getByRole('button', { name: /translate/i })
      
      fireEvent.change(textInput, { target: { value: 'Hello world' } })
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(mockTranslate).toHaveBeenCalledWith({
          text: 'Hello world',
          sourceLang: 'en',
          targetLang: 'vi',
          qualityTier: 'standard'
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })
    })

    it('should show loading state during translation', async () => {
      mockTranslate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      renderWorkbench()
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      const translateButton = screen.getByRole('button', { name: /translate/i })
      
      fireEvent.change(textInput, { target: { value: 'Test text' } })
      fireEvent.click(translateButton)
      
      expect(screen.getByText(/translating/i)).toBeInTheDocument()
      expect(translateButton).toBeDisabled()
    })

    it('should handle translation errors', async () => {
      mockTranslate.mockRejectedValue(new Error('Translation failed'))
      
      renderWorkbench()
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      const translateButton = screen.getByRole('button', { name: /translate/i })
      
      fireEvent.change(textInput, { target: { value: 'Test text' } })
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/translation failed/i)).toBeInTheDocument()
      })
    })

    it('should prevent translation of empty text', () => {
      renderWorkbench()
      
      const translateButton = screen.getByRole('button', { name: /translate/i })
      
      fireEvent.click(translateButton)
      
      expect(mockTranslate).not.toHaveBeenCalled()
      expect(translateButton).toBeDisabled()
    })
  })

  describe('Language Selection', () => {
    it('should change source language', () => {
      renderWorkbench()
      
      const sourceSelect = screen.getByDisplayValue(/english/i)
      fireEvent.change(sourceSelect, { target: { value: 'zh' } })
      
      expect(sourceSelect).toHaveValue('zh')
    })

    it('should change target language', () => {
      renderWorkbench()
      
      const targetSelect = screen.getByDisplayValue(/vietnamese/i)
      fireEvent.change(targetSelect, { target: { value: 'en' } })
      
      expect(targetSelect).toHaveValue('en')
    })

    it('should swap languages when swap button is clicked', () => {
      renderWorkbench()
      
      const sourceSelect = screen.getByDisplayValue(/english/i)
      const targetSelect = screen.getByDisplayValue(/vietnamese/i)
      const swapButton = screen.getByLabelText(/swap languages/i)
      
      fireEvent.click(swapButton)
      
      expect(sourceSelect).toHaveValue('vi')
      expect(targetSelect).toHaveValue('en')
    })
  })

  describe('Quality Tier Selection', () => {
    it('should change quality tier', () => {
      renderWorkbench()
      
      const qualitySelect = screen.getByDisplayValue(/standard/i)
      fireEvent.change(qualitySelect, { target: { value: 'premium' } })
      
      expect(qualitySelect).toHaveValue('premium')
    })

    it('should show premium quality for premium users', () => {
      const premiumUser = {
        ...mockUser,
        user_metadata: { subscription_tier: 'premium' }
      }
      
      renderWorkbench(premiumUser)
      
      expect(screen.getByText(/premium/i)).toBeInTheDocument()
    })

    it('should restrict quality options for free users', () => {
      const freeUser = {
        ...mockUser,
        user_metadata: { subscription_tier: 'free' }
      }
      
      renderWorkbench(freeUser)
      
      const qualitySelect = screen.getByDisplayValue(/basic/i)
      expect(qualitySelect).toBeInTheDocument()
      expect(screen.queryByText(/premium/i)).not.toBeInTheDocument()
    })
  })

  describe('Character Count', () => {
    it('should show character count', () => {
      renderWorkbench()
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      fireEvent.change(textInput, { target: { value: 'Hello' } })
      
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })

    it('should warn about character limit', () => {
      renderWorkbench()
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      const longText = 'a'.repeat(9000)
      fireEvent.change(textInput, { target: { value: longText } })
      
      expect(screen.getByText(/9000/)).toBeInTheDocument()
      expect(screen.getByText(/approaching limit/i)).toBeInTheDocument()
    })
  })

  describe('Authentication Integration', () => {
    it('should show sign-in prompt for unauthenticated users', () => {
      renderWorkbench(null)
      
      expect(screen.getByText(/sign in to translate/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /translate/i })).not.toBeInTheDocument()
    })

    it('should show upgrade prompt for free users with long text', () => {
      const freeUser = {
        ...mockUser,
        user_metadata: { subscription_tier: 'free' }
      }
      
      renderWorkbench(freeUser)
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      const longText = 'a'.repeat(1500) // Exceeds free tier limit
      fireEvent.change(textInput, { target: { value: longText } })
      
      expect(screen.getByText(/upgrade/i)).toBeInTheDocument()
    })
  })

  describe('Copy Functionality', () => {
    it('should copy translated text to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      })

      renderWorkbench()
      
      const textInput = screen.getByPlaceholderText(/enter text to translate/i)
      const translateButton = screen.getByRole('button', { name: /translate/i })
      
      fireEvent.change(textInput, { target: { value: 'Hello world' } })
      fireEvent.click(translateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Xin chào thế giới')).toBeInTheDocument()
      })

      const copyButton = screen.getByLabelText(/copy translation/i)
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Xin chào thế giới')
    })
  })
})