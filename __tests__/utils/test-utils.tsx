// Test utilities and custom render functions
// Comprehensive testing utilities with provider wrappers

import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { User } from '../../types/auth'
import type { WorkspaceIntelligenceState } from '../../types/workspace'
import type { SupportedLanguage } from '../../types'

// Mock contexts
import { AuthProvider } from '../../contexts/AuthContext'
import { SSRSafeLanguageProvider } from '../../contexts/SSRSafeLanguageContext'
import { WorkspaceIntelligenceProvider } from '../../contexts/WorkspaceIntelligenceContext'
import { LoadingProvider } from '../../contexts/LoadingContext'
import { ThemeProvider } from '../../components/theme/ThemeProvider'
import { ToastProvider } from '../../components/ui/Toast'

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: 'https://example.com/avatar.jpg',
  language: 'en',
  timezone: 'UTC',
  emailVerified: true,
  phoneNumber: '+1234567890',
  phoneVerified: false,
  twoFactorEnabled: false,
  lastLoginAt: new Date('2024-01-01T00:00:00Z'),
  lastActiveAt: new Date('2024-01-01T00:00:00Z'),
  status: 'active',
  roles: [],
  permissions: [],
  preferences: {
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      inApp: true,
      digest: 'weekly'
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false
    },
    workspace: {
      defaultView: 'translation',
      autoSave: true,
      showTutorials: true,
      compactMode: false
    },
    privacy: {
      profileVisibility: 'private',
      showOnlineStatus: true,
      allowMessageRequests: false
    }
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

export const createMockWorkspaceState = (overrides: Partial<WorkspaceIntelligenceState> = {}): WorkspaceIntelligenceState => ({
  currentMode: 'translation',
  previousMode: undefined,
  context: {
    currentMode: 'translation',
    activeDocuments: [],
    cursor: { line: 0, column: 0 },
    viewport: { scroll: 0, zoom: 1 },
    recentActions: []
  },
  activities: [],
  patterns: {
    preferredLanguages: {
      source: ['en'],
      target: ['vi']
    },
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    },
    frequentActions: [],
    efficiency: {
      averageTranslationTime: 2500,
      preferredWorkflowSteps: [],
      errorRate: 0.05
    },
    preferences: {
      preferredAgents: [],
      autoTranslation: true,
      qualityThreshold: 0.9
    }
  },
  activeOperations: [],
  completedOperations: [],
  suggestions: [],
  insights: [],
  isProcessing: false,
  lastSync: new Date('2024-01-01T00:00:00Z'),
  connectionStatus: 'connected',
  ...overrides
})

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  user?: User | null
  language?: SupportedLanguage
  workspaceState?: WorkspaceIntelligenceState
  queryClient?: QueryClient
  withRouter?: boolean
  withAuth?: boolean
  withWorkspace?: boolean
  withTheme?: boolean
  withToast?: boolean
}

// Mock providers
const MockAuthProvider: React.FC<{ children: ReactNode; user?: User | null }> = ({ 
  children, 
  user = null 
}) => {
  const mockAuthContext = {
    user,
    session: null,
    profile: null,
    loading: false,
    sessionRestored: true,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
    refreshProfile: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    state: {
      user,
      isAuthenticated: !!user,
      isLoading: false,
      isInitialized: true,
      error: null,
      session: null,
      tokens: null
    },
    isAuthenticated: !!user,
    error: null
  }

  return (
    <AuthProvider value={mockAuthContext}>
      {children}
    </AuthProvider>
  )
}

const MockLanguageProvider: React.FC<{ children: ReactNode; language?: SupportedLanguage }> = ({ 
  children, 
  language = 'en' 
}) => {
  const mockLanguageContext = {
    language,
    setLanguage: jest.fn(),
    t: (key: string) => key, // Simple identity function for testing
    isLoading: false,
    translations: {}
  }

  return (
    <SSRSafeLanguageProvider value={mockLanguageContext}>
      {children}
    </SSRSafeLanguageProvider>
  )
}

const MockWorkspaceProvider: React.FC<{ children: ReactNode; state?: WorkspaceIntelligenceState }> = ({ 
  children, 
  state 
}) => {
  const mockWorkspaceContext = {
    state: state || createMockWorkspaceState(),
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

  return (
    <WorkspaceIntelligenceProvider value={mockWorkspaceContext}>
      {children}
    </WorkspaceIntelligenceProvider>
  )
}

// Wrapper component factory
const createWrapper = (options: CustomRenderOptions = {}) => {
  const {
    initialEntries = ['/'],
    user,
    language,
    workspaceState,
    queryClient,
    withRouter = false,
    withAuth = false,
    withWorkspace = false,
    withTheme = false,
    withToast = false
  } = options

  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => {
    let wrappedChildren = children

    // Wrap with QueryClient
    wrappedChildren = (
      <QueryClientProvider client={testQueryClient}>
        {wrappedChildren}
      </QueryClientProvider>
    )

    // Wrap with Router if needed
    if (withRouter) {
      wrappedChildren = (
        <MemoryRouter initialEntries={initialEntries}>
          {wrappedChildren}
        </MemoryRouter>
      )
    }

    // Wrap with Theme Provider if needed
    if (withTheme) {
      wrappedChildren = (
        <ThemeProvider defaultTheme="light">
          {wrappedChildren}
        </ThemeProvider>
      )
    }

    // Wrap with Language Provider if needed
    if (withAuth || withWorkspace) {
      wrappedChildren = (
        <MockLanguageProvider language={language}>
          {wrappedChildren}
        </MockLanguageProvider>
      )
    }

    // Wrap with Auth Provider if needed
    if (withAuth || withWorkspace) {
      wrappedChildren = (
        <MockAuthProvider user={user}>
          {wrappedChildren}
        </MockAuthProvider>
      )
    }

    // Wrap with Workspace Provider if needed
    if (withWorkspace) {
      wrappedChildren = (
        <MockWorkspaceProvider state={workspaceState}>
          {wrappedChildren}
        </MockWorkspaceProvider>
      )
    }

    // Wrap with Toast Provider if needed
    if (withToast) {
      wrappedChildren = (
        <ToastProvider>
          {wrappedChildren}
        </ToastProvider>
      )
    }

    // Wrap with Loading Provider
    wrappedChildren = (
      <LoadingProvider>
        {wrappedChildren}
      </LoadingProvider>
    )

    return <>{wrappedChildren}</>
  }
}

// Custom render function
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const userEventInstance = userEvent.setup()
  
  const result = render(ui, {
    wrapper: createWrapper(options),
    ...options
  })

  return {
    ...result,
    user: userEventInstance
  }
}

// Specific render functions for common scenarios
export const renderWithAuth = (
  ui: ReactElement,
  options: { user?: User } & CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...options,
    withAuth: true
  })
}

export const renderWithWorkspace = (
  ui: ReactElement,
  options: { user?: User; workspaceState?: WorkspaceIntelligenceState } & CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...options,
    withAuth: true,
    withWorkspace: true
  })
}

export const renderWithRouter = (
  ui: ReactElement,
  options: { initialEntries?: string[] } & CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...options,
    withRouter: true
  })
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...options,
    withRouter: true,
    withAuth: true,
    withWorkspace: true,
    withTheme: true,
    withToast: true
  })
}

// Test utilities
export const waitFor = (callback: () => void | Promise<void>, options?: { timeout?: number }) => {
  return new Promise<void>((resolve, reject) => {
    const timeout = options?.timeout || 5000
    const startTime = Date.now()
    
    const checkCondition = async () => {
      try {
        await callback()
        resolve()
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Timeout after ${timeout}ms: ${error}`))
        } else {
          setTimeout(checkCondition, 100)
        }
      }
    }
    
    checkCondition()
  })
}

export const waitForElementToBeRemoved = (element: HTMLElement) => {
  return waitFor(() => {
    if (document.contains(element)) {
      throw new Error('Element is still in the document')
    }
  })
}

export const createMockFile = (
  name = 'test.txt',
  content = 'test content',
  type = 'text/plain'
): File => {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

export const createMockFormData = (fields: Record<string, string | File>): FormData => {
  const formData = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Assertion helpers
export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectToHaveLoadingState = (element: HTMLElement) => {
  expect(element).toHaveAttribute('aria-busy', 'true')
}

export const expectToHaveErrorState = (element: HTMLElement, message?: string) => {
  expect(element).toHaveAttribute('aria-invalid', 'true')
  if (message) {
    expect(element).toHaveAccessibleDescription(message)
  }
}

// Mock implementations
export const mockFetch = (response: any, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response))
  })
}

export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  }
}

export const mockSessionStorage = mockLocalStorage

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => Promise<void> | void): Promise<number> => {
  const start = performance.now()
  await renderFn()
  const end = performance.now()
  return end - start
}

export const expectPerformanceToBeAcceptable = (renderTime: number, threshold = 100) => {
  expect(renderTime).toBeLessThan(threshold)
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override the default render
export { customRender as render }