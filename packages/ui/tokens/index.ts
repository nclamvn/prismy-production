/**
 * UI/UX Polish Sprint - Phase 1.1: Token Architecture & CSS Namespace System
 * 
 * Reusable design token system with CSS variable namespace --pry-v2-*
 * Supports auto-generation of CSS vars, Tailwind config, and Storybook theme
 */

// Base color palette with semantic meaning
export const baseColors = {
  // Brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Neutral/Gray scale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },
  
  // Status colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  }
} as const

// Semantic color mappings
export const semanticColors = {
  // Job status colors
  status: {
    idle: baseColors.neutral[400],
    queued: baseColors.warning[500],
    processing: baseColors.primary[500],
    success: baseColors.success[500],
    error: baseColors.error[500],
    warning: baseColors.warning[500]
  },
  
  // Workspace colors
  workspace: {
    canvas: baseColors.neutral[50],
    panel: baseColors.neutral[100],
    sidebar: baseColors.neutral[200],
    border: baseColors.neutral[300],
    divider: baseColors.neutral[200],
    
    // Dark mode variants
    canvasDark: baseColors.neutral[900],
    panelDark: baseColors.neutral[800],
    sidebarDark: baseColors.neutral[700],
    borderDark: baseColors.neutral[600],
    dividerDark: baseColors.neutral[700]
  },
  
  // Text colors
  text: {
    primary: baseColors.neutral[900],
    secondary: baseColors.neutral[600],
    muted: baseColors.neutral[500],
    
    // Dark mode variants
    primaryDark: baseColors.neutral[50],
    secondaryDark: baseColors.neutral[300],
    mutedDark: baseColors.neutral[400]
  }
} as const

// Typography system
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Monaco', 'monospace'],
    heading: ['Inter', 'system-ui', 'sans-serif']
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem'  // 60px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em'
  }
} as const

// Spacing system (8px base grid)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
} as const

// Border radius system
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
} as const

// Shadow system
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  none: '0 0 #0000'
} as const

// Component-specific tokens
export const components = {
  // Button variants
  button: {
    primary: {
      background: baseColors.primary[500],
      backgroundHover: baseColors.primary[600],
      text: baseColors.neutral[50],
      border: baseColors.primary[500]
    },
    secondary: {
      background: baseColors.neutral[100],
      backgroundHover: baseColors.neutral[200],
      text: baseColors.neutral[900],
      border: baseColors.neutral[300]
    },
    ghost: {
      background: 'transparent',
      backgroundHover: baseColors.neutral[100],
      text: baseColors.neutral[700],
      border: 'transparent'
    }
  },
  
  // Panel styles
  panel: {
    workspace: {
      background: semanticColors.workspace.panel,
      border: semanticColors.workspace.border,
      shadow: shadows.sm,
      borderRadius: borderRadius.lg
    },
    sidebar: {
      background: semanticColors.workspace.sidebar,
      border: semanticColors.workspace.border,
      shadow: shadows.base,
      borderRadius: borderRadius.none
    }
  },
  
  // Input styles
  input: {
    background: baseColors.neutral[50],
    backgroundFocus: baseColors.neutral[50],
    border: baseColors.neutral[300],
    borderFocus: baseColors.primary[500],
    text: baseColors.neutral[900],
    placeholder: baseColors.neutral[500]
  }
} as const

// Layout constants
export const layout = {
  // Workspace dimensions
  workspace: {
    topBarHeight: '64px',
    sideNavWidth: '280px',
    jobSidebarWidth: '320px',
    maxContentWidth: '1200px'
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    modal: 50,
    popover: 100,
    tooltip: 200,
    toast: 300
  }
} as const

// Animation constants
export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const

// Main token export with namespaced CSS variables
export const designTokensV2 = {
  colors: {
    ...baseColors,
    ...semanticColors
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  layout,
  animation
} as const

// CSS variable namespace prefix
export const CSS_VAR_PREFIX = '--pry-v2' as const

// Export individual token categories
export type DesignTokensV2 = typeof designTokensV2
export type BaseColors = typeof baseColors
export type SemanticColors = typeof semanticColors
export type Typography = typeof typography
export type Spacing = typeof spacing
export type BorderRadius = typeof borderRadius
export type Shadows = typeof shadows
export type Components = typeof components
export type Layout = typeof layout
export type Animation = typeof animation