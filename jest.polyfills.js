/**
 * Jest Polyfills for DOM and Web APIs
 * Provides compatibility shims for testing environment
 */

// TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util')

Object.assign(global, { TextDecoder, TextEncoder })

// Crypto polyfill for Web Crypto API
const { webcrypto } = require('crypto')
global.crypto = webcrypto

// URL polyfill
const { URL, URLSearchParams } = require('url')
global.URL = URL
global.URLSearchParams = URLSearchParams

// FormData polyfill if needed
if (typeof global.FormData === 'undefined') {
  global.FormData = require('formdata-polyfill').FormData
}

// AbortController polyfill
if (typeof global.AbortController === 'undefined') {
  global.AbortController = require('abort-controller').AbortController
}

// Blob polyfill for file handling
if (typeof global.Blob === 'undefined') {
  global.Blob = require('buffer').Blob
}

// File polyfill for file uploads
if (typeof global.File === 'undefined') {
  class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options)
      this.name = fileName
      this.lastModified = options.lastModified || Date.now()
    }
  }
  global.File = File
}

// Headers polyfill for fetch API (simplified)
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map()
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.map.set(key.toLowerCase(), value))
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) =>
            this.map.set(key.toLowerCase(), value)
          )
        }
      }
    }

    get(name) {
      return this.map.get(name.toLowerCase()) || null
    }

    set(name, value) {
      this.map.set(name.toLowerCase(), value)
    }

    has(name) {
      return this.map.has(name.toLowerCase())
    }

    delete(name) {
      this.map.delete(name.toLowerCase())
    }

    entries() {
      return this.map.entries()
    }
  }
}

// Request/Response polyfills for fetch API (simplified)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this.body = init.body || null
    }

    async json() {
      return JSON.parse(this.body)
    }

    async text() {
      return this.body
    }

    async formData() {
      const formData = new FormData()
      return formData
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
    }

    async json() {
      return JSON.parse(this.body)
    }

    async text() {
      return this.body
    }

    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      })
    }
  }
}

// Performance API polyfill
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
  }
}

// CustomEvent polyfill
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict)
      this.detail = eventInitDict.detail
    }
  }
}

// Event polyfill
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor(type, eventInitDict = {}) {
      this.type = type
      this.bubbles = eventInitDict.bubbles || false
      this.cancelable = eventInitDict.cancelable || false
      this.composed = eventInitDict.composed || false
      this.defaultPrevented = false
      this.eventPhase = 0
      this.isTrusted = false
      this.timeStamp = Date.now()
    }

    preventDefault() {
      this.defaultPrevented = true
    }

    stopPropagation() {}
    stopImmediatePropagation() {}
  }
}

// EventTarget polyfill
if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    constructor() {
      this.listeners = {}
    }

    addEventListener(type, listener) {
      if (!this.listeners[type]) {
        this.listeners[type] = []
      }
      this.listeners[type].push(listener)
    }

    removeEventListener(type, listener) {
      if (this.listeners[type]) {
        const index = this.listeners[type].indexOf(listener)
        if (index > -1) {
          this.listeners[type].splice(index, 1)
        }
      }
    }

    dispatchEvent(event) {
      if (this.listeners[event.type]) {
        this.listeners[event.type].forEach(listener => {
          listener.call(this, event)
        })
      }
      return !event.defaultPrevented
    }
  }
}

// MutationObserver polyfill
if (typeof global.MutationObserver === 'undefined') {
  global.MutationObserver = class MutationObserver {
    constructor(callback) {
      this.callback = callback
    }

    observe() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
}

// DOMRect polyfill
if (typeof global.DOMRect === 'undefined') {
  global.DOMRect = class DOMRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
      this.top = y
      this.right = x + width
      this.bottom = y + height
      this.left = x
    }
  }
}

// Range polyfill for text selection
if (typeof global.Range === 'undefined') {
  global.Range = class Range {
    constructor() {
      this.collapsed = true
      this.commonAncestorContainer = null
      this.endContainer = null
      this.endOffset = 0
      this.startContainer = null
      this.startOffset = 0
    }

    setStart() {}
    setEnd() {}
    selectNode() {}
    selectNodeContents() {}
    collapse() {}
    getBoundingClientRect() {
      return new DOMRect()
    }
  }
}

// Selection API polyfill
if (typeof global.Selection === 'undefined') {
  global.Selection = class Selection {
    constructor() {
      this.anchorNode = null
      this.anchorOffset = 0
      this.focusNode = null
      this.focusOffset = 0
      this.isCollapsed = true
      this.rangeCount = 0
      this.type = 'None'
    }

    addRange() {}
    removeAllRanges() {}
    getRangeAt() {
      return new Range()
    }
    toString() {
      return ''
    }
  }
}

// getSelection polyfill
if (typeof global.getSelection === 'undefined') {
  global.getSelection = () => new Selection()
}

// Clipboard API polyfill
if (typeof global.navigator === 'undefined') {
  global.navigator = {}
}

if (!global.navigator.clipboard) {
  global.navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  }
}

// User agent polyfill
if (!global.navigator.userAgent) {
  global.navigator.userAgent = 'Node.js/Jest'
}

// Geolocation API polyfill
if (!global.navigator.geolocation) {
  global.navigator.geolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  }
}

// MediaDevices polyfill
if (!global.navigator.mediaDevices) {
  global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockRejectedValue(new Error('Not implemented')),
    enumerateDevices: jest.fn().mockResolvedValue([]),
  }
}

// Web Workers polyfill
if (typeof global.Worker === 'undefined') {
  global.Worker = class Worker extends EventTarget {
    constructor(url) {
      super()
      this.url = url
    }

    postMessage() {}
    terminate() {}
  }
}

// Service Worker polyfill
if (!global.navigator.serviceWorker) {
  global.navigator.serviceWorker = {
    register: jest.fn().mockResolvedValue({ unregister: jest.fn() }),
    ready: Promise.resolve({ unregister: jest.fn() }),
    controller: null,
  }
}

// Notification API polyfill
if (typeof global.Notification === 'undefined') {
  global.Notification = class Notification extends EventTarget {
    constructor(title, options = {}) {
      super()
      this.title = title
      this.body = options.body || ''
      this.icon = options.icon || ''
      this.permission = 'default'
    }

    static requestPermission() {
      return Promise.resolve('default')
    }

    close() {}
  }

  global.Notification.permission = 'default'
}

// WebSocket polyfill
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class WebSocket extends EventTarget {
    constructor(url) {
      super()
      this.url = url
      this.readyState = 0
      this.CONNECTING = 0
      this.OPEN = 1
      this.CLOSING = 2
      this.CLOSED = 3
    }

    send() {}
    close() {}
  }
}

// Polyfill for older Node.js versions
if (typeof global.queueMicrotask === 'undefined') {
  global.queueMicrotask = callback => {
    Promise.resolve().then(callback)
  }
}

// Console polyfills for complete coverage
if (!global.console.debug) {
  global.console.debug = global.console.log
}

if (!global.console.groupCollapsed) {
  global.console.groupCollapsed = global.console.group || (() => {})
}

if (!global.console.groupEnd) {
  global.console.groupEnd = () => {}
}

// Ensure global document and window are available
if (typeof global.document === 'undefined') {
  const { JSDOM } = require('jsdom')
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  })

  global.document = dom.window.document
  global.window = dom.window

  // Copy window properties to global
  Object.keys(dom.window).forEach(property => {
    if (typeof global[property] === 'undefined') {
      global[property] = dom.window[property]
    }
  })
}
