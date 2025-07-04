import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

// Navigation Link variants
const navLinkVariants = cva(
  [
    'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100',
          'focus-visible:ring-neutral-500',
        ],
        active: [
          'text-primary-700 bg-primary-50 hover:bg-primary-100',
          'focus-visible:ring-primary-500',
        ],
        ghost: [
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50',
          'focus-visible:ring-neutral-500',
        ],
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Navigation Link Component
export interface NavLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof navLinkVariants> {
  icon?: React.ReactNode
  badge?: React.ReactNode
  active?: boolean
  disabled?: boolean
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, variant, size, icon, badge, active, disabled, children, ...props }, ref) => {
    const effectiveVariant = active ? 'active' : variant

    return (
      <a
        ref={ref}
        className={cn(
          navLinkVariants({ variant: effectiveVariant, size }),
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        aria-disabled={disabled}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
        {badge && <span className="shrink-0">{badge}</span>}
      </a>
    )
  }
)

NavLink.displayName = 'NavLink'

// Navigation Container
export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'underline'
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, orientation = 'horizontal', variant = 'default', ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'items-center space-x-1' : 'flex-col space-y-1',
          variant === 'pills' && 'p-1 bg-neutral-100 rounded-lg',
          variant === 'underline' && 'border-b border-neutral-200',
          className
        )}
        {...props}
      />
    )
  }
)

Navigation.displayName = 'Navigation'

// Breadcrumb Components
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn('flex items-center space-x-1 text-sm', className)}
        aria-label="Breadcrumb"
        {...props}
      />
    )
  }
)

Breadcrumb.displayName = 'Breadcrumb'

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  href?: string
  active?: boolean
  icon?: React.ReactNode
}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, href, active, icon, children, ...props }, ref) => {
    const content = (
      <>
        {icon && <span className="shrink-0">{icon}</span>}
        <span className={cn('truncate', active && 'font-medium')}>{children}</span>
      </>
    )

    return (
      <li ref={ref} className={cn('flex items-center gap-1', className)} {...props}>
        {href && !active ? (
          <a
            href={href}
            className={cn(
              'inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500'
            )}
          >
            {content}
          </a>
        ) : (
          <span className={cn('inline-flex items-center gap-1', active ? 'text-neutral-900' : 'text-neutral-600')}>
            {content}
          </span>
        )}
      </li>
    )
  }
)

BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn('flex items-center text-neutral-400', className)}
        role="presentation"
        aria-hidden="true"
        {...props}
      >
        {children || <ChevronRight className="h-4 w-4" />}
      </li>
    )
  }
)

BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

// Tab Components
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row gap-6',
          className
        )}
        {...props}
      />
    )
  }
)

Tabs.displayName = 'Tabs'

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center p-1 text-neutral-500 bg-neutral-100 rounded-lg',
          orientation === 'vertical' && 'flex-col h-fit',
          className
        )}
        role="tablist"
        aria-orientation={orientation}
        {...props}
      />
    )
  }
)

TabsList.displayName = 'TabsList'

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  active?: boolean
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, active, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          active
            ? 'bg-white text-neutral-950 shadow-sm'
            : 'hover:bg-neutral-200 hover:text-neutral-900',
          className
        )}
        role="tab"
        aria-selected={active}
        {...props}
      />
    )
  }
)

TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  active?: boolean
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, active, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-4 ring-offset-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2',
          !active && 'hidden',
          className
        )}
        role="tabpanel"
        tabIndex={0}
        {...props}
      />
    )
  }
)

TabsContent.displayName = 'TabsContent'

// Sidebar Navigation
export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  collapsible?: boolean
  collapsed?: boolean
  onToggle?: () => void
}

const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(
  ({ className, collapsed, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'flex flex-col space-y-1 p-2',
          collapsed && 'w-16',
          !collapsed && 'w-64',
          'transition-all duration-200 ease-in-out',
          className
        )}
        {...props}
      >
        {children}
      </nav>
    )
  }
)

SidebarNav.displayName = 'SidebarNav'

export interface SidebarNavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode
  badge?: React.ReactNode
  active?: boolean
  collapsed?: boolean
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ className, icon, badge, active, collapsed, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          active
            ? 'bg-primary-50 text-primary-700 focus-visible:ring-primary-500'
            : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-500',
          collapsed && 'justify-center px-2',
          className
        )}
        title={collapsed ? String(children) : undefined}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {!collapsed && (
          <>
            <span className="truncate">{children}</span>
            {badge && <span className="shrink-0 ml-auto">{badge}</span>}
          </>
        )}
      </a>
    )
  }
)

SidebarNavItem.displayName = 'SidebarNavItem'

export {
  Navigation,
  NavLink,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SidebarNav,
  SidebarNavItem,
}