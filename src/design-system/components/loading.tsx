import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Spinner variants
const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-primary-600',
      muted: 'text-neutral-400',
      white: 'text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
})

export interface SpinnerProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn(spinnerVariants({ size, variant }), className)}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  )
)

Spinner.displayName = 'Spinner'

// Dots loading animation
export interface DotsProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

const Dots: React.FC<DotsProps> = ({ size = 'md', variant = 'default', className }) => {
  const dotSize = {
    xs: 'h-1 w-1',
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  }

  const colorClass = {
    default: 'bg-primary-600',
    muted: 'bg-neutral-400',
    white: 'bg-white',
  }

  const currentSize = size || 'md'
  const currentVariant = variant || 'default'

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            dotSize[currentSize],
            colorClass[currentVariant]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s',
          }}
        />
      ))}
    </div>
  )
}

// Pulse loading animation
export interface PulseProps {
  className?: string
  children?: React.ReactNode
}

const Pulse: React.FC<PulseProps> = ({ className, children }) => (
  <div className={cn('animate-pulse', className)}>
    {children}
  </div>
)

// Skeleton loading component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  shape?: 'rectangle' | 'circle' | 'rounded'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, shape = 'rounded', style, ...props }, ref) => {
    const shapeClasses = {
      rectangle: '',
      circle: 'rounded-full',
      rounded: 'rounded-md',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-neutral-200',
          shapeClasses[shape],
          className
        )}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Loading overlay component
export interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  text?: string
  variant?: 'spinner' | 'dots'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text,
  variant = 'spinner',
  size = 'md',
  className,
}) => (
  <div className={cn('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          {variant === 'spinner' ? (
            <Spinner size={size} />
          ) : (
            <Dots size={size} />
          )}
          {text && (
            <p className="text-sm text-neutral-600 font-medium">{text}</p>
          )}
        </div>
      </div>
    )}
  </div>
)

// Card skeleton for common loading states
const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton shape="circle" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton height={16} width="60%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton height={12} width="100%" />
      <Skeleton height={12} width="90%" />
      <Skeleton height={12} width="80%" />
    </div>
  </div>
)

// List skeleton
const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Skeleton shape="circle" width={32} height={32} />
        <div className="space-y-2 flex-1">
          <Skeleton height={14} width="70%" />
          <Skeleton height={12} width="50%" />
        </div>
      </div>
    ))}
  </div>
)

// Progress bar
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    showLabel = false,
    variant = 'default',
    size = 'md',
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    }

    const variantClasses = {
      default: 'bg-primary-600',
      success: 'bg-success-600',
      warning: 'bg-warning-600',
      error: 'bg-error-600',
    }

    return (
      <div className="w-full">
        {showLabel && (
          <div className="flex justify-between text-sm text-neutral-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            'w-full bg-neutral-200 rounded-full overflow-hidden',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export {
  Spinner,
  Dots,
  Pulse,
  Skeleton,
  LoadingOverlay,
  CardSkeleton,
  ListSkeleton,
  Progress,
}