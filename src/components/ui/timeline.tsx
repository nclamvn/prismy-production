import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const timelineVariants = cva(
  "relative",
  {
    variants: {
      orientation: {
        vertical: "flex flex-col space-y-8",
        horizontal: "grid grid-cols-1 md:grid-cols-3 gap-8",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

const timelineItemVariants = cva(
  "relative flex",
  {
    variants: {
      orientation: {
        vertical: "items-start space-x-4",
        horizontal: "flex-col items-center text-center space-y-4",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

const timelineIconVariants = cva(
  "flex items-center justify-center rounded-full border-2 border-primary bg-background text-primary transition-all duration-300",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        default: "h-12 w-12",
        lg: "h-16 w-16",
      },
      variant: {
        default: "border-primary bg-background text-primary",
        filled: "border-primary bg-primary text-primary-foreground",
        muted: "border-muted bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface TimelineProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof timelineVariants> {}

export interface TimelineItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof timelineItemVariants> {
  icon?: LucideIcon
  iconVariant?: VariantProps<typeof timelineIconVariants>["variant"]
  iconSize?: VariantProps<typeof timelineIconVariants>["size"]
  title: string
  description: string
  step?: number
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, orientation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timelineVariants({ orientation, className }))}
        {...props}
      />
    )
  }
)
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ 
    className, 
    orientation, 
    icon: Icon, 
    iconVariant,
    iconSize,
    title, 
    description, 
    step,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timelineItemVariants({ orientation, className }))}
        {...props}
      >
        {/* Icon or step number */}
        <div className={cn(timelineIconVariants({ size: iconSize, variant: iconVariant }))}>
          {Icon ? (
            <Icon className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{step}</span>
          )}
        </div>
        
        {/* Content */}
        <div className={cn(
          "flex-1 min-w-0",
          orientation === "horizontal" ? "text-center" : "space-y-2"
        )}>
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        
        {/* Connector line for horizontal layout */}
        {orientation === "horizontal" && (
          <div className="absolute top-6 left-1/2 hidden md:block w-full h-[2px] bg-border -z-10 last:hidden" />
        )}
        
        {/* Connector line for vertical layout */}
        {orientation === "vertical" && (
          <div className="absolute left-6 top-12 hidden md:block w-[2px] h-full bg-border -z-10 last:hidden" />
        )}
      </div>
    )
  }
)
TimelineItem.displayName = "TimelineItem"

export { Timeline, TimelineItem, timelineVariants, timelineItemVariants, timelineIconVariants }