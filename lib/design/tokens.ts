/**
 * Prismy Design System Tokens
 * Monochrome, full-width, bilingual (EN-VI) design system
 *
 * Usage:
 * import { tokens } from '@/lib/design/tokens'
 * className={`bg-${tokens.colors.gray[100]} p-${tokens.spacing[4]}`}
 */

export const tokens = {
  // Monochrome color palette
  colors: {
    // Grayscale foundation
    gray: {
      0: '#ffffff', // Pure white
      50: '#f9fafb', // Ultra light gray
      100: '#f3f4f6', // Very light gray
      200: '#e5e7eb', // Light gray
      300: '#d1d5db', // Medium light gray
      400: '#9ca3af', // Medium gray
      500: '#6b7280', // Medium dark gray
      600: '#4b5563', // Dark gray
      700: '#374151', // Very dark gray
      800: '#1f2937', // Ultra dark gray
      900: '#111827', // Near black
    },

    // Brand accent colors (minimal)
    primary: {
      50: '#eff6ff', // Very light blue
      100: '#dbeafe', // Light blue
      500: '#3b82f6', // Primary blue
      600: '#2563eb', // Medium blue
      700: '#1d4ed8', // Dark blue
      800: '#1e40af', // Very dark blue
      900: '#1e3a8a', // Ultra dark blue
    },

    // Status colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      900: '#14532d',
    },

    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      900: '#78350f',
    },

    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      900: '#7f1d1d',
    },

    // Semantic colors
    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
    },
  },

  // Consistent spacing scale
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.125rem', // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Typography scale
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }], // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    none: 'none',
  },

  // Z-index layers
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    modal: '1000',
    dropdown: '1010',
    tooltip: '1020',
    notification: '1030',
  },

  // Animation timing
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // Layout constraints
  layout: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      full: '100%',
    },
    containerPadding: {
      mobile: '1rem', // 16px
      tablet: '2rem', // 32px
      desktop: '3rem', // 48px
    },
  },

  // Breakpoints (matches Tailwind defaults)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// Type exports for TypeScript integration
export type Tokens = typeof tokens
export type ColorScale = keyof typeof tokens.colors.gray
export type SpacingScale = keyof typeof tokens.spacing
export type FontSizeScale = keyof typeof tokens.fontSize

// Utility functions for dynamic token usage
export const getColor = (scale: string, level: number | string) => {
  return (tokens.colors as any)[scale]?.[level] || tokens.colors.gray[500]
}

export const getSpacing = (scale: keyof typeof tokens.spacing) => {
  return tokens.spacing[scale] || tokens.spacing[4]
}

// Bilingual text utilities
export const text = {
  en: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
  },
  vi: {
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi',
    retry: 'Thử lại',
    cancel: 'Hủy',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    close: 'Đóng',
  },
} as const

export type SupportedLanguage = keyof typeof text
export type TextKey = keyof typeof text.en

// Text function for bilingual support
export const getText = (key: TextKey, lang: SupportedLanguage = 'en') => {
  return text[lang][key] || text.en[key]
}
