/**
 * UI/UX Polish Sprint - Phase 1.2: Theme System & Flash Prevention
 * 
 * Advanced theme management with flash prevention and smooth transitions
 * Supports system preference detection and persistent user choice
 */

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'pry-theme-preference'
export const THEME_ATTRIBUTE = 'data-theme'
export const UI_VERSION_ATTRIBUTE = 'data-ui-version'

// Theme detection and application utilities
export class ThemeSystem {
  private static instance: ThemeSystem
  private currentTheme: Theme = 'system'
  private resolvedTheme: ResolvedTheme = 'light'
  private mediaQuery: MediaQueryList | null = null
  private listeners: Set<(theme: ResolvedTheme) => void> = new Set()

  private constructor() {
    this.initializeTheme()
  }

  static getInstance(): ThemeSystem {
    if (!ThemeSystem.instance) {
      ThemeSystem.instance = new ThemeSystem()
    }
    return ThemeSystem.instance
  }

  private initializeTheme(): void {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Set up media query listener for system preference changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this))

    // Get stored preference or default to system
    const stored = this.getStoredTheme()
    this.currentTheme = stored || 'system'

    // Apply initial theme
    this.updateResolvedTheme()
    this.applyTheme(this.resolvedTheme)
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent): void => {
    if (this.currentTheme === 'system') {
      this.resolvedTheme = e.matches ? 'dark' : 'light'
      this.applyTheme(this.resolvedTheme)
      this.notifyListeners()
    }
  }

  private getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      return stored as Theme || null
    } catch {
      return null
    }
  }

  private setStoredTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors
    }
  }

  private updateResolvedTheme(): void {
    if (this.currentTheme === 'system') {
      this.resolvedTheme = this.getSystemTheme()
    } else {
      this.resolvedTheme = this.currentTheme
    }
  }

  private getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  private applyTheme(theme: ResolvedTheme): void {
    const html = document.documentElement
    
    // Remove previous theme
    html.removeAttribute(THEME_ATTRIBUTE)
    
    // Add new theme with smooth transition
    html.setAttribute(THEME_ATTRIBUTE, theme)
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme)
  }

  private updateMetaThemeColor(theme: ResolvedTheme): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const color = theme === 'dark' ? '#171717' : '#fafafa'
      metaThemeColor.setAttribute('content', color)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.resolvedTheme))
  }

  // Public API
  setTheme(theme: Theme): void {
    this.currentTheme = theme
    this.setStoredTheme(theme)
    this.updateResolvedTheme()
    this.applyTheme(this.resolvedTheme)
    this.notifyListeners()
  }

  getTheme(): Theme {
    return this.currentTheme
  }

  getResolvedTheme(): ResolvedTheme {
    return this.resolvedTheme
  }

  subscribe(listener: (theme: ResolvedTheme) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Enable UI v2 tokens conditionally
  enableUIv2(enabled: boolean = true): void {
    const html = document.documentElement
    if (enabled) {
      html.setAttribute(UI_VERSION_ATTRIBUTE, 'v2')
    } else {
      html.removeAttribute(UI_VERSION_ATTRIBUTE)
    }
  }

  isUIv2Enabled(): boolean {
    if (typeof window === 'undefined') return false
    return document.documentElement.getAttribute(UI_VERSION_ATTRIBUTE) === 'v2'
  }

  // Cleanup
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange)
    }
    this.listeners.clear()
  }
}

// React hook for theme management
export function useTheme() {
  const [theme, setThemeState] = React.useState<ResolvedTheme>('light')
  const themeSystem = ThemeSystem.getInstance()

  React.useEffect(() => {
    setThemeState(themeSystem.getResolvedTheme())
    
    const unsubscribe = themeSystem.subscribe(setThemeState)
    return unsubscribe
  }, [])

  const setTheme = React.useCallback((newTheme: Theme) => {
    themeSystem.setTheme(newTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    const currentResolved = themeSystem.getResolvedTheme()
    const newTheme = currentResolved === 'light' ? 'dark' : 'light'
    themeSystem.setTheme(newTheme)
  }, [])

  return {
    theme,
    setTheme,
    toggleTheme,
    currentTheme: themeSystem.getTheme(),
    resolvedTheme: theme
  }
}

// Flash prevention script (to be inlined in HTML head)
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';
    var resolvedTheme;
    
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedTheme = theme;
    }
    
    document.documentElement.setAttribute('${THEME_ATTRIBUTE}', resolvedTheme);
    
    // Set UI version if feature flag is enabled
    var uiVersion = '${process.env.NEXT_PUBLIC_UI_V2}' === 'true' ? 'v2' : 'v1';
    document.documentElement.setAttribute('${UI_VERSION_ATTRIBUTE}', uiVersion);
    
    // Update theme-color meta tag
    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#171717' : '#fafafa');
    }
  } catch (e) {
    // Fallback to light theme
    document.documentElement.setAttribute('${THEME_ATTRIBUTE}', 'light');
    document.documentElement.setAttribute('${UI_VERSION_ATTRIBUTE}', 'v1');
  }
})();
`

// CSS for smooth transitions
export const THEME_TRANSITION_CSS = `
/* Theme transition styles */
* {
  transition: 
    background-color var(--pry-v2-animation-duration-fast, 150ms) var(--pry-v2-animation-easing-ease-out, ease-out),
    border-color var(--pry-v2-animation-duration-fast, 150ms) var(--pry-v2-animation-easing-ease-out, ease-out),
    color var(--pry-v2-animation-duration-fast, 150ms) var(--pry-v2-animation-easing-ease-out, ease-out);
}

/* Disable transitions during theme initialization */
.theme-transitioning * {
  transition: none !important;
}

/* UI version conditional loading */
[data-ui-version="v1"] .ui-v2-only {
  display: none !important;
}

[data-ui-version="v2"] .ui-v1-only {
  display: none !important;
}
`

// Feature flag check
export function getUIVersion(): 'v1' | 'v2' {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_UI_V2 === 'true' ? 'v2' : 'v1'
  }
  
  const version = document.documentElement.getAttribute(UI_VERSION_ATTRIBUTE)
  return version === 'v2' ? 'v2' : 'v1'
}

export function isUIv2Enabled(): boolean {
  return getUIVersion() === 'v2'
}

// Export singleton instance
export const themeSystem = ThemeSystem.getInstance()

// Add React import for hook
import React from 'react'