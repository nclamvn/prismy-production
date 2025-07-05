/**
 * Vitest setup file
 */

import { vi } from 'vitest'

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

// Setup global mocks
Object.defineProperty(global, 'fetch', {
  writable: true,
  value: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  ),
})

// Setup console mocks to reduce noise in tests
const originalError = console.error
const originalLog = console.log

beforeEach(() => {
  console.error = vi.fn()
  console.log = vi.fn()
})

afterEach(() => {
  console.error = originalError
  console.log = originalLog
})