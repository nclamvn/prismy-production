'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-default flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-accent-brand-light rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">😔</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-primary mb-4">
          Oops! Something went wrong
        </h2>
        
        <p className="text-secondary mb-8">
          We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={reset}
            className="w-full"
          >
            Try again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  )
}