import '@testing-library/jest-dom'

// Minimal Jest setup without MSW for mutation testing

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

// Mock environment variables
process.env.NODE_ENV = 'test'

// Mock crypto for Node.js environment
const { webcrypto } = require('crypto')
if (!global.crypto) {
  global.crypto = webcrypto
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})