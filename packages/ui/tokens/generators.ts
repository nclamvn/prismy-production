/**
 * UI/UX Polish Sprint - Phase 1.1: Token Export Generators
 * 
 * Auto-generates CSS variables, Tailwind config, and Storybook theme
 * from design tokens with proper namespacing
 */

import { designTokensV2, CSS_VAR_PREFIX, type DesignTokensV2 } from './index'

// Utility function to flatten nested objects
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey))
    } else {
      flattened[newKey] = String(value)
    }
  }
  
  return flattened
}

// Generate CSS custom properties with namespace
export function generateCSSVariables(): string {
  const flattened = flattenObject(designTokensV2)
  
  let css = `/* Auto-generated CSS Variables - UI/UX Polish Sprint Phase 1.1 */\n`
  css += `/* Generated at: ${new Date().toISOString()} */\n\n`
  
  // Light theme variables
  css += `:root {\n`
  for (const [key, value] of Object.entries(flattened)) {
    css += `  ${CSS_VAR_PREFIX}-${key}: ${value};\n`
  }
  css += `}\n\n`
  
  // Dark theme variables (for workspace colors)
  css += `[data-theme="dark"] {\n`
  css += `  ${CSS_VAR_PREFIX}-workspace-canvas: var(${CSS_VAR_PREFIX}-workspace-canvas-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-workspace-panel: var(${CSS_VAR_PREFIX}-workspace-panel-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-workspace-sidebar: var(${CSS_VAR_PREFIX}-workspace-sidebar-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-workspace-border: var(${CSS_VAR_PREFIX}-workspace-border-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-workspace-divider: var(${CSS_VAR_PREFIX}-workspace-divider-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-text-primary: var(${CSS_VAR_PREFIX}-text-primary-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-text-secondary: var(${CSS_VAR_PREFIX}-text-secondary-dark);\n`
  css += `  ${CSS_VAR_PREFIX}-text-muted: var(${CSS_VAR_PREFIX}-text-muted-dark);\n`
  css += `}\n\n`
  
  // Reduced motion support
  css += `@media (prefers-reduced-motion: reduce) {\n`
  css += `  ${CSS_VAR_PREFIX}-animation-duration-fast: 0ms;\n`
  css += `  ${CSS_VAR_PREFIX}-animation-duration-normal: 0ms;\n`
  css += `  ${CSS_VAR_PREFIX}-animation-duration-slow: 0ms;\n`
  css += `}\n`
  
  return css
}

// Generate Tailwind CSS config extension
export function generateTailwindConfig(): object {
  const { colors, typography, spacing, borderRadius, shadows, layout, animation } = designTokensV2
  
  return {
    theme: {
      extend: {
        colors: {
          primary: colors.primary,
          neutral: colors.neutral,
          success: colors.success,
          warning: colors.warning,
          error: colors.error,
          'status-idle': colors.status.idle,
          'status-queued': colors.status.queued,
          'status-processing': colors.status.processing,
          'status-success': colors.status.success,
          'status-error': colors.status.error,
          'status-warning': colors.status.warning,
          'workspace-canvas': colors.workspace.canvas,
          'workspace-panel': colors.workspace.panel,
          'workspace-sidebar': colors.workspace.sidebar,
          'workspace-border': colors.workspace.border,
          'workspace-divider': colors.workspace.divider,
          'text-primary': colors.text.primary,
          'text-secondary': colors.text.secondary,
          'text-muted': colors.text.muted
        },
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSize,
        fontWeight: typography.fontWeight,
        lineHeight: typography.lineHeight,
        letterSpacing: typography.letterSpacing,
        spacing: spacing,
        borderRadius: borderRadius,
        boxShadow: shadows,
        screens: layout.breakpoints,
        zIndex: layout.zIndex,
        transitionDuration: animation.duration,
        transitionTimingFunction: animation.easing,
        width: {
          'top-bar': layout.workspace.topBarHeight,
          'side-nav': layout.workspace.sideNavWidth,
          'job-sidebar': layout.workspace.jobSidebarWidth
        },
        height: {
          'top-bar': layout.workspace.topBarHeight
        },
        maxWidth: {
          'content': layout.workspace.maxContentWidth
        }
      }
    }
  }
}

// Generate Storybook theme configuration
export function generateStorybookTheme(): object {
  const { colors, typography } = designTokensV2
  
  return {
    base: 'light',
    brandTitle: 'Prismy UI v2',
    brandUrl: 'https://prismy.in',
    
    colorPrimary: colors.primary[500],
    colorSecondary: colors.primary[600],
    
    // UI colors
    appBg: colors.workspace.canvas,
    appContentBg: colors.workspace.panel,
    appBorderColor: colors.workspace.border,
    appBorderRadius: 8,
    
    // Typography
    fontBase: typography.fontFamily.sans.join(', '),
    fontCode: typography.fontFamily.mono.join(', '),
    
    // Text colors
    textColor: colors.text.primary,
    textInverseColor: colors.text.primaryDark,
    textMutedColor: colors.text.secondary,
    
    // Toolbar colors
    barTextColor: colors.text.secondary,
    barSelectedColor: colors.primary[500],
    barBg: colors.workspace.panel,
    
    // Form colors
    inputBg: colors.workspace.canvas,
    inputBorder: colors.workspace.border,
    inputTextColor: colors.text.primary,
    inputBorderRadius: 6
  }
}

// Generate component CSS classes using CSS variables
export function generateComponentClasses(): string {
  let css = `/* Auto-generated Component Classes - UI/UX Polish Sprint Phase 1.1 */\n\n`
  
  // Button variants
  css += `.btn-primary {\n`
  css += `  background-color: var(${CSS_VAR_PREFIX}-components-button-primary-background);\n`
  css += `  color: var(${CSS_VAR_PREFIX}-components-button-primary-text);\n`
  css += `  border: 1px solid var(${CSS_VAR_PREFIX}-components-button-primary-border);\n`
  css += `  border-radius: var(${CSS_VAR_PREFIX}-border-radius-md);\n`
  css += `  padding: var(${CSS_VAR_PREFIX}-spacing-2) var(${CSS_VAR_PREFIX}-spacing-4);\n`
  css += `  transition: all var(${CSS_VAR_PREFIX}-animation-duration-fast) var(${CSS_VAR_PREFIX}-animation-easing-ease-out);\n`
  css += `}\n\n`
  
  css += `.btn-primary:hover {\n`
  css += `  background-color: var(${CSS_VAR_PREFIX}-components-button-primary-background-hover);\n`
  css += `}\n\n`
  
  // Panel styles
  css += `.workspace-panel {\n`
  css += `  background-color: var(${CSS_VAR_PREFIX}-components-panel-workspace-background);\n`
  css += `  border: 1px solid var(${CSS_VAR_PREFIX}-components-panel-workspace-border);\n`
  css += `  border-radius: var(${CSS_VAR_PREFIX}-components-panel-workspace-border-radius);\n`
  css += `  box-shadow: var(${CSS_VAR_PREFIX}-components-panel-workspace-shadow);\n`
  css += `}\n\n`
  
  css += `.workspace-sidebar {\n`
  css += `  background-color: var(${CSS_VAR_PREFIX}-components-panel-sidebar-background);\n`
  css += `  border-right: 1px solid var(${CSS_VAR_PREFIX}-components-panel-sidebar-border);\n`
  css += `  box-shadow: var(${CSS_VAR_PREFIX}-components-panel-sidebar-shadow);\n`
  css += `}\n\n`
  
  // Job card styles
  css += `.job-card {\n`
  css += `  background-color: var(${CSS_VAR_PREFIX}-workspace-canvas);\n`
  css += `  border: 1px solid var(${CSS_VAR_PREFIX}-workspace-border);\n`
  css += `  border-radius: var(${CSS_VAR_PREFIX}-border-radius-lg);\n`
  css += `  padding: var(${CSS_VAR_PREFIX}-spacing-4);\n`
  css += `  transition: all var(${CSS_VAR_PREFIX}-animation-duration-fast) var(${CSS_VAR_PREFIX}-animation-easing-ease-out);\n`
  css += `}\n\n`
  
  css += `.job-card:hover {\n`
  css += `  border-color: var(${CSS_VAR_PREFIX}-primary-300);\n`
  css += `  box-shadow: var(${CSS_VAR_PREFIX}-shadows-md);\n`
  css += `}\n\n`
  
  return css
}

// Generate JavaScript object for runtime access
export function generateTokensJS(): string {
  return `// Auto-generated Token Export - UI/UX Polish Sprint Phase 1.1
// Generated at: ${new Date().toISOString()}

export const tokens = ${JSON.stringify(designTokensV2, null, 2)};

export const cssVarPrefix = '${CSS_VAR_PREFIX}';

// Helper function to get CSS variable name
export function getCSSVar(path: string): string {
  return \`var(\${cssVarPrefix}-\${path.replace(/\\./g, '-')})\`;
}

// Helper function to get token value
export function getTokenValue(path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], tokens);
}
`
}

// Export all generators
export const generators = {
  css: generateCSSVariables,
  tailwind: generateTailwindConfig,
  storybook: generateStorybookTheme,
  components: generateComponentClasses,
  js: generateTokensJS
} as const

export type GeneratorType = keyof typeof generators