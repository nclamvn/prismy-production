/**
 * Prismy vNEXT Tailwind Preset
 * Token-driven configuration for consistent design system
 */

import { designTokens, generateCSSVariables, generateDarkCSSVariables } from './lib/design-tokens'
import type { Config } from 'tailwindcss'

const prismyPreset: Partial<Config> = {
  theme: {
    extend: {
      // Colors from design tokens
      colors: {
        // Semantic color aliases
        canvas: designTokens.color.bg.default,
        surface: designTokens.color.bg.surface,
        elevated: designTokens.color.bg.elevated,
        muted: designTokens.color.bg.muted,
        overlay: designTokens.color.bg.overlay,

        primary: designTokens.color.text.primary,
        secondary: designTokens.color.text.secondary,
        'text-muted': designTokens.color.text.muted,
        'text-inverse': designTokens.color.text.inverse,

        'border-default': designTokens.color.border.default,
        'border-muted': designTokens.color.border.muted,
        'border-focus': designTokens.color.border.focus,

        'accent-brand': designTokens.color['accent-brand'],
        'accent-brand-light': designTokens.color['accent-brand-light'],
        'primary-blue': designTokens.color['primary-blue'],

        // Full color scales from design tokens
        gray: designTokens.color.gray,
        primary: designTokens.color.primary,
        accent: designTokens.color.accent,

        // Status colors for job progress
        status: designTokens.color.status,

        // Workspace semantic colors
        workspace: designTokens.color.workspace,

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

      // Workspace layout dimensions from design tokens
      width: {
        'sidebar': designTokens.layout['sidebar-width'],
        'sidebar-collapsed': designTokens.layout['sidebar-collapsed'],
        'agent-pane': designTokens.layout['agent-pane-width'],
        'job-sidebar': designTokens.layout['job-sidebar-width'],
        'min-canvas': designTokens.layout['min-canvas-width'],
      },

      height: {
        'topbar': designTokens.layout['topbar-height'],
        'upload-dropzone': designTokens.component['upload-dropzone'].height,
        'upload-dropzone-large': designTokens.component['upload-dropzone']['height-large'],
        'job-card': designTokens.component['job-card'].height,
        'progress-bar': designTokens.component['progress-bar'].height,
        'progress-bar-large': designTokens.component['progress-bar']['height-large'],
        'output-chip': designTokens.component['output-chip'].height,
      },

      // Additional utilities
      maxWidth: {
        content: '1440px', // Max content width for NotebookML feel
      },

      // Grid system for workspace layouts
      gridTemplateColumns: {
        'workspace-full': `${designTokens.layout['sidebar-width']} 1fr ${designTokens.layout['agent-pane-width']}`, // 3-column
        'workspace-main': `${designTokens.layout['sidebar-width']} 1fr`, // 2-column
        'workspace-collapsed': `${designTokens.layout['sidebar-collapsed']} 1fr ${designTokens.layout['agent-pane-width']}`, // Collapsed sidebar
        'marketing': 'repeat(12, 1fr)', // 12-column marketing grid
      },

      // Component-specific tokens
      backdropBlur: {
        overlay: 'blur(8px)',
      },
    },
  },

  plugins: [
    // Plugin for CSS custom properties - automated generation
    function ({ addBase }: any) {
      addBase({
        ':root': {
          ...generateCSSVariables(),
        },
        '.dark': {
          ...generateDarkCSSVariables(),
        },
      })
    },

    // Plugin for semantic utilities and workspace layouts
    function ({ addUtilities }: any) {
      addUtilities({
        // Semantic background utilities using CSS variables
        '.bg-canvas': { backgroundColor: 'var(--color-bg-default)' },
        '.bg-surface': { backgroundColor: 'var(--color-bg-surface)' },
        '.bg-elevated': { backgroundColor: 'var(--color-bg-elevated)' },
        '.bg-muted': { backgroundColor: 'var(--color-bg-muted)' },
        '.bg-overlay': { backgroundColor: 'var(--color-bg-overlay)' },

        // Workspace semantic backgrounds
        '.bg-workspace-canvas': { backgroundColor: 'var(--color-workspace-canvas)' },
        '.bg-workspace-panel': { backgroundColor: 'var(--color-workspace-panel)' },
        '.bg-workspace-sidebar': { backgroundColor: 'var(--color-workspace-sidebar)' },
        '.bg-workspace-dropzone': { backgroundColor: 'var(--color-workspace-dropzone)' },
        '.bg-workspace-hover': { backgroundColor: 'var(--color-workspace-hover)' },
        '.bg-workspace-selected': { backgroundColor: 'var(--color-workspace-selected)' },

        // Semantic text utilities
        '.text-primary': { color: 'var(--color-text-primary)' },
        '.text-secondary': { color: 'var(--color-text-secondary)' },
        '.text-muted': { color: 'var(--color-text-muted)' },
        '.text-inverse': { color: 'var(--color-text-inverse)' },

        // Semantic border utilities
        '.border-default': { borderColor: 'var(--color-border-default)' },
        '.border-muted': { borderColor: 'var(--color-border-muted)' },
        '.border-focus': { borderColor: 'var(--color-border-focus)' },
        '.border-workspace': { borderColor: 'var(--color-workspace-border)' },
        '.border-workspace-divider': { borderColor: 'var(--color-workspace-divider)' },

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

        // Workspace layout grids with responsive behavior
        '.workspace-grid-full': {
          display: 'grid',
          gridTemplateColumns: `${designTokens.layout['sidebar-width']} 1fr ${designTokens.layout['agent-pane-width']}`,
          height: '100vh',
        },

        '.workspace-grid-main': {
          display: 'grid',
          gridTemplateColumns: `${designTokens.layout['sidebar-width']} 1fr`,
          height: '100vh',
        },

        '.workspace-grid-collapsed': {
          display: 'grid',
          gridTemplateColumns: `${designTokens.layout['sidebar-collapsed']} 1fr ${designTokens.layout['agent-pane-width']}`,
          height: '100vh',
        },

        '.workspace-grid-mobile': {
          display: 'grid',
          gridTemplateColumns: '1fr',
          height: '100vh',
        },

        // Component utilities
        '.upload-dropzone': {
          height: designTokens.component['upload-dropzone'].height,
          borderRadius: designTokens.radius['2xl'],
          border: `2px dashed var(--color-workspace-border)`,
          backgroundColor: 'var(--color-workspace-dropzone)',
          '&.active': {
            backgroundColor: 'var(--color-workspace-dropzone-active)',
            borderColor: 'var(--color-border-focus)',
          },
        },

        '.job-card': {
          height: designTokens.component['job-card'].height,
          padding: designTokens.component['job-card'].padding,
          borderRadius: designTokens.radius.lg,
          backgroundColor: 'var(--color-workspace-panel)',
        },

        '.output-chip': {
          height: designTokens.component['output-chip'].height,
          padding: designTokens.component['output-chip'].padding,
          borderRadius: designTokens.radius.full,
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
