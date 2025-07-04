import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

// Form variants
const formVariants = cva(
  'space-y-6',
  {
    variants: {
      variant: {
        default: '',
        card: 'p-6 bg-white border border-neutral-200 rounded-lg shadow-sm',
        inline: 'space-y-0 space-x-4 flex items-center flex-wrap',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Form Component
export interface FormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>,
    VariantProps<typeof formVariants> {
  onSubmit?: (data: FormData) => void | Promise<void>
  loading?: boolean
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, variant, size, onSubmit, loading, children, ...props }, ref) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (onSubmit && !loading) {
        const formData = new FormData(e.currentTarget)
        await onSubmit(formData)
      }
    }

    return (
      <form
        ref={ref}
        className={cn(formVariants({ variant, size }), className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    )
  }
)

Form.displayName = 'Form'

// Form Field Group
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  required?: boolean
  disabled?: boolean
  error?: string
  success?: string
  helperText?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, disabled, error, success, helperText, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          disabled && 'opacity-60 pointer-events-none',
          className
        )}
        {...props}
      >
        {children}
        {(error || success || helperText) && (
          <FormMessage error={error} success={success} helperText={helperText} />
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

// Form Label
export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  disabled?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, disabled, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium leading-none peer-disabled:cursor-not-allowed',
          disabled ? 'text-neutral-400' : 'text-neutral-700',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
    )
  }
)

FormLabel.displayName = 'FormLabel'

// Form Message (for errors, success, helper text)
export interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string
  success?: string
  helperText?: string
  icon?: boolean
}

const FormMessage = React.forwardRef<HTMLDivElement, FormMessageProps>(
  ({ className, error, success, helperText, icon = true, ...props }, ref) => {
    if (!error && !success && !helperText) return null

    const message = error || success || helperText
    const variant = error ? 'error' : success ? 'success' : 'helper'

    const getIcon = () => {
      if (!icon) return null
      switch (variant) {
        case 'error':
          return <AlertCircle className="h-4 w-4 text-error-500" />
        case 'success':
          return <CheckCircle2 className="h-4 w-4 text-success-500" />
        case 'helper':
          return <Info className="h-4 w-4 text-neutral-400" />
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-2 text-sm',
          variant === 'error' && 'text-error-600',
          variant === 'success' && 'text-success-600',
          variant === 'helper' && 'text-neutral-500',
          className
        )}
        role={variant === 'error' ? 'alert' : undefined}
        {...props}
      >
        {getIcon()}
        <span>{message}</span>
      </div>
    )
  }
)

FormMessage.displayName = 'FormMessage'

// Form Section
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, collapsible, defaultCollapsed, children, ...props }, ref) => {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed ?? false)

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                {collapsible && (
                  <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-sm text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 rounded"
                  >
                    {collapsed ? 'Expand' : 'Collapse'}
                  </button>
                )}
              </div>
            )}
            {description && (
              <p className="text-sm text-neutral-600">{description}</p>
            )}
          </div>
        )}
        {(!collapsible || !collapsed) && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    )
  }
)

FormSection.displayName = 'FormSection'

// Form Grid
export interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ className, cols = 2, gap = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          {
            'grid-cols-1': cols === 1,
            'grid-cols-1 md:grid-cols-2': cols === 2,
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': cols === 3,
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': cols === 4,
          },
          {
            'gap-4': gap === 'sm',
            'gap-6': gap === 'md',
            'gap-8': gap === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

FormGrid.displayName = 'FormGrid'

// Fieldset
export interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend?: string
  disabled?: boolean
}

const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ className, legend, disabled, children, ...props }, ref) => {
    return (
      <fieldset
        ref={ref}
        className={cn(
          'space-y-4 border border-neutral-200 rounded-lg p-4',
          disabled && 'opacity-60',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {legend && (
          <legend className="px-2 text-sm font-medium text-neutral-700">
            {legend}
          </legend>
        )}
        {children}
      </fieldset>
    )
  }
)

Fieldset.displayName = 'Fieldset'

// Select Component
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  placeholder?: string
  error?: boolean
  success?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, success, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-base',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-error-300 focus-visible:border-error-500 focus-visible:ring-error-500'
            : success
            ? 'border-success-300 focus-visible:border-success-500 focus-visible:ring-success-500'
            : 'border-neutral-200 focus-visible:border-primary-500 focus-visible:ring-primary-500',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

// Checkbox Component
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: boolean
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="flex items-start space-x-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2',
            error && 'border-error-300 text-error-600 focus:ring-error-500',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-neutral-700 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// Radio Component
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: boolean
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="flex items-start space-x-3">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={cn(
            'h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2',
            error && 'border-error-300 text-error-600 focus:ring-error-500',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={radioId}
                className="text-sm font-medium text-neutral-700 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'

// Radio Group
export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name: string
  value?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  error?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, name, value, onChange, orientation = 'vertical', error, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-3',
          orientation === 'horizontal' && 'flex flex-wrap gap-6 space-y-0',
          className
        )}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioProps>(child) && child.type === Radio) {
            const radioProps = child.props as RadioProps
            return React.cloneElement(child, {
              name,
              checked: radioProps.value === value,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (onChange) {
                  onChange(e.target.value)
                }
                radioProps.onChange?.(e)
              },
              error: error || radioProps.error,
            })
          }
          return child
        })}
      </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormSection,
  FormGrid,
  Fieldset,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
}