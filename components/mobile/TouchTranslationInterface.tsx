'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useMobile, useVibration } from '@/hooks/useMobile'
import { useSwipe, usePinchZoom } from '@/hooks/useTouch'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'

interface TouchTranslationInterfaceProps {
  language?: 'vi' | 'en'
  onTranslate?: (text: string, sourceLang: string, targetLang: string) => void
  onCameraCapture?: () => void
  onVoiceInput?: () => void
  onClear?: () => void
  isLoading?: boolean
}

interface LanguageOption {
  code: string
  name: string
  flag: string
}

export default function TouchTranslationInterface({
  language = 'en',
  onTranslate,
  onCameraCapture,
  onVoiceInput,
  onClear,
  isLoading = false
}: TouchTranslationInterfaceProps) {
  const [inputText, setInputText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('vi')
  const [isExpanded, setIsExpanded] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [showLanguageSelector, setShowLanguageSelector] = useState<'source' | 'target' | null>(null)
  
  const { isMobile, isTouchDevice } = useMobile()
  const { vibrate, patterns } = useVibration()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const content = {
    vi: {
      inputPlaceholder: 'Nhập văn bản cần dịch...',
      translate: 'Dịch',
      clear: 'Xóa',
      camera: 'Chụp ảnh',
      voice: 'Giọng nói',
      detectLanguage: 'Tự động phát hiện',
      swipeUp: 'Vuốt lên để mở rộng',
      swipeDown: 'Vuốt xuống để thu gọn',
      pinchZoom: 'Véo để phóng to/thu nhỏ',
      longPress: 'Nhấn giữ để sao chép',
      sourceLang: 'Ngôn ngữ nguồn',
      targetLang: 'Ngôn ngữ đích',
      translating: 'Đang dịch...',
      copied: 'Đã sao chép!',
      paste: 'Dán',
      undo: 'Hoàn tác',
      redo: 'Làm lại'
    },
    en: {
      inputPlaceholder: 'Enter text to translate...',
      translate: 'Translate',
      clear: 'Clear',
      camera: 'Camera',
      voice: 'Voice',
      detectLanguage: 'Auto-detect',
      swipeUp: 'Swipe up to expand',
      swipeDown: 'Swipe down to collapse',
      pinchZoom: 'Pinch to zoom in/out',
      longPress: 'Long press to copy',
      sourceLang: 'Source Language',
      targetLang: 'Target Language',
      translating: 'Translating...',
      copied: 'Copied!',
      paste: 'Paste',
      undo: 'Undo',
      redo: 'Redo'
    }
  }

  const languages: LanguageOption[] = [
    { code: 'auto', name: content[language].detectLanguage, flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ]

  // Swipe gestures for interface control
  const { touchHandlers: swipeHandlers } = useSwipe(
    undefined, // onSwipeLeft
    undefined, // onSwipeRight
    () => {
      setIsExpanded(true)
      vibrate(patterns.selection)
    }, // onSwipeUp
    () => {
      setIsExpanded(false)
      vibrate(patterns.selection)
    } // onSwipeDown
  )

  // Pinch to zoom for text size
  const { touchHandlers: pinchHandlers } = usePinchZoom(
    (scale) => {
      const newFontSize = Math.max(12, Math.min(24, 16 * scale))
      setFontSize(newFontSize)
    }
  )

  const handleTranslate = useCallback(() => {
    if (!inputText.trim()) return
    
    vibrate(patterns.success)
    onTranslate?.(inputText.trim(), sourceLang, targetLang)
  }, [inputText, sourceLang, targetLang, onTranslate, vibrate, patterns])

  const handleClear = useCallback(() => {
    setInputText('')
    vibrate(patterns.selection)
    onClear?.()
  }, [onClear, vibrate, patterns])

  const handleCameraCapture = useCallback(() => {
    vibrate(patterns.notification)
    onCameraCapture?.()
  }, [onCameraCapture, vibrate, patterns])

  const handleVoiceInput = useCallback(() => {
    vibrate(patterns.notification)
    onVoiceInput?.()
  }, [onVoiceInput, vibrate, patterns])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputText(prev => prev + text)
      vibrate(patterns.success)
    } catch (error) {
      console.warn('Paste failed:', error)
    }
  }, [vibrate, patterns])

  const handleCopy = useCallback(async () => {
    if (!inputText.trim()) return
    
    try {
      await navigator.clipboard.writeText(inputText)
      vibrate(patterns.success)
    } catch (error) {
      console.warn('Copy failed:', error)
    }
  }, [inputText, vibrate, patterns])

  const handleLanguageSelect = useCallback((type: 'source' | 'target', langCode: string) => {
    if (type === 'source') {
      setSourceLang(langCode)
    } else {
      setTargetLang(langCode)
    }
    setShowLanguageSelector(null)
    vibrate(patterns.selection)
  }, [vibrate, patterns])

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      setIsExpanded(false)
    } else if (info.offset.y < -100) {
      setIsExpanded(true)
    }
  }, [])

  if (!isMobile) {
    return null
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-gray-200 shadow-lg"
      variants={motionSafe({
        collapsed: { height: '200px' },
        expanded: { height: '70vh' }
      })}
      initial="collapsed"
      animate={isExpanded ? 'expanded' : 'collapsed'}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onTouchStart={(e) => swipeHandlers.onTouchStart(e.nativeEvent)}
      onTouchMove={(e) => swipeHandlers.onTouchMove(e.nativeEvent)}
      onTouchEnd={(e) => swipeHandlers.onTouchEnd(e.nativeEvent)}
    >
      {/* Handle bar */}
      <motion.div
        className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </motion.div>

      {/* Language Selector Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setShowLanguageSelector('source')}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg"
        >
          <span>{languages.find(l => l.code === sourceLang)?.flag}</span>
          <span className="text-sm font-medium">{languages.find(l => l.code === sourceLang)?.name}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          onClick={() => {
            const temp = sourceLang
            setSourceLang(targetLang)
            setTargetLang(temp)
            vibrate(patterns.selection)
          }}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <button
          onClick={() => setShowLanguageSelector('target')}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg"
        >
          <span>{languages.find(l => l.code === targetLang)?.flag}</span>
          <span className="text-sm font-medium">{languages.find(l => l.code === targetLang)?.name}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Input Area */}
      <div 
        className="flex-1 p-4"
        onTouchStart={(e) => pinchHandlers.onTouchStart(e.nativeEvent)}
        onTouchMove={(e) => pinchHandlers.onTouchMove(e.nativeEvent)}
        onTouchEnd={(e) => pinchHandlers.onTouchEnd(e.nativeEvent)}
      >
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={content[language].inputPlaceholder}
          className="w-full h-full resize-none border-none outline-none text-gray-900 placeholder-gray-500"
          style={{ fontSize: `${fontSize}px` }}
          autoFocus
        />
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Left side buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCameraCapture}
              className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={content[language].camera}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={handleVoiceInput}
              className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={content[language].voice}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <button
              onClick={handlePaste}
              className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={content[language].paste}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg"
              disabled={!inputText.trim()}
            >
              {content[language].clear}
            </button>

            <button
              onClick={handleTranslate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? content[language].translating : content[language].translate}
            </button>
          </div>
        </div>
      </div>

      {/* Language Selector Modal */}
      <AnimatePresence>
        {showLanguageSelector && (
          <motion.div
            className="absolute inset-0 bg-white z-50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                {showLanguageSelector === 'source' ? content[language].sourceLang : content[language].targetLang}
              </h3>
              <button
                onClick={() => setShowLanguageSelector(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(showLanguageSelector, lang.code)}
                  className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-gray-900">{lang.name}</span>
                  {((showLanguageSelector === 'source' && sourceLang === lang.code) ||
                    (showLanguageSelector === 'target' && targetLang === lang.code)) && (
                    <svg className="w-5 h-5 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}