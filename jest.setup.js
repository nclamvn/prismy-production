import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(_callback => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(_callback => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
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
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
})

// Mock document.elementFromPoint
Object.defineProperty(document, 'elementFromPoint', {
  value: jest.fn(),
  writable: true,
})

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn(),
    minHeight: '40px',
    minWidth: '40px',
  })),
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()

  // Clean up DOM
  document.body.innerHTML = ''
  document.documentElement.className = ''
  document.body.className = ''

  // Reset fetch mock
  global.fetch.mockClear()
})

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NODE_ENV = 'test'

// Increase timeout for accessibility tests
jest.setTimeout(30000)

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}))

// Mock Radix UI components to avoid complex setup
jest.mock(
  '@radix-ui/react-slot',
  () => ({
    Slot: ({ children, ...props }) => <div {...props}>{children}</div>,
  }),
  { virtual: true }
)

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Mail: () => <svg data-testid="mail-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
  Search: () => <svg data-testid="search-icon" />,
  User: () => <svg data-testid="user-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    section: ({ children, ...props }) => (
      <section {...props}>{children}</section>
    ),
    article: ({ children, ...props }) => (
      <article {...props}>{children}</article>
    ),
    nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
    header: ({ children, ...props }) => <header {...props}>{children}</header>,
    footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useInView: () => true,
}))

// Add custom jest matchers for better accessibility testing
expect.extend({
  toHaveAccessibleName(received, expected) {
    const accessibleName =
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.textContent

    const pass = accessibleName === expected

    return {
      message: () =>
        pass
          ? `Expected element not to have accessible name "${expected}"`
          : `Expected element to have accessible name "${expected}", but got "${accessibleName}"`,
      pass,
    }
  },

  toBeAccessible(received) {
    const hasAccessibleName =
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.textContent?.trim()

    const hasProperRole =
      received.getAttribute('role') ||
      ['button', 'link', 'input', 'textarea'].includes(
        received.tagName.toLowerCase()
      )

    const pass = hasAccessibleName && hasProperRole

    return {
      message: () =>
        pass
          ? `Expected element not to be accessible`
          : `Expected element to be accessible (have name and role)`,
      pass,
    }
  },
})

// Mock CSS imports
jest.mock('*/globals.css', () => ({}))
jest.mock('*/design-tokens.css', () => ({}))
jest.mock('*/components.css', () => ({}))
jest.mock('*/utilities.css', () => ({}))

// Suppress console warnings for tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ReactDOM.render') ||
      args[0].includes('findDOMNode') ||
      args[0].includes('componentWillReceiveProps'))
  ) {
    return
  }
  originalConsoleWarn(...args)
}
