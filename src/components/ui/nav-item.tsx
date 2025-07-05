import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const navItemVariants = cva(
  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "text-muted-foreground hover:text-accent-foreground",
        active: "bg-accent text-accent-foreground",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-transparent",
      },
      size: {
        sm: "px-2 py-1.5 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface NavItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navItemVariants> {
  icon?: LucideIcon
  label: string
  href?: string
  badge?: string | number
  isActive?: boolean
  collapsed?: boolean
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon: Icon, 
    label, 
    href,
    badge,
    isActive,
    collapsed = false,
    onClick,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (href) {
        // Handle navigation - in a real app, use Next.js router
        window.location.href = href
      }
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={cn(
          navItemVariants({ 
            variant: isActive ? "active" : variant, 
            size, 
            className 
          }),
          collapsed && "justify-center px-2"
        )}
        onClick={handleClick}
        {...props}
      >
        {Icon && (
          <Icon className={cn(
            "flex-shrink-0 transition-colors",
            size === "sm" && "h-3 w-3",
            size === "default" && "h-4 w-4",
            size === "lg" && "h-5 w-5"
          )} />
        )}
        
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">
              {label}
            </span>
            
            {badge && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {badge}
              </span>
            )}
          </>
        )}
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        
        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md bg-popover px-2 py-1 text-sm text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {label}
            {badge && <span className="ml-2 text-xs">({badge})</span>}
          </div>
        )}
      </button>
    )
  }
)
NavItem.displayName = "NavItem"

export { NavItem, navItemVariants }