'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary',
  className = '',
  label = 'Loading...'
}: LoadingSpinnerProps) {
  const getSizeStyles = () => {
    const sizes = {
      sm: { width: '16px', height: '16px', strokeWidth: '2px' },
      md: { width: '24px', height: '24px', strokeWidth: '2px' },
      lg: { width: '32px', height: '32px', strokeWidth: '2px' },
      xl: { width: '48px', height: '48px', strokeWidth: '3px' }
    }
    return sizes[size]
  }

  const getVariantColor = () => {
    const variants = {
      primary: 'var(--notebooklm-primary)',
      secondary: 'var(--text-secondary)',
      white: '#ffffff'
    }
    return variants[variant]
  }

  const sizeStyles = getSizeStyles()
  const color = getVariantColor()

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <svg
        width={sizeStyles.width}
        height={sizeStyles.height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={sizeStyles.strokeWidth}
          strokeOpacity="0.1"
          style={{ color }}
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={sizeStyles.strokeWidth}
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="23.562"
          style={{ color }}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  height?: string
  width?: string
  rounded?: boolean
}

export function Skeleton({ 
  className = '',
  height = '1rem',
  width = '100%',
  rounded = false
}: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{
        height,
        width,
        backgroundColor: 'var(--surface-filled)'
      }}
      aria-hidden="true"
    />
  )
}

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function LoadingState({ 
  variant = 'spinner',
  size = 'md',
  message = 'Loading...',
  className = ''
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton height="1.5rem" width="75%" />
        <Skeleton height="1rem" width="50%" />
        <Skeleton height="1rem" width="85%" />
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: 'var(--notebooklm-primary)',
            animationDelay: '0ms'
          }}
        />
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: 'var(--notebooklm-primary)',
            animationDelay: '200ms'
          }}
        />
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: 'var(--notebooklm-primary)',
            animationDelay: '400ms'
          }}
        />
        {message && (
          <span 
            className="ml-3"
            style={{
              fontSize: 'var(--sys-body-medium-size)',
              color: 'var(--text-secondary)'
            }}
          >
            {message}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <LoadingSpinner size={size} />
      {message && (
        <p 
          style={{
            fontSize: 'var(--sys-body-medium-size)',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}

// Full page loading overlay
interface LoadingOverlayProps {
  message?: string
  isVisible: boolean
}

export function LoadingOverlay({ 
  message = 'Loading...',
  isVisible 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="flex flex-col items-center space-y-4 p-8 rounded-lg"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--surface-outline)',
          borderRadius: 'var(--mat-card-elevated-container-shape)',
          boxShadow: 'var(--elevation-level-5)'
        }}
      >
        <LoadingSpinner size="xl" />
        <p 
          style={{
            fontSize: 'var(--sys-title-medium-size)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            fontWeight: '500'
          }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}