'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ServiceWorkerRegistrationProps {
  onUpdate?: () => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export default function ServiceWorkerRegistration({
  onUpdate,
  onSuccess,
  onError
}: ServiceWorkerRegistrationProps) {
  const [swStatus, setSwStatus] = useState<'loading' | 'ready' | 'update-available' | 'error' | null>(null)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      setSwStatus('loading')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      setRegistration(registration)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              setSwStatus('update-available')
              setShowUpdatePrompt(true)
              onUpdate?.()
            }
          })
        }
      })

      // Service worker is ready
      if (registration.active) {
        setSwStatus('ready')
        onSuccess?.()
      }

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update()
      }, 30 * 60 * 1000)

    } catch (error) {
      console.error('Service Worker registration failed:', error)
      setSwStatus('error')
      onError?.(error as Error)
    }
  }

  const handleUpdate = async () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setShowUpdatePrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  return (
    <>
      {/* Update Prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            className="fixed top-4 right-4 z-50 max-w-sm"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    Update Available
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    A new version of Prismy is available. Update now to get the latest features and improvements.
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={handleUpdate}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Worker Status (Development only) */}
      {process.env.NODE_ENV === 'development' && swStatus && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`text-xs px-2 py-1 rounded-md ${
            swStatus === 'ready' ? 'bg-green-100 text-green-800' :
            swStatus === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            swStatus === 'update-available' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            SW: {swStatus}
          </div>
        </div>
      )}
    </>
  )
}

// Hook for service worker utilities
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Online/offline status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Get SW registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(setSwRegistration)
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const sendMessageToSW = (message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!swRegistration?.active) {
        reject(new Error('Service Worker not available'))
        return
      }

      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      swRegistration.active.postMessage(message, [messageChannel.port2])
    })
  }

  const getCacheStatus = async () => {
    try {
      return await sendMessageToSW({ type: 'GET_CACHE_STATUS' })
    } catch (error) {
      console.error('Failed to get cache status:', error)
      return null
    }
  }

  const clearCache = async () => {
    try {
      await sendMessageToSW({ type: 'CLEAR_CACHE' })
      return true
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return false
    }
  }

  const cacheTranslation = async (translation: any) => {
    try {
      await sendMessageToSW({ 
        type: 'CACHE_TRANSLATION', 
        payload: translation 
      })
      return true
    } catch (error) {
      console.error('Failed to cache translation:', error)
      return false
    }
  }

  return {
    isOnline,
    swRegistration,
    getCacheStatus,
    clearCache,
    cacheTranslation
  }
}