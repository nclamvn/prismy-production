/**
 * UI/UX Polish Sprint - Phase 4: Global Search Hook
 * 
 * React hook for managing global search state and keyboard shortcuts
 * Provides search modal control and search-related functionality
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseGlobalSearchOptions {
  enableKeyboardShortcuts?: boolean
  shortcuts?: {
    open?: string[]
    close?: string[]
  }
}

interface GlobalSearchState {
  isOpen: boolean
  query: string
  isLoading: boolean
}

export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const {
    enableKeyboardShortcuts = true,
    shortcuts = {
      open: ['cmd+k', 'ctrl+k', 'cmd+/', 'ctrl+/'],
      close: ['escape']
    }
  } = options
  
  const router = useRouter()
  
  const [state, setState] = useState<GlobalSearchState>({
    isOpen: false,
    query: '',
    isLoading: false
  })
  
  // Open search modal
  const openSearch = useCallback((initialQuery = '') => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      query: initialQuery
    }))
  }, [])
  
  // Close search modal
  const closeSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      query: '',
      isLoading: false
    }))
  }, [])
  
  // Navigate to path and close search
  const navigateAndClose = useCallback((path: string) => {
    router.push(path)
    closeSearch()
  }, [router, closeSearch])
  
  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])
  
  // Update query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }))
  }, [])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for open shortcuts
      const isOpenShortcut = shortcuts.open?.some(shortcut => {
        const keys = shortcut.toLowerCase().split('+')
        const hasCmd = keys.includes('cmd') && (event.metaKey || event.ctrlKey)
        const hasCtrl = keys.includes('ctrl') && event.ctrlKey
        const hasKey = keys.includes(event.key.toLowerCase())
        
        return (hasCmd || hasCtrl) && hasKey
      })
      
      // Check for close shortcuts
      const isCloseShortcut = shortcuts.close?.some(shortcut => {
        return shortcut.toLowerCase() === event.key.toLowerCase()
      })
      
      if (isOpenShortcut && !state.isOpen) {
        event.preventDefault()
        openSearch()
      } else if (isCloseShortcut && state.isOpen) {
        event.preventDefault()
        closeSearch()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enableKeyboardShortcuts, shortcuts, state.isOpen, openSearch, closeSearch])
  
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [state.isOpen])
  
  return {
    // State
    isOpen: state.isOpen,
    query: state.query,
    isLoading: state.isLoading,
    
    // Actions
    openSearch,
    closeSearch,
    navigateAndClose,
    setLoading,
    setQuery,
    
    // Shortcuts info
    shortcuts: {
      open: shortcuts.open?.join(', ') || '',
      close: shortcuts.close?.join(', ') || ''
    }
  }
}

/**
 * Hook for search analytics and tracking
 */
export function useSearchAnalytics() {
  const trackSearch = useCallback((query: string, resultCount: number, processingTime: number) => {
    // Track search metrics
    console.log('[Search Analytics]', {
      query,
      resultCount,
      processingTime,
      timestamp: new Date().toISOString()
    })
    
    // In production, send to analytics service
    // analytics.track('search_performed', { query, resultCount, processingTime })
  }, [])
  
  const trackSearchResult = useCallback((query: string, resultId: string, position: number) => {
    console.log('[Search Analytics] Result clicked:', {
      query,
      resultId,
      position,
      timestamp: new Date().toISOString()
    })
    
    // In production, send to analytics service
    // analytics.track('search_result_clicked', { query, resultId, position })
  }, [])
  
  const trackSearchAbandoned = useCallback((query: string, timeSpent: number) => {
    console.log('[Search Analytics] Search abandoned:', {
      query,
      timeSpent,
      timestamp: new Date().toISOString()
    })
    
    // In production, send to analytics service
    // analytics.track('search_abandoned', { query, timeSpent })
  }, [])
  
  return {
    trackSearch,
    trackSearchResult,
    trackSearchAbandoned
  }
}

/**
 * Hook for search suggestions and autocomplete
 */
export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  const loadSuggestions = useCallback(async (partialQuery: string) => {
    if (partialQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    setIsLoadingSuggestions(true)
    
    try {
      // Load suggestions from search engine
      const { vectorSearchEngine } = await import('@/lib/search/vector-engine')
      const suggestions = await vectorSearchEngine.getSuggestions(partialQuery)
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])
  
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])
  
  return {
    suggestions,
    isLoadingSuggestions,
    loadSuggestions,
    clearSuggestions
  }
}

/**
 * Hook for search history management
 */
export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prismy-search-history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [])
  
  // Add search to history
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return
    
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10)
      localStorage.setItem('prismy-search-history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])
  
  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('prismy-search-history')
  }, [])
  
  // Remove specific item from history
  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(q => q !== query)
      localStorage.setItem('prismy-search-history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])
  
  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory
  }
}

/**
 * Hook for search filters
 */
export function useSearchFilters() {
  const [activeFilters, setActiveFilters] = useState<{
    types: string[]
    categories: string[]
    tags: string[]
  }>({
    types: [],
    categories: [],
    tags: []
  })
  
  const addFilter = useCallback((type: 'types' | 'categories' | 'tags', value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: [...prev[type], value]
    }))
  }, [])
  
  const removeFilter = useCallback((type: 'types' | 'categories' | 'tags', value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(v => v !== value)
    }))
  }, [])
  
  const toggleFilter = useCallback((type: 'types' | 'categories' | 'tags', value: string) => {
    setActiveFilters(prev => {
      const currentValues = prev[type]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [type]: newValues
      }
    })
  }, [])
  
  const clearFilters = useCallback(() => {
    setActiveFilters({
      types: [],
      categories: [],
      tags: []
    })
  }, [])
  
  const hasActiveFilters = activeFilters.types.length > 0 || 
                         activeFilters.categories.length > 0 || 
                         activeFilters.tags.length > 0
  
  return {
    activeFilters,
    addFilter,
    removeFilter,
    toggleFilter,
    clearFilters,
    hasActiveFilters
  }
}

export default useGlobalSearch