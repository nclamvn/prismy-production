import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, formatVND, getBilingualText } from "@/lib/utils"
import { componentTokens } from "@/tokens"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        vietnamese: "bg-vietnamese-red text-white hover:bg-vietnamese-red/90 font-vietnamese",
        tet: "bg-tet-gold text-black hover:bg-tet-gold/90 font-vietnamese",
        pricing: "bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  vietnamese?: boolean
  bilingualText?: {
    en: string
    vi: string
  }
  priceDisplay?: {
    amount: number
    currency: 'USD' | 'VND'
  }
  loading?: boolean
  loadingText?: string
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    vietnamese = false, 
    bilingualText,
    priceDisplay,
    loading = false,
    loadingText = 'Loading...',
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Apply Vietnamese-specific styling if vietnamese prop is true
    const vietnameseClass = vietnamese ? "font-vietnamese" : ""
    
    // Generate button content based on props
    const getButtonContent = () => {
      if (loading) {
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {loadingText}
          </div>
        )
      }
      
      if (bilingualText) {
        return getBilingualText(bilingualText.en, bilingualText.vi)
      }
      
      if (priceDisplay) {
        const formattedPrice = priceDisplay.currency === 'VND' 
          ? formatVND(priceDisplay.amount)
          : `$${priceDisplay.amount}`
        return (
          <span className={vietnamese ? 'text-vietnamese-red font-semibold' : ''}>
            {formattedPrice}
          </span>
        )
      }
      
      return children
    }
    
    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, className }), vietnameseClass)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {getButtonContent()}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

// Vietnamese-specific button variants
export const VietnameseButton = React.forwardRef<
  HTMLButtonElement, 
  Omit<EnhancedButtonProps, 'vietnamese'>
>(
  (props, ref) => <EnhancedButton vietnamese={true} {...props} ref={ref} />
)
VietnameseButton.displayName = "VietnameseButton"

export const TetButton = React.forwardRef<
  HTMLButtonElement, 
  Omit<EnhancedButtonProps, 'variant' | 'vietnamese'>
>(
  (props, ref) => <EnhancedButton variant="tet" vietnamese={true} {...props} ref={ref} />
)
TetButton.displayName = "TetButton"

export const PricingButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, 'variant'> & {
    plan: 'free' | 'standard' | 'premium' | 'enterprise'
    amount: number
    currency?: 'USD' | 'VND'
  }
>(
  ({ plan, amount, currency = 'VND', vietnamese = true, ...props }, ref) => (
    <EnhancedButton
      variant="pricing"
      vietnamese={vietnamese}
      priceDisplay={{ amount, currency }}
      {...props}
      ref={ref}
    />
  )
)
PricingButton.displayName = "PricingButton"

export const BilingualButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, 'bilingualText'> & {
    en: string
    vi: string
  }
>(
  ({ en, vi, vietnamese = true, ...props }, ref) => (
    <EnhancedButton
      vietnamese={vietnamese}
      bilingualText={{ en, vi }}
      {...props}
      ref={ref}
    />
  )
)
BilingualButton.displayName = "BilingualButton"

export { EnhancedButton, enhancedButtonVariants }