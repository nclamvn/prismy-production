import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, formatVND } from "@/lib/utils"
import { vietnameseUtils } from "@/tokens"

const currencyDisplayVariants = cva(
  "inline-flex items-center font-vietnamese",
  {
    variants: {
      variant: {
        default: "text-current",
        primary: "text-vietnamese-red font-semibold",
        success: "text-green-600 font-semibold",
        muted: "text-muted-foreground",
        pricing: "text-vietnamese-red font-bold text-lg",
        large: "text-vietnamese-red font-bold text-2xl",
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg", 
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CurrencyDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof currencyDisplayVariants> {
  amount: number
  currency?: 'VND' | 'USD'
  showSymbol?: boolean
  precision?: number
  locale?: 'vi-VN' | 'en-US'
}

const CurrencyDisplay = React.forwardRef<HTMLSpanElement, CurrencyDisplayProps>(
  ({ 
    className, 
    variant, 
    size, 
    amount,
    currency = 'VND',
    showSymbol = true,
    precision = 0,
    locale = 'vi-VN',
    ...props 
  }, ref) => {
    
    const formatCurrency = () => {
      if (currency === 'VND') {
        return vietnameseUtils.formatVNDWithPattern(amount)
      } else {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(amount)
      }
    }

    return (
      <span
        ref={ref}
        className={cn(currencyDisplayVariants({ variant, size }), className)}
        {...props}
      >
        {formatCurrency()}
      </span>
    )
  }
)
CurrencyDisplay.displayName = "CurrencyDisplay"

// Vietnamese-specific currency variants
export const VNDDisplay = React.forwardRef<
  HTMLSpanElement,
  Omit<CurrencyDisplayProps, 'currency'>
>(
  (props, ref) => <CurrencyDisplay currency="VND" {...props} ref={ref} />
)
VNDDisplay.displayName = "VNDDisplay"

export const PricingDisplay = React.forwardRef<
  HTMLSpanElement,
  Omit<CurrencyDisplayProps, 'variant' | 'currency'> & {
    plan?: 'free' | 'standard' | 'premium' | 'enterprise'
  }
>(
  ({ plan, ...props }, ref) => (
    <CurrencyDisplay 
      variant="pricing" 
      currency="VND"
      {...props} 
      ref={ref} 
    />
  )
)
PricingDisplay.displayName = "PricingDisplay"

export const LargeCurrencyDisplay = React.forwardRef<
  HTMLSpanElement,
  Omit<CurrencyDisplayProps, 'variant' | 'size'>
>(
  (props, ref) => (
    <CurrencyDisplay 
      variant="large" 
      size="3xl"
      {...props} 
      ref={ref} 
    />
  )
)
LargeCurrencyDisplay.displayName = "LargeCurrencyDisplay"

export { CurrencyDisplay, currencyDisplayVariants }