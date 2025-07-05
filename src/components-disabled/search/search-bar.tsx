'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  FileType,
  Languages,
  Star
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SearchFilters } from '@/lib/search/search-engine'

interface SearchBarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: () => void
  loading?: boolean
}

export function SearchBar({ filters, onFiltersChange, onSearch, loading }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(filters.query || '')

  useEffect(() => {
    setLocalQuery(filters.query || '')
  }, [filters.query])

  const handleSearch = () => {
    onFiltersChange({ ...filters, query: localQuery })
    onSearch()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilter = (filterType: keyof SearchFilters) => {
    const newFilters = { ...filters }
    delete newFilters[filterType]
    onFiltersChange(newFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.status && filters.status.length > 0) count++
    if (filters.languages && filters.languages.length > 0) count++
    if (filters.fileTypes && filters.fileTypes.length > 0) count++
    if (filters.dateRange) count++
    if (filters.favorites) count++
    return count
  }

  const formatDateRange = (dateRange: { start: Date; end: Date }) => {
    const start = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${start} - ${end}`
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents, translations, or content..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <FilterPanel filters={filters} onFiltersChange={onFiltersChange} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && filters.status.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status.join(', ')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('status')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.languages && filters.languages.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Languages className="h-3 w-3" />
              Languages: {filters.languages.join(', ')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('languages')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.fileTypes && filters.fileTypes.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileType className="h-3 w-3" />
              Types: {filters.fileTypes.join(', ')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('fileTypes')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateRange(filters.dateRange)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('dateRange')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.favorites && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Favorites only
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('favorites')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({})}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

interface FilterPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const statusOptions = [
    { value: 'uploaded', label: 'Uploaded' },
    { value: 'processing', label: 'Processing' },
    { value: 'translated', label: 'Translated' },
    { value: 'error', label: 'Error' }
  ]

  const languageOptions = [
    { value: 'en', label: '🇺🇸 English' },
    { value: 'vi', label: '🇻🇳 Vietnamese' },
    { value: 'es', label: '🇪🇸 Spanish' },
    { value: 'fr', label: '🇫🇷 French' },
    { value: 'de', label: '🇩🇪 German' },
    { value: 'it', label: '🇮🇹 Italian' },
    { value: 'pt', label: '🇵🇹 Portuguese' },
    { value: 'ru', label: '🇷🇺 Russian' },
    { value: 'ja', label: '🇯🇵 Japanese' },
    { value: 'ko', label: '🇰🇷 Korean' },
    { value: 'zh', label: '🇨🇳 Chinese' }
  ]

  const fileTypeOptions = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
    { value: 'application/msword', label: 'DOC' },
    { value: 'text/plain', label: 'TXT' },
    { value: 'text/markdown', label: 'Markdown' }
  ]

  const handleArrayFilterChange = (
    filterKey: 'status' | 'languages' | 'fileTypes',
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[filterKey] || []
    let newValues: string[]

    if (checked) {
      newValues = [...currentValues, value]
    } else {
      newValues = currentValues.filter(v => v !== value)
    }

    onFiltersChange({
      ...filters,
      [filterKey]: newValues.length > 0 ? newValues : undefined
    })
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Filter Results</h4>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <div className="space-y-1">
          {statusOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.status?.includes(option.value) || false}
                onChange={(e) => handleArrayFilterChange('status', option.value, e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Language Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Languages</label>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {languageOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.languages?.includes(option.value) || false}
                onChange={(e) => handleArrayFilterChange('languages', option.value, e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File Type Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">File Types</label>
        <div className="space-y-1">
          {fileTypeOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.fileTypes?.includes(option.value) || false}
                onChange={(e) => handleArrayFilterChange('fileTypes', option.value, e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Favorites Filter */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="favorites"
          checked={filters.favorites || false}
          onChange={(e) => onFiltersChange({
            ...filters,
            favorites: e.target.checked || undefined
          })}
          className="rounded border-gray-300"
        />
        <label htmlFor="favorites" className="text-sm font-medium">
          Favorites only
        </label>
      </div>
    </div>
  )
}