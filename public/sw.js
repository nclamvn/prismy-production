/* ============================================================================ */
/* PRISMY SERVICE WORKER - ULTRA PERFORMANCE EDITION */
/* Advanced caching strategies for 60fps smooth experience */
/* ============================================================================ */

const CACHE_VERSION = 'prismy-v5-perf'
const CACHES = {
  static: `static-${CACHE_VERSION}`,
  runtime: `runtime-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
}

// Performance configuration
const CACHE_CONFIG = {
  maxAge: {
    static: 31536000, // 1 year
    images: 2592000,  // 30 days
    api: 300,         // 5 minutes
    runtime: 3600,    // 1 hour
  },
  networkTimeout: 3000, // 3 seconds
  maxEntries: {
    images: 100,
    api: 50,
    runtime: 100,
  },
}

// Critical assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/logo.svg',
  '/favicon-rounded.svg',
]

// Routes for offline support
const OFFLINE_PAGES = [
  '/workspace',
  '/documents',
  '/pricing',
  '/features',
]

// Install event - aggressive precaching
self.addEventListener('install', event => {

  event.waitUntil(
    Promise.all([
      // Precache static assets
      caches.open(CACHES.static).then(cache => {

        return cache.addAll(PRECACHE_ASSETS)
      }),
      
      // Precache offline pages
      caches.open(CACHES.runtime).then(cache => {

        return cache.addAll(OFFLINE_PAGES)
      }),
    ]).then(() => {
      // Skip waiting for immediate activation
      return self.skipWaiting()
    })
  )
})

// Activate event - cleanup and optimization
self.addEventListener('activate', event => {

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => !Object.values(CACHES).includes(name))
            .map(name => {

              return caches.delete(name)
            })
        )
      }),
      
      // Claim all clients
      self.clients.claim(),
      
      // Warm critical routes
      warmCriticalRoutes(),
    ])
  )
})

// Warm critical routes for instant loading
async function warmCriticalRoutes() {
  const criticalRoutes = ['/', '/workspace', '/documents']
  const cache = await caches.open(CACHES.runtime)
  
  for (const route of criticalRoutes) {
    try {
      const response = await fetch(route)
      if (response.ok) {
        await cache.put(route, response)
      }
    } catch (error) {
      // Silent fail
    }
  }
}

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) return
  
  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') return
  
  // Route to appropriate handler
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPI(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImage(request))
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStatic(request))
  } else {
    event.respondWith(handleRuntime(request))
  }
})

// API handler - Network first with timeout
async function handleAPI(request) {
  const cache = await caches.open(CACHES.api)
  
  try {
    // Race network request against timeout
    const networkPromise = fetch(request)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CACHE_CONFIG.networkTimeout)
    )
    
    const response = await Promise.race([networkPromise, timeoutPromise])
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache
    const cached = await cache.match(request)
    if (cached) {

      return cached
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Image handler - Cache first with lazy update
async function handleImage(request) {
  const cache = await caches.open(CACHES.images)
  const cached = await cache.match(request)
  
  if (cached) {
    // Return cached immediately
    const age = getResponseAge(cached)
    if (age < CACHE_CONFIG.maxAge.images) {
      return cached
    }
    
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response)
      }
    }).catch(() => {})
    
    return cached
  }
  
  // Fetch with optimization headers
  try {
    const response = await fetch(request, {
      headers: {
        'Accept': 'image/avif,image/webp,image/*',
      }
    })
    
    if (response.ok) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Return placeholder image
    return generatePlaceholderImage()
  }
}

// Static asset handler - Cache first
async function handleStatic(request) {
  const cache = await caches.open(CACHES.static)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  const response = await fetch(request)
  
  if (response.ok) {
    cache.put(request, response.clone())
  }
  
  return response
}

// Runtime handler - Stale while revalidate
async function handleRuntime(request) {
  const cache = await caches.open(CACHES.runtime)
  const cached = await cache.match(request)
  
  // Return cached immediately if available
  if (cached) {
    // Update in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response)
      }
    }).catch(() => {})
    
    return cached
  }
  
  // Otherwise fetch from network
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Try to return offline page
    const offlinePage = await cache.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
    
    // Last resort - return error page
    return new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Utility functions
function isImageRequest(request) {
  const accept = request.headers.get('Accept') || ''
  return accept.includes('image/') || 
         /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(request.url)
}

function isStaticAsset(pathname) {
  return pathname.includes('/_next/static/') ||
         pathname.includes('/fonts/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.woff2')
}

function getResponseAge(response) {
  const date = response.headers.get('date')
  if (!date) return Infinity
  return (Date.now() - new Date(date).getTime()) / 1000
}

function generatePlaceholderImage() {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <text x="200" y="150" text-anchor="middle" font-family="system-ui" font-size="16" fill="#6b7280">
        Image unavailable
      </text>
    </svg>
  `
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  })
}

// Background sync for offline actions
self.addEventListener('sync', event => {

  if (event.tag === 'sync-translations') {
    event.waitUntil(syncOfflineTranslations())
  }
})

async function syncOfflineTranslations() {

  // Implementation would sync with IndexedDB
}

// Message handling for app communication
self.addEventListener('message', event => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(names => 
          Promise.all(names.map(name => caches.delete(name)))
        ).then(() => {
          event.ports[0].postMessage({ type: 'CACHE_CLEARED' })
        })
      )
      break
      
    case 'CACHE_URLS':
      event.waitUntil(
        cacheUrls(payload).then(() => {
          event.ports[0].postMessage({ type: 'URLS_CACHED' })
        })
      )
      break
  }
})

async function cacheUrls(urls) {
  const cache = await caches.open(CACHES.runtime)
  return Promise.all(
    urls.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          return cache.put(url, response)
        }
      }).catch(() => {})
    )
  )
}

// Performance monitoring
let performanceBuffer = []

if ('PerformanceObserver' in self) {
  const observer = new PerformanceObserver(list => {
    performanceBuffer.push(...list.getEntries())
    
    // Send metrics in batches
    if (performanceBuffer.length >= 10) {
      sendPerformanceMetrics(performanceBuffer)
      performanceBuffer = []
    }
  })
  
  observer.observe({ entryTypes: ['resource', 'navigation'] })
}

function sendPerformanceMetrics(entries) {
  // Send to analytics endpoint
  fetch('/api/analytics/sw-performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entries: entries.map(e => ({
        name: e.name,
        duration: e.duration,
        type: e.entryType,
        size: e.transferSize || 0,
      }))
    })
  }).catch(() => {})
}
