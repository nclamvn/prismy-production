'use client'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-4'
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground'
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'default'
    }
  }
)

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

export function Spinner({ size, variant, className }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingStateProps {
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LoadingState({ children, className, size = 'lg' }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <Spinner size={size} className="mb-4" />
      {children || (
        <div className="space-y-2">
          <p className="text-sm font-medium">Loading...</p>
          <p className="text-xs text-muted-foreground">Please wait while we prepare your content</p>
        </div>
      )}
    </div>
  )
}

interface FullPageLoadingProps {
  message?: string
}

export function FullPageLoading({ message = 'Loading workspace...' }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Spinner size="xl" />
        <div className="space-y-2">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            This should only take a moment
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton components
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-muted',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
      <div className="space-y-2">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-5/6" />
      </div>
    </div>
  )
}