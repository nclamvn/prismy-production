import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Responsive container variants
const containerVariants = cva(
  'w-full mx-auto px-4',
  {
    variants: {
      size: {
        sm: 'max-w-sm',      // 384px
        md: 'max-w-md',      // 448px  
        lg: 'max-w-lg',      // 512px
        xl: 'max-w-xl',      // 576px
        '2xl': 'max-w-2xl',  // 672px
        '3xl': 'max-w-3xl',  // 768px
        '4xl': 'max-w-4xl',  // 896px
        '5xl': 'max-w-5xl',  // 1024px
        '6xl': 'max-w-6xl',  // 1152px
        '7xl': 'max-w-7xl',  // 1280px
        full: 'max-w-full',
        none: 'max-w-none',
      },
      padding: {
        none: 'px-0',
        sm: 'px-4 sm:px-6',
        md: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-4 sm:px-6 lg:px-8 xl:px-12',
        xl: 'px-4 sm:px-6 lg:px-8 xl:px-16',
      },
      center: {
        true: 'mx-auto',
        false: '',
      },
    },
    defaultVariants: {
      size: '7xl',
      padding: 'md',
      center: true,
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer'
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, center, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding, center }), className)}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'

// Responsive grid system
const gridVariants = cva(
  'grid gap-4',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
        12: 'grid-cols-12',
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-2 sm:gap-3',
        md: 'gap-4 sm:gap-6',
        lg: 'gap-6 sm:gap-8',
        xl: 'gap-8 sm:gap-12',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
      justify: {
        start: 'justify-items-start',
        center: 'justify-items-center',
        end: 'justify-items-end',
        stretch: 'justify-items-stretch',
      },
    },
    defaultVariants: {
      cols: 2,
      gap: 'md',
      align: 'stretch',
      justify: 'stretch',
    },
  }
)

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, align, justify, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ cols, gap, align, justify }), className)}
        {...props}
      />
    )
  }
)

Grid.displayName = 'Grid'

// Grid item component for explicit spanning
const gridItemVariants = cva(
  '',
  {
    variants: {
      span: {
        1: 'col-span-1',
        2: 'col-span-2',
        3: 'col-span-3',
        4: 'col-span-4',
        5: 'col-span-5',
        6: 'col-span-6',
        7: 'col-span-7',
        8: 'col-span-8',
        9: 'col-span-9',
        10: 'col-span-10',
        11: 'col-span-11',
        12: 'col-span-12',
        full: 'col-span-full',
      },
      spanSm: {
        1: 'sm:col-span-1',
        2: 'sm:col-span-2',
        3: 'sm:col-span-3',
        4: 'sm:col-span-4',
        5: 'sm:col-span-5',
        6: 'sm:col-span-6',
        7: 'sm:col-span-7',
        8: 'sm:col-span-8',
        9: 'sm:col-span-9',
        10: 'sm:col-span-10',
        11: 'sm:col-span-11',
        12: 'sm:col-span-12',
        full: 'sm:col-span-full',
      },
      spanMd: {
        1: 'md:col-span-1',
        2: 'md:col-span-2',
        3: 'md:col-span-3',
        4: 'md:col-span-4',
        5: 'md:col-span-5',
        6: 'md:col-span-6',
        7: 'md:col-span-7',
        8: 'md:col-span-8',
        9: 'md:col-span-9',
        10: 'md:col-span-10',
        11: 'md:col-span-11',
        12: 'md:col-span-12',
        full: 'md:col-span-full',
      },
      spanLg: {
        1: 'lg:col-span-1',
        2: 'lg:col-span-2',
        3: 'lg:col-span-3',
        4: 'lg:col-span-4',
        5: 'lg:col-span-5',
        6: 'lg:col-span-6',
        7: 'lg:col-span-7',
        8: 'lg:col-span-8',
        9: 'lg:col-span-9',
        10: 'lg:col-span-10',
        11: 'lg:col-span-11',
        12: 'lg:col-span-12',
        full: 'lg:col-span-full',
      },
    },
  }
)

export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, spanSm, spanMd, spanLg, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridItemVariants({ span, spanSm, spanMd, spanLg }), className)}
        {...props}
      />
    )
  }
)

GridItem.displayName = 'GridItem'

// Flexible stack component for vertical/horizontal layouts
const stackVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        row: 'flex-row',
        col: 'flex-col',
        'row-reverse': 'flex-row-reverse',
        'col-reverse': 'flex-col-reverse',
      },
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      responsive: {
        true: 'flex-col sm:flex-row',
        false: '',
      },
    },
    defaultVariants: {
      direction: 'row',
      wrap: false,
      gap: 'md',
      align: 'start',
      justify: 'start',
      responsive: false,
    },
  }
)

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, wrap, gap, align, justify, responsive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ direction, wrap, gap, align, justify, responsive }), className)}
        {...props}
      />
    )
  }
)

Stack.displayName = 'Stack'

// Responsive breakpoint utilities
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Hook for responsive breakpoint detection
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<keyof typeof breakpoints | 'xs'>('xs')

  React.useEffect(() => {
    const getBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= 1536) return '2xl'
      if (width >= 1280) return 'xl'
      if (width >= 1024) return 'lg'
      if (width >= 768) return 'md'
      if (width >= 640) return 'sm'
      return 'xs'
    }

    const handleResize = () => {
      setCurrentBreakpoint(getBreakpoint())
    }

    // Set initial breakpoint
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isBreakpoint = (breakpoint: keyof typeof breakpoints | 'xs') => {
    return currentBreakpoint === breakpoint
  }

  const isBreakpointUp = (breakpoint: keyof typeof breakpoints) => {
    const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = order.indexOf(currentBreakpoint)
    const targetIndex = order.indexOf(breakpoint)
    return currentIndex >= targetIndex
  }

  const isBreakpointDown = (breakpoint: keyof typeof breakpoints) => {
    const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = order.indexOf(currentBreakpoint)
    const targetIndex = order.indexOf(breakpoint)
    return currentIndex <= targetIndex
  }

  return {
    current: currentBreakpoint,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md' || currentBreakpoint === 'lg',
    isDesktop: currentBreakpoint === 'xl' || currentBreakpoint === '2xl',
  }
}

// Responsive visibility components
const showVariants = cva(
  '',
  {
    variants: {
      above: {
        sm: 'hidden sm:block',
        md: 'hidden md:block',
        lg: 'hidden lg:block',
        xl: 'hidden xl:block',
        '2xl': 'hidden 2xl:block',
      },
      below: {
        sm: 'block sm:hidden',
        md: 'block md:hidden',
        lg: 'block lg:hidden',
        xl: 'block xl:hidden',
        '2xl': 'block 2xl:hidden',
      },
      only: {
        sm: 'hidden sm:block md:hidden',
        md: 'hidden md:block lg:hidden',
        lg: 'hidden lg:block xl:hidden',
        xl: 'hidden xl:block 2xl:hidden',
        '2xl': 'hidden 2xl:block',
      },
    },
  }
)

export interface ShowProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof showVariants> {}

const Show = React.forwardRef<HTMLDivElement, ShowProps>(
  ({ className, above, below, only, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(showVariants({ above, below, only }), className)}
        {...props}
      />
    )
  }
)

Show.displayName = 'Show'

// Hide component (opposite of Show)
const hideVariants = cva(
  '',
  {
    variants: {
      above: {
        sm: 'block sm:hidden',
        md: 'block md:hidden',
        lg: 'block lg:hidden',
        xl: 'block xl:hidden',
        '2xl': 'block 2xl:hidden',
      },
      below: {
        sm: 'hidden sm:block',
        md: 'hidden md:block',
        lg: 'hidden lg:block',
        xl: 'hidden xl:block',
        '2xl': 'hidden 2xl:block',
      },
      only: {
        sm: 'block sm:hidden md:block',
        md: 'block md:hidden lg:block',
        lg: 'block lg:hidden xl:block',
        xl: 'block xl:hidden 2xl:block',
        '2xl': 'block 2xl:hidden',
      },
    },
  }
)

export interface HideProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof hideVariants> {}

const Hide = React.forwardRef<HTMLDivElement, HideProps>(
  ({ className, above, below, only, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(hideVariants({ above, below, only }), className)}
        {...props}
      />
    )
  }
)

Hide.displayName = 'Hide'

export {
  Container,
  Grid,
  GridItem,
  Stack,
  Show,
  Hide,
}