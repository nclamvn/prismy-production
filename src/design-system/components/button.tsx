import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Button variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white shadow-sm',
          'hover:bg-primary-700 hover:shadow-md',
          'focus-visible:ring-primary-500',
          'active:bg-primary-800',
        ],
        secondary: [
          'bg-neutral-100 text-neutral-900 border border-neutral-200',
          'hover:bg-neutral-200 hover:border-neutral-300',
          'focus-visible:ring-neutral-500',
          'active:bg-neutral-300',
        ],
        outline: [
          'border border-primary-300 text-primary-700 bg-transparent',
          'hover:bg-primary-50 hover:border-primary-400',
          'focus-visible:ring-primary-500',
          'active:bg-primary-100',
        ],
        ghost: [
          'text-neutral-700 bg-transparent',
          'hover:bg-neutral-100 hover:text-neutral-900',
          'focus-visible:ring-neutral-500',
          'active:bg-neutral-200',
        ],
        destructive: [
          'bg-error-600 text-white shadow-sm',
          'hover:bg-error-700 hover:shadow-md',
          'focus-visible:ring-error-500',
          'active:bg-error-800',
        ],
        link: [
          'text-primary-600 underline-offset-4',
          'hover:underline hover:text-primary-700',
          'focus-visible:ring-primary-500',
          'active:text-primary-800',
        ],
      },
      size: {
        xs: ['h-6 px-2 text-xs', 'rounded'],
        sm: ['h-8 px-3 text-sm', 'rounded-md'],
        md: ['h-10 px-4 text-base', 'rounded-md'],
        lg: ['h-11 px-5 text-lg', 'rounded-lg'],
        xl: ['h-12 px-6 text-xl', 'rounded-lg'],
        icon: ['h-10 w-10', 'rounded-md'],
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const LoadingSpinner = ({ size = 16 }: { size?: number }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
            {children && <span className="opacity-70">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Button Group Component
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          orientation === 'horizontal' 
            ? 'divide-x rounded-md [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child):not(:last-child)]:rounded-none'
            : 'flex-col divide-y rounded-md [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child):not(:last-child)]:rounded-none',
          className
        )}
        {...props}
      />
    )
  }
)

ButtonGroup.displayName = 'ButtonGroup'