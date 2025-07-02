/**
 * UI/UX Polish Sprint - Phase 4: Search Provider Component
 * 
 * Context provider for global search functionality
 * Manages search state and provides search capabilities throughout the app
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlobalSearchModal } from './GlobalSearchModal'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { vectorSearchEngine } from '@/lib/search/vector-engine'

interface SearchContextType {
  isOpen: boolean
  openSearch: (initialQuery?: string) => void
  closeSearch: () => void
  navigate: (path: string) => void
}

const SearchContext = createContext<SearchContextType | null>(null)

interface SearchProviderProps {
  children: React.ReactNode
  enableKeyboardShortcuts?: boolean
}

export function SearchProvider({ 
  children, 
  enableKeyboardShortcuts = true 
}: SearchProviderProps) {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  
  const {
    isOpen,
    openSearch,
    closeSearch,
    navigateAndClose
  } = useGlobalSearch({
    enableKeyboardShortcuts
  })
  
  // Initialize search engine
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        // Search engine initialization happens automatically
        // Add any custom documents here if needed
        
        console.log('[SearchProvider] Search engine initialized')
        setIsInitialized(true)
      } catch (error) {
        console.error('[SearchProvider] Failed to initialize search:', error)
      }
    }
    
    initializeSearch()
  }, [])
  
  // Handle navigation
  const handleNavigate = (path: string) => {
    navigateAndClose(path)
  }
  
  const contextValue: SearchContextType = {
    isOpen,
    openSearch,
    closeSearch,
    navigate: handleNavigate
  }
  
  return (
    <SearchContext.Provider value={contextValue}>
      {children}
      
      {/* Global Search Modal */}
      {isInitialized && (
        <GlobalSearchModal
          isOpen={isOpen}
          onClose={closeSearch}
          onNavigate={handleNavigate}
        />
      )}
    </SearchContext.Provider>
  )
}

/**
 * Hook to use search context
 */
export function useSearch() {
  const context = useContext(SearchContext)
  
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  
  return context
}

/**
 * HOC to add search functionality to components
 */
export function withSearch<P extends object>(
  Component: React.ComponentType<P & { search: SearchContextType }>
) {
  return function WithSearchComponent(props: P) {
    const search = useSearch()
    
    return <Component {...props} search={search} />
  }
}

/**
 * Search statistics provider for analytics
 */
interface SearchStatsContextType {
  totalSearches: number
  averageResponseTime: number
  topQueries: Array<{ query: string; count: number }>
  resetStats: () => void
}

const SearchStatsContext = createContext<SearchStatsContextType | null>(null)

export function SearchStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState({
    totalSearches: 0,
    averageResponseTime: 0,
    responseTimes: [] as number[],
    queryMap: new Map<string, number>()
  })
  
  // Track search performance
  useEffect(() => {
    const handleSearchPerformed = (event: CustomEvent) => {
      const { processingTime, query } = event.detail
      
      setStats(prev => {
        const newResponseTimes = [...prev.responseTimes, processingTime].slice(-100) // Keep last 100
        const newQueryMap = new Map(prev.queryMap)
        newQueryMap.set(query, (newQueryMap.get(query) || 0) + 1)
        
        return {
          totalSearches: prev.totalSearches + 1,
          averageResponseTime: newResponseTimes.reduce((sum, time) => sum + time, 0) / newResponseTimes.length,
          responseTimes: newResponseTimes,
          queryMap: newQueryMap
        }
      })
    }
    
    // Listen for search events
    window.addEventListener('search:performed', handleSearchPerformed as EventListener)
    
    return () => {
      window.removeEventListener('search:performed', handleSearchPerformed as EventListener)
    }
  }, [])
  
  const resetStats = () => {
    setStats({
      totalSearches: 0,
      averageResponseTime: 0,
      responseTimes: [],
      queryMap: new Map()
    })
  }
  
  const topQueries = Array.from(stats.queryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }))
  
  const contextValue: SearchStatsContextType = {
    totalSearches: stats.totalSearches,
    averageResponseTime: Math.round(stats.averageResponseTime),
    topQueries,
    resetStats
  }
  
  return (
    <SearchStatsContext.Provider value={contextValue}>
      {children}
    </SearchStatsContext.Provider>
  )
}

/**
 * Hook to use search statistics
 */
export function useSearchStats() {
  const context = useContext(SearchStatsContext)
  
  if (!context) {
    throw new Error('useSearchStats must be used within a SearchStatsProvider')
  }
  
  return context
}

export default SearchProvider