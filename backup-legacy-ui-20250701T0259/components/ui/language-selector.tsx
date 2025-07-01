'use client'

/**
 * Enhanced Language Selector Component
 * Provides intuitive language switching with search and favorites
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { GlobeAltIcon as GlobeIcon } from '@heroicons/react/24/outline'
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/config'
import { useI18n, useTranslation } from '@/lib/i18n/provider'
import { useClickOutside } from '@/lib/hooks/use-click-outside'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
  showSearch?: boolean
  showFlags?: boolean
  maxHeight?: string
  onLanguageChange?: (language: Language) => void
}

export function LanguageSelector({
  variant = 'default',
  className = '',
  showSearch = true,
  showFlags = true,
  maxHeight = '16rem',
  onLanguageChange
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, isLoading } = useI18n()
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteLanguages, setFavoriteLanguages] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useClickOutside(dropdownRef, () => setIsOpen(false))

  useEffect(() => {
    // Load favorite languages from localStorage
    const favorites = localStorage.getItem('favorite-languages')
    if (favorites) {
      setFavoriteLanguages(JSON.parse(favorites))
    }
  }, [])

  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, showSearch])

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(language => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      language.name.toLowerCase().includes(query) ||
      language.nativeName.toLowerCase().includes(query) ||
      language.code.toLowerCase().includes(query)
    )
  })

  const sortedLanguages = [...filteredLanguages].sort((a, b) => {
    // Current language first
    if (a.code === currentLanguage.code) return -1
    if (b.code === currentLanguage.code) return 1
    
    // Favorites next
    const aIsFavorite = favoriteLanguages.includes(a.code)
    const bIsFavorite = favoriteLanguages.includes(b.code)
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // Then alphabetically by native name
    return a.nativeName.localeCompare(b.nativeName)
  })

  const handleLanguageChange = async (language: Language) => {
    if (language.code === currentLanguage.code) {
      setIsOpen(false)
      return
    }

    try {
      await setLanguage(language.code)
      setIsOpen(false)
      setSearchQuery('')
      onLanguageChange?.(language)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  const toggleFavorite = (languageCode: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const newFavorites = favoriteLanguages.includes(languageCode)
      ? favoriteLanguages.filter(code => code !== languageCode)
      : [...favoriteLanguages, languageCode]
    
    setFavoriteLanguages(newFavorites)
    localStorage.setItem('favorite-languages', JSON.stringify(newFavorites))
  }

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-gray-200 h-10 w-32 rounded-md', className)} />
    )
  }

  const renderTrigger = () => {
    const baseClasses = "flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    
    switch (variant) {
      case 'compact':
        return (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(baseClasses, 'min-w-0', className)}
            aria-label={t('selectLanguage')}
          >
            {showFlags && <span className="text-lg mr-2">{currentLanguage.flag}</span>}
            <span className="truncate">{currentLanguage.code.toUpperCase()}</span>
            <ChevronDownIcon className={cn("ml-2 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </button>
        )
      
      case 'icon-only':
        return (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              className
            )}
            aria-label={t('selectLanguage')}
          >
            {showFlags ? (
              <span className="text-lg">{currentLanguage.flag}</span>
            ) : (
              <GlobeIcon className="h-5 w-5" />
            )}
          </button>
        )
      
      default:
        return (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(baseClasses, 'min-w-max', className)}
            aria-label={t('selectLanguage')}
          >
            <div className="flex items-center">
              {showFlags && <span className="text-lg mr-3">{currentLanguage.flag}</span>}
              <div className="text-left">
                <div className="font-medium">{currentLanguage.nativeName}</div>
                <div className="text-xs text-gray-500">{currentLanguage.name}</div>
              </div>
            </div>
            <ChevronDownIcon className={cn("ml-3 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </button>
        )
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {renderTrigger()}

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-full min-w-72 rounded-md border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50"
          style={{ maxHeight }}
        >
          {showSearch && (
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {sortedLanguages.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {t('search.noResults')}
              </div>
            ) : (
              <div className="py-1">
                {sortedLanguages.map((language) => {
                  const isSelected = language.code === currentLanguage.code
                  const isFavorite = favoriteLanguages.includes(language.code)
                  
                  return (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100",
                        isSelected && "bg-blue-50 text-blue-600"
                      )}
                    >
                      <div className="flex items-center flex-1">
                        {showFlags && (
                          <span className="text-lg mr-3">{language.flag}</span>
                        )}
                        <div className="flex-1">
                          <div className={cn("font-medium", isSelected && "text-blue-600")}>
                            {language.nativeName}
                          </div>
                          <div className={cn("text-xs", isSelected ? "text-blue-500" : "text-gray-500")}>
                            {language.name} ({language.code})
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => toggleFavorite(language.code, e)}
                          className={cn(
                            "p-1 rounded hover:bg-gray-200 focus:outline-none",
                            isFavorite ? "text-yellow-500" : "text-gray-400"
                          )}
                          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                        
                        {isSelected && (
                          <CheckIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {favoriteLanguages.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-2">
                {t('recentSearches')} ({favoriteLanguages.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {favoriteLanguages.slice(0, 5).map((code) => {
                  const language = SUPPORTED_LANGUAGES.find(l => l.code === code)
                  if (!language) return null
                  
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(language)}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {showFlags && <span className="mr-1">{language.flag}</span>}
                      {language.code.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}