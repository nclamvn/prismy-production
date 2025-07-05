'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search documents, translations, or content…" 
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-5xl gap-2 flex-col sm:flex-row"
    >
      <div
        className="
          relative flex flex-1 items-center
          rounded-lg border border-input bg-background
          shadow-sm
        "
      >
        <Search className="absolute left-3 size-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="
            h-12 w-full pl-11 pr-4
            rounded-lg bg-transparent
            focus:outline-none focus:ring-2 focus:ring-primary/40
          "
        />
      </div>

      <Button type="submit" size="lg" className="min-w-[110px]">
        Search
      </Button>
    </form>
  )
}