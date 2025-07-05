import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

const featureCardVariants = cva(
  "group relative overflow-hidden transition-all duration-300 hover:shadow-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-card",
        gradient: "gradient-border bg-card",
        glass: "glass",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface FeatureCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof featureCardVariants> {
  icon?: LucideIcon
  title: string
  description: string
  iconClassName?: string
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon: Icon, 
    title, 
    description, 
    iconClassName,
    ...props 
  }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(featureCardVariants({ variant, size, className }))}
        {...props}
      >
        <CardHeader className="space-y-4">
          {Icon && (
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20",
              iconClassName
            )}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold leading-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }
)
FeatureCard.displayName = "FeatureCard"

export { FeatureCard, featureCardVariants }