'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hybridTranslationEngine, HybridTranslationResponse, TranslationResult } from '@/src/lib/hybrid-translation-engine'
import { backgroundQueue, ProcessingJob } from '@/src/lib/background-processing-queue'
import { useAuth } from '@/contexts/AuthContext'

interface HybridTranslationInterfaceProps {
  text: string
  sourceLang: string
  targetLang: string
  onTranslationComplete?: (result: HybridTranslationResponse) => void
  showComparison?: boolean
  className?: string
}

export default function HybridTranslationInterface({
  text,
  sourceLang,
  targetLang,
  onTranslationComplete,
  showComparison = true,
  className = ''
}: HybridTranslationInterfaceProps) {
  const [result, setResult] = useState<HybridTranslationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<'free' | 'premium'>('free')
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<ProcessingJob | null>(null)
  const [useBackgroundProcessing, setUseBackgroundProcessing] = useState(false)
  const { user } = useAuth()

  // Threshold for background processing (5000 characters ≈ 800-1000 words)
  const BACKGROUND_THRESHOLD = 5000

  // Get user's usage stats
  const [usageStats, setUsageStats] = useState<{
    used: number
    remaining: number
    resetDate: Date
  } | null>(null)

  useEffect(() => {
    if (user?.id) {
      const stats = hybridTranslationEngine.getUserUsageStats(user.id)
      setUsageStats(stats)
    }
  }, [user])

  // Subscribe to job updates for background processing
  useEffect(() => {
    if (!jobId) return

    const handleJobUpdate = (updatedJob: ProcessingJob) => {
      if (updatedJob.id === jobId) {
        setJob(updatedJob)
        
        // Handle completion
        if (updatedJob.status === 'completed' && updatedJob.result) {
          setResult(updatedJob.result)
          setIsLoading(false)
          
          if (onTranslationComplete) {
            onTranslationComplete(updatedJob.result)
          }
        }

        // Handle failure
        if (updatedJob.status === 'failed') {
          setError(updatedJob.error || 'Translation failed')
          setIsLoading(false)
        }
      }
    }

    backgroundQueue.onJobUpdate('started', handleJobUpdate)
    backgroundQueue.onJobUpdate('completed', handleJobUpdate)
    backgroundQueue.onJobUpdate('failed', handleJobUpdate)

    return () => {
      // Cleanup handled by queue
    }
  }, [jobId, onTranslationComplete])

  useEffect(() => {
    if (text.trim()) {
      // Check if we should use background processing
      const shouldUseBackground = text.length > BACKGROUND_THRESHOLD
      setUseBackgroundProcessing(shouldUseBackground)
      performTranslation()
    }
  }, [text, sourceLang, targetLang])

  const performTranslation = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    setError(null)
    setJob(null)
    setJobId(null)

    try {
      if (useBackgroundProcessing) {
        // Use background processing for long texts
        const newJobId = backgroundQueue.addJob({
          type: 'document_translation',
          priority: 'medium',
          data: {
            text,
            sourceLang,
            targetLang,
            useFreeTier: selectedProvider === 'free',
            includePremiumComparison: showComparison
          },
          userId: user?.id,
          estimatedDuration: Math.ceil(text.length / 1000) * 2000, // ~2 seconds per 1000 characters
          maxRetries: 2,
          metadata: {
            processingOptions: {
              provider: selectedProvider,
              sourceLang,
              targetLang
            }
          }
        })

        setJobId(newJobId)
        
      } else {
        // Direct translation for shorter texts
        const translationResult = await hybridTranslationEngine.translate({
          text,
          sourceLang,
          targetLang,
          useFreeTier: selectedProvider === 'free',
          includePremiumComparison: showComparison,
          userId: user?.id
        })

        setResult(translationResult)
        setIsLoading(false)
        
        if (onTranslationComplete) {
          onTranslationComplete(translationResult)
        }

        // Update usage stats
        if (user?.id) {
          const newStats = hybridTranslationEngine.getUserUsageStats(user.id)
          setUsageStats(newStats)
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
      setIsLoading(false)
    }
  }

  const handleProviderSwitch = (provider: 'free' | 'premium') => {
    setSelectedProvider(provider)
    if (result) {
      performTranslation()
    }
  }

  const cancelTranslation = () => {
    if (jobId) {
      backgroundQueue.cancelJob(jobId)
      setIsLoading(false)
      setJobId(null)
      setJob(null)
    }
  }

  const formatUsageStats = (stats: typeof usageStats) => {
    if (!stats) return null
    
    const percentageUsed = (stats.used / (stats.used + stats.remaining)) * 100
    const remainingWords = Math.floor(stats.remaining / 6) // Approximate words

    return {
      percentageUsed,
      remainingWords,
      resetDate: stats.resetDate
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityIcon = (score: number) => {
    if (score >= 0.9) return '🟢'
    if (score >= 0.8) return '🟡'
    return '🔴'
  }

  const usage = formatUsageStats(usageStats)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Usage Stats */}
      {usage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Free Translation Allowance</h3>
            <span className="text-xs text-blue-700">
              Resets {usage.resetDate.toLocaleDateString()}
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${usage.percentageUsed}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-blue-700">
            <span>{usage.remainingWords.toLocaleString()} words remaining</span>
            <span>{usage.percentageUsed.toFixed(1)}% used</span>
          </div>
        </motion.div>
      )}

      {/* Provider Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Translation Mode</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleProviderSwitch('free')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedProvider === 'free'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <div className="font-medium text-gray-900">Free Translation</div>
              <div className="text-xs text-gray-600 mt-1">
                LibreTranslate • Good quality • No cost
              </div>
              <div className="text-xs text-green-600 mt-1">
                ✓ Perfect for casual use
              </div>
            </div>
          </button>

          <button
            onClick={() => handleProviderSwitch('premium')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedProvider === 'premium'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <div className="font-medium text-gray-900">Premium Translation</div>
              <div className="text-xs text-gray-600 mt-1">
                Google Translate • Highest quality • Paid
              </div>
              <div className="text-xs text-purple-600 mt-1">
                ✓ Professional accuracy
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 font-medium">
                {useBackgroundProcessing ? 'Processing in Background...' : 'Translating...'}
              </span>
            </div>
            
            {useBackgroundProcessing && job && (job.status === 'pending' || job.status === 'processing') && (
              <button
                onClick={cancelTranslation}
                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {useBackgroundProcessing && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Large translation jobs are processed in the background for better performance.
              </div>
              
              {job && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">
                      {job.status === 'pending' ? 'Queued' : job.status}
                    </span>
                  </div>
                  
                  {job.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Job ID: {job.id}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex">
            <div className="text-red-500 mr-3">❌</div>
            <div>
              <h3 className="text-sm font-medium text-red-900">Translation Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Primary Translation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.primary.provider.name} Translation
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.primary.provider.cost === 'free' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {result.primary.provider.cost === 'free' ? 'FREE' : 'PREMIUM'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>{getQualityIcon(result.primary.qualityScore)}</span>
                    <span className={getQualityColor(result.primary.qualityScore)}>
                      {Math.round(result.primary.qualityScore * 100)}% quality
                    </span>
                  </div>
                  <div>
                    {result.primary.processingTime}ms
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed">
                  {result.primary.translatedText}
                </p>
              </div>
            </div>

            {/* Comparison Translation */}
            {result.comparison && showComparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {result.comparison.provider.name} Translation
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.comparison.provider.cost === 'free' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {result.comparison.provider.cost === 'free' ? 'FREE' : 'PREMIUM'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span>{getQualityIcon(result.comparison.qualityScore)}</span>
                      <span className={getQualityColor(result.comparison.qualityScore)}>
                        {Math.round(result.comparison.qualityScore * 100)}% quality
                      </span>
                    </div>
                    <div>
                      {result.comparison.processingTime}ms
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 leading-relaxed">
                    {result.comparison.translatedText}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Upgrade Recommendation */}
            {result.recommendation === 'premium' && result.upgradeReasons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-lg">⭐</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      Upgrade to Premium for Better Results
                    </h3>
                    
                    <ul className="space-y-2 mb-4">
                      {result.upgradeReasons.map((reason, index) => (
                        <li key={index} className="flex items-center text-sm text-purple-800">
                          <span className="text-purple-500 mr-2">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleProviderSwitch('premium')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Try Premium Now
                      </button>
                      
                      <button className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors">
                        View Pricing
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quality Metrics */}
            {result.comparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quality Comparison</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {result.primary.provider.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Quality: {Math.round(result.primary.qualityScore * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Confidence: {Math.round(result.primary.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {result.comparison.provider.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Quality: {Math.round(result.comparison.qualityScore * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Confidence: {Math.round(result.comparison.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}