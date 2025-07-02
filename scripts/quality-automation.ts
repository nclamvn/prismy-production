#!/usr/bin/env tsx
/**
 * UI/UX Polish Sprint - Phase 3.1: A11y & i18n Automation CLI
 * 
 * Automated quality assurance script for accessibility and internationalization
 * Runs comprehensive checks and generates actionable reports
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { AccessibilityChecker, A11yReport } from '../lib/a11y/accessibility-checker'
import { I18nValidator, I18nValidationReport, SUPPORTED_LOCALES } from '../lib/i18n/i18n-validator'

interface QualityReport {
  timestamp: string
  project: string
  version: string
  summary: {
    accessibility: {
      score: number
      issues: number
      criticalIssues: number
    }
    i18n: {
      coverage: Record<string, number>
      totalIssues: number
      missingTranslations: number
    }
  }
  details: {
    accessibility: A11yReport[]
    i18n: I18nValidationReport[]
  }
  recommendations: string[]
}

class QualityAutomation {
  private a11yChecker = new AccessibilityChecker()
  private i18nValidator = new I18nValidator()
  private projectRoot: string
  
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot
  }
  
  /**
   * Run comprehensive quality check
   */
  async runQualityCheck(): Promise<QualityReport> {
    console.log('🔍 Starting quality automation check...')
    
    // Load project configuration
    const packageJson = this.loadPackageJson()
    
    // Run accessibility checks
    console.log('♿ Running accessibility checks...')
    const a11yReports = await this.runAccessibilityChecks()
    
    // Run i18n validation
    console.log('🌍 Running i18n validation...')
    const i18nReports = await this.runI18nValidation()
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(a11yReports, i18nReports)
    
    // Compile final report
    const report: QualityReport = {
      timestamp: new Date().toISOString(),
      project: packageJson.name || 'prismy',
      version: packageJson.version || '1.0.0',
      summary: this.generateSummary(a11yReports, i18nReports),
      details: {
        accessibility: a11yReports,
        i18n: i18nReports
      },
      recommendations
    }
    
    return report
  }
  
  /**
   * Run accessibility checks on components
   */
  private async runAccessibilityChecks(): Promise<A11yReport[]> {
    const reports: A11yReport[] = []
    const componentPaths = this.findComponentFiles()
    
    console.log(`  Found ${componentPaths.length} component files`)
    
    // For this automation, we'll scan for common accessibility issues in code
    for (const filePath of componentPaths) {
      try {
        const content = readFileSync(filePath, 'utf-8')
        const codeReport = this.analyzeComponentCode(content, filePath)
        if (codeReport) {
          reports.push(codeReport)
        }
      } catch (error) {
        console.warn(`  ⚠️ Could not analyze ${filePath}: ${error}`)
      }
    }
    
    return reports
  }
  
  /**
   * Run i18n validation for all supported locales
   */
  private async runI18nValidation(): Promise<I18nValidationReport[]> {
    const reports: I18nValidationReport[] = []
    
    // Load translations for all locales
    await this.loadTranslations()
    
    // Validate each locale
    for (const locale of Object.keys(SUPPORTED_LOCALES)) {
      try {
        const report = this.i18nValidator.validate(locale)
        reports.push(report)
        console.log(`  ${locale}: ${report.coverage.toFixed(1)}% coverage`)
      } catch (error) {
        console.warn(`  ⚠️ Could not validate ${locale}: ${error}`)
      }
    }
    
    // Scan for hardcoded strings
    await this.scanForHardcodedStrings()
    
    return reports
  }
  
  /**
   * Load translations from locale files
   */
  private async loadTranslations(): Promise<void> {
    const translationsDir = join(this.projectRoot, 'public', 'locales')
    
    if (!existsSync(translationsDir)) {
      console.warn('  ⚠️ No translations directory found at public/locales')
      return
    }
    
    for (const locale of Object.keys(SUPPORTED_LOCALES)) {
      const localeDir = join(translationsDir, locale)
      
      if (existsSync(localeDir)) {
        // Load all JSON files in locale directory
        const files = readdirSync(localeDir).filter(f => f.endsWith('.json'))
        
        for (const file of files) {
          try {
            const filePath = join(localeDir, file)
            const content = JSON.parse(readFileSync(filePath, 'utf-8'))
            const namespace = file.replace('.json', '')
            
            this.i18nValidator.loadTranslations(locale, content, namespace)
          } catch (error) {
            console.warn(`  ⚠️ Could not load ${locale}/${file}: ${error}`)
          }
        }
      }
    }
  }
  
  /**
   * Scan codebase for hardcoded strings
   */
  private async scanForHardcodedStrings(): Promise<void> {
    const codeFiles = this.findCodeFiles()
    let totalIssues = 0
    
    for (const filePath of codeFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8')
        const issues = this.i18nValidator.scanForHardcodedStrings(
          content, 
          filePath.replace(this.projectRoot, ''),
          'en'
        )
        totalIssues += issues.length
      } catch (error) {
        // Ignore files that can't be read
      }
    }
    
    console.log(`  Found ${totalIssues} potential hardcoded strings`)
  }
  
  /**
   * Analyze component code for accessibility patterns
   */
  private analyzeComponentCode(content: string, filePath: string): A11yReport | null {
    const issues: any[] = []
    const lines = content.split('\n')
    let passes = 0
    
    // Check for common accessibility patterns
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      
      // Check for img without alt
      if (line.includes('<img') && !line.includes('alt=')) {
        issues.push({
          id: `img-no-alt-${lineNumber}`,
          type: 'error',
          code: 'IMG_NO_ALT',
          message: 'Image missing alt attribute',
          wcagLevel: 'A',
          wcagCriteria: ['1.1.1'],
          impact: 'critical',
          fix: 'Add alt attribute to image'
        })
      } else if (line.includes('<img') && line.includes('alt=')) {
        passes++
      }
      
      // Check for buttons without accessible names
      if (line.includes('<button') && !line.includes('aria-label') && 
          !line.match(/<button[^>]*>.*[a-zA-Z].*<\/button>/)) {
        issues.push({
          id: `button-no-text-${lineNumber}`,
          type: 'error',
          code: 'BUTTON_NO_TEXT',
          message: 'Button without accessible text',
          wcagLevel: 'A',
          wcagCriteria: ['4.1.2'],
          impact: 'serious',
          fix: 'Add text content or aria-label to button'
        })
      }
      
      // Check for positive tabindex
      const tabindexMatch = line.match(/tabIndex={?(\d+)}?/)
      if (tabindexMatch && parseInt(tabindexMatch[1]) > 0) {
        issues.push({
          id: `tabindex-positive-${lineNumber}`,
          type: 'warning',
          code: 'TABINDEX_POSITIVE',
          message: 'Positive tabindex disrupts tab order',
          wcagLevel: 'A',
          wcagCriteria: ['2.4.3'],
          impact: 'moderate',
          fix: 'Use tabIndex={0} or tabIndex={-1}'
        })
      }
      
      // Check for form inputs without labels
      if (line.includes('<input') && !line.includes('aria-label') && 
          !line.includes('placeholder')) {
        issues.push({
          id: `input-no-label-${lineNumber}`,
          type: 'warning',
          code: 'INPUT_NO_LABEL',
          message: 'Input may be missing label',
          wcagLevel: 'A',
          wcagCriteria: ['3.3.2'],
          impact: 'serious',
          fix: 'Add aria-label, placeholder, or associated label'
        })
      }
    })
    
    // Only return report if issues found
    if (issues.length === 0 && passes === 0) return null
    
    const total = issues.length + passes
    const score = total > 0 ? Math.round((passes / total) * 100) : 100
    
    return {
      passes,
      failures: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      issues,
      score,
      timestamp: new Date().toISOString(),
      locale: filePath
    }
  }
  
  /**
   * Find all component files
   */
  private findComponentFiles(): string[] {
    const files: string[] = []
    this.scanDirectory(join(this.projectRoot, 'components'), files, ['.tsx', '.jsx'])
    this.scanDirectory(join(this.projectRoot, 'app'), files, ['.tsx', '.jsx'])
    return files
  }
  
  /**
   * Find all code files for hardcoded string scanning
   */
  private findCodeFiles(): string[] {
    const files: string[] = []
    this.scanDirectory(join(this.projectRoot, 'components'), files, ['.tsx', '.jsx', '.ts', '.js'])
    this.scanDirectory(join(this.projectRoot, 'app'), files, ['.tsx', '.jsx', '.ts', '.js'])
    this.scanDirectory(join(this.projectRoot, 'lib'), files, ['.tsx', '.jsx', '.ts', '.js'])
    return files
  }
  
  /**
   * Recursively scan directory for files
   */
  private scanDirectory(dir: string, files: string[], extensions: string[]): void {
    if (!existsSync(dir)) return
    
    const entries = readdirSync(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        this.scanDirectory(fullPath, files, extensions)
      } else if (stat.isFile() && extensions.includes(extname(entry))) {
        files.push(fullPath)
      }
    }
  }
  
  /**
   * Load package.json
   */
  private loadPackageJson(): any {
    const packagePath = join(this.projectRoot, 'package.json')
    if (existsSync(packagePath)) {
      return JSON.parse(readFileSync(packagePath, 'utf-8'))
    }
    return {}
  }
  
  /**
   * Generate summary statistics
   */
  private generateSummary(
    a11yReports: A11yReport[], 
    i18nReports: I18nValidationReport[]
  ): QualityReport['summary'] {
    // Accessibility summary
    const totalA11yIssues = a11yReports.reduce((sum, r) => sum + r.issues.length, 0)
    const criticalA11yIssues = a11yReports.reduce((sum, r) => 
      sum + r.issues.filter(i => i.impact === 'critical').length, 0
    )
    const avgA11yScore = a11yReports.length > 0 
      ? a11yReports.reduce((sum, r) => sum + r.score, 0) / a11yReports.length
      : 100
    
    // i18n summary
    const i18nCoverage: Record<string, number> = {}
    const totalI18nIssues = i18nReports.reduce((sum, r) => sum + r.issues.length, 0)
    const missingTranslations = i18nReports.reduce((sum, r) => 
      sum + r.stats.missingKeys, 0
    )
    
    i18nReports.forEach(report => {
      i18nCoverage[report.locale] = report.coverage
    })
    
    return {
      accessibility: {
        score: Math.round(avgA11yScore),
        issues: totalA11yIssues,
        criticalIssues: criticalA11yIssues
      },
      i18n: {
        coverage: i18nCoverage,
        totalIssues: totalI18nIssues,
        missingTranslations
      }
    }
  }
  
  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    a11yReports: A11yReport[], 
    i18nReports: I18nValidationReport[]
  ): string[] {
    const recommendations: string[] = []
    
    // Accessibility recommendations
    const criticalA11yIssues = a11yReports.reduce((sum, r) => 
      sum + r.issues.filter(i => i.impact === 'critical').length, 0
    )
    
    if (criticalA11yIssues > 0) {
      recommendations.push(
        `🚨 Fix ${criticalA11yIssues} critical accessibility issues immediately`
      )
    }
    
    const avgA11yScore = a11yReports.length > 0 
      ? a11yReports.reduce((sum, r) => sum + r.score, 0) / a11yReports.length
      : 100
    
    if (avgA11yScore < 85) {
      recommendations.push(
        `♿ Improve accessibility score from ${Math.round(avgA11yScore)}% to 85%+`
      )
    }
    
    // i18n recommendations
    const poorCoverageLocales = i18nReports.filter(r => r.coverage < 90)
    if (poorCoverageLocales.length > 0) {
      recommendations.push(
        `🌍 Improve translation coverage for: ${poorCoverageLocales.map(r => r.locale).join(', ')}`
      )
    }
    
    const totalMissing = i18nReports.reduce((sum, r) => sum + r.stats.missingKeys, 0)
    if (totalMissing > 10) {
      recommendations.push(
        `📝 Add ${totalMissing} missing translations across all locales`
      )
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Quality checks passed! Consider running automated tests in CI/CD')
    } else {
      recommendations.push('🔄 Run quality checks in CI/CD to prevent regressions')
    }
    
    return recommendations
  }
  
  /**
   * Save report to file
   */
  saveReport(report: QualityReport, outputPath?: string): string {
    const defaultPath = join(this.projectRoot, 'reports', 'quality-report.json')
    const filePath = outputPath || defaultPath
    
    // Ensure reports directory exists
    const reportsDir = join(this.projectRoot, 'reports')
    if (!existsSync(reportsDir)) {
      require('fs').mkdirSync(reportsDir, { recursive: true })
    }
    
    writeFileSync(filePath, JSON.stringify(report, null, 2))
    return filePath
  }
  
  /**
   * Generate human-readable report
   */
  generateHumanReport(report: QualityReport): string {
    let output = ''
    
    output += `# Quality Report - ${report.project} v${report.version}\n`
    output += `Generated: ${new Date(report.timestamp).toLocaleString()}\n\n`
    
    // Summary
    output += `## Summary\n\n`
    output += `### Accessibility\n`
    output += `- Score: ${report.summary.accessibility.score}%\n`
    output += `- Issues: ${report.summary.accessibility.issues}\n`
    output += `- Critical: ${report.summary.accessibility.criticalIssues}\n\n`
    
    output += `### Internationalization\n`
    Object.entries(report.summary.i18n.coverage).forEach(([locale, coverage]) => {
      output += `- ${locale}: ${coverage.toFixed(1)}% coverage\n`
    })
    output += `- Total Issues: ${report.summary.i18n.totalIssues}\n`
    output += `- Missing Translations: ${report.summary.i18n.missingTranslations}\n\n`
    
    // Recommendations
    output += `## Recommendations\n\n`
    report.recommendations.forEach(rec => {
      output += `- ${rec}\n`
    })
    
    return output
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const outputFormat = args.includes('--format=json') ? 'json' : 'human'
  const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1]
  
  console.log('🚀 Prismy Quality Automation\n')
  
  const automation = new QualityAutomation()
  
  try {
    const report = await automation.runQualityCheck()
    
    console.log('\n📊 Quality Check Complete!')
    console.log(`Accessibility Score: ${report.summary.accessibility.score}%`)
    console.log(`i18n Coverage: ${Object.values(report.summary.i18n.coverage).reduce((a, b) => a + b, 0) / Object.keys(report.summary.i18n.coverage).length || 0}%`)
    
    // Save report
    const savedPath = automation.saveReport(report, outputPath)
    console.log(`\n💾 Report saved: ${savedPath}`)
    
    // Output human-readable report
    if (outputFormat === 'human') {
      const humanReport = automation.generateHumanReport(report)
      console.log('\n' + humanReport)
    } else {
      console.log(JSON.stringify(report, null, 2))
    }
    
    // Exit with error code if critical issues found
    if (report.summary.accessibility.criticalIssues > 0) {
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Quality check failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { QualityAutomation }