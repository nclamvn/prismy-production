import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  [
    'flex w-full rounded-md border transition-colors duration-150',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-neutral-500',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-neutral-200 bg-white',
          'hover:border-neutral-300',
          'focus-visible:border-primary-500 focus-visible:ring-primary-500',
        ],
        filled: [
          'border-transparent bg-neutral-100',
          'hover:bg-neutral-200',
          'focus-visible:bg-white focus-visible:border-primary-500 focus-visible:ring-primary-500',
        ],
        error: [
          'border-error-300 bg-white',
          'hover:border-error-400',
          'focus-visible:border-error-500 focus-visible:ring-error-500',
        ],
        success: [
          'border-success-300 bg-white',
          'hover:border-success-400',
          'focus-visible:border-success-500 focus-visible:ring-success-500',
        ],
      },
      inputSize: {
        sm: 'h-8 px-3 py-1 text-sm',
        md: 'h-10 px-3 py-2 text-base',
        lg: 'h-12 px-4 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  helperText?: string
  error?: string
  success?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    inputSize, 
    type = 'text',
    leftIcon,
    rightIcon, 
    label,
    helperText,
    error,
    success,
    id,
    ...props 
  }, ref) => {
    // Determine variant based on error/success state
    const effectiveVariant = error ? 'error' : success ? 'success' : variant

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: effectiveVariant, inputSize }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>

        {(helperText || error || success) && (
          <p className={cn(
            'mt-2 text-sm',
            error && 'text-error-600',
            success && 'text-success-600',
            !error && !success && 'text-neutral-500'
          )}>
            {error || success || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Pick<InputProps, 'label' | 'helperText' | 'error' | 'success'> {
  resize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label,
    helperText,
    error,
    success,
    resize = true,
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors duration-150',
            'placeholder:text-neutral-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? [
              'border-error-300 bg-white',
              'hover:border-error-400',
              'focus-visible:border-error-500 focus-visible:ring-error-500',
            ] : success ? [
              'border-success-300 bg-white',
              'hover:border-success-400',
              'focus-visible:border-success-500 focus-visible:ring-success-500',
            ] : [
              'border-neutral-200 bg-white',
              'hover:border-neutral-300',
              'focus-visible:border-primary-500 focus-visible:ring-primary-500',
            ],
            !resize && 'resize-none',
            className
          )}
          ref={ref}
          {...props}
        />

        {(helperText || error || success) && (
          <p className={cn(
            'mt-2 text-sm',
            error && 'text-error-600',
            success && 'text-success-600',
            !error && !success && 'text-neutral-500'
          )}>
            {error || success || helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Input, Textarea }