import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, getBilingualText } from "@/lib/utils"
import { componentTokens } from "@/tokens"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        vietnamese: "font-vietnamese border-vietnamese-red/30 focus-visible:ring-vietnamese-red",
      },
      size: {
        default: "h-10",
        sm: "h-9",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  vietnamese?: boolean
  error?: boolean
  success?: boolean
  helperText?: string
  label?: string
  bilingualLabel?: {
    en: string
    vi: string
  }
  bilingualPlaceholder?: {
    en: string
    vi: string
  }
  currencyFormat?: 'VND' | 'USD'
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    type = "text",
    variant, 
    size, 
    vietnamese = false,
    error = false,
    success = false,
    helperText,
    label,
    bilingualLabel,
    bilingualPlaceholder,
    currencyFormat,
    placeholder,
    ...props 
  }, ref) => {
    // Determine variant based on state
    const finalVariant = error ? "error" : success ? "success" : vietnamese ? "vietnamese" : variant
    
    const vietnameseClass = vietnamese ? "font-vietnamese" : ""
    
    // Generate placeholder based on props
    const finalPlaceholder = bilingualPlaceholder 
      ? getBilingualText(bilingualPlaceholder.en, bilingualPlaceholder.vi)
      : placeholder

    // Generate label based on props  
    const finalLabel = bilingualLabel
      ? getBilingualText(bilingualLabel.en, bilingualLabel.vi)
      : label

    // Currency formatting for input
    const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (currencyFormat && type === "text") {
        const value = e.target.value.replace(/\D/g, '')
        if (currencyFormat === 'VND') {
          e.target.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        } else {
          e.target.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        }
      }
      props.onChange?.(e)
    }

    return (
      <div className="space-y-2">
        {finalLabel && (
          <label className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            vietnameseClass,
            error && "text-destructive",
            success && "text-green-600"
          )}>
            {finalLabel}
          </label>
        )}
        
        <div className="relative">
          {currencyFormat && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
              {currencyFormat === 'VND' ? '₫' : '$'}
            </span>
          )}
          
          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, size }),
              vietnameseClass,
              currencyFormat && "pl-8",
              className
            )}
            placeholder={finalPlaceholder}
            ref={ref}
            onChange={currencyFormat ? handleCurrencyInput : props.onChange}
            {...props}
          />
          
          {(error || success) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {error && (
                <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {success && (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
        
        {helperText && (
          <p className={cn(
            "text-sm",
            vietnameseClass,
            error && "text-destructive",
            success && "text-green-600",
            !error && !success && "text-muted-foreground"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

// Vietnamese-specific input variants
export const VietnameseInput = React.forwardRef<
  HTMLInputElement,
  Omit<EnhancedInputProps, 'vietnamese'>
>(
  (props, ref) => <EnhancedInput vietnamese={true} {...props} ref={ref} />
)
VietnameseInput.displayName = "VietnameseInput"

export const VNDInput = React.forwardRef<
  HTMLInputElement,
  Omit<EnhancedInputProps, 'currencyFormat' | 'vietnamese'>
>(
  (props, ref) => (
    <EnhancedInput 
      currencyFormat="VND" 
      vietnamese={true} 
      type="text"
      {...props} 
      ref={ref} 
    />
  )
)
VNDInput.displayName = "VNDInput"

export const BilingualInput = React.forwardRef<
  HTMLInputElement,
  Omit<EnhancedInputProps, 'bilingualLabel' | 'bilingualPlaceholder'> & {
    labelEn: string
    labelVi: string
    placeholderEn?: string
    placeholderVi?: string
  }
>(
  ({ labelEn, labelVi, placeholderEn, placeholderVi, vietnamese = true, ...props }, ref) => (
    <EnhancedInput
      vietnamese={vietnamese}
      bilingualLabel={{ en: labelEn, vi: labelVi }}
      bilingualPlaceholder={placeholderEn && placeholderVi ? 
        { en: placeholderEn, vi: placeholderVi } : undefined
      }
      {...props}
      ref={ref}
    />
  )
)
BilingualInput.displayName = "BilingualInput"

export { EnhancedInput, inputVariants }