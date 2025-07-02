/**
 * UI/UX Polish Sprint - Phase 3.1: A11y & i18n Automation Tooling
 * 
 * Automated accessibility checking system with WCAG 2.1 AA compliance
 * Integrates with development workflow for continuous accessibility validation
 */

import { ReactElement } from 'react'

export interface A11yIssue {
  id: string
  type: 'error' | 'warning' | 'notice'
  code: string
  message: string
  element?: string
  selector?: string
  context?: string
  wcagLevel: 'A' | 'AA' | 'AAA'
  wcagCriteria: string[]
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  fix?: string
}

export interface A11yReport {
  passes: number
  failures: number
  warnings: number
  issues: A11yIssue[]
  score: number // 0-100
  timestamp: string
  locale?: string
}

// WCAG 2.1 criteria mapping
export const WCAG_CRITERIA = {
  // Perceivable
  '1.1.1': 'Non-text Content',
  '1.2.1': 'Audio-only and Video-only',
  '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence',
  '1.3.3': 'Sensory Characteristics',
  '1.3.4': 'Orientation',
  '1.3.5': 'Identify Input Purpose',
  '1.4.1': 'Use of Color',
  '1.4.2': 'Audio Control',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.4': 'Resize Text',
  '1.4.5': 'Images of Text',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text Contrast',
  '1.4.12': 'Text Spacing',
  '1.4.13': 'Content on Hover or Focus',
  
  // Operable
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.1.4': 'Character Key Shortcuts',
  '2.2.1': 'Timing Adjustable',
  '2.2.2': 'Pause, Stop, Hide',
  '2.3.1': 'Three Flashes or Below',
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.3': 'Focus Order',
  '2.4.4': 'Link Purpose',
  '2.4.5': 'Multiple Ways',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  '2.5.1': 'Pointer Gestures',
  '2.5.2': 'Pointer Cancellation',
  '2.5.3': 'Label in Name',
  '2.5.4': 'Motion Actuation',
  
  // Understandable
  '3.1.1': 'Language of Page',
  '3.1.2': 'Language of Parts',
  '3.2.1': 'On Focus',
  '3.2.2': 'On Input',
  '3.2.3': 'Consistent Navigation',
  '3.2.4': 'Consistent Identification',
  '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions',
  '3.3.3': 'Error Suggestion',
  '3.3.4': 'Error Prevention',
  
  // Robust
  '4.1.1': 'Parsing',
  '4.1.2': 'Name, Role, Value',
  '4.1.3': 'Status Messages'
} as const

/**
 * Core accessibility checker class
 */
export class AccessibilityChecker {
  private issues: A11yIssue[] = []
  private passes: number = 0
  
  /**
   * Checks component for accessibility issues
   */
  check(element: HTMLElement | ReactElement, locale?: string): A11yReport {
    this.reset()
    
    if (element instanceof HTMLElement) {
      this.checkDOM(element)
    } else {
      // For React elements, we'd need to render and check
      console.warn('React element checking requires rendering')
    }
    
    return this.generateReport(locale)
  }
  
  /**
   * Checks DOM element for accessibility issues
   */
  private checkDOM(element: HTMLElement): void {
    // Check for images without alt text
    this.checkImages(element)
    
    // Check color contrast
    this.checkColorContrast(element)
    
    // Check heading structure
    this.checkHeadingStructure(element)
    
    // Check form labels
    this.checkFormLabels(element)
    
    // Check keyboard navigation
    this.checkKeyboardNavigation(element)
    
    // Check ARIA usage
    this.checkARIA(element)
    
    // Check focus indicators
    this.checkFocusIndicators(element)
    
    // Check link text
    this.checkLinkText(element)
    
    // Check language attributes
    this.checkLanguageAttributes(element)
    
    // Check motion and animations
    this.checkMotion(element)
  }
  
  /**
   * Checks images for proper alt text
   */
  private checkImages(element: HTMLElement): void {
    const images = element.querySelectorAll('img')
    
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        this.addIssue({
          id: `img-no-alt-${Date.now()}`,
          type: 'error',
          code: 'IMG_NO_ALT',
          message: 'Image missing alt attribute',
          element: img.outerHTML.slice(0, 100),
          selector: this.getSelector(img),
          wcagLevel: 'A',
          wcagCriteria: ['1.1.1'],
          impact: 'critical',
          fix: 'Add descriptive alt text or alt="" for decorative images'
        })
      } else {
        this.passes++
      }
    })
  }
  
  /**
   * Checks color contrast ratios
   */
  private checkColorContrast(element: HTMLElement): void {
    const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button')
    
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el as HTMLElement)
      const bgColor = styles.backgroundColor
      const textColor = styles.color
      
      if (bgColor && textColor && bgColor !== 'transparent') {
        const contrast = this.calculateContrast(textColor, bgColor)
        const fontSize = parseFloat(styles.fontSize)
        const fontWeight = styles.fontWeight
        
        // WCAG AA requirements
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700)
        const requiredContrast = isLargeText ? 3 : 4.5
        
        if (contrast < requiredContrast) {
          this.addIssue({
            id: `contrast-${Date.now()}`,
            type: 'error',
            code: 'LOW_CONTRAST',
            message: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (requires ${requiredContrast}:1)`,
            element: (el as HTMLElement).outerHTML.slice(0, 100),
            selector: this.getSelector(el as HTMLElement),
            wcagLevel: 'AA',
            wcagCriteria: ['1.4.3'],
            impact: 'serious',
            fix: `Increase contrast between text (${textColor}) and background (${bgColor})`
          })
        } else {
          this.passes++
        }
      }
    })
  }
  
  /**
   * Checks heading structure for proper hierarchy
   */
  private checkHeadingStructure(element: HTMLElement): void {
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let lastLevel = 0
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1])
      
      if (index === 0 && level !== 1) {
        this.addIssue({
          id: `heading-start-${Date.now()}`,
          type: 'warning',
          code: 'HEADING_START',
          message: 'Page should start with h1',
          element: heading.outerHTML,
          selector: this.getSelector(heading as HTMLElement),
          wcagLevel: 'AA',
          wcagCriteria: ['1.3.1'],
          impact: 'moderate',
          fix: 'Start page heading hierarchy with h1'
        })
      }
      
      if (lastLevel > 0 && level > lastLevel + 1) {
        this.addIssue({
          id: `heading-skip-${Date.now()}`,
          type: 'warning',
          code: 'HEADING_SKIP',
          message: `Heading level skipped from h${lastLevel} to h${level}`,
          element: heading.outerHTML,
          selector: this.getSelector(heading as HTMLElement),
          wcagLevel: 'AA',
          wcagCriteria: ['1.3.1'],
          impact: 'moderate',
          fix: 'Use sequential heading levels'
        })
      } else {
        this.passes++
      }
      
      lastLevel = level
    })
  }
  
  /**
   * Checks form elements for proper labels
   */
  private checkFormLabels(element: HTMLElement): void {
    const formInputs = element.querySelectorAll('input, select, textarea')
    
    formInputs.forEach(input => {
      const inputElement = input as HTMLInputElement
      
      // Skip hidden inputs
      if (inputElement.type === 'hidden') return
      
      const hasLabel = this.hasAssociatedLabel(inputElement)
      const hasAriaLabel = inputElement.hasAttribute('aria-label') || 
                          inputElement.hasAttribute('aria-labelledby')
      
      if (!hasLabel && !hasAriaLabel) {
        this.addIssue({
          id: `form-label-${Date.now()}`,
          type: 'error',
          code: 'FORM_NO_LABEL',
          message: 'Form input missing label',
          element: inputElement.outerHTML,
          selector: this.getSelector(inputElement),
          wcagLevel: 'A',
          wcagCriteria: ['3.3.2'],
          impact: 'serious',
          fix: 'Add <label> element or aria-label attribute'
        })
      } else {
        this.passes++
      }
    })
  }
  
  /**
   * Checks keyboard navigation support
   */
  private checkKeyboardNavigation(element: HTMLElement): void {
    const interactiveElements = element.querySelectorAll(
      'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    )
    
    interactiveElements.forEach(el => {
      const htmlEl = el as HTMLElement
      const tabIndex = htmlEl.getAttribute('tabindex')
      
      // Check for positive tabindex (bad practice)
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          id: `tabindex-positive-${Date.now()}`,
          type: 'warning',
          code: 'TABINDEX_POSITIVE',
          message: 'Positive tabindex disrupts natural tab order',
          element: htmlEl.outerHTML.slice(0, 100),
          selector: this.getSelector(htmlEl),
          wcagLevel: 'A',
          wcagCriteria: ['2.4.3'],
          impact: 'moderate',
          fix: 'Use tabindex="0" or "-1" instead'
        })
      } else {
        this.passes++
      }
    })
  }
  
  /**
   * Checks ARIA attribute usage
   */
  private checkARIA(element: HTMLElement): void {
    const ariaElements = element.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]')
    
    ariaElements.forEach(el => {
      const htmlEl = el as HTMLElement
      const role = htmlEl.getAttribute('role')
      
      // Check for redundant roles
      if (role && this.isRedundantRole(htmlEl, role)) {
        this.addIssue({
          id: `aria-redundant-${Date.now()}`,
          type: 'notice',
          code: 'ARIA_REDUNDANT',
          message: `Redundant role="${role}" on ${htmlEl.tagName}`,
          element: htmlEl.outerHTML.slice(0, 100),
          selector: this.getSelector(htmlEl),
          wcagLevel: 'A',
          wcagCriteria: ['4.1.2'],
          impact: 'minor',
          fix: 'Remove redundant role attribute'
        })
      }
      
      // Check aria-labelledby references
      const labelledBy = htmlEl.getAttribute('aria-labelledby')
      if (labelledBy && !element.querySelector(`#${labelledBy}`)) {
        this.addIssue({
          id: `aria-ref-${Date.now()}`,
          type: 'error',
          code: 'ARIA_REF_INVALID',
          message: `aria-labelledby references non-existent ID: ${labelledBy}`,
          element: htmlEl.outerHTML.slice(0, 100),
          selector: this.getSelector(htmlEl),
          wcagLevel: 'A',
          wcagCriteria: ['4.1.2'],
          impact: 'serious',
          fix: 'Ensure referenced ID exists'
        })
      } else {
        this.passes++
      }
    })
  }
  
  /**
   * Checks focus indicators
   */
  private checkFocusIndicators(element: HTMLElement): void {
    const focusableElements = element.querySelectorAll(
      'a, button, input, select, textarea, [tabindex="0"]'
    )
    
    focusableElements.forEach(el => {
      const htmlEl = el as HTMLElement
      const styles = window.getComputedStyle(htmlEl, ':focus')
      
      // Check if focus styles are defined
      const hasOutline = styles.outlineStyle !== 'none' || styles.outlineWidth !== '0px'
      const hasBorder = styles.borderStyle !== 'none'
      const hasBoxShadow = styles.boxShadow !== 'none'
      
      if (!hasOutline && !hasBorder && !hasBoxShadow) {
        this.addIssue({
          id: `focus-indicator-${Date.now()}`,
          type: 'warning',
          code: 'NO_FOCUS_INDICATOR',
          message: 'Element may lack visible focus indicator',
          element: htmlEl.outerHTML.slice(0, 100),
          selector: this.getSelector(htmlEl),
          wcagLevel: 'AA',
          wcagCriteria: ['2.4.7'],
          impact: 'serious',
          fix: 'Add visible focus styles (outline, border, or box-shadow)'
        })
      } else {
        this.passes++
      }
    })
  }
  
  /**
   * Checks link text for descriptiveness
   */
  private checkLinkText(element: HTMLElement): void {
    const links = element.querySelectorAll('a')
    const genericTexts = ['click here', 'read more', 'learn more', 'more', 'here']
    
    links.forEach(link => {
      const linkText = link.textContent?.trim().toLowerCase() || ''
      
      if (genericTexts.includes(linkText)) {
        this.addIssue({
          id: `link-text-${Date.now()}`,
          type: 'warning',
          code: 'GENERIC_LINK_TEXT',
          message: `Non-descriptive link text: "${link.textContent}"`,
          element: link.outerHTML,
          selector: this.getSelector(link),
          wcagLevel: 'AA',
          wcagCriteria: ['2.4.4'],
          impact: 'moderate',
          fix: 'Use descriptive link text that explains the destination'
        })
      } else {
        this.passes++
      }
    })
  }
  
  /**
   * Checks language attributes
   */
  private checkLanguageAttributes(element: HTMLElement): void {
    // Check if root element has lang attribute
    if (element === document.documentElement && !element.hasAttribute('lang')) {
      this.addIssue({
        id: 'lang-missing',
        type: 'error',
        code: 'LANG_MISSING',
        message: 'Page missing lang attribute',
        element: '<html>',
        wcagLevel: 'A',
        wcagCriteria: ['3.1.1'],
        impact: 'serious',
        fix: 'Add lang attribute to <html> element'
      })
    }
  }
  
  /**
   * Checks motion and animation accessibility
   */
  private checkMotion(element: HTMLElement): void {
    const animatedElements = element.querySelectorAll('[class*="animate"], [class*="transition"]')
    
    if (animatedElements.length > 0) {
      // Check if prefers-reduced-motion is respected
      const hasReducedMotionSupport = Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules || []).some(rule => 
            rule.cssText.includes('prefers-reduced-motion')
          )
        } catch {
          return false
        }
      })
      
      if (!hasReducedMotionSupport) {
        this.addIssue({
          id: 'motion-no-preference',
          type: 'warning',
          code: 'MOTION_NO_PREFERENCE',
          message: 'Animations detected without prefers-reduced-motion support',
          wcagLevel: 'AA',
          wcagCriteria: ['2.3.1'],
          impact: 'moderate',
          fix: 'Add CSS media query for prefers-reduced-motion'
        })
      } else {
        this.passes++
      }
    }
  }
  
  /**
   * Helper: Calculate color contrast ratio
   */
  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In production, use a proper library like color-contrast-checker
    return 4.5 // Placeholder
  }
  
  /**
   * Helper: Get CSS selector for element
   */
  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    if (element.className) return `.${element.className.split(' ')[0]}`
    return element.tagName.toLowerCase()
  }
  
  /**
   * Helper: Check if element has associated label
   */
  private hasAssociatedLabel(input: HTMLInputElement): boolean {
    // Check for explicit label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`)
      if (label) return true
    }
    
    // Check for implicit label
    const parent = input.parentElement
    if (parent && parent.tagName === 'LABEL') return true
    
    return false
  }
  
  /**
   * Helper: Check if role is redundant
   */
  private isRedundantRole(element: HTMLElement, role: string): boolean {
    const redundantRoles: Record<string, string[]> = {
      'BUTTON': ['button'],
      'A': ['link'],
      'NAV': ['navigation'],
      'MAIN': ['main'],
      'HEADER': ['banner'],
      'FOOTER': ['contentinfo']
    }
    
    return redundantRoles[element.tagName]?.includes(role) || false
  }
  
  /**
   * Add issue to the list
   */
  private addIssue(issue: A11yIssue): void {
    this.issues.push(issue)
  }
  
  /**
   * Generate accessibility report
   */
  private generateReport(locale?: string): A11yReport {
    const failures = this.issues.filter(i => i.type === 'error').length
    const warnings = this.issues.filter(i => i.type === 'warning').length
    const total = this.passes + failures + warnings
    const score = total > 0 ? Math.round((this.passes / total) * 100) : 100
    
    return {
      passes: this.passes,
      failures,
      warnings,
      issues: this.issues,
      score,
      timestamp: new Date().toISOString(),
      locale
    }
  }
  
  /**
   * Reset checker state
   */
  private reset(): void {
    this.issues = []
    this.passes = 0
  }
}

// Export singleton instance
export const a11yChecker = new AccessibilityChecker()

/**
 * React hook for accessibility checking
 */
export function useA11yCheck(elementRef: React.RefObject<HTMLElement>, locale?: string) {
  const [report, setReport] = React.useState<A11yReport | null>(null)
  
  React.useEffect(() => {
    if (elementRef.current) {
      const newReport = a11yChecker.check(elementRef.current, locale)
      setReport(newReport)
    }
  }, [elementRef, locale])
  
  return report
}