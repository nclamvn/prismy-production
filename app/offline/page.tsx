'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp } from '@/lib/motion'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      // Redirect to homepage when back online
      window.location.href = '/'
    }
  }, [isOnline])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full text-center"
        variants={motionSafe(slideUp)}
        initial="hidden"
        animate="visible"
      >
        {/* Offline Icon */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 bg-gray-200 rounded-full flex items-center justify-center"
          variants={motionSafe({
            hidden: { scale: 0 },
            visible: { scale: 1 }
          })}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <svg 
            className="w-12 h-12 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" 
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="heading-3 text-gray-900 mb-4"
          variants={motionSafe(slideUp)}
          transition={{ delay: 0.3 }}
        >
          You&apos;re Offline
        </motion.h1>

        {/* Description */}
        <motion.p
          className="body-base text-gray-600 mb-8"
          variants={motionSafe(slideUp)}
          transition={{ delay: 0.4 }}
        >
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry - some features are still available offline!
        </motion.p>

        {/* Offline Features */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8"
          variants={motionSafe(slideUp)}
          transition={{ delay: 0.5 }}
        >
          <h3 className="heading-4 text-gray-900 mb-4">Available Offline:</h3>
          <ul className="space-y-3 text-left">
            <li className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              View cached translations
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Browse your translation history
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Access saved documents
            </li>
            <li className="flex items-center text-gray-500">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              New translations (requires internet)
            </li>
          </ul>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          className={`p-4 rounded-lg flex items-center justify-center ${
            isOnline 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}
          variants={motionSafe(slideUp)}
          transition={{ delay: 0.6 }}
        >
          <div className={`w-3 h-3 rounded-full mr-3 ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className={`font-medium ${
            isOnline ? 'text-green-800' : 'text-red-800'
          }`}>
            {isOnline ? 'Back Online! Redirecting...' : 'No Internet Connection'}
          </span>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="mt-8 space-y-3"
          variants={motionSafe(slideUp)}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary w-full"
          >
            Go Back
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}