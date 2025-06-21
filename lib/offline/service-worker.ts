/**
 * Enhanced Service Worker for Offline Support
 * Implements caching strategies, background sync, and PWA features
 */

declare const self: ServiceWorkerGlobalScope

const CACHE_VERSION = 'prismy-v1.2.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE = `${CACHE_VERSION}-api`

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS and JS files
]

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/translate/, strategy: 'networkFirst', ttl: 300000 }, // 5 minutes
  { pattern: /\/api\/user\/profile/, strategy: 'staleWhileRevalidate', ttl: 900000 }, // 15 minutes
  { pattern: /\/api\/user\/history/, strategy: 'networkFirst', ttl: 600000 }, // 10 minutes
]

// Pages to cache for offline viewing
const OFFLINE_PAGES = [
  '/',
  '/dashboard',
  '/documents',
  '/offline'
]

interface CacheItem {
  data: any
  timestamp: number
  ttl: number
}

interface SyncData {
  type: string
  data: any
  timestamp: number
  id: string
}

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS)
      }),
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAsset(request))
  } else if (OFFLINE_PAGES.includes(url.pathname)) {
    event.respondWith(handlePageRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

// API request handler with caching strategies
async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  
  // Find matching cache pattern
  const pattern = API_CACHE_PATTERNS.find(p => p.pattern.test(url.pathname))
  
  if (!pattern) {
    // No caching for unmatched APIs
    return fetch(request)
  }

  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)

  switch (pattern.strategy) {
    case 'networkFirst':
      return networkFirst(request, cache, pattern.ttl)
    
    case 'cacheFirst':
      return cacheFirst(request, cache, pattern.ttl)
    
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cache, pattern.ttl)
    
    default:
      return fetch(request)
  }
}

// Network first strategy
async function networkFirst(request: Request, cache: Cache, ttl: number): Promise<Response> {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone()
      await cacheResponseWithTTL(cache, request, responseClone, ttl)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    
    const cachedResponse = await getCachedResponseIfValid(cache, request, ttl)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline fallback
    return createOfflineResponse()
  }
}

// Cache first strategy
async function cacheFirst(request: Request, cache: Cache, ttl: number): Promise<Response> {
  const cachedResponse = await getCachedResponseIfValid(cache, request, ttl)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cacheResponseWithTTL(cache, request, responseClone, ttl)
    }
    
    return networkResponse
  } catch (error) {
    return createOfflineResponse()
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request: Request, cache: Cache, ttl: number): Promise<Response> {
  const cachedResponse = await cache.match(request)
  
  // Always try to revalidate in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cacheResponseWithTTL(cache, request, responseClone, ttl)
    }
    return networkResponse
  }).catch(() => null)

  // Return cached version immediately if available
  if (cachedResponse) {
    // Don't await the network promise to return immediately
    networkPromise
    return cachedResponse
  }
  
  // Wait for network if no cache
  try {
    return await networkPromise || createOfflineResponse()
  } catch (error) {
    return createOfflineResponse()
  }
}

// Static asset handler
async function handleStaticAsset(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    return createOfflineResponse()
  }
}

// Page request handler
async function handlePageRequest(request: Request): Promise<Response> {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Page network failed, trying cache')
    
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    const offlineResponse = await cache.match('/offline')
    return offlineResponse || createOfflineResponse()
  }
}

// Dynamic request handler
async function handleDynamicRequest(request: Request): Promise<Response> {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    return cachedResponse || createOfflineResponse()
  }
}

// Cache response with TTL metadata
async function cacheResponseWithTTL(
  cache: Cache, 
  request: Request, 
  response: Response, 
  ttl: number
): Promise<void> {
  const cacheItem: CacheItem = {
    data: await response.text(),
    timestamp: Date.now(),
    ttl
  }
  
  const cacheResponse = new Response(JSON.stringify(cacheItem), {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached': 'true',
      'sw-timestamp': Date.now().toString()
    }
  })
  
  await cache.put(request, cacheResponse)
}

// Get cached response if still valid
async function getCachedResponseIfValid(
  cache: Cache, 
  request: Request, 
  ttl: number
): Promise<Response | null> {
  const cachedResponse = await cache.match(request)
  
  if (!cachedResponse) {
    return null
  }
  
  const timestamp = cachedResponse.headers.get('sw-timestamp')
  if (!timestamp) {
    return cachedResponse
  }
  
  const age = Date.now() - parseInt(timestamp)
  if (age > ttl) {
    // Cache expired, remove it
    await cache.delete(request)
    return null
  }
  
  return cachedResponse
}

// Create offline response
function createOfflineResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This request requires an internet connection',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'translation-sync') {
    event.waitUntil(syncTranslations())
  } else if (event.tag === 'document-sync') {
    event.waitUntil(syncDocuments())
  }
})

// Sync offline translations
async function syncTranslations(): Promise<void> {
  try {
    const syncData = await getStoredSyncData('translations')
    
    for (const item of syncData) {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        })
        
        if (response.ok) {
          await removeSyncData('translations', item.id)
          console.log('Synced translation:', item.id)
        }
      } catch (error) {
        console.error('Failed to sync translation:', error)
      }
    }
  } catch (error) {
    console.error('Translation sync failed:', error)
  }
}

// Sync offline documents
async function syncDocuments(): Promise<void> {
  try {
    const syncData = await getStoredSyncData('documents')
    
    for (const item of syncData) {
      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        })
        
        if (response.ok) {
          await removeSyncData('documents', item.id)
          console.log('Synced document:', item.id)
        }
      } catch (error) {
        console.error('Failed to sync document:', error)
      }
    }
  } catch (error) {
    console.error('Document sync failed:', error)
  }
}

// IndexedDB helpers for sync data
async function getStoredSyncData(type: string): Promise<SyncData[]> {
  // Simplified - in production, use IndexedDB
  return []
}

async function removeSyncData(type: string, id: string): Promise<void> {
  // Simplified - in production, use IndexedDB
}

// Push notification handler
self.addEventListener('push', (event: any) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: data.data,
    actions: data.actions
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  
  if (action === 'open') {
    event.waitUntil(
      self.clients.openWindow(data.url || '/')
    )
  }
})

// Message handler for client communication
self.addEventListener('message', (event: any) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls))
      break
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCaches())
      break
      
    case 'GET_CACHE_INFO':
      event.waitUntil(getCacheInfo().then(info => {
        event.ports[0].postMessage(info)
      }))
      break
  }
})

// Cache specific URLs
async function cacheUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(DYNAMIC_CACHE)
  await cache.addAll(urls)
}

// Clear all caches
async function clearCaches(): Promise<void> {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  )
}

// Get cache information
async function getCacheInfo(): Promise<any> {
  const cacheNames = await caches.keys()
  const info: any = {}
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    info[name] = {
      size: keys.length,
      urls: keys.map(req => req.url)
    }
  }
  
  return info
}

export {}