/**
 * Prismy vNEXT Design Tokens
 * NotebookML-inspired minimalist design system
 *
 * Philosophy: Clean, spacious, monochromatic with subtle indigo accents
 */

export const designTokens = {
  // Color System - Minimal but complete
  color: {
    // Neutral grays (8 shades)
    gray: {
      50: '#FAFAFA', // bg-default
      100: '#F5F5F5', // bg-muted
      200: '#E5E5E5', // border-default
      300: '#D4D4D4', // border-muted
      400: '#A3A3A3', // text-muted
      500: '#737373', // text-secondary
      600: '#525252', // text-primary-light
      900: '#171717', // text-primary
    },

    // Brand accents (expanded for workspace)
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE', 
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB', // Prismy blue from blueprint
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    
    accent: {
      600: '#4E82FF', // brand-primary (doctrine spec)
      50: '#E8F0FF', // brand-light (doctrine spec)
    },

    // Semantic colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Semantic aliases for better DX
    bg: {
      default: '#F9FAFB', // canvas color - minimalist background
      surface: '#FFFFFF', // white
      elevated: '#FFFFFF', // white
      muted: '#F5F5F5', // gray.100
      overlay: 'rgba(0, 0, 0, 0.8)',
    },

    text: {
      primary: '#171717', // gray.900
      secondary: '#525252', // gray.600
      muted: '#A3A3A3', // gray.400
      inverse: '#FFFFFF', // white
    },

    border: {
      default: '#E5E5E5', // gray.200
      muted: '#F5F5F5', // gray.100
      focus: '#4E82FF', // accent.600
    },

    // Status colors for job progress
    status: {
      idle: '#6B7280',     // gray-500
      queued: '#F59E0B',   // amber-500  
      processing: '#3B82F6', // blue-500
      success: '#10B981',  // emerald-500
      error: '#EF4444',    // red-500
      warning: '#F59E0B',  // amber-500
    },
    
    // Workspace semantic colors
    workspace: {
      canvas: '#F9FAFB',
      panel: '#FFFFFF',
      sidebar: '#F8FAFC',
      border: '#E2E8F0',
      divider: '#E5E7EB',
      hover: '#F1F5F9',
      selected: '#EFF6FF',
      dropzone: '#FAFBFF',
      'dropzone-active': '#EFF6FF',
    },
    
    // Updated semantic aliases to use doctrine colors
    'accent-brand': '#4E82FF', // accent.600
    'accent-brand-light': '#E8F0FF', // accent.50
    'primary-blue': '#2563EB', // primary.600 from blueprint
  },

  // Workspace Layout Dimensions
  layout: {
    'sidebar-width': '280px',
    'sidebar-collapsed': '60px', 
    'agent-pane-width': '400px',
    'topbar-height': '64px',
    'job-sidebar-width': '320px',
    'min-canvas-width': '600px',
  },
  
  // Spacing Scale - 8px base rhythm
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
  },

  // Border Radius - Enhanced for workspace
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px', // cards from blueprint
    xl: '16px',
    '2xl': '24px', // file preview from blueprint
    full: '9999px',
  },

  // Typography Scale - DOCTRINE SPEC: Inter var, 300-700, letter-spacing -0.01em
  fontSize: {
    xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
    sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
    base: ['16px', { lineHeight: '24px', letterSpacing: '-0.01em' }], // body 16/24
    lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    '2xl': ['22px', { lineHeight: '28px', letterSpacing: '-0.01em' }], // h3 22/28
    '3xl': ['28px', { lineHeight: '32px', letterSpacing: '-0.01em' }], // h2 28/32
    '4xl': ['40px', { lineHeight: '44px', letterSpacing: '-0.01em' }], // h1 40/44
    '5xl': ['48px', { lineHeight: '1', letterSpacing: '-0.01em' }],
    '6xl': ['60px', { lineHeight: '1', letterSpacing: '-0.01em' }],
  },

  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
  },

  fontWeight: {
    light: '300', // doctrine: 300-700 range
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700', // doctrine: max 700
  },

  // Elevation - Subtle shadows for depth
  elevation: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation - Spring physics for NotebookML feel
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy spring
    },
  },

  // Breakpoints - Mobile-first responsive
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px', // Max content width
  },

  // Z-index scale - Enhanced for workspace
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    'job-sidebar': '20',
    'agent-pane': '25',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
  },
  
  // Workspace-specific component sizes
  component: {
    'upload-dropzone': {
      height: '200px',
      'height-large': '300px',
    },
    'job-card': {
      height: '120px',
      padding: '16px',
    },
    'output-chip': {
      height: '32px',
      padding: '8px 12px',
    },
    'progress-bar': {
      height: '8px',
      'height-large': '12px',
    },
  },
} as const

// Type exports for TypeScript
export type DesignTokens = typeof designTokens
export type DarkTokens = typeof darkTokens
export type ColorTokens = typeof designTokens.color
export type SpacingTokens = typeof designTokens.spacing
export type RadiusTokens = typeof designTokens.radius
export type LayoutTokens = typeof designTokens.layout
export type ComponentTokens = typeof designTokens.component

// Utility function to get token values
export function getToken<T extends keyof DesignTokens>(
  category: T,
  path: string
): any {
  const keys = path.split('.')
  let value: any = designTokens[category]

  for (const key of keys) {
    value = value?.[key]
  }

  return value
}

// Dark mode variants
export const darkTokens = {
  color: {
    bg: {
      default: '#0F172A', // slate-900
      surface: '#1E293B', // slate-800
      elevated: '#334155', // slate-700
      muted: '#475569', // slate-600
      overlay: 'rgba(0, 0, 0, 0.9)',
    },
    text: {
      primary: '#F8FAFC', // slate-50
      secondary: '#CBD5E1', // slate-300
      muted: '#94A3B8', // slate-400
      inverse: '#0F172A', // slate-900
    },
    border: {
      default: '#334155', // slate-700
      muted: '#475569', // slate-600
      focus: '#3B82F6', // blue-500
    },
    workspace: {
      canvas: '#0F172A',
      panel: '#1E293B',
      sidebar: '#1E293B',
      border: '#334155',
      divider: '#475569',
      hover: '#334155',
      selected: '#1E3A8A',
      dropzone: '#1E293B',
      'dropzone-active': '#1E3A8A',
    },
  },
} as const

// CSS Custom Properties for runtime theming
export function generateCSSVariables(): Record<string, string> {
  const flatten = (obj: any, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {}

    Object.entries(obj).forEach(([key, value]) => {
      const cssKey = prefix ? `${prefix}-${key}` : key

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(result, flatten(value, cssKey))
      } else {
        result[`--${cssKey}`] = String(value)
      }
    })

    return result
  }

  return {
    ...flatten(designTokens.color, 'color'),
    ...flatten(designTokens.spacing, 'spacing'),
    ...flatten(designTokens.radius, 'radius'),
    ...flatten(designTokens.elevation, 'elevation'),
    ...flatten(designTokens.layout, 'layout'),
    ...flatten(designTokens.component, 'component'),
  }
}

// Dark mode CSS variables
export function generateDarkCSSVariables(): Record<string, string> {
  const flatten = (obj: any, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {}

    Object.entries(obj).forEach(([key, value]) => {
      const cssKey = prefix ? `${prefix}-${key}` : key

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(result, flatten(value, cssKey))
      } else {
        result[`--${cssKey}`] = String(value)
      }
    })

    return result
  }

  return {
    ...flatten(darkTokens.color, 'color'),
  }
}
