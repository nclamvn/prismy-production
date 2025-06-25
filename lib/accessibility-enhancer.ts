// Accessibility enhancement utilities for complex AI features

// ARIA live region management
export class LiveRegionManager {
  private static regions = new Map<string, HTMLElement>()
  
  static createLiveRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
    if (this.regions.has(id)) {
      return this.regions.get(id)!
    }
    
    const region = document.createElement('div')
    region.id = `live-region-${id}`
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only' // Screen reader only
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    
    document.body.appendChild(region)
    this.regions.set(id, region)
    
    return region
  }
  
  static announce(id: string, message: string, politeness: 'polite' | 'assertive' = 'polite') {
    let region = this.regions.get(id)
    if (!region) {
      region = this.createLiveRegion(id, politeness)
    }
    
    // Clear and announce
    region.textContent = ''
    setTimeout(() => {
      region!.textContent = message
    }, 100)
  }
  
  static clearRegion(id: string) {
    const region = this.regions.get(id)
    if (region) {
      region.textContent = ''
    }
  }
  
  static removeLiveRegion(id: string) {
    const region = this.regions.get(id)
    if (region) {
      region.remove()
      this.regions.delete(id)
    }
  }
}

// Keyboard navigation enhancement
export class KeyboardNavigator {
  private static trapStack: HTMLElement[] = []
  private static lastFocusedElement: HTMLElement | null = null
  
  static trapFocus(container: HTMLElement) {
    this.trapStack.push(container)
    this.lastFocusedElement = document.activeElement as HTMLElement
    
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return
    
    // Focus first element
    focusableElements[0].focus()
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      
      const currentFocusIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
      
      if (event.shiftKey) {
        // Shift + Tab
        const nextIndex = currentFocusIndex <= 0 ? focusableElements.length - 1 : currentFocusIndex - 1
        focusableElements[nextIndex].focus()
      } else {
        // Tab
        const nextIndex = currentFocusIndex >= focusableElements.length - 1 ? 0 : currentFocusIndex + 1
        focusableElements[nextIndex].focus()
      }
      
      event.preventDefault()
    }
    
    container.addEventListener('keydown', handleKeyDown)
    container.setAttribute('data-focus-trap', 'true')
    
    // Store cleanup function
    ;(container as any)._cleanupFocusTrap = () => {
      container.removeEventListener('keydown', handleKeyDown)
      container.removeAttribute('data-focus-trap')
    }
  }
  
  static releaseFocus(container?: HTMLElement) {
    if (container) {
      const cleanup = (container as any)._cleanupFocusTrap
      if (cleanup) {
        cleanup()
        delete (container as any)._cleanupFocusTrap
      }
      
      const index = this.trapStack.indexOf(container)
      if (index > -1) {
        this.trapStack.splice(index, 1)
      }
    } else {
      // Release latest trap
      const latestTrap = this.trapStack.pop()
      if (latestTrap) {
        const cleanup = (latestTrap as any)._cleanupFocusTrap
        if (cleanup) {
          cleanup()
          delete (latestTrap as any)._cleanupFocusTrap
        }
      }
    }
    
    // Restore focus to previous element
    if (this.lastFocusedElement && this.trapStack.length === 0) {
      this.lastFocusedElement.focus()
      this.lastFocusedElement = null
    }
  }
  
  private static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')
    
    return Array.from(container.querySelectorAll(selectors)) as HTMLElement[]
  }
  
  static addKeyboardShortcut(
    key: string,
    callback: (event: KeyboardEvent) => void,
    options: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean } = {}
  ) {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !!event.ctrlKey === !!options.ctrlKey &&
        !!event.altKey === !!options.altKey &&
        !!event.shiftKey === !!options.shiftKey
      ) {
        event.preventDefault()
        callback(event)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }
}

// High contrast and color adaptation
export class ColorAccessibility {
  private static contrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return 1
    
    const l1 = this.relativeLuminance(rgb1)
    const l2 = this.relativeLuminance(rgb2)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }
  
  private static hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
  
  private static relativeLuminance({r, g, b}: {r: number, g: number, b: number}): number {
    const rsRGB = r / 255
    const gsRGB = g / 255
    const bsRGB = b / 255
    
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
  }
  
  static checkContrast(foreground: string, background: string): {
    ratio: number
    aa: boolean
    aaa: boolean
  } {
    const ratio = this.contrastRatio(foreground, background)
    return {
      ratio,
      aa: ratio >= 4.5,  // WCAG AA standard
      aaa: ratio >= 7     // WCAG AAA standard
    }
  }
  
  static adaptColorsForHighContrast(): void {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast')
      
      // Apply high contrast styles
      const style = document.createElement('style')
      style.textContent = `
        .high-contrast {
          --primary-color: #000000;
          --secondary-color: #ffffff;
          --border-color: #000000;
          --shadow: none;
        }
        
        .high-contrast .bg-gradient-to-r,
        .high-contrast .bg-gradient-to-br {
          background: var(--secondary-color) !important;
          color: var(--primary-color) !important;
          border: 2px solid var(--border-color) !important;
        }
        
        .high-contrast .shadow-lg,
        .high-contrast .shadow-md {
          box-shadow: var(--shadow) !important;
        }
      `
      document.head.appendChild(style)
    }
  }
}

// Screen reader optimization
export class ScreenReaderOptimizer {
  static addDescriptiveLabels(element: HTMLElement, description: string) {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`
    
    const descElement = document.createElement('div')
    descElement.id = descId
    descElement.className = 'sr-only'
    descElement.textContent = description
    
    element.appendChild(descElement)
    element.setAttribute('aria-describedby', descId)
  }
  
  static announceStateChange(element: HTMLElement, newState: string) {
    LiveRegionManager.announce('state-change', `${element.getAttribute('aria-label') || 'Element'} is now ${newState}`)
  }
  
  static makeComplexUIAccessible(container: HTMLElement, structure: {
    role: string
    label: string
    children?: Array<{element: HTMLElement, label: string, role?: string}>
  }) {
    container.setAttribute('role', structure.role)
    container.setAttribute('aria-label', structure.label)
    
    if (structure.children) {
      structure.children.forEach((child, index) => {
        child.element.setAttribute('aria-label', child.label)
        if (child.role) {
          child.element.setAttribute('role', child.role)
        }
        child.element.setAttribute('aria-setsize', structure.children!.length.toString())
        child.element.setAttribute('aria-posinset', (index + 1).toString())
      })
    }
  }
  
  static optimizeForVoiceControl(element: HTMLElement, voiceCommands: string[]) {
    // Add voice command hints
    const commands = voiceCommands.join(', ')
    element.setAttribute('aria-description', `Voice commands: ${commands}`)
    
    // Add data attribute for voice recognition
    element.setAttribute('data-voice-commands', JSON.stringify(voiceCommands))
  }
}

// Motion and animation preferences
export class MotionAccessibility {
  private static reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  static initialize() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      this.reducedMotion = e.matches
      this.updateAnimations()
    })
    
    this.updateAnimations()
  }
  
  private static updateAnimations() {
    if (this.reducedMotion) {
      document.body.classList.add('reduce-motion')
      
      // Add reduced motion styles
      const style = document.createElement('style')
      style.id = 'reduced-motion-styles'
      style.textContent = `
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        .reduce-motion .animate-spin {
          animation: none !important;
        }
        
        .reduce-motion .animate-pulse {
          animation: none !important;
        }
      `
      
      // Remove existing style if present
      const existing = document.getElementById('reduced-motion-styles')
      if (existing) existing.remove()
      
      document.head.appendChild(style)
    } else {
      document.body.classList.remove('reduce-motion')
      const style = document.getElementById('reduced-motion-styles')
      if (style) style.remove()
    }
  }
  
  static shouldReduceMotion(): boolean {
    return this.reducedMotion
  }
  
  static getAnimationDuration(defaultDuration: number): number {
    return this.reducedMotion ? 0 : defaultDuration
  }
}

// Touch and gesture accessibility
export class TouchAccessibility {
  private static touchTargets = new Map<HTMLElement, {minSize: number, originalPadding: string}>()
  
  static ensureMinimumTouchTarget(element: HTMLElement, minSize: number = 44) {
    const rect = element.getBoundingClientRect()
    const currentSize = Math.min(rect.width, rect.height)
    
    if (currentSize < minSize) {
      const originalPadding = getComputedStyle(element).padding
      this.touchTargets.set(element, { minSize, originalPadding })
      
      const additionalPadding = Math.ceil((minSize - currentSize) / 2)
      element.style.padding = `${additionalPadding}px`
      element.style.minWidth = `${minSize}px`
      element.style.minHeight = `${minSize}px`
    }
  }
  
  static addTouchFeedback(element: HTMLElement) {
    element.style.touchAction = 'manipulation'
    
    const addRipple = (event: TouchEvent) => {
      const rect = element.getBoundingClientRect()
      const touch = event.touches[0]
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      const ripple = document.createElement('div')
      ripple.className = 'touch-ripple'
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        pointer-events: none;
        width: 20px;
        height: 20px;
        left: ${x - 10}px;
        top: ${y - 10}px;
        transform: scale(0);
        animation: ripple 0.3s ease-out;
      `
      
      // Add ripple animation
      const style = document.createElement('style')
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
      
      element.style.position = 'relative'
      element.style.overflow = 'hidden'
      element.appendChild(ripple)
      
      setTimeout(() => {
        ripple.remove()
      }, 300)
    }
    
    element.addEventListener('touchstart', addRipple, { passive: true })
  }
}

// Comprehensive accessibility checker
export class AccessibilityChecker {
  static auditElement(element: HTMLElement): {
    issues: Array<{type: string, message: string, severity: 'error' | 'warning'}>
    score: number
  } {
    const issues: Array<{type: string, message: string, severity: 'error' | 'warning'}> = []
    
    // Check for missing alt text on images
    const images = element.querySelectorAll('img')
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        issues.push({
          type: 'missing-alt',
          message: 'Image missing alt text',
          severity: 'error'
        })
      }
    })
    
    // Check for missing labels on form controls
    const inputs = element.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${input.id}"]`)
      
      if (!hasLabel) {
        issues.push({
          type: 'missing-label',
          message: 'Form control missing label',
          severity: 'error'
        })
      }
    })
    
    // Check for adequate color contrast
    const textElements = element.querySelectorAll('*')
    textElements.forEach(el => {
      const styles = getComputedStyle(el)
      const color = styles.color
      const background = styles.backgroundColor
      
      if (color !== 'rgba(0, 0, 0, 0)' && background !== 'rgba(0, 0, 0, 0)') {
        const contrast = ColorAccessibility.checkContrast(color, background)
        if (!contrast.aa) {
          issues.push({
            type: 'low-contrast',
            message: `Low color contrast (${contrast.ratio.toFixed(2)}:1)`,
            severity: 'warning'
          })
        }
      }
    })
    
    // Check for keyboard accessibility
    const interactiveElements = element.querySelectorAll('button, a, input, select, textarea, [tabindex]')
    interactiveElements.forEach(el => {
      const tabIndex = el.getAttribute('tabindex')
      if (tabIndex === '-1' && el.tagName !== 'DIV') {
        issues.push({
          type: 'keyboard-inaccessible',
          message: 'Interactive element not keyboard accessible',
          severity: 'error'
        })
      }
    })
    
    // Calculate score
    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length
    const totalElements = element.querySelectorAll('*').length
    
    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5))
    
    return { issues, score }
  }
  
  static generateReport(container: HTMLElement): string {
    const audit = this.auditElement(container)
    
    let report = `Accessibility Audit Report\n`
    report += `Score: ${audit.score}/100\n\n`
    
    if (audit.issues.length === 0) {
      report += 'No accessibility issues found!\n'
    } else {
      report += 'Issues found:\n'
      audit.issues.forEach((issue, index) => {
        report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message}\n`
      })
    }
    
    return report
  }
}

export default {
  LiveRegionManager,
  KeyboardNavigator,
  ColorAccessibility,
  ScreenReaderOptimizer,
  MotionAccessibility,
  TouchAccessibility,
  AccessibilityChecker
}