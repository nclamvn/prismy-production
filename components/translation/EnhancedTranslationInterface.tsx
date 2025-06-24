'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Languages, 
  Copy, 
  Download, 
  History, 
  BookOpen, 
  Zap, 
  FileText,
  Volume2,
  Star,
  Clock,
  Target,
  Brain,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { translationMemory } from '@/lib/translation-memory'
import { TouchButton } from '@/components/ui/TouchOptimized'
import { ProgressiveImage } from '@/components/IntersectionOptimizer'

export interface TranslationSession {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  confidence: number
  processingTime: number
  memoryMatch?: {
    matchScore: number
    matchType: 'exact' | 'fuzzy' | 'context'
  }
  timestamp: Date
}

export interface RealTimeTranslationProps {
  initialSourceLang?: string
  initialTargetLang?: string
  onTranslationComplete?: (session: TranslationSession) => void
  enableBatchMode?: boolean
  enableMemoryView?: boolean
  enableQualityControl?: boolean
}

const EnhancedTranslationInterface: React.FC<RealTimeTranslationProps> = ({
  initialSourceLang = 'auto',
  initialTargetLang = 'vi',
  onTranslationComplete,
  enableBatchMode = true,
  enableMemoryView = true,
  enableQualityControl = true
}) => {
  const { language } = useLanguage()
  
  // Core state
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState(initialSourceLang)
  const [targetLang, setTargetLang] = useState(initialTargetLang)
  
  // UI state
  const [isTranslating, setIsTranslating] = useState(false)
  const [showMemoryMatches, setShowMemoryMatches] = useState(false)
  const [showBatchMode, setShowBatchMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'translate' | 'batch' | 'memory' | 'history'>('translate')
  
  // Translation state
  const [confidence, setConfidence] = useState(0)
  const [processingTime, setProcessingTime] = useState(0)
  const [memoryMatches, setMemoryMatches] = useState<any[]>([])
  const [translationHistory, setTranslationHistory] = useState<TranslationSession[]>([])
  
  // Batch mode state
  const [batchTexts, setBatchTexts] = useState<string[]>([''])
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  
  // Refs
  const sourceTextRef = useRef<HTMLTextAreaElement>(null)
  const translationTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Real-time translation with debouncing
  const debouncedTranslate = useCallback(
    async (text: string) => {
      if (!text.trim() || text.length < 2) {
        setTranslatedText('')
        setMemoryMatches([])
        return
      }

      setIsTranslating(true)
      const startTime = Date.now()

      try {
        // 1. Check Translation Memory first
        if (enableMemoryView) {
          const matches = await translationMemory.findMatches(
            text,
            sourceLang === 'auto' ? 'en' : sourceLang,
            targetLang,
            undefined,
            {
              minScore: 0.7,
              maxResults: 5,
              enableContextMatching: true,
              enableDomainFiltering: false,
              preferApproved: true,
              weightByUsage: true
            }
          )
          
          setMemoryMatches(matches)
          
          // Use high-confidence memory match
          if (matches.length > 0 && matches[0].matchScore >= 0.95) {
            const match = matches[0]
            setTranslatedText(match.entry.targetText)
            setConfidence(match.matchScore)
            setProcessingTime(Date.now() - startTime)
            setIsTranslating(false)
            return
          }
        }

        // 2. Call translation API
        const response = await fetch('/api/translate/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
            targetLang,
            qualityTier: 'free'
          })
        })

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || 'Translation failed')
        }
        
        const result = data.result
        setTranslatedText(result.translatedText)
        setConfidence(result.qualityScore || 0.8)
        setProcessingTime(result.processingTime || (Date.now() - startTime))

        // Create session record
        const session: TranslationSession = {
          id: `session-${Date.now()}`,
          sourceText: text,
          translatedText: result.translatedText,
          sourceLang: result.detectedLanguage || sourceLang,
          targetLang,
          confidence: result.confidence || 0.8,
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        }

        // Add to history
        setTranslationHistory(prev => [session, ...prev.slice(0, 9)])
        
        // Callback
        if (onTranslationComplete) {
          onTranslationComplete(session)
        }

      } catch (error) {
        console.error('[Enhanced Translation] Error:', error)
        setTranslatedText('Translation failed. Please try again.')
        setConfidence(0)
      } finally {
        setIsTranslating(false)
      }
    },
    [sourceLang, targetLang, enableMemoryView, onTranslationComplete]
  )

  // Debounced translation effect
  useEffect(() => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current)
    }

    translationTimeoutRef.current = setTimeout(() => {
      if (sourceText.trim()) {
        debouncedTranslate(sourceText)
      }
    }, 800) // 800ms debounce

    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current)
      }
    }
  }, [sourceText, debouncedTranslate])

  // Batch translation handler
  const handleBatchTranslation = async () => {
    const validTexts = batchTexts.filter(text => text.trim().length > 0)
    
    if (validTexts.length === 0) return

    setIsTranslating(true)
    setBatchProgress(0)

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: validTexts,
          sourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
          targetLang,
          useTranslationMemory: true,
          enableCache: true,
          qualityTier: 'standard'
        })
      })

      if (!response.ok) {
        throw new Error(`Batch translation failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Poll for progress
      const batchId = result.batchId
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch(`/api/translate/batch/${batchId}/progress`)
          const progress = await progressResponse.json()
          
          setBatchProgress(progress.progress)
          
          if (progress.progress < 100) {
            setTimeout(pollProgress, 1000)
          } else {
            // Get final results
            const resultsResponse = await fetch(`/api/translate/batch/${batchId}/results`)
            const finalResults = await resultsResponse.json()
            setBatchResults(finalResults.translations || [])
            setIsTranslating(false)
          }
        } catch (error) {
          console.error('[Batch Translation] Progress polling failed:', error)
          setIsTranslating(false)
        }
      }
      
      pollProgress()

    } catch (error) {
      console.error('[Batch Translation] Error:', error)
      setIsTranslating(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add toast notification here
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Language swap
  const swapLanguages = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
      setSourceText(translatedText)
      setTranslatedText('')
    }
  }

  const content = {
    vi: {
      sourceLabel: 'Văn bản nguồn',
      targetLabel: 'Bản dịch',
      detectLanguage: 'Tự động phát hiện',
      translating: 'Đang dịch...',
      confidence: 'Độ tin cậy',
      processingTime: 'Thời gian xử lý',
      memoryMatch: 'Khớp từ bộ nhớ dịch',
      batchMode: 'Chế độ dịch hàng loạt',
      addText: 'Thêm văn bản',
      translateAll: 'Dịch tất cả',
      history: 'Lịch sử dịch',
      copy: 'Sao chép',
      download: 'Tải xuống'
    },
    en: {
      sourceLabel: 'Source text',
      targetLabel: 'Translation',
      detectLanguage: 'Auto-detect',
      translating: 'Translating...',
      confidence: 'Confidence',
      processingTime: 'Processing time',
      memoryMatch: 'Memory match',
      batchMode: 'Batch translation',
      addText: 'Add text',
      translateAll: 'Translate all',
      history: 'Translation history',
      copy: 'Copy',
      download: 'Download'
    }
  }

  const t = content[language as keyof typeof content] || content.en

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Translation</h1>
            <p className="text-gray-600">Real-time translation with memory integration</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'translate', icon: Zap, label: 'Translate' },
            { id: 'batch', icon: FileText, label: 'Batch' },
            { id: 'memory', icon: Brain, label: 'Memory' },
            { id: 'history', icon: History, label: 'History' }
          ].map(tab => (
            <TouchButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TouchButton>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'translate' && (
          <motion.div
            key="translate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Language selector */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="auto">{t.detectLanguage}</option>
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                </select>

                <TouchButton
                  onClick={swapLanguages}
                  disabled={sourceLang === 'auto'}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Languages className="w-5 h-5" />
                </TouchButton>

                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Quality indicators */}
              {(confidence > 0 || processingTime > 0) && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {confidence > 0 && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{Math.round(confidence * 100)}%</span>
                    </div>
                  )}
                  {processingTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{processingTime}ms</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main translation interface */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Source text */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t.sourceLabel}
                </label>
                <div className="relative">
                  <textarea
                    ref={sourceTextRef}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {sourceText && (
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                      {sourceText.length} characters
                    </div>
                  )}
                </div>
              </div>

              {/* Translated text */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    {t.targetLabel}
                  </label>
                  {translatedText && (
                    <div className="flex items-center gap-2">
                      <TouchButton
                        onClick={() => copyToClipboard(translatedText)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                      </TouchButton>
                      <TouchButton
                        onClick={() => {/* Text-to-speech functionality */}}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        <Volume2 className="w-4 h-4" />
                      </TouchButton>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="w-full h-64 p-4 border border-gray-300 rounded-xl bg-gray-50 overflow-y-auto">
                    {isTranslating ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span>{t.translating}</span>
                        </div>
                      </div>
                    ) : translatedText ? (
                      <div className="space-y-2">
                        <p className="text-gray-900 leading-relaxed">{translatedText}</p>
                        {memoryMatches.length > 0 && memoryMatches[0].matchScore >= 0.7 && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {memoryMatches[0].matchType === 'exact' ? 'Exact' : 'Fuzzy'} match from memory 
                              ({Math.round(memoryMatches[0].matchScore * 100)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Translation will appear here...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Memory matches panel */}
            {enableMemoryView && memoryMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Translation Memory Matches</h3>
                </div>
                <div className="space-y-2">
                  {memoryMatches.slice(0, 3).map((match, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded-lg p-3 cursor-pointer hover:bg-blue-50"
                      onClick={() => setTranslatedText(match.entry.targetText)}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{match.entry.targetText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {match.matchType} match • {Math.round(match.matchScore * 100)}% confidence
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'batch' && enableBatchMode && (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Batch translation interface */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.batchMode}</h2>
              
              <div className="space-y-4">
                {batchTexts.map((text, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={text}
                        onChange={(e) => {
                          const newTexts = [...batchTexts]
                          newTexts[index] = e.target.value
                          setBatchTexts(newTexts)
                        }}
                        placeholder={`Text ${index + 1}...`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                    {batchTexts.length > 1 && (
                      <TouchButton
                        onClick={() => {
                          const newTexts = batchTexts.filter((_, i) => i !== index)
                          setBatchTexts(newTexts)
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </TouchButton>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-3">
                  <TouchButton
                    onClick={() => setBatchTexts([...batchTexts, ''])}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {t.addText}
                  </TouchButton>
                  
                  <TouchButton
                    onClick={handleBatchTranslation}
                    disabled={isTranslating || batchTexts.every(text => !text.trim())}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? 'Processing...' : t.translateAll}
                  </TouchButton>
                </div>

                {isTranslating && batchProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{Math.round(batchProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {batchResults.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-medium text-gray-900">Results</h3>
                    {batchResults.map((result, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Source:</p>
                            <p className="text-gray-900">{result.sourceText}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Translation:</p>
                            <p className="text-gray-900">{result.translatedText}</p>
                            {result.fromMemory && (
                              <p className="text-xs text-blue-600 mt-1">From memory</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.history}</h2>
              
              {translationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No translation history yet
                </div>
              ) : (
                <div className="space-y-3">
                  {translationHistory.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            {session.sourceLang.toUpperCase()} → {session.targetLang.toUpperCase()}
                          </p>
                          <p className="text-gray-900">{session.sourceText}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Translation</p>
                          <p className="text-gray-900">{session.translatedText}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{Math.round(session.confidence * 100)}% confidence</span>
                          <span>{session.processingTime}ms</span>
                          <span>{session.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <TouchButton
                          onClick={() => copyToClipboard(session.translatedText)}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <Copy className="w-4 h-4" />
                        </TouchButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EnhancedTranslationInterface