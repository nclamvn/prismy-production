#!/usr/bin/env tsx

/**
 * Prismy UI Audit Tool
 * Comprehensive analysis of UI components, Tailwind classes, and style patterns
 * Generates inventory for design system creation and duplicate elimination
 */

import { promises as fs } from 'fs'
import path from 'path'
import fg from 'fast-glob'

interface TailwindClassUsage {
  class: string
  count: number
  files: string[]
  category: string
  variants: string[]
}

interface ComponentInventory {
  name: string
  path: string
  type: 'component' | 'page' | 'layout'
  tailwindClasses: string[]
  inlineStyles: string[]
  dependencies: string[]
  propsInterface?: string
}

interface UIAuditReport {
  timestamp: string
  summary: {
    totalFiles: number
    totalComponents: number
    uniqueTailwindClasses: number
    duplicatePatterns: number
    inlineStyles: number
  }
  tailwindClasses: TailwindClassUsage[]
  components: ComponentInventory[]
  duplicatePatterns: Array<{
    pattern: string
    count: number
    files: string[]
    suggestion: string
  }>
  recommendations: string[]
  vietnameseSpecific: {
    vndCurrencyUsage: number
    vietnameseTextDetected: number
    localizationPatterns: string[]
  }
}

class UIAuditor {
  private report: UIAuditReport
  private rootDir: string

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        totalComponents: 0,
        uniqueTailwindClasses: 0,
        duplicatePatterns: 0,
        inlineStyles: 0,
      },
      tailwindClasses: [],
      components: [],
      duplicatePatterns: [],
      recommendations: [],
      vietnameseSpecific: {
        vndCurrencyUsage: 0,
        vietnameseTextDetected: 0,
        localizationPatterns: [],
      },
    }
  }

  /**
   * Main audit process
   */
  async runAudit(): Promise<UIAuditReport> {
    console.log('🎨 Starting Prismy UI Audit...\n')

    // Find all relevant files
    const files = await this.findUIFiles()
    this.report.summary.totalFiles = files.length

    console.log(`📁 Found ${files.length} UI files to analyze`)

    // Process each file
    for (const file of files) {
      await this.analyzeFile(file)
    }

    // Analyze patterns and generate recommendations
    this.analyzeDuplicatePatterns()
    this.analyzeVietnameseSpecific()
    this.generateRecommendations()
    this.calculateSummary()

    console.log('\n✅ UI Audit completed!')
    return this.report
  }

  /**
   * Find all UI-related files
   */
  private async findUIFiles(): Promise<string[]> {
    const patterns = [
      'app/**/*.{tsx,jsx}',
      'components/**/*.{tsx,jsx}',
      'lib/**/*.{tsx,jsx}',
      'pages/**/*.{tsx,jsx}', // Legacy Next.js pages
    ]

    try {
      const files = await fg(patterns, {
        cwd: this.rootDir,
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
        onlyFiles: true,
        absolute: false,
      })

      return files
    } catch (error) {
      console.error(`❌ Error finding UI files: ${error}`)
      return []
    }
  }

  /**
   * Analyze individual file
   */
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(
        path.join(this.rootDir, filePath),
        'utf8'
      )

      // Extract component info
      const component = this.extractComponentInfo(filePath, content)
      this.report.components.push(component)

      // Count Tailwind classes
      this.extractTailwindClasses(content, filePath)

      // Check for Vietnamese-specific content
      this.checkVietnameseContent(content)
    } catch (error) {
      console.warn(`⚠️  Could not analyze ${filePath}: ${error}`)
    }
  }

  /**
   * Extract component information
   */
  private extractComponentInfo(
    filePath: string,
    content: string
  ): ComponentInventory {
    const componentName = path.basename(filePath, path.extname(filePath))

    // Determine component type
    let type: 'component' | 'page' | 'layout'
    if (
      filePath.includes('/app/') &&
      (filePath.includes('page.tsx') || filePath.includes('layout.tsx'))
    ) {
      type = filePath.includes('layout.tsx') ? 'layout' : 'page'
    } else {
      type = 'component'
    }

    // Extract Tailwind classes
    const tailwindClasses = this.extractTailwindClassesFromContent(content)

    // Extract inline styles
    const inlineStyles = this.extractInlineStyles(content)

    // Extract dependencies (imports)
    const dependencies = this.extractDependencies(content)

    // Try to extract props interface
    const propsInterface = this.extractPropsInterface(content, componentName)

    return {
      name: componentName,
      path: filePath,
      type,
      tailwindClasses,
      inlineStyles,
      dependencies,
      propsInterface,
    }
  }

  /**
   * Extract Tailwind classes from content
   */
  private extractTailwindClassesFromContent(content: string): string[] {
    const classPattern = /className\s*=\s*["'`]([^"'`]+)["'`]/g
    const clsxPattern = /(?:clsx|cn|classNames)\s*\(\s*["'`]([^"'`]+)["'`]/g

    const classes: string[] = []
    let match

    // Extract from className
    while ((match = classPattern.exec(content)) !== null) {
      const classString = match[1]
      classes.push(...this.parseClassString(classString))
    }

    // Extract from clsx/cn utility functions
    while ((match = clsxPattern.exec(content)) !== null) {
      const classString = match[1]
      classes.push(...this.parseClassString(classString))
    }

    return [...new Set(classes)]
  }

  /**
   * Parse class string into individual classes
   */
  private parseClassString(classString: string): string[] {
    return classString
      .split(/\s+/)
      .filter(cls => cls.trim().length > 0)
      .map(cls => cls.trim())
  }

  /**
   * Extract and categorize Tailwind classes
   */
  private extractTailwindClasses(content: string, filePath: string): void {
    const classes = this.extractTailwindClassesFromContent(content)

    for (const cls of classes) {
      const existing = this.report.tailwindClasses.find(
        item => item.class === cls
      )

      if (existing) {
        existing.count++
        if (!existing.files.includes(filePath)) {
          existing.files.push(filePath)
        }
      } else {
        this.report.tailwindClasses.push({
          class: cls,
          count: 1,
          files: [filePath],
          category: this.categorizeTailwindClass(cls),
          variants: this.extractVariants(cls),
        })
      }
    }
  }

  /**
   * Categorize Tailwind class
   */
  private categorizeTailwindClass(cls: string): string {
    // Remove responsive/state prefixes for categorization
    const baseClass = cls.replace(
      /^(sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:)/,
      ''
    )

    if (baseClass.startsWith('text-')) return 'typography'
    if (baseClass.startsWith('font-')) return 'typography'
    if (baseClass.startsWith('bg-')) return 'colors'
    if (baseClass.startsWith('border-')) return 'colors'
    if (baseClass.startsWith('text-')) return 'colors'
    if (
      baseClass.match(/^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|space|gap)-/)
    )
      return 'spacing'
    if (baseClass.match(/^(w-|h-|min-|max-)/)) return 'sizing'
    if (baseClass.match(/^(flex|grid|block|inline)/)) return 'layout'
    if (baseClass.match(/^(rounded|border)/)) return 'borders'
    if (baseClass.match(/^(shadow|opacity|transform)/)) return 'effects'
    if (baseClass.match(/^(transition|duration|ease)/)) return 'animations'

    return 'other'
  }

  /**
   * Extract variants from class
   */
  private extractVariants(cls: string): string[] {
    const variants: string[] = []
    const parts = cls.split(':')

    if (parts.length > 1) {
      variants.push(...parts.slice(0, -1))
    }

    return variants
  }

  /**
   * Extract inline styles
   */
  private extractInlineStyles(content: string): string[] {
    const stylePattern = /style\s*=\s*\{([^}]+)\}/g
    const styles: string[] = []
    let match

    while ((match = stylePattern.exec(content)) !== null) {
      styles.push(match[1].trim())
    }

    return styles
  }

  /**
   * Extract component dependencies
   */
  private extractDependencies(content: string): string[] {
    const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g
    const dependencies: string[] = []
    let match

    while ((match = importPattern.exec(content)) !== null) {
      const dep = match[1]
      if (!dep.startsWith('.') && !dep.startsWith('/')) {
        dependencies.push(dep)
      }
    }

    return dependencies
  }

  /**
   * Extract props interface
   */
  private extractPropsInterface(
    content: string,
    componentName: string
  ): string | undefined {
    const interfacePattern = new RegExp(
      `interface\\s+${componentName}Props\\s*\\{([^}]+)\\}`,
      's'
    )
    const match = content.match(interfacePattern)

    return match ? match[0] : undefined
  }

  /**
   * Check for Vietnamese-specific content
   */
  private checkVietnameseContent(content: string): void {
    // Check for VND currency
    if (content.includes('₫') || content.includes('VND')) {
      this.report.vietnameseSpecific.vndCurrencyUsage++
    }

    // Check for Vietnamese text (diacritics)
    const vietnamesePattern =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    if (vietnamesePattern.test(content)) {
      this.report.vietnameseSpecific.vietnameseTextDetected++
    }

    // Check for localization patterns
    if (
      content.includes('locale') ||
      content.includes('vi-VN') ||
      content.includes('en-US')
    ) {
      this.report.vietnameseSpecific.localizationPatterns.push('locale-aware')
    }
  }

  /**
   * Analyze duplicate patterns
   */
  private analyzeDuplicatePatterns(): void {
    // Group similar Tailwind class combinations
    const classGroups = new Map<string, string[]>()

    for (const component of this.report.components) {
      for (const cls of component.tailwindClasses) {
        const category = this.categorizeTailwindClass(cls)
        if (!classGroups.has(category)) {
          classGroups.set(category, [])
        }
        classGroups.get(category)!.push(cls)
      }
    }

    // Find frequent patterns
    for (const [category, classes] of classGroups) {
      const classCounts = new Map<string, number>()

      for (const cls of classes) {
        classCounts.set(cls, (classCounts.get(cls) || 0) + 1)
      }

      // Find classes used multiple times
      for (const [cls, count] of classCounts) {
        if (count > 3) {
          // Used in more than 3 places
          this.report.duplicatePatterns.push({
            pattern: cls,
            count,
            files:
              this.report.tailwindClasses.find(item => item.class === cls)
                ?.files || [],
            suggestion: this.generateSuggestion(cls, category),
          })
        }
      }
    }
  }

  /**
   * Generate suggestion for duplicate pattern
   */
  private generateSuggestion(cls: string, category: string): string {
    switch (category) {
      case 'typography':
        return `Consider creating a typography token: text-${cls.replace('text-', '')}`
      case 'colors':
        return `Consider creating a color token: ${cls}`
      case 'spacing':
        return `Consider creating a spacing token: space-${cls.split('-')[1]}`
      default:
        return `Consider creating a utility class or component variant`
    }
  }

  /**
   * Analyze Vietnamese-specific requirements
   */
  private analyzeVietnameseSpecific(): void {
    // This will be expanded with more Vietnamese-specific analysis
    if (this.report.vietnameseSpecific.vndCurrencyUsage > 0) {
      this.report.recommendations.push(
        '🇻🇳 Create VND currency formatting utilities'
      )
    }

    if (this.report.vietnameseSpecific.vietnameseTextDetected > 0) {
      this.report.recommendations.push(
        '🇻🇳 Ensure Vietnamese diacritics are properly handled in fonts'
      )
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): void {
    const { tailwindClasses, components, duplicatePatterns } = this.report

    // Color recommendations
    const colorClasses = tailwindClasses.filter(
      item => item.category === 'colors' && item.count > 2
    )
    if (colorClasses.length > 10) {
      this.report.recommendations.push(
        '🎨 Create a unified color palette - detected multiple color variations'
      )
    }

    // Typography recommendations
    const typographyClasses = tailwindClasses.filter(
      item => item.category === 'typography' && item.count > 2
    )
    if (typographyClasses.length > 8) {
      this.report.recommendations.push(
        '📝 Standardize typography scale - detected inconsistent text sizes'
      )
    }

    // Spacing recommendations
    const spacingClasses = tailwindClasses.filter(
      item => item.category === 'spacing' && item.count > 2
    )
    if (spacingClasses.length > 15) {
      this.report.recommendations.push(
        '📏 Create spacing tokens - detected inconsistent spacing patterns'
      )
    }

    // Component recommendations
    const buttonLikeComponents = components.filter(
      c =>
        c.name.toLowerCase().includes('button') ||
        c.tailwindClasses.some(
          cls => cls.includes('bg-') && cls.includes('text-')
        )
    )
    if (buttonLikeComponents.length > 3) {
      this.report.recommendations.push(
        '🔘 Consolidate button variants into a single Button component'
      )
    }

    // Duplicate pattern recommendations
    if (duplicatePatterns.length > 5) {
      this.report.recommendations.push(
        '🔄 High number of duplicate patterns detected - prioritize component extraction'
      )
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(): void {
    this.report.summary = {
      totalFiles: this.report.components.length,
      totalComponents: this.report.components.filter(
        c => c.type === 'component'
      ).length,
      uniqueTailwindClasses: this.report.tailwindClasses.length,
      duplicatePatterns: this.report.duplicatePatterns.length,
      inlineStyles: this.report.components.reduce(
        (sum, c) => sum + c.inlineStyles.length,
        0
      ),
    }
  }

  /**
   * Export to CSV
   */
  async exportToCSV(outputPath: string): Promise<void> {
    const csvData = [
      ['Category', 'Item', 'Count', 'Files', 'Recommendation'],
      ...this.report.tailwindClasses.map(item => [
        item.category,
        item.class,
        item.count.toString(),
        item.files.join('; '),
        item.count > 3 ? 'Consider tokenizing' : 'OK',
      ]),
    ]

    const csvContent = csvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    await fs.writeFile(outputPath, csvContent)
  }

  /**
   * Export full report to JSON
   */
  async exportToJSON(outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(this.report, null, 2))
  }
}

// CLI execution
async function main() {
  const auditor = new UIAuditor()

  try {
    const report = await auditor.runAudit()

    // Create output directory
    const outputDir = path.join(process.cwd(), 'tools', 'output')
    await fs.mkdir(outputDir, { recursive: true })

    // Export reports
    const timestamp = new Date().toISOString().split('T')[0]
    await auditor.exportToJSON(
      path.join(outputDir, `ui-audit-${timestamp}.json`)
    )
    await auditor.exportToCSV(
      path.join(outputDir, `ui-inventory-${timestamp}.csv`)
    )

    // Print summary
    console.log('\n📊 UI Audit Summary:')
    console.log(`   📁 Files analyzed: ${report.summary.totalFiles}`)
    console.log(`   🧩 Components found: ${report.summary.totalComponents}`)
    console.log(
      `   🎨 Unique Tailwind classes: ${report.summary.uniqueTailwindClasses}`
    )
    console.log(`   🔄 Duplicate patterns: ${report.summary.duplicatePatterns}`)
    console.log(`   💅 Inline styles: ${report.summary.inlineStyles}`)
    console.log(`\n🇻🇳 Vietnamese-specific:`)
    console.log(
      `   ₫ VND currency usage: ${report.vietnameseSpecific.vndCurrencyUsage}`
    )
    console.log(
      `   📝 Vietnamese text detected: ${report.vietnameseSpecific.vietnameseTextDetected}`
    )

    console.log('\n💡 Top Recommendations:')
    report.recommendations.slice(0, 5).forEach(rec => console.log(`   ${rec}`))

    console.log(`\n📄 Reports saved to tools/output/`)
    console.log(`   JSON: ui-audit-${timestamp}.json`)
    console.log(`   CSV: ui-inventory-${timestamp}.csv`)
  } catch (error) {
    console.error('❌ UI Audit failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { UIAuditor, type UIAuditReport }
