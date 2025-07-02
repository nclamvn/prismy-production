/**
 * UI/UX Polish Sprint - Phase 4: Global Search Modal Component
 * 
 * Advanced search interface with real-time suggestions, filtering, and keyboard navigation
 * Provides semantic search across all app content with intelligent results
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Search, 
  X, 
  FileText, 
  Settings, 
  HelpCircle, 
  Zap, 
  Filter,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { AnimatedModal, MotionCard } from '@/components/motion/MotionComponents'
import { Button } from '@/components/ui/Button'
import { 
  vectorSearchEngine, 
  searchUtils, 
  SearchQuery, 
  SearchResult, 
  SearchResponse 
} from '@/lib/search/vector-engine'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate?: (path: string) => void
}

interface SearchState {
  query: string
  results: SearchResult[]
  suggestions: string[]
  isLoading: boolean
  selectedIndex: number
  showFilters: boolean
  activeFilters: {
    types: string[]
    categories: string[]
  }
  recentSearches: string[]
}

export function GlobalSearchModal({ 
  isOpen, 
  onClose, 
  onNavigate 
}: GlobalSearchModalProps) {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    isLoading: false,
    selectedIndex: -1,
    showFilters: false,
    activeFilters: {
      types: [],
      categories: []
    },
    recentSearches: []
  })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // Debounced search function
  const debouncedSearch = useCallback(
    searchUtils.debouncedSearch(async (query: string) => {
      if (query.trim().length < 2) {
        setState(prev => ({ ...prev, results: [], isLoading: false }))
        return
      }
      
      setState(prev => ({ ...prev, isLoading: true }))
      
      try {
        const searchQuery: SearchQuery = {
          text: query,
          type: state.activeFilters.types.length > 0 
            ? state.activeFilters.types as any[] 
            : undefined,
          filters: {
            category: state.activeFilters.categories.length > 0 
              ? state.activeFilters.categories 
              : undefined
          },
          limit: 8
        }
        
        const response = await vectorSearchEngine.search(searchQuery)
        
        setState(prev => ({
          ...prev,
          results: response.results,
          suggestions: response.suggestions || [],
          isLoading: false,
          selectedIndex: -1
        }))
        
      } catch (error) {
        console.error('Search failed:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }, 300),
    [state.activeFilters]
  )
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setState(prev => ({ ...prev, query }))
    debouncedSearch(query)
  }
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { results, selectedIndex } = state
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setState(prev => ({
          ...prev,
          selectedIndex: Math.min(selectedIndex + 1, results.length - 1)
        }))
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setState(prev => ({
          ...prev,
          selectedIndex: Math.max(selectedIndex - 1, -1)
        }))
        break
        
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex])
        }
        break
        
      case 'Escape':
        onClose()
        break
        
      case '/':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          inputRef.current?.focus()
        }
        break
    }
  }
  
  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    const { document } = result
    
    // Add to recent searches
    setState(prev => ({
      ...prev,
      recentSearches: [
        state.query,
        ...prev.recentSearches.filter(s => s !== state.query)
      ].slice(0, 5)
    }))
    
    // Navigate based on document type
    if (document.type === 'ui_element' && document.metadata.path) {
      onNavigate?.(document.metadata.path)
    } else if (document.type === 'action') {
      handleActionCommand(document.id)
    } else if (document.type === 'help') {
      // Open help content
      console.log('Open help:', document.title)
    }
    
    onClose()
  }
  
  // Handle action commands
  const handleActionCommand = (actionId: string) => {
    switch (actionId) {
      case 'action-upload-file':
        onNavigate?.('/workspace/upload')
        break
      case 'action-toggle-theme':
        // Toggle theme
        const currentTheme = localStorage.getItem('pry-theme-preference') || 'light'
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        localStorage.setItem('pry-theme-preference', newTheme)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)
        break
      case 'action-change-language':
        onNavigate?.('/workspace/settings#language')
        break
      default:
        console.log('Unknown action:', actionId)
    }
  }
  
  // Toggle filter
  const toggleFilter = (type: 'types' | 'categories', value: string) => {
    setState(prev => {
      const currentFilters = prev.activeFilters[type]
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value]
      
      return {
        ...prev,
        activeFilters: {
          ...prev.activeFilters,
          [type]: newFilters
        }
      }
    })
    
    // Re-run search with new filters
    if (state.query.trim().length >= 2) {
      debouncedSearch(state.query)
    }
  }
  
  // Clear search
  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      suggestions: [],
      selectedIndex: -1
    }))
    inputRef.current?.focus()
  }
  
  // Get result icon
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'ui_element':
        return <Zap className="h-4 w-4 text-primary" />
      case 'action':
        return <ArrowRight className="h-4 w-4 text-success" />
      case 'help':
        return <HelpCircle className="h-4 w-4 text-info" />
      case 'setting':
        return <Settings className="h-4 w-4 text-warning" />
      case 'document':
        return <FileText className="h-4 w-4 text-secondary" />
      default:
        return <Search className="h-4 w-4 text-muted" />
    }
  }
  
  // Get type label
  const getTypeLabel = (type: string) => {
    const labels = {
      'ui_element': 'Page',
      'action': 'Action',
      'help': 'Help',
      'setting': 'Setting',
      'document': 'Document'
    }
    return labels[type as keyof typeof labels] || type
  }
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      
      // Load recent searches from localStorage
      const recent = localStorage.getItem('prismy-recent-searches')
      if (recent) {
        setState(prev => ({
          ...prev,
          recentSearches: JSON.parse(recent)
        }))
      }
    }
  }, [isOpen])
  
  // Save recent searches
  useEffect(() => {
    if (state.recentSearches.length > 0) {
      localStorage.setItem('prismy-recent-searches', JSON.stringify(state.recentSearches))
    }
  }, [state.recentSearches])
  
  // Scroll selected result into view
  useEffect(() => {
    if (state.selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[state.selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [state.selectedIndex])
  
  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl mx-auto mt-[10vh]"
    >
      <MotionCard className="search-modal">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-workspace-divider">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={state.query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search anything... (Ctrl+/ to focus)"
              className="w-full pl-10 pr-10 py-3 bg-transparent border-none outline-none text-lg placeholder-muted"
            />
            {state.query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-workspace-hover rounded"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className={`p-2 ${state.showFilters ? 'bg-workspace-hover' : ''}`}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filters */}
        {state.showFilters && (
          <div className="p-4 border-b border-workspace-divider bg-workspace-panel">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-secondary mb-2">Content Type</h4>
                <div className="flex flex-wrap gap-2">
                  {['ui_element', 'action', 'help', 'document', 'setting'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleFilter('types', type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        state.activeFilters.types.includes(type)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-workspace-hover text-secondary hover:bg-workspace-border'
                      }`}
                    >
                      {getTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-secondary mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {['file_management', 'configuration', 'features', 'support'].map(category => (
                    <button
                      key={category}
                      onClick={() => toggleFilter('categories', category)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        state.activeFilters.categories.includes(category)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-workspace-hover text-secondary hover:bg-workspace-border'
                      }`}
                    >
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {state.isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
              <span className="ml-2 text-muted">Searching...</span>
            </div>
          )}
          
          {!state.isLoading && state.query && state.results.length === 0 && (
            <div className="py-8 text-center">
              <Search className="h-8 w-8 text-muted mx-auto mb-2" />
              <p className="text-muted">No results found for "{state.query}"</p>
              {state.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-secondary mb-2">Did you mean:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {state.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setState(prev => ({ ...prev, query: suggestion }))
                          debouncedSearch(suggestion)
                        }}
                        className="px-3 py-1 bg-workspace-hover rounded-full text-sm hover:bg-workspace-border"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!state.isLoading && state.results.length > 0 && (
            <div ref={resultsRef} className="py-2">
              {state.results.map((result, index) => (
                <button
                  key={result.document.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full p-4 text-left hover:bg-workspace-hover transition-colors ${
                    index === state.selectedIndex ? 'bg-workspace-hover' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getResultIcon(result.document.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-primary truncate">
                          {result.document.title}
                        </h3>
                        <span className="text-xs px-2 py-0.5 bg-workspace-border rounded-full text-secondary">
                          {getTypeLabel(result.document.type)}
                        </span>
                        <span className="text-xs text-muted">
                          {Math.round(result.score * 100)}% match
                        </span>
                      </div>
                      
                      <p className="text-sm text-secondary line-clamp-2">
                        {searchUtils.formatSnippet(result.document.content)}
                      </p>
                      
                      {result.highlights.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted">
                            {result.highlights[0]}
                          </p>
                        </div>
                      )}
                      
                      {result.document.metadata.path && (
                        <div className="mt-1">
                          <span className="text-xs text-muted">
                            {result.document.metadata.path}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Recent Searches (when no query) */}
          {!state.query && state.recentSearches.length > 0 && (
            <div className="py-4">
              <div className="px-4 mb-3">
                <h4 className="text-sm font-medium text-secondary flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </h4>
              </div>
              
              {state.recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setState(prev => ({ ...prev, query: search }))
                    debouncedSearch(search)
                  }}
                  className="w-full p-3 text-left hover:bg-workspace-hover flex items-center gap-3"
                >
                  <Clock className="h-4 w-4 text-muted" />
                  <span className="text-secondary">{search}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Quick Actions (when no query) */}
          {!state.query && (
            <div className="py-4">
              <div className="px-4 mb-3">
                <h4 className="text-sm font-medium text-secondary">Quick Actions</h4>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => handleActionCommand('action-upload-file')}
                  className="w-full p-3 text-left hover:bg-workspace-hover flex items-center gap-3"
                >
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-primary">Upload Document</span>
                </button>
                
                <button
                  onClick={() => handleActionCommand('action-toggle-theme')}
                  className="w-full p-3 text-left hover:bg-workspace-hover flex items-center gap-3"
                >
                  <Settings className="h-4 w-4 text-secondary" />
                  <span className="text-secondary">Toggle Theme</span>
                </button>
                
                <button
                  onClick={() => onNavigate?.('/workspace/settings')}
                  className="w-full p-3 text-left hover:bg-workspace-hover flex items-center gap-3"
                >
                  <Settings className="h-4 w-4 text-secondary" />
                  <span className="text-secondary">Open Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-workspace-divider bg-workspace-panel">
          <div className="flex justify-between items-center text-xs text-muted">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div>
              Powered by Vector Search
            </div>
          </div>
        </div>
      </MotionCard>
    </AnimatedModal>
  )
}