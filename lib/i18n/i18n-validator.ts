/**
 * UI/UX Polish Sprint - Phase 3.1: i18n Validation & Automation
 * 
 * Automated internationalization validation system
 * Ensures all UI strings are properly translated and formatted
 */

export interface I18nValidationIssue {
  id: string
  type: 'missing' | 'unused' | 'format' | 'plural' | 'length' | 'hardcoded'
  severity: 'error' | 'warning' | 'info'
  key?: string
  locale: string
  message: string
  file?: string
  line?: number
  suggestion?: string
}

export interface I18nValidationReport {
  locale: string
  coverage: number // Translation coverage percentage
  issues: I18nValidationIssue[]
  stats: {
    totalKeys: number
    translatedKeys: number
    missingKeys: number
    unusedKeys: number
    formatErrors: number
    hardcodedStrings: number
  }
  timestamp: string
}

export interface TranslationEntry {
  key: string
  value: string
  namespace?: string
  plurals?: Record<string, string>
  context?: string
}

// Supported locales for Prismy
export const SUPPORTED_LOCALES = {
  en: { name: 'English', direction: 'ltr' },
  vi: { name: 'Tiếng Việt', direction: 'ltr' },
  ja: { name: '日本語', direction: 'ltr' },
  ar: { name: 'العربية', direction: 'rtl' },
  zh: { name: '中文', direction: 'ltr' }
} as const

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES

/**
 * Core i18n validator class
 */
export class I18nValidator {
  private translations: Map<string, Map<string, TranslationEntry>> = new Map()
  private usedKeys: Set<string> = new Set()
  
  /**
   * Load translations for validation
   */
  loadTranslations(locale: string, translations: Record<string, any>, namespace = 'common'): void {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, new Map())
    }
    
    const localeMap = this.translations.get(locale)!
    this.flattenTranslations(translations, '', namespace, localeMap)
  }
  
  /**
   * Validate translations for a specific locale
   */
  validate(locale: string, referenceLocale = 'en'): I18nValidationReport {
    const issues: I18nValidationIssue[] = []
    const stats = {
      totalKeys: 0,
      translatedKeys: 0,
      missingKeys: 0,
      unusedKeys: 0,
      formatErrors: 0,
      hardcodedStrings: 0
    }
    
    // Get reference and target translations
    const referenceTranslations = this.translations.get(referenceLocale)
    const targetTranslations = this.translations.get(locale)
    
    if (!referenceTranslations) {
      throw new Error(`Reference locale ${referenceLocale} not loaded`)
    }
    
    if (!targetTranslations) {
      issues.push({
        id: `locale-missing-${locale}`,
        type: 'missing',
        severity: 'error',
        locale,
        message: `No translations found for locale: ${locale}`
      })
      
      return this.generateReport(locale, 0, issues, stats)
    }
    
    // Check for missing translations
    referenceTranslations.forEach((entry, key) => {
      stats.totalKeys++
      
      if (!targetTranslations.has(key)) {
        stats.missingKeys++
        issues.push({
          id: `missing-${key}-${locale}`,
          type: 'missing',
          severity: 'error',
          key,
          locale,
          message: `Missing translation for key: ${key}`,
          suggestion: `Add translation for "${entry.value}" in ${locale}`
        })
      } else {
        stats.translatedKeys++
        const targetEntry = targetTranslations.get(key)!
        
        // Validate translation format
        this.validateTranslationFormat(entry, targetEntry, locale, issues, stats)
        
        // Check translation length (important for UI)
        this.validateTranslationLength(entry, targetEntry, locale, issues)
        
        // Validate plurals if present
        if (entry.plurals) {
          this.validatePlurals(entry, targetEntry, locale, issues)
        }
      }
    })
    
    // Check for unused translations
    targetTranslations.forEach((entry, key) => {
      if (!referenceTranslations.has(key) && !this.usedKeys.has(key)) {
        stats.unusedKeys++
        issues.push({
          id: `unused-${key}-${locale}`,
          type: 'unused',
          severity: 'warning',
          key,
          locale,
          message: `Unused translation key: ${key}`,
          suggestion: 'Remove unused translation or verify key usage'
        })
      }
    })
    
    const coverage = stats.totalKeys > 0 
      ? (stats.translatedKeys / stats.totalKeys) * 100 
      : 0
    
    return this.generateReport(locale, coverage, issues, stats)
  }
  
  /**
   * Scan code for hardcoded strings
   */
  scanForHardcodedStrings(
    content: string, 
    filename: string,
    locale: string
  ): I18nValidationIssue[] {
    const issues: I18nValidationIssue[] = []
    const lines = content.split('\n')
    
    // Patterns for detecting hardcoded strings
    const patterns = [
      // JSX text content
      />([A-Z][^<>]{2,})</g,
      // String literals with UI text
      /["']([A-Z][a-zA-Z\s]{4,})["']/g,
      // Template literals with UI text
      /`([A-Z][a-zA-Z\s]{4,})`/g,
      // Common UI patterns
      /(button|label|title|placeholder|error|success|warning)\s*[:=]\s*["']([^"']+)["']/gi
    ]
    
    lines.forEach((line, lineNumber) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.includes('import')) {
        return
      }
      
      patterns.forEach(pattern => {
        const matches = line.matchAll(pattern)
        for (const match of matches) {
          const text = match[1] || match[2]
          
          // Skip common exceptions
          if (this.isExceptionString(text)) continue
          
          issues.push({
            id: `hardcoded-${filename}-${lineNumber}`,
            type: 'hardcoded',
            severity: 'warning',
            locale,
            message: `Hardcoded string: "${text}"`,
            file: filename,
            line: lineNumber + 1,
            suggestion: `Use i18n key instead: t('${this.suggestKey(text)}')`
          })
        }
      })
    })
    
    return issues
  }
  
  /**
   * Validate translation format consistency
   */
  private validateTranslationFormat(
    reference: TranslationEntry,
    target: TranslationEntry,
    locale: string,
    issues: I18nValidationIssue[],
    stats: { formatErrors: number }
  ): void {
    // Check interpolation variables
    const refVars = this.extractInterpolationVars(reference.value)
    const targetVars = this.extractInterpolationVars(target.value)
    
    if (refVars.length !== targetVars.length) {
      stats.formatErrors++
      issues.push({
        id: `format-vars-${target.key}-${locale}`,
        type: 'format',
        severity: 'error',
        key: target.key,
        locale,
        message: `Variable count mismatch: expected ${refVars.length}, got ${targetVars.length}`,
        suggestion: `Ensure all variables ${refVars.join(', ')} are present`
      })
    }
    
    // Check HTML tags consistency
    const refTags = this.extractHTMLTags(reference.value)
    const targetTags = this.extractHTMLTags(target.value)
    
    if (refTags.length !== targetTags.length) {
      stats.formatErrors++
      issues.push({
        id: `format-tags-${target.key}-${locale}`,
        type: 'format',
        severity: 'error',
        key: target.key,
        locale,
        message: `HTML tag mismatch: expected ${refTags.length} tags, got ${targetTags.length}`,
        suggestion: 'Ensure HTML structure is consistent across translations'
      })
    }
  }
  
  /**
   * Validate translation length for UI consistency
   */
  private validateTranslationLength(
    reference: TranslationEntry,
    target: TranslationEntry,
    locale: string,
    issues: I18nValidationIssue[]
  ): void {
    const refLength = reference.value.length
    const targetLength = target.value.length
    
    // Allow 50% length variance for most translations
    const maxVariance = 1.5
    
    if (targetLength > refLength * maxVariance) {
      issues.push({
        id: `length-${target.key}-${locale}`,
        type: 'length',
        severity: 'warning',
        key: target.key,
        locale,
        message: `Translation significantly longer (${targetLength} vs ${refLength} chars)`,
        suggestion: 'Consider shortening translation for UI consistency'
      })
    }
    
    // For short strings (buttons, labels), be stricter
    if (refLength < 20 && targetLength > refLength * 1.3) {
      issues.push({
        id: `length-short-${target.key}-${locale}`,
        type: 'length',
        severity: 'warning',
        key: target.key,
        locale,
        message: `Short UI string too long (${targetLength} vs ${refLength} chars)`,
        suggestion: 'Keep button/label text concise'
      })
    }
  }
  
  /**
   * Validate plural forms
   */
  private validatePlurals(
    reference: TranslationEntry,
    target: TranslationEntry,
    locale: string,
    issues: I18nValidationIssue[]
  ): void {
    if (!target.plurals) {
      issues.push({
        id: `plural-missing-${target.key}-${locale}`,
        type: 'plural',
        severity: 'error',
        key: target.key,
        locale,
        message: 'Missing plural forms',
        suggestion: 'Add plural forms for proper localization'
      })
      return
    }
    
    // Check if all required plural forms are present
    const requiredForms = this.getRequiredPluralForms(locale)
    requiredForms.forEach(form => {
      if (!target.plurals![form]) {
        issues.push({
          id: `plural-form-${target.key}-${form}-${locale}`,
          type: 'plural',
          severity: 'error',
          key: target.key,
          locale,
          message: `Missing plural form: ${form}`,
          suggestion: `Add ${form} plural form`
        })
      }
    })
  }
  
  /**
   * Helper: Flatten nested translation objects
   */
  private flattenTranslations(
    obj: Record<string, any>,
    prefix: string,
    namespace: string,
    map: Map<string, TranslationEntry>
  ): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'string') {
        map.set(fullKey, {
          key: fullKey,
          value,
          namespace
        })
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Check if it's a plural object
        if (this.isPluralObject(value)) {
          map.set(fullKey, {
            key: fullKey,
            value: value.one || value.other || '',
            namespace,
            plurals: value
          })
        } else {
          // Recursively flatten
          this.flattenTranslations(value, fullKey, namespace, map)
        }
      }
    })
  }
  
  /**
   * Helper: Extract interpolation variables
   */
  private extractInterpolationVars(text: string): string[] {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || []
    return matches.map(m => m.replace(/[{}]/g, '').trim())
  }
  
  /**
   * Helper: Extract HTML tags
   */
  private extractHTMLTags(text: string): string[] {
    const matches = text.match(/<[^>]+>/g) || []
    return matches
  }
  
  /**
   * Helper: Check if object is plural forms
   */
  private isPluralObject(obj: any): boolean {
    const pluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other']
    return Object.keys(obj).some(key => pluralKeys.includes(key))
  }
  
  /**
   * Helper: Get required plural forms for locale
   */
  private getRequiredPluralForms(locale: string): string[] {
    // Simplified plural rules - in production use Intl.PluralRules
    const pluralRules: Record<string, string[]> = {
      en: ['one', 'other'],
      vi: ['other'],
      ja: ['other'],
      ar: ['zero', 'one', 'two', 'few', 'many', 'other'],
      zh: ['other']
    }
    
    return pluralRules[locale] || ['one', 'other']
  }
  
  /**
   * Helper: Check if string is an exception
   */
  private isExceptionString(text: string): boolean {
    const exceptions = [
      /^[A-Z]+$/, // All caps (likely constants)
      /^[a-z]+$/, // All lowercase (likely technical)
      /^[\d\s]+$/, // Numbers
      /^https?:\/\//, // URLs
      /^[a-zA-Z0-9._%+-]+@/, // Emails
      /^#[0-9A-Fa-f]{6}$/, // Hex colors
    ]
    
    return exceptions.some(pattern => pattern.test(text))
  }
  
  /**
   * Helper: Suggest i18n key from text
   */
  private suggestKey(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 30)
  }
  
  /**
   * Generate validation report
   */
  private generateReport(
    locale: string,
    coverage: number,
    issues: I18nValidationIssue[],
    stats: any
  ): I18nValidationReport {
    return {
      locale,
      coverage,
      issues,
      stats,
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * Mark keys as used (for detecting unused translations)
   */
  markKeysAsUsed(keys: string[]): void {
    keys.forEach(key => this.usedKeys.add(key))
  }
  
  /**
   * Clear validation state
   */
  clear(): void {
    this.translations.clear()
    this.usedKeys.clear()
  }
}

// Export singleton instance
export const i18nValidator = new I18nValidator()

/**
 * React hook for i18n validation
 */
export function useI18nValidation(locale: string) {
  const [report, setReport] = React.useState<I18nValidationReport | null>(null)
  
  React.useEffect(() => {
    // In production, this would load actual translations
    const validationReport = i18nValidator.validate(locale)
    setReport(validationReport)
  }, [locale])
  
  return report
}