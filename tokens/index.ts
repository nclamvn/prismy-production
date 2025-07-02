// Use require for JSON imports to avoid TypeScript compilation issues
const colorsTokens = require('./color.json')
const spacingTokens = require('./spacing.json')
const typographyTokens = require('./typography.json')
const radiusTokens = require('./radius.json')
const vietnameseTokens = require('./vietnamese.json')

export const colors = colorsTokens.color
export const spacing = spacingTokens.spacing
export const space = spacingTokens.space
export const typography = typographyTokens
export const radius = radiusTokens.borderRadius
export const vietnamese = vietnameseTokens

// Flatten color tokens for easy Tailwind integration
export const flattenedColors = {
  // Gray scale (monochromatic focus)
  gray: colors.gray,

  // Single accent color
  accent: colors.accent,

  // Base colors
  white: colors.white,
  black: colors.black,

  // Semantic colors
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
  info: colors.semantic.info,

  // Background tokens
  'bg-primary': colors.background.primary,
  'bg-secondary': colors.background.secondary,
  'bg-tertiary': colors.background.tertiary,
  'bg-panel': colors.background.panel,
  'bg-surface': colors.background.surface,
  'bg-overlay': colors.background.overlay,

  // Foreground tokens
  'text-primary': colors.foreground.primary,
  'text-secondary': colors.foreground.secondary,
  'text-tertiary': colors.foreground.tertiary,
  'text-inverse': colors.foreground.inverse,
  'text-muted': colors.foreground.muted,
  'text-disabled': colors.foreground.disabled,

  // Border tokens
  'border-default': colors.border.default,
  'border-strong': colors.border.strong,
  'border-accent': colors.border.accent,
  'border-focus': colors.border.focus,
  'border-error': colors.border.error,
  'border-success': colors.border.success,

  // Workspace colors
  'workspace-sidebar': colors.workspace.sidebar,
  'workspace-panel': colors.workspace.panel,
  'workspace-canvas': colors.workspace.canvas,
  'workspace-toolbar': colors.workspace.toolbar,

  // NotebookML theme
  'notebookml-bg': colors.notebookml.background,
  'notebookml-surface': colors.notebookml.surface,
  'notebookml-accent': colors.notebookml.accent,
  'notebookml-text': colors.notebookml.text,
  'notebookml-text-secondary': colors.notebookml.textSecondary,
  'notebookml-border': colors.notebookml.border,
}

// Flattened spacing for Tailwind integration
export const flattenedSpacing = {
  ...space,
  // Semantic spacing
  xs: spacing.semantic.xs,
  sm: spacing.semantic.sm,
  md: spacing.semantic.md,
  lg: spacing.semantic.lg,
  xl: spacing.semantic.xl,
  '2xl': spacing.semantic['2xl'],
  '3xl': spacing.semantic['3xl'],
  '4xl': spacing.semantic['4xl'],
  '5xl': spacing.semantic['5xl'],
  '6xl': spacing.semantic['6xl'],
}

// Typography scale for Tailwind integration
export const flattenedTypography = {
  fontFamily: {
    sans: typography.fontFamily.sans,
    serif: typography.fontFamily.serif,
    mono: typography.fontFamily.mono,
    vietnamese: typography.fontFamily.vietnamese,
  },
  fontSize: {
    xs: [typography.fontSize.xs, { lineHeight: typography.lineHeight['4'] }],
    sm: [typography.fontSize.sm, { lineHeight: typography.lineHeight['5'] }],
    base: [
      typography.fontSize.base,
      { lineHeight: typography.lineHeight['6'] },
    ],
    lg: [typography.fontSize.lg, { lineHeight: typography.lineHeight['7'] }],
    xl: [typography.fontSize.xl, { lineHeight: typography.lineHeight['7'] }],
    '2xl': [
      typography.fontSize['2xl'],
      { lineHeight: typography.lineHeight['8'] },
    ],
    '3xl': [
      typography.fontSize['3xl'],
      { lineHeight: typography.lineHeight['9'] },
    ],
    '4xl': [
      typography.fontSize['4xl'],
      { lineHeight: typography.lineHeight['10'] },
    ],
    '5xl': [
      typography.fontSize['5xl'],
      { lineHeight: typography.lineHeight.none },
    ],
    '6xl': [
      typography.fontSize['6xl'],
      { lineHeight: typography.lineHeight.none },
    ],
    '7xl': [
      typography.fontSize['7xl'],
      { lineHeight: typography.lineHeight.none },
    ],
    '8xl': [
      typography.fontSize['8xl'],
      { lineHeight: typography.lineHeight.none },
    ],
    '9xl': [
      typography.fontSize['9xl'],
      { lineHeight: typography.lineHeight.none },
    ],
  },
  fontWeight: typography.fontWeight,
  lineHeight: typography.lineHeight,
  letterSpacing: typography.letterSpacing,
}

// Vietnamese-specific utilities
export const vietnameseUtils = {
  formatVND: (amount: number): string => {
    return amount.toLocaleString('vi-VN') + ' ₫'
  },

  formatVNDWithPattern: (amount: number): string => {
    const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted} ₫`
  },

  getFontFamilyForVietnamese: (): string[] => {
    return vietnamese.typography.diacritics.fontFamily
  },

  getBilingualText: (en: string, vi: string): string => {
    return `${en}${vietnamese.patterns.bilingual.separator}${vi}`
  },
}

// Component semantic tokens
export const componentTokens = {
  button: {
    padding: {
      sm: spacing.component.buttonPadding.sm,
      md: spacing.component.buttonPadding.md,
      lg: spacing.component.buttonPadding.lg,
      xl: spacing.component.buttonPadding.xl,
    },
    typography: typography.semantic.button,
  },

  card: {
    padding: {
      sm: spacing.component.cardPadding.sm,
      md: spacing.component.cardPadding.md,
      lg: spacing.component.cardPadding.lg,
      xl: spacing.component.cardPadding.xl,
    },
  },

  container: {
    padding: {
      mobile: spacing.component.containerPadding.mobile,
      tablet: spacing.component.containerPadding.tablet,
      desktop: spacing.component.containerPadding.desktop,
    },
  },

  layout: {
    sectionGap: spacing.layout.sectionGap,
    contentGap: spacing.layout.contentGap,
  },

  heading: typography.semantic.heading,
  body: typography.semantic.body,

  pricing: {
    color: vietnamese.semantic.pricing.color,
    fontWeight: vietnamese.semantic.pricing.fontWeight,
    fontSize: vietnamese.semantic.pricing.fontSize,
  },
}

// Export everything as default object
export default {
  colors,
  spacing,
  space,
  typography,
  radius,
  vietnamese,
  flattenedColors,
  flattenedSpacing,
  flattenedTypography,
  vietnameseUtils,
  componentTokens,
}
