/**
 * Jest polyfills for Node.js environment
 * These polyfills run BEFORE any imports to ensure MSW and other dependencies work correctly
 */

// Use native Node.js globals when available (Node 18+)
if (typeof globalThis !== 'undefined') {
  // TextEncoder/TextDecoder are available in Node 18+
  if (!global.TextEncoder) {
    const { TextEncoder, TextDecoder } = require('util')
    global.TextEncoder = TextEncoder
    global.TextDecoder = TextDecoder
  }

  // Use Node.js native fetch if available (Node 18+)
  if (!global.fetch && typeof fetch !== 'undefined') {
    global.fetch = fetch
    global.Headers = Headers
    global.Request = Request
    global.Response = Response
  }
}

// Fallback for older Node.js or missing APIs
if (!global.fetch) {
  // Use whatwg-fetch as polyfill (more compatible than undici for tests)
  require('whatwg-fetch')
}

// Add minimal polyfills for Web APIs that MSW needs
global.MessageChannel =
  global.MessageChannel ||
  class MessageChannel {
    port1 = { postMessage: () => {}, onmessage: null }
    port2 = { postMessage: () => {}, onmessage: null }
  }

global.MessagePort =
  global.MessagePort ||
  class MessagePort {
    postMessage() {}
    onmessage = null
  }

// Mock URL if not available
if (!global.URL) {
  global.URL = require('url').URL
}

// Mock crypto with minimal implementation
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => require('crypto').randomUUID(),
    getRandomValues: arr => require('crypto').getRandomValues(arr),
  }
}
