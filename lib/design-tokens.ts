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

    // Brand accents (2 colors only)
    indigo: {
      500: '#4F46E5', // brand-primary
      600: '#4338CA', // brand-hover
      50: '#EEF2FF', // brand-light
    },

    // Semantic colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Semantic aliases for better DX
    bg: {
      default: '#FAFAFA', // gray.50
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
      focus: '#4F46E5', // indigo.500
    },

    accent: {
      brand: '#4F46E5', // indigo.500
      'brand-hover': '#4338CA', // indigo.600
      'brand-light': '#EEF2FF', // indigo.50
    },
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

  // Border Radius - Subtle, modern
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Typography Scale - Inter + JetBrains Mono
  fontSize: {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '40px' }],
    '5xl': ['48px', { lineHeight: '1' }],
    '6xl': ['60px', { lineHeight: '1' }],
  },

  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
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

  // Z-index scale
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
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
} as const

// Type exports for TypeScript
export type DesignTokens = typeof designTokens
export type ColorTokens = typeof designTokens.color
export type SpacingTokens = typeof designTokens.spacing
export type RadiusTokens = typeof designTokens.radius

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
  }
}
