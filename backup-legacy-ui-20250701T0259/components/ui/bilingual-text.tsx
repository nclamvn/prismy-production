import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, getBilingualText } from "@/lib/utils"
import { vietnamese } from "@/tokens"

const bilingualTextVariants = cva(
  "font-vietnamese",
  {
    variants: {
      variant: {
        default: "text-current",
        heading: "font-semibold",
        subtitle: "text-muted-foreground",
        caption: "text-sm text-muted-foreground",
        accent: "text-vietnamese-red font-medium",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium", 
        semibold: "font-semibold",
        bold: "font-bold",
      },
      separator: {
        pipe: "", // Default pipe separator
        slash: "",
        dash: "",
        bullet: "",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "normal",
      separator: "pipe",
    },
  }
)

export interface BilingualTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof bilingualTextVariants> {
  en: string
  vi: string
  customSeparator?: string
  showOnlyVietnamese?: boolean
  showOnlyEnglish?: boolean
}

const BilingualText = React.forwardRef<HTMLSpanElement, BilingualTextProps>(
  ({ 
    className, 
    variant, 
    size, 
    weight,
    separator = "pipe",
    en,
    vi,
    customSeparator,
    showOnlyVietnamese = false,
    showOnlyEnglish = false,
    ...props 
  }, ref) => {
    
    const getSeparatorSymbol = () => {
      if (customSeparator) return customSeparator
      
      switch (separator) {
        case 'pipe': return vietnamese.patterns.bilingual.separator
        case 'slash': return ' / '
        case 'dash': return ' - '
        case 'bullet': return ' • '
        case 'none': return ' '
        default: return vietnamese.patterns.bilingual.separator
      }
    }

    const getDisplayText = () => {
      if (showOnlyVietnamese) return vi
      if (showOnlyEnglish) return en
      
      if (separator === 'none') {
        return `${en} ${vi}`
      }
      
      return `${en}${getSeparatorSymbol()}${vi}`
    }

    return (
      <span
        ref={ref}
        className={cn(bilingualTextVariants({ variant, size, weight }), className)}
        {...props}
      >
        {getDisplayText()}
      </span>
    )
  }
)
BilingualText.displayName = "BilingualText"

// Specific bilingual text variants
export const BilingualHeading = React.forwardRef<
  HTMLSpanElement,
  Omit<BilingualTextProps, 'variant'>
>(
  (props, ref) => <BilingualText variant="heading" {...props} ref={ref} />
)
BilingualHeading.displayName = "BilingualHeading"

export const BilingualSubtitle = React.forwardRef<
  HTMLSpanElement,
  Omit<BilingualTextProps, 'variant'>
>(
  (props, ref) => <BilingualText variant="subtitle" {...props} ref={ref} />
)
BilingualSubtitle.displayName = "BilingualSubtitle"

export const BilingualCaption = React.forwardRef<
  HTMLSpanElement,
  Omit<BilingualTextProps, 'variant'>
>(
  (props, ref) => <BilingualText variant="caption" {...props} ref={ref} />
)
BilingualCaption.displayName = "BilingualCaption"

export const BilingualAccent = React.forwardRef<
  HTMLSpanElement,
  Omit<BilingualTextProps, 'variant'>
>(
  (props, ref) => <BilingualText variant="accent" {...props} ref={ref} />
)
BilingualAccent.displayName = "BilingualAccent"

// Navigation/menu specific
export const BilingualNavItem = React.forwardRef<
  HTMLSpanElement,
  Omit<BilingualTextProps, 'separator'>
>(
  (props, ref) => <BilingualText separator="pipe" {...props} ref={ref} />
)
BilingualNavItem.displayName = "BilingualNavItem"

// Content-specific variants
export const BilingualDescription = React.forwardRef<
  HTMLSpanElement,
  Omit<BilingualTextProps, 'variant' | 'separator'>
>(
  (props, ref) => (
    <BilingualText 
      variant="subtitle" 
      separator="none"
      {...props} 
      ref={ref} 
    />
  )
)
BilingualDescription.displayName = "BilingualDescription"

export { BilingualText, bilingualTextVariants }