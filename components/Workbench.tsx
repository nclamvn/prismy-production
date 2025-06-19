'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'

interface Language {
  code: string
  name: string
}

const getLanguages = (language: 'vi' | 'en'): Language[] => {
  if (language === 'vi') {
    return [
      { code: 'auto', name: 'Tự động' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'vi', name: 'Tiếng Việt' },
    ]
  } else {
    return [
      { code: 'auto', name: 'Auto-detect' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'vi', name: 'Vietnamese' },
    ]
  }
}

const qualityTiers = [
  { value: 'free', label: 'Free', description: 'Basic translation' },
  { value: 'standard', label: 'Standard', description: 'Enhanced accuracy' },
  { value: 'premium', label: 'Premium', description: 'Professional quality' },
  { value: 'enterprise', label: 'Enterprise', description: 'Maximum precision' },
]

interface WorkbenchProps {
  language?: 'vi' | 'en'
}

export default function Workbench({ language = 'en' }: WorkbenchProps) {
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState(language === 'vi' ? 'vi' : 'en')
  const [qualityTier, setQualityTier] = useState('premium')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationQuality, setTranslationQuality] = useState<number | null>(null)
  const [lastTranslation, setLastTranslation] = useState<any>(null)

  const content = {
    vi: {
      title: 'Bảng dịch thuật',
      subtitle: 'Công cụ dịch thuật chuyên nghiệp được hỗ trợ bởi AI',
      sourceLabel: 'Ngôn ngữ nguồn',
      targetLabel: 'Ngôn ngữ đích',
      sourcePlaceholder: 'Nhập văn bản cần dịch...',
      targetPlaceholder: 'Bản dịch sẽ xuất hiện ở đây...',
      uploadDoc: 'Tải tài liệu lên',
      quality: 'Chất lượng:',
      translate: 'Dịch',
      translating: 'Đang dịch...',
      characters: 'ký tự',
      poweredBy: 'Được hỗ trợ bởi Prismy AI',
      accuracy: 'Độ chính xác 99.9%',
      languages: '150+ ngôn ngữ'
    },
    en: {
      title: 'Translation Workbench',
      subtitle: 'Professional-grade translation tools powered by AI',
      sourceLabel: 'Source Language',
      targetLabel: 'Target Language',
      sourcePlaceholder: 'Enter text to translate...',
      targetPlaceholder: 'Translation will appear here...',
      uploadDoc: 'Upload Document',
      quality: 'Quality:',
      translate: 'Translate',
      translating: 'Translating...',
      characters: 'characters',
      poweredBy: 'Powered by Prismy AI',
      accuracy: '99.9% accuracy',
      languages: '150+ languages'
    }
  }

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    
    setIsTranslating(true)
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: sourceLang,
          targetLang: targetLang,
          qualityTier: qualityTier
        })
      })

      const data = await response.json()

      if (data.success) {
        setTargetText(data.result.translatedText)
        setTranslationQuality(data.result.qualityScore)
        setLastTranslation(data.result)
        
        // Update detected source language if auto-detect was used
        if (sourceLang === 'auto' && data.result.sourceLang !== 'auto') {
          setSourceLang(data.result.sourceLang)
        }
      } else {
        // Handle API errors
        setTargetText(`Error: ${data.message || 'Translation failed'}`)
      }
    } catch (error) {
      console.error('Translation error:', error)
      setTargetText('Error: Unable to connect to translation service')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
      setSourceText(targetText)
      setTargetText(sourceText)
    }
  }

  return (
    <section id="workbench" className="w-full py-24 bg-main" data-testid="workbench">
      <div className="content-container">
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <motion.div 
            variants={motionSafe(slideUp)}
            className="text-center mb-12"
          >
            <h2 className="heading-2 text-black mb-4">
              {content[language].title}
            </h2>
            <p className="body-lg text-gray-600">
              {content[language].subtitle}
            </p>
          </motion.div>

          {/* Workbench Grid */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="workbench-grid"
          >
            {/* Source Panel */}
            <div className="workbench-panel">
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="source-lang" className="heading-4 whitespace-nowrap">
                  {content[language].sourceLabel}
                </label>
                <select
                  id="source-lang"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="select-base text-sm bg-white hover:bg-gray-50 w-[160px]"
                  aria-label="Select source language"
                >
                  {getLanguages(language).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={content[language].sourcePlaceholder}
                className="textarea-base h-64 text-left"
                aria-label="Source text input"
              />

              <div className="flex items-center justify-between mt-4">
                <button className="btn-secondary text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {content[language].uploadDoc}
                </button>
                <div className="flex items-center gap-2">
                  <span className={`body-sm ${sourceText.length > 10000 ? 'text-red-500' : 'text-gray-500'}`}>
                    {sourceText.length}/10,000 {content[language].characters}
                  </span>
                  {sourceText.length > 10000 && (
                    <span className="text-xs text-red-500">Max limit exceeded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Target Panel */}
            <div className="workbench-panel">
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="target-lang" className="heading-4 whitespace-nowrap">
                  {content[language].targetLabel}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSwapLanguages}
                    className="btn-ghost p-2"
                    disabled={sourceLang === 'auto'}
                    aria-label="Swap languages"
                    title="Swap languages"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                  <select
                    id="target-lang"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="select-base text-sm bg-white hover:bg-gray-50 w-[160px]"
                    aria-label="Select target language"
                  >
                    {getLanguages(language).filter(lang => lang.code !== 'auto').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={targetText}
                readOnly
                placeholder={content[language].targetPlaceholder}
                className="textarea-base h-64 bg-white text-left"
                aria-label="Target text output"
              />

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="quality-tier" className="body-sm text-gray-600 whitespace-nowrap">
                      {content[language].quality}
                    </label>
                  <select
                    id="quality-tier"
                    value={qualityTier}
                    onChange={(e) => setQualityTier(e.target.value)}
                    className="select-base text-sm bg-white hover:bg-gray-50"
                    aria-label="Select quality tier"
                  >
                    {qualityTiers.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                  </div>
                  
                  {translationQuality && (
                    <div className="flex items-center gap-2">
                      <span className="body-sm text-gray-600">Quality:</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          translationQuality >= 0.9 ? 'bg-green-500' :
                          translationQuality >= 0.8 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-500">
                          {Math.round(translationQuality * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <motion.button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || isTranslating || sourceText.length > 10000}
                  className="btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isTranslating ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {content[language].translating}
                    </>
                  ) : (
                    content[language].translate
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Minimalist info bar - removed redundant "Powered by" */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="flex items-center justify-center mt-8"
            role="group"
            aria-label="Translation info"
          >
            <div className="flex items-center gap-4 px-6 py-3 
                          bg-white rounded-full border border-gray-200 
                          shadow-sm">
              <span className="body-sm text-gray-600">{content[language].accuracy}</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span className="body-sm text-gray-600">{content[language].languages}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}