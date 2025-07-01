import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, formatVND, getBilingualText, formatVietnameseDate } from "@/lib/utils"
import { componentTokens } from "@/tokens"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-background border-border",
        elevated: "bg-background border-border shadow-lg",
        outline: "bg-transparent border-2",
        vietnamese: "bg-background border-vietnamese-red/20 shadow-md",
        tet: "bg-gradient-to-br from-tet-gold/10 to-vietnamese-red/10 border-vietnamese-red/30",
        pricing: "bg-background border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow",
      },
      size: {
        sm: "p-4",
        default: "p-6", 
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  vietnamese?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, vietnamese = false, ...props }, ref) => {
    const vietnameseClass = vietnamese ? "font-vietnamese" : ""
    
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size }), vietnameseClass, className)}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    vietnamese?: boolean
    bilingualText?: {
      en: string
      vi: string
    }
  }
>(({ className, vietnamese = false, bilingualText, children, ...props }, ref) => {
  const vietnameseClass = vietnamese ? "font-vietnamese" : ""
  
  const content = bilingualText 
    ? getBilingualText(bilingualText.en, bilingualText.vi)
    : children
    
  return (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        vietnameseClass,
        className
      )}
      {...props}
    >
      {content}
    </h3>
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    vietnamese?: boolean
    bilingualText?: {
      en: string
      vi: string
    }
  }
>(({ className, vietnamese = false, bilingualText, children, ...props }, ref) => {
  const vietnameseClass = vietnamese ? "font-vietnamese" : ""
  
  const content = bilingualText 
    ? getBilingualText(bilingualText.en, bilingualText.vi)
    : children
    
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", vietnameseClass, className)}
      {...props}
    >
      {content}
    </p>
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Vietnamese-specific card variants
export const VietnameseCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'vietnamese'>
>(
  (props, ref) => <Card vietnamese={true} {...props} ref={ref} />
)
VietnameseCard.displayName = "VietnameseCard"

export const TetCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'variant' | 'vietnamese'>
>(
  (props, ref) => <Card variant="tet" vietnamese={true} {...props} ref={ref} />
)
TetCard.displayName = "TetCard"

export const PricingCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'variant'> & {
    plan: 'free' | 'standard' | 'premium' | 'enterprise'
    price: {
      amount: number
      currency: 'USD' | 'VND'
      period?: string
    }
    features: string[]
    popular?: boolean
  }
>(
  ({ plan, price, features, popular = false, vietnamese = true, children, ...props }, ref) => (
    <Card
      variant="pricing"
      vietnamese={vietnamese}
      className={cn(
        popular && "ring-2 ring-primary ring-offset-2",
        "relative"
      )}
      {...props}
      ref={ref}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {vietnamese ? "Phổ biến nhất" : "Most Popular"}
          </span>
        </div>
      )}
      
      <CardHeader>
        <CardTitle vietnamese={vietnamese} className="capitalize">
          {plan === 'free' && (vietnamese ? 'Miễn phí' : 'Free')}
          {plan === 'standard' && (vietnamese ? 'Tiêu chuẩn' : 'Standard')}
          {plan === 'premium' && (vietnamese ? 'Cao cấp' : 'Premium')}
          {plan === 'enterprise' && (vietnamese ? 'Doanh nghiệp' : 'Enterprise')}
        </CardTitle>
        <CardDescription vietnamese={vietnamese}>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-vietnamese-red">
              {price.currency === 'VND' ? formatVND(price.amount) : `$${price.amount}`}
            </span>
            {price.period && (
              <span className="text-sm text-muted-foreground">
                /{vietnamese ? 'tháng' : price.period}
              </span>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className={vietnamese ? "font-vietnamese" : ""}>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      {children}
    </Card>
  )
)
PricingCard.displayName = "PricingCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants
}