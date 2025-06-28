// Test setup and configuration
// Jest and testing library setup for comprehensive testing

import '@testing-library/jest-dom'
import 'jest-canvas-mock'
import React from 'react'
import { configure } from '@testing-library/react'
import { server } from './mocks/server'

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
})

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    reload: jest.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}))

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock framer-motion for performance
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
    textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>,
    select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({ get: () => initial, set: jest.fn() }),
  useTransform: (value: any, input: any, output: any) => value,
  useSpring: (value: any) => value,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ children, ...props }: any) => (
    <svg {...props} data-testid="mock-icon">
      {children}
    </svg>
  )
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return MockIcon
      }
      return target[prop as keyof typeof target]
    }
  })
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Mock console methods for cleaner test output
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  // Setup MSW server
  server.listen({
    onUnhandledRequest: 'error',
  })
  
  // Suppress specific console warnings during tests
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: validateDOMNesting') ||
       args[0].includes('Error: Not implemented: navigation'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterEach(() => {
  // Reset all mocks after each test
  jest.clearAllMocks()
  
  // Reset MSW handlers
  server.resetHandlers()
  
  // Clear localStorage and sessionStorage
  localStorageMock.clear()
  sessionStorageMock.clear()
})

afterAll(() => {
  // Cleanup MSW server
  server.close()
  
  // Restore console methods
  console.error = originalError
  console.warn = originalWarn
})

// Custom matchers for better assertions
expect.extend({
  toBeVisible(received) {
    const pass = received && received.style.display !== 'none' && received.style.visibility !== 'hidden'
    
    if (pass) {
      return {
        message: () => `expected element not to be visible`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected element to be visible`,
        pass: false,
      }
    }
  },
  
  toHaveLoadingState(received) {
    const pass = received && (
      received.getAttribute('aria-busy') === 'true' ||
      received.querySelector('[data-testid="loading-spinner"]') ||
      received.classList.contains('loading')
    )
    
    if (pass) {
      return {
        message: () => `expected element not to have loading state`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected element to have loading state`,
        pass: false,
      }
    }
  },
})

// Global test utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

export const createMockIntersectionObserver = (options = {}) => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  })
  
  return mockIntersectionObserver
}

export const createMockMediaQuery = (matches = false) => {
  return {
    matches,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }
}