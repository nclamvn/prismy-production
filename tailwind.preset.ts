/**
 * Prismy vNEXT Tailwind Preset
 * Token-driven configuration for consistent design system
 */

import { designTokens } from './lib/design-tokens'
import type { Config } from 'tailwindcss'

const prismyPreset: Partial<Config> = {
  theme: {
    extend: {
      // Colors from design tokens
      colors: {
        // Semantic color aliases
        'bg-default': designTokens.color.bg.default,
        'bg-surface': designTokens.color.bg.surface,
        'bg-elevated': designTokens.color.bg.elevated,
        'bg-muted': designTokens.color.bg.muted,
        'bg-overlay': designTokens.color.bg.overlay,

        'text-primary': designTokens.color.text.primary,
        'text-secondary': designTokens.color.text.secondary,
        'text-muted': designTokens.color.text.muted,
        'text-inverse': designTokens.color.text.inverse,

        'border-default': designTokens.color.border.default,
        'border-muted': designTokens.color.border.muted,
        'border-focus': designTokens.color.border.focus,

        'accent-brand': designTokens.color['accent-brand'],
        'accent-brand-light': designTokens.color['accent-brand-light'],

        // DOCTRINE: Only 8 grays + 2 accents
        gray: designTokens.color.gray,
        accent: designTokens.color.accent,

        // Status colors (doctrine: green-500 on green-50, yellow-600 on transparent)
        green: {
          50: '#F0FDF4',
          500: '#22C55E',
        },
        yellow: {
          600: '#D97706',
        },

        // Standard colors
        white: designTokens.color.white,
        black: designTokens.color.black,
        transparent: designTokens.color.transparent,
      },

      // Spacing from design tokens
      spacing: designTokens.spacing,

      // Border radius from design tokens
      borderRadius: designTokens.radius,

      // Typography from design tokens
      fontSize: designTokens.fontSize,
      fontFamily: designTokens.fontFamily,
      fontWeight: designTokens.fontWeight,

      // Box shadows from design tokens
      boxShadow: {
        'elevation-sm': designTokens.elevation.sm,
        'elevation-md': designTokens.elevation.md,
        'elevation-lg': designTokens.elevation.lg,
        'elevation-xl': designTokens.elevation.xl,
        none: designTokens.elevation.none,
      },

      // Animation from design tokens
      transitionDuration: designTokens.animation.duration,
      transitionTimingFunction: designTokens.animation.easing,

      // Screens from design tokens
      screens: designTokens.screens,

      // Z-index from design tokens
      zIndex: designTokens.zIndex,

      // Additional utilities
      maxWidth: {
        content: '1440px', // Max content width for NotebookML feel
      },

      // Grid system
      gridTemplateColumns: {
        sidebar: '280px 1fr', // Workspace layout
        workspace: '1fr 320px', // Main + chat panel
        marketing: 'repeat(12, 1fr)', // 12-column marketing grid
      },

      // Component-specific tokens
      backdropBlur: {
        overlay: 'blur(8px)',
      },
    },
  },

  plugins: [
    // Plugin for CSS custom properties
    function ({ addBase }: any) {
      addBase({
        ':root': {
          // CSS variables for runtime theming
          '--color-bg-default': designTokens.color.bg.default,
          '--color-bg-surface': designTokens.color.bg.surface,
          '--color-bg-elevated': designTokens.color.bg.elevated,
          '--color-bg-muted': designTokens.color.bg.muted,
          '--color-bg-overlay': designTokens.color.bg.overlay,

          '--color-text-primary': designTokens.color.text.primary,
          '--color-text-secondary': designTokens.color.text.secondary,
          '--color-text-muted': designTokens.color.text.muted,
          '--color-text-inverse': designTokens.color.text.inverse,

          '--color-border-default': designTokens.color.border.default,
          '--color-border-muted': designTokens.color.border.muted,
          '--color-border-focus': designTokens.color.border.focus,

          '--color-accent-brand': designTokens.color.accent.brand,
          '--color-accent-brand-hover':
            designTokens.color.accent['brand-hover'],
          '--color-accent-brand-light':
            designTokens.color.accent['brand-light'],

          // Spacing variables for dynamic usage
          '--spacing-xs': designTokens.spacing[1],
          '--spacing-sm': designTokens.spacing[2],
          '--spacing-md': designTokens.spacing[4],
          '--spacing-lg': designTokens.spacing[6],
          '--spacing-xl': designTokens.spacing[8],

          // Border radius variables
          '--radius-sm': designTokens.radius.sm,
          '--radius-md': designTokens.radius.md,
          '--radius-lg': designTokens.radius.lg,
          '--radius-full': designTokens.radius.full,
        },
      })
    },

    // Plugin for semantic color utilities
    function ({ addUtilities }: any) {
      addUtilities({
        // Semantic background utilities
        '.bg-default': { backgroundColor: 'var(--color-bg-default)' },
        '.bg-surface': { backgroundColor: 'var(--color-bg-surface)' },
        '.bg-elevated': { backgroundColor: 'var(--color-bg-elevated)' },
        '.bg-muted': { backgroundColor: 'var(--color-bg-muted)' },
        '.bg-overlay': { backgroundColor: 'var(--color-bg-overlay)' },

        // Semantic text utilities
        '.text-primary': { color: 'var(--color-text-primary)' },
        '.text-secondary': { color: 'var(--color-text-secondary)' },
        '.text-muted': { color: 'var(--color-text-muted)' },
        '.text-inverse': { color: 'var(--color-text-inverse)' },

        // Semantic border utilities
        '.border-default': { borderColor: 'var(--color-border-default)' },
        '.border-muted': { borderColor: 'var(--color-border-muted)' },
        '.border-focus': { borderColor: 'var(--color-border-focus)' },

        // Elevation utilities
        '.elevation-sm': { boxShadow: designTokens.elevation.sm },
        '.elevation-md': { boxShadow: designTokens.elevation.md },
        '.elevation-lg': { boxShadow: designTokens.elevation.lg },
        '.elevation-xl': { boxShadow: designTokens.elevation.xl },

        // Layout utilities
        '.container-content': {
          maxWidth: '1440px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: designTokens.spacing[4],
          paddingRight: designTokens.spacing[4],
        },

        // NotebookML-style utilities
        '.workspace-grid': {
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px', // Sidebar + Main + Chat
          height: '100vh',
        },

        '.marketing-grid': {
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: designTokens.spacing[6],
        },
      })
    },
  ],
}

export default prismyPreset
