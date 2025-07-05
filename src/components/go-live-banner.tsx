'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export function GoLiveBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex w-0 flex-1 items-center">
            <span className="flex rounded-lg bg-blue-800 p-2">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="ml-3 truncate font-medium">
              <span className="md:hidden">
                Prismy v2 is now live! 🎉
              </span>
              <span className="hidden md:inline">
                🎉 Prismy v2 is now live! Professional document translation with AI-powered OCR
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50 border-white"
              onClick={() => window.open('https://github.com/prismy/prismy-v2', '_blank')}
            >
              View on GitHub
            </Button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}