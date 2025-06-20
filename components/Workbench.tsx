'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  zenBreathe, 
  invisiblePresence, 
  whisperUp, 
  getCulturalRhythm,
  whisperHover,
  breathHover
} from '@/lib/motion'

interface Language {
  code: string
  name: string
}

// Simplified language list - Essential languages only
const getLanguages = (language: 'vi' | 'en'): Language[] => {
  const essential = language === 'vi' ? [
    { code: 'auto', name: 'Tự động' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ] : [
    { code: 'auto', name: 'Auto' },
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ]
  
  return essential
}

interface WorkbenchProps {
  language?: 'vi' | 'en'
}

export default function Workbench({ language = 'en' }: WorkbenchProps) {
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState(language === 'vi' ? 'vi' : 'en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const culturalRhythm = getCulturalRhythm()

  // Zen-level content - Minimal, purposeful
  const content = {
    vi: {
      from: 'Từ',
      to: 'Sang',
      source: 'Nhập văn bản...',
      target: 'Kết quả...',
      action: 'Dịch',
      working: 'Đang dịch...',
      ready: 'Sẵn sàng'
    },
    en: {
      from: 'From',
      to: 'To', 
      source: 'Enter text...',
      target: 'Result...',
      action: 'Translate',
      working: 'Translating...',
      ready: 'Ready'
    }
  }

  // Vietnamese cultural breathing effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // AI-powered instant translation
  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    
    setIsTranslating(true)
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: sourceLang,
          targetLang: targetLang,
          tier: 'instant' // Always instant for zen experience
        })
      })

      const data = await response.json()

      if (data.success) {
        setTargetText(data.result.translatedText)
        
        // Auto-detect feedback
        if (sourceLang === 'auto' && data.result.sourceLang !== 'auto') {
          setSourceLang(data.result.sourceLang)
        }
      } else {
        setTargetText(data.message || 'Unable to translate')
      }
    } catch (error) {
      setTargetText('Translation unavailable')
    } finally {
      setIsTranslating(false)
    }
  }

  // Invisible swap - breath-level interaction
  const handleSwap = () => {
    if (sourceLang !== 'auto' && targetText) {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
      setSourceText(targetText)
      setTargetText(sourceText)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section 
          className="relative"
          variants={zenBreathe}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Zen Translation Interface - Single Column Flow */}
          <div className="space-zen">
            
            {/* Language Selectors - Invisible Presence */}
            <motion.div 
              className="flex items-center justify-center gap-8 mb-12"
              variants={invisiblePresence}
            >
              {/* Source Language */}
              <div className="flex items-center gap-3">
                <span className="text-caption text-mono-medium vietnamese-text">
                  {content[language].from}
                </span>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="form-input text-body-sm border-whisper bg-transparent 
                           focus:border-mono-black transition-all duration-200
                           hover-whisper cursor-pointer vietnamese-text"
                  style={{ minWidth: '120px' }}
                >
                  {getLanguages(language).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zen Swap - Invisible Until Needed */}
              <motion.button
                onClick={handleSwap}
                disabled={sourceLang === 'auto' || !targetText}
                className="w-8 h-8 flex items-center justify-center text-mono-light 
                         hover:text-mono-black transition-colors duration-200
                         disabled:opacity-30"
                {...whisperHover}
                whileHover={{ rotate: 180 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </motion.button>

              {/* Target Language */}
              <div className="flex items-center gap-3">
                <span className="text-caption text-mono-medium vietnamese-text">
                  {content[language].to}
                </span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="form-input text-body-sm border-whisper bg-transparent 
                           focus:border-mono-black transition-all duration-200
                           hover-whisper cursor-pointer vietnamese-text"
                  style={{ minWidth: '120px' }}
                >
                  {getLanguages(language).filter(lang => lang.code !== 'auto').map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Translation Canvas - Zen Simplicity */}
            <motion.div 
              className="grid gap-8 md:grid-cols-2"
              variants={whisperUp}
            >
              {/* Source Input - Breathing Space */}
              <motion.div 
                className="relative"
                variants={invisiblePresence}
              >
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder={content[language].source}
                  className="form-input w-full h-64 resize-none text-body 
                           vietnamese-text placeholder:text-mono-light
                           border-whisper focus:border-mono-black bg-transparent
                           transition-all duration-300"
                  style={{ 
                    lineHeight: culturalRhythm === 'evening' ? '1.8' : '1.6',
                    fontSize: culturalRhythm === 'evening' ? '1.125rem' : '1rem'
                  }}
                />
                {sourceText && (
                  <motion.div 
                    className="absolute bottom-4 right-4 text-caption text-mono-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {sourceText.length}
                  </motion.div>
                )}
              </motion.div>

              {/* Target Output - Zen Reception */}
              <motion.div 
                className="relative"
                variants={invisiblePresence}
              >
                <textarea
                  value={targetText}
                  readOnly
                  placeholder={content[language].target}
                  className="form-input w-full h-64 resize-none text-body 
                           vietnamese-text placeholder:text-mono-light
                           border-whisper bg-mono-white-95 cursor-default
                           transition-all duration-300"
                  style={{ 
                    lineHeight: culturalRhythm === 'evening' ? '1.8' : '1.6',
                    fontSize: culturalRhythm === 'evening' ? '1.125rem' : '1rem'
                  }}
                />
                {isTranslating && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-mono-medium loading-breath">
                      {content[language].working}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Zen Action - Single Purpose */}
            <motion.div 
              className="flex justify-center mt-12"
              variants={invisiblePresence}
            >
              <motion.button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isTranslating}
                className="btn btn-primary px-16 py-4 text-body hover-whisper focus-breath
                         disabled:opacity-50 disabled:cursor-not-allowed vietnamese-text"
                {...breathHover}
              >
                {isTranslating ? content[language].working : content[language].action}
              </motion.button>
            </motion.div>

            {/* Invisible Status - Breath-Level Feedback */}
            <motion.div 
              className="flex justify-center mt-8"
              variants={invisiblePresence}
            >
              <div className="text-caption text-mono-light vietnamese-text">
                {!sourceText.trim() ? content[language].ready : 
                 targetText ? '✓' : 
                 isTranslating ? '○' : ''}
              </div>
            </motion.div>

          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}