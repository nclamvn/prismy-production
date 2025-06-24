'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Languages,
  Camera,
  Mic,
  Copy,
  Share2,
  Star,
  History,
  Settings,
  Zap,
  FileText,
  Image as ImageIcon,
  Volume2,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { advancedGestures } from '@/lib/mobile/advanced-gestures'
import { nativeAPIs } from '@/lib/mobile/native-apis'
import { installManager } from '@/lib/mobile/install-manager'
import { TouchButton } from '@/components/ui/TouchOptimized'

export interface MobileTranslationMode {
  id: string
  name: string
  icon: React.ComponentType<any>
  description: string
  features: string[]
}

export interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: () => void
  color: string
}

export interface MobileTranslationHubProps {
  onModeChange?: (mode: MobileTranslationMode) => void
  onTranslationComplete?: (result: any) => void
  initialMode?: string
}

const MobileTranslationHub: React.FC<MobileTranslationHubProps> = ({
  onModeChange,
  onTranslationComplete,
  initialMode = 'text'
}) => {
  const { language } = useLanguage()
  
  // Core state
  const [activeMode, setActiveMode] = useState(initialMode)
  const [isExpanded, setIsExpanded] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('vi')
  
  // Mobile-specific state
  const [dragOffset, setDragOffset] = useState(0)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [recentTranslations, setRecentTranslations] = useState<any[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Translation modes
  const translationModes: MobileTranslationMode[] = [
    {
      id: 'text',
      name: 'Text',
      icon: FileText,
      description: 'Type or paste text to translate',
      features: ['Real-time translation', 'Translation memory', 'Batch processing']
    },
    {
      id: 'camera',
      name: 'Camera',
      icon: Camera,
      description: 'Point camera at text to translate',
      features: ['Live OCR', 'Offline recognition', 'Multi-language detection']
    },
    {
      id: 'voice',
      name: 'Voice',
      icon: Mic,
      description: 'Speak to translate instantly',
      features: ['Speech recognition', 'Voice synthesis', 'Conversation mode']
    },
    {
      id: 'image',
      name: 'Image',
      icon: ImageIcon,
      description: 'Upload image with text',
      features: ['Batch OCR', 'PDF support', 'High accuracy']
    }
  ]

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      action: () => handleCopyTranslation(),
      color: 'blue'
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share2,
      action: () => handleShareTranslation(),
      color: 'green'
    },
    {
      id: 'favorite',
      label: 'Save',
      icon: Star,
      action: () => handleSaveTranslation(),
      color: 'yellow'
    },
    {
      id: 'speak',
      label: 'Speak',
      icon: Volume2,
      action: () => handleSpeakTranslation(),
      color: 'purple'
    }
  ]

  // Initialize mobile gestures
  useEffect(() => {
    if (!hubRef.current) return

    // Swipe gestures for mode switching
    const unsubscribeSwipe = advancedGestures.on('swipe', (gesture) => {
      if (gesture.direction === 'left') {
        switchToNextMode()
      } else if (gesture.direction === 'right') {
        switchToPreviousMode()
      } else if (gesture.direction === 'up') {
        setIsExpanded(true)
      } else if (gesture.direction === 'down' && isExpanded) {
        setIsExpanded(false)
      }
    })

    // Long press for quick actions
    const unsubscribeLongPress = advancedGestures.on('longpress', () => {
      setShowQuickActions(!showQuickActions)
    })

    // Pinch to zoom for text
    const unsubscribePinch = advancedGestures.on('pinch', (gesture) => {
      if (textareaRef.current) {
        const currentSize = parseInt(getComputedStyle(textareaRef.current).fontSize)
        const newSize = Math.max(12, Math.min(24, currentSize * gesture.scale))
        textareaRef.current.style.fontSize = `${newSize}px`
      }
    })

    return () => {
      unsubscribeSwipe()
      unsubscribeLongPress()
      unsubscribePinch()
    }
  }, [isExpanded, showQuickActions])

  // Translation logic
  const handleTranslation = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslatedText('')
      return
    }

    setIsTranslating(true)
    installManager.trackEngagement('translation')

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
          targetLang,
          enableMemoryLookup: true,
          enableCaching: true
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const result = await response.json()
      setTranslatedText(result.result.translatedText)
      
      // Add to recent translations
      const newTranslation = {
        id: Date.now(),
        sourceText: text,
        translatedText: result.result.translatedText,
        sourceLang: result.result.sourceLanguage,
        targetLang,
        timestamp: new Date()
      }
      
      setRecentTranslations(prev => [newTranslation, ...prev.slice(0, 4)])
      
      if (onTranslationComplete) {
        onTranslationComplete(result)
      }

    } catch (error) {
      console.error('[Mobile Translation] Error:', error)
      setTranslatedText('Translation failed. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }, [sourceLang, targetLang, onTranslationComplete])

  // Debounced translation for text mode
  useEffect(() => {
    if (activeMode !== 'text') return

    const timeoutId = setTimeout(() => {
      if (sourceText.trim()) {
        handleTranslation(sourceText)
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [sourceText, activeMode, handleTranslation])

  // Mode switching
  const switchToNextMode = () => {
    const currentIndex = translationModes.findIndex(mode => mode.id === activeMode)
    const nextIndex = (currentIndex + 1) % translationModes.length
    setActiveMode(translationModes[nextIndex].id)
  }

  const switchToPreviousMode = () => {
    const currentIndex = translationModes.findIndex(mode => mode.id === activeMode)
    const prevIndex = (currentIndex - 1 + translationModes.length) % translationModes.length
    setActiveMode(translationModes[prevIndex].id)
  }

  // Quick action handlers
  const handleCopyTranslation = async () => {
    if (translatedText) {
      const success = await nativeAPIs.writeToClipboard(translatedText)
      if (success) {
        // Show success feedback
      }
    }
  }

  const handleShareTranslation = async () => {
    if (translatedText) {
      await nativeAPIs.share({
        title: 'Translation from Prismy',
        text: `${sourceText}\n\n${translatedText}`,
        url: window.location.origin
      })
    }
  }

  const handleSaveTranslation = () => {
    // Save to local storage or sync with server
    console.log('[Mobile Translation] Saving translation')
  }

  const handleSpeakTranslation = () => {
    if (translatedText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translatedText)
      utterance.lang = targetLang === 'vi' ? 'vi-VN' : 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  // Camera mode
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error('[Mobile Translation] Camera access failed:', error)
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        // Process with OCR
        console.log('[Mobile Translation] Image captured for OCR')
      }
    }
  }

  // Voice mode
  const initializeVoice = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = sourceLang === 'auto' ? 'en-US' : `${sourceLang}-${sourceLang.toUpperCase()}`
      
      recognition.onstart = () => setVoiceActive(true)
      recognition.onend = () => setVoiceActive(false)
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSourceText(transcript)
      }
      
      recognition.start()
    }
  }

  const currentMode = translationModes.find(mode => mode.id === activeMode)

  const content = {
    vi: {
      expand: 'Mở rộng',
      collapse: 'Thu gọn',
      switchMode: 'Chuyển chế độ',
      recentTranslations: 'Dịch gần đây',
      noRecent: 'Chưa có bản dịch nào',
      translating: 'Đang dịch...',
      tapToTranslate: 'Nhấn để dịch',
      swipeToSwitch: 'Vuốt để chuyển chế độ'
    },
    en: {
      expand: 'Expand',
      collapse: 'Collapse',
      switchMode: 'Switch mode',
      recentTranslations: 'Recent translations',
      noRecent: 'No recent translations',
      translating: 'Translating...',
      tapToTranslate: 'Tap to translate',
      swipeToSwitch: 'Swipe to switch mode'
    }
  }

  const t = content[language as keyof typeof content] || content.en

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Main Hub */}
      <motion.div
        ref={hubRef}
        className="absolute bottom-4 left-4 right-4 pointer-events-auto"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Expanded Interface */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-t-2xl shadow-2xl mb-2 overflow-hidden"
            >
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Language Selector */}
                <div className="flex items-center gap-3">
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                  
                  <TouchButton
                    onClick={() => {
                      if (sourceLang !== 'auto') {
                        setSourceLang(targetLang)
                        setTargetLang(sourceLang)
                      }
                    }}
                    className="p-3 bg-gray-100 rounded-xl"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </TouchButton>
                  
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>

                {/* Text Input Area */}
                {activeMode === 'text' && (
                  <div className="space-y-3">
                    <textarea
                      ref={textareaRef}
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Enter text to translate..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {translatedText && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-gray-900 leading-relaxed">{translatedText}</p>
                        {isTranslating && (
                          <div className="flex items-center gap-2 mt-2 text-blue-600 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>{t.translating}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Camera Interface */}
                {activeMode === 'camera' && (
                  <div className="space-y-3">
                    {!cameraActive ? (
                      <TouchButton
                        onClick={initializeCamera}
                        className="w-full p-4 bg-blue-600 text-white rounded-xl text-center"
                      >
                        <Camera className="w-6 h-6 mx-auto mb-2" />
                        Start Camera
                      </TouchButton>
                    ) : (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-48 bg-black rounded-xl object-cover"
                        />
                        <TouchButton
                          onClick={captureImage}
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center"
                        >
                          <Camera className="w-8 h-8 text-gray-700" />
                        </TouchButton>
                      </div>
                    )}
                  </div>
                )}

                {/* Voice Interface */}
                {activeMode === 'voice' && (
                  <div className="space-y-3">
                    <TouchButton
                      onClick={initializeVoice}
                      className={`w-full p-4 rounded-xl text-center transition-colors ${
                        voiceActive
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      <Mic className="w-6 h-6 mx-auto mb-2" />
                      {voiceActive ? 'Listening...' : 'Start Speaking'}
                    </TouchButton>
                    
                    {sourceText && (
                      <div className="bg-gray-100 rounded-xl p-3">
                        <p className="text-gray-700 italic">"{sourceText}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Translations */}
                {recentTranslations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">{t.recentTranslations}</h3>
                    {recentTranslations.slice(0, 3).map((translation) => (
                      <TouchButton
                        key={translation.id}
                        onClick={() => {
                          setSourceText(translation.sourceText)
                          setTranslatedText(translation.translatedText)
                        }}
                        className="w-full p-3 bg-gray-50 rounded-lg text-left"
                      >
                        <p className="text-sm text-gray-600 truncate">{translation.sourceText}</p>
                        <p className="text-sm text-gray-900 truncate mt-1">{translation.translatedText}</p>
                      </TouchButton>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Interface */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-3">
              {currentMode && <currentMode.icon className="w-6 h-6 text-white" />}
              <div>
                <h3 className="font-semibold text-white">{currentMode?.name}</h3>
                <p className="text-xs text-blue-100">{t.swipeToSwitch}</p>
              </div>
            </div>
            
            <TouchButton
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white/20 rounded-full"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-white" />
              ) : (
                <ChevronUp className="w-5 h-5 text-white" />
              )}
            </TouchButton>
          </div>

          {/* Mode Indicators */}
          <div className="flex justify-center gap-2 py-3 bg-gray-50">
            {translationModes.map((mode) => (
              <TouchButton
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-8 h-2 rounded-full transition-colors ${
                  mode.id === activeMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showQuickActions && translatedText && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="flex justify-around py-3">
                  {quickActions.map((action) => (
                    <TouchButton
                      key={action.id}
                      onClick={action.action}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg bg-${action.color}-50 text-${action.color}-600`}
                    >
                      <action.icon className="w-5 h-5" />
                      <span className="text-xs">{action.label}</span>
                    </TouchButton>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default MobileTranslationHub