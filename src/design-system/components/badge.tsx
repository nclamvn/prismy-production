import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: [
          'border-transparent bg-primary-600 text-primary-50',
          'hover:bg-primary-700',
        ],
        secondary: [
          'border-transparent bg-neutral-100 text-neutral-900',
          'hover:bg-neutral-200',
        ],
        destructive: [
          'border-transparent bg-error-600 text-error-50',
          'hover:bg-error-700',
        ],
        success: [
          'border-transparent bg-success-600 text-success-50',
          'hover:bg-success-700',
        ],
        warning: [
          'border-transparent bg-warning-600 text-warning-50',
          'hover:bg-warning-700',
        ],
        info: [
          'border-transparent bg-info-600 text-info-50',
          'hover:bg-info-700',
        ],
        outline: [
          'border-neutral-200 text-neutral-900 bg-transparent',
          'hover:bg-neutral-100',
        ],
        ghost: [
          'border-transparent text-neutral-900 bg-transparent',
          'hover:bg-neutral-100',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean
  onRemove?: () => void
  icon?: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, removable, onRemove, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 -mr-1"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

// Badge with dot indicator
export interface DotBadgeProps extends BadgeProps {
  dot?: boolean
  dotColor?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const DotBadge = React.forwardRef<HTMLDivElement, DotBadgeProps>(
  ({ dot = true, dotColor = 'default', children, ...props }, ref) => {
    const dotColors = {
      default: 'bg-neutral-400',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-info-500',
    }

    return (
      <Badge ref={ref} {...props}>
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-1.5 w-1.5 rounded-full',
              dotColors[dotColor]
            )}
          />
        )}
        {children}
      </Badge>
    )
  }
)

DotBadge.displayName = 'DotBadge'

// Notification Badge
export interface NotificationBadgeProps {
  count?: number
  max?: number
  showZero?: boolean
  variant?: 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  max = 99,
  showZero = false,
  variant = 'destructive',
  size = 'sm',
  children,
}) => {
  const shouldShow = count > 0 || showZero
  const displayCount = count > max ? `${max}+` : count.toString()

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
  }

  return (
    <div className="relative inline-flex">
      {children}
      {shouldShow && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold',
            variant === 'destructive' ? 'bg-error-600 text-white' : 'bg-primary-600 text-white',
            sizeClasses[size],
            count > 99 && 'px-1'
          )}
        >
          {displayCount}
        </span>
      )}
    </div>
  )
}

export { Badge, DotBadge, NotificationBadge }