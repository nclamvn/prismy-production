'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, X, ArrowRight, Sparkles } from 'lucide-react'
import { useFeatureHint } from '@/contexts/FeatureDiscoveryContext'

interface FeatureHintProps {
  feature: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactNode
}

export default function FeatureHint({ 
  feature, 
  title, 
  description, 
  position = 'bottom',
  delay = 5000,
  children 
}: FeatureHintProps) {
  const { shouldShow, dismiss } = useFeatureHint(feature)
  const [isVisible, setIsVisible] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (shouldShow && !hasInteracted) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [shouldShow, hasInteracted, delay])

  useEffect(() => {
    // Hide hint when user interacts with the feature
    const element = children as any
    if (element?.ref?.current) {
      const handleInteraction = () => {
        setHasInteracted(true)
        setIsVisible(false)
        dismiss()
      }

      const el = element.ref.current
      el.addEventListener('click', handleInteraction)
      el.addEventListener('focus', handleInteraction)

      return () => {
        el.removeEventListener('click', handleInteraction)
        el.removeEventListener('focus', handleInteraction)
      }
    }
  }, [children, dismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    dismiss()
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
    }
  }

  if (!shouldShow) return <>{children}</>

  return (
    <div className="relative inline-block">
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`absolute z-50 ${getPositionClasses()}`}
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg max-w-xs">
              {/* Arrow pointing to element */}
              <div className={`absolute w-3 h-3 bg-purple-600 transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1.5' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1.5' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1.5' :
                'right-full top-1/2 -translate-y-1/2 -mr-1.5'
              }`} />
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-medium text-purple-200">NEW FEATURE</span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="p-0.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                <p className="text-xs text-purple-100 leading-relaxed mb-3">
                  {description}
                </p>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-purple-200 hover:text-white transition-colors"
                  >
                    Dismiss
                  </button>
                  <div className="flex items-center space-x-1 text-xs text-purple-200">
                    <span>Try it</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle pulsing effect on the element when hint is available */}
      {shouldShow && !isVisible && (
        <div className="absolute inset-0 rounded-lg bg-purple-400 bg-opacity-20 animate-pulse pointer-events-none" />
      )}
    </div>
  )
}

// Smart Feature Badge Component
interface FeatureBadgeProps {
  feature: string
  type?: 'new' | 'pro' | 'ai' | 'beta'
  size?: 'sm' | 'md' | 'lg'
}

export function FeatureBadge({ feature, type = 'new', size = 'sm' }: FeatureBadgeProps) {
  const { shouldShow } = useFeatureHint(feature)

  if (!shouldShow) return null

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  const typeClasses = {
    new: 'bg-green-100 text-green-700 border-green-200',
    pro: 'bg-purple-100 text-purple-700 border-purple-200',
    ai: 'bg-blue-100 text-blue-700 border-blue-200',
    beta: 'bg-orange-100 text-orange-700 border-orange-200'
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        inline-flex items-center font-medium rounded-full border
        ${sizeClasses[size]} ${typeClasses[type]}
      `}
    >
      {type.toUpperCase()}
    </motion.span>
  )
}

// Progressive Feature Wrapper
interface ProgressiveFeatureProps {
  feature: string
  requiredLevel: 'beginner' | 'intermediate' | 'advanced'
  fallbackMessage?: string
  children: React.ReactNode
}

export function ProgressiveFeature({ 
  feature, 
  requiredLevel, 
  fallbackMessage,
  children 
}: ProgressiveFeatureProps) {
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')

  useEffect(() => {
    // Get user level from feature discovery context
    const level = localStorage.getItem('prismy-user-level') as 'beginner' | 'intermediate' | 'advanced'
    if (level) {
      setUserLevel(level)
    }
  }, [])

  const levelHierarchy = {
    'beginner': 0,
    'intermediate': 1,
    'advanced': 2
  }

  const isUnlocked = levelHierarchy[userLevel] >= levelHierarchy[requiredLevel]

  if (!isUnlocked) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        {fallbackMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className="text-center p-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                🔒
              </div>
              <p className="text-sm text-gray-600">{fallbackMessage}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}