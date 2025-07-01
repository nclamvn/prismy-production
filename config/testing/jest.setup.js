import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// MSW testing setup - polyfills are handled in jest.polyfills.js

// MSW temporarily disabled for P0 fix - will re-enable in P1
// import { server } from '@/lib/__tests__/mocks/server'

// beforeAll(() => {
//   server.listen({
//     onUnhandledRequest: 'warn'
//   })
// })

// afterEach(() => {
//   server.resetHandlers()
// })

// afterAll(() => {
//   server.close()
// })

// Mock Next.js router
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
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(() => []),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
  })),
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url: url || 'http://localhost:3000',
    method: init?.method || 'GET',
    headers: new Map(),
    json: jest.fn().mockResolvedValue({}),
    formData: jest.fn().mockResolvedValue(new FormData()),
    text: jest.fn().mockResolvedValue(''),
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map(),
    })),
    redirect: jest.fn(),
    rewrite: jest.fn(),
    next: jest.fn(),
  },
}))

// Mock global Request/Response
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map()
    this.body = options.body
  }
  
  async json() { return {} }
  async text() { return '' }
  async formData() { return new FormData() }
}

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Map()
  }
  
  async json() { return this.body }
  async text() { return this.body }
}

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'
process.env.CSRF_SECRET = 'test-csrf-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_test'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
process.env.VNPAY_HASH_SECRET = 'test-vnpay-secret'
process.env.MOMO_SECRET_KEY = 'test-momo-secret'

// AI Provider environment variables
process.env.OPENAI_API_KEY = 'sk-test-openai-key'
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-anthropic-key'
process.env.COHERE_API_KEY = 'test-cohere-key'

// Mock fetch globally
global.fetch = jest.fn()

// Mock crypto for Node.js environment
const { webcrypto } = require('crypto')
if (!global.crypto) {
  global.crypto = webcrypto
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock clipboard API
Object.defineProperty(window.navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Mock problematic ESM modules
jest.mock('uncrypto', () => ({
  default: {
    getRandomValues: jest.fn(() => new Uint8Array(16)),
    randomUUID: jest.fn(() => 'test-uuid-1234'),
    subtle: {
      importKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    }
  },
  getRandomValues: jest.fn(() => new Uint8Array(16)),
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}))

// Mock OpenAI
jest.mock('openai', () => {
  const mockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'chatcmpl-test',
          created: Date.now(),
          model: 'gpt-4o-mini',
          choices: [{ 
            message: { content: 'Test response' },
            finish_reason: 'stop'
          }],
          usage: { 
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        model: 'text-embedding-3-small',
        data: [{ embedding: Array(384).fill(0.1) }],
        usage: { total_tokens: 50 }
      })
    }
  }))
  
  return {
    __esModule: true,
    default: mockOpenAI,
    OpenAI: mockOpenAI
  }
})

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => {
  const mockAnthropic = jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Test response' }],
        model: 'claude-3-5-haiku-20241022',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 }
      })
    }
  }))
  
  return {
    __esModule: true,
    default: mockAnthropic,
    Anthropic: mockAnthropic
  }
})

// Note: Cohere mock removed - package not installed

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
  session: null,
  profile: {
    id: 'test-user-id',
    full_name: 'Test User',
    tier: 'standard',
    usage_count: 0,
    usage_limit: 50,
  },
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  refreshProfile: jest.fn(),
}

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthContext: {
    Provider: ({ children, value }) => children,
  },
  AuthProvider: ({ children }) => children,
}))

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})