#!/usr/bin/env node

/**
 * 📊 Prismy Quality Dashboard
 * Comprehensive quality metrics reporting for Vietnamese translation platform
 *
 * Usage: node scripts/quality-dashboard.js [--format=json|html|markdown]
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class QualityDashboard {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      coverage: {},
      security: {},
      performance: {},
      accessibility: {},
      codeQuality: {},
      vietnamese: {},
      summary: {},
    }
  }

  /**
   * 📊 Collect Test Coverage Metrics
   */
  collectCoverageMetrics() {
    console.log('📊 Collecting test coverage metrics...')

    try {
      // Run Jest with coverage
      execSync('npm test -- --coverage --watchAll=false --silent', {
        stdio: 'pipe',
      })

      // Read coverage summary
      const coveragePath = path.join(
        process.cwd(),
        'coverage',
        'coverage-summary.json'
      )
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))

        this.metrics.coverage = {
          lines: {
            total: coverage.total.lines.total,
            covered: coverage.total.lines.covered,
            percentage: coverage.total.lines.pct,
          },
          branches: {
            total: coverage.total.branches.total,
            covered: coverage.total.branches.covered,
            percentage: coverage.total.branches.pct,
          },
          functions: {
            total: coverage.total.functions.total,
            covered: coverage.total.functions.covered,
            percentage: coverage.total.functions.pct,
          },
          statements: {
            total: coverage.total.statements.total,
            covered: coverage.total.statements.covered,
            percentage: coverage.total.statements.pct,
          },
          threshold: {
            lines: 70,
            branches: 60,
            functions: 70,
            statements: 70,
          },
          status: {
            lines: coverage.total.lines.pct >= 70 ? 'PASS' : 'FAIL',
            branches: coverage.total.branches.pct >= 60 ? 'PASS' : 'FAIL',
            functions: coverage.total.functions.pct >= 70 ? 'PASS' : 'FAIL',
            statements: coverage.total.statements.pct >= 70 ? 'PASS' : 'FAIL',
          },
        }

        // Detailed module coverage
        this.metrics.coverage.modules = Object.entries(coverage)
          .filter(([key]) => key !== 'total')
          .map(([file, data]) => ({
            file: file.replace(process.cwd(), ''),
            lines: data.lines.pct,
            branches: data.branches.pct,
            functions: data.functions.pct,
            statements: data.statements.pct,
          }))
          .sort((a, b) => b.lines - a.lines)
      }

      console.log('✅ Coverage metrics collected')
    } catch (error) {
      console.log('⚠️ Coverage collection failed:', error.message)
      this.metrics.coverage.error = error.message
    }
  }

  /**
   * 🛡️ Collect Security Metrics
   */
  collectSecurityMetrics() {
    console.log('🛡️ Collecting security metrics...')

    try {
      // Check for security audit
      const auditResult = execSync('npm audit --json --audit-level=moderate', {
        stdio: 'pipe',
        encoding: 'utf8',
      })

      const audit = JSON.parse(auditResult)

      this.metrics.security = {
        vulnerabilities: {
          total: audit.metadata?.vulnerabilities?.total || 0,
          critical: audit.metadata?.vulnerabilities?.critical || 0,
          high: audit.metadata?.vulnerabilities?.high || 0,
          moderate: audit.metadata?.vulnerabilities?.moderate || 0,
          low: audit.metadata?.vulnerabilities?.low || 0,
          info: audit.metadata?.vulnerabilities?.info || 0,
        },
        packages: {
          total: audit.metadata?.totalDependencies || 0,
          vulnerable: Object.keys(audit.vulnerabilities || {}).length,
        },
        status:
          (audit.metadata?.vulnerabilities?.critical || 0) === 0 &&
          (audit.metadata?.vulnerabilities?.high || 0) === 0
            ? 'PASS'
            : 'FAIL',
      }

      // Check ZAP scan results if available
      const zapReportPath = path.join(
        process.cwd(),
        'security',
        'baseline-report.json'
      )
      if (fs.existsSync(zapReportPath)) {
        const zapReport = JSON.parse(fs.readFileSync(zapReportPath, 'utf8'))

        const zapVulns = { high: 0, medium: 0, low: 0, info: 0 }
        if (zapReport.site && zapReport.site[0] && zapReport.site[0].alerts) {
          zapReport.site[0].alerts.forEach(alert => {
            const risk = alert.riskdesc.toLowerCase()
            if (risk.includes('high')) zapVulns.high++
            else if (risk.includes('medium')) zapVulns.medium++
            else if (risk.includes('low')) zapVulns.low++
            else zapVulns.info++
          })
        }

        this.metrics.security.zap = {
          scan_date: zapReport['@generated'],
          vulnerabilities: zapVulns,
          status: zapVulns.high === 0 ? 'PASS' : 'FAIL',
        }
      }

      console.log('✅ Security metrics collected')
    } catch (error) {
      console.log('⚠️ Security collection failed:', error.message)
      this.metrics.security.error = error.message
    }
  }

  /**
   * 🎨 Collect Code Quality Metrics
   */
  collectCodeQualityMetrics() {
    console.log('🎨 Collecting code quality metrics...')

    try {
      // ESLint analysis
      const eslintResult = execSync(
        'npx eslint --format=json lib/ components/ app/ || true',
        {
          stdio: 'pipe',
          encoding: 'utf8',
        }
      )

      const eslintData = JSON.parse(eslintResult || '[]')

      let totalErrors = 0
      let totalWarnings = 0

      eslintData.forEach(file => {
        totalErrors += file.errorCount
        totalWarnings += file.warningCount
      })

      this.metrics.codeQuality = {
        eslint: {
          errors: totalErrors,
          warnings: totalWarnings,
          files_checked: eslintData.length,
          status: totalErrors === 0 ? 'PASS' : 'FAIL',
        },
      }

      // TypeScript check
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' })
        this.metrics.codeQuality.typescript = {
          status: 'PASS',
          errors: 0,
        }
      } catch (tsError) {
        this.metrics.codeQuality.typescript = {
          status: 'FAIL',
          errors: (tsError.stdout?.match(/error TS\d+:/g) || []).length,
        }
      }

      // Code complexity analysis (simplified)
      const complexFiles = execSync(
        'find lib/ components/ app/ -name "*.ts" -o -name "*.tsx" | head -20',
        {
          encoding: 'utf8',
        }
      )
        .split('\n')
        .filter(Boolean)

      let totalLines = 0
      let totalFiles = 0

      complexFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8')
          totalLines += content.split('\n').length
          totalFiles++
        } catch (e) {
          // Ignore file read errors
        }
      })

      this.metrics.codeQuality.complexity = {
        total_files: totalFiles,
        total_lines: totalLines,
        avg_lines_per_file: Math.round(totalLines / totalFiles) || 0,
        status: totalLines / totalFiles < 300 ? 'PASS' : 'WARN',
      }

      console.log('✅ Code quality metrics collected')
    } catch (error) {
      console.log('⚠️ Code quality collection failed:', error.message)
      this.metrics.codeQuality.error = error.message
    }
  }

  /**
   * 🇻🇳 Collect Vietnamese Market Compliance Metrics
   */
  collectVietnameseMetrics() {
    console.log('🇻🇳 Collecting Vietnamese market compliance metrics...')

    try {
      const metrics = {
        payment_gateways: {
          vnpay: false,
          momo: false,
          stripe: false,
        },
        localization: {
          vietnamese_translations: 0,
          english_translations: 0,
          currency_vnd: false,
        },
        compliance: {
          data_privacy: false,
          security_headers: false,
          payment_security: false,
        },
      }

      // Scan for payment gateway implementations
      const paymentFiles = execSync(
        'find lib/ components/ app/ -name "*.ts" -o -name "*.tsx"',
        {
          encoding: 'utf8',
        }
      )
        .split('\n')
        .filter(Boolean)

      paymentFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8')

          if (content.includes('vnp_') || content.includes('vnpay')) {
            metrics.payment_gateways.vnpay = true
          }
          if (content.includes('momo_') || content.includes('MoMo')) {
            metrics.payment_gateways.momo = true
          }
          if (content.includes('stripe') || content.includes('Stripe')) {
            metrics.payment_gateways.stripe = true
          }
          if (content.includes('VND') || content.includes('₫')) {
            metrics.localization.currency_vnd = true
          }
        } catch (e) {
          // Ignore file read errors
        }
      })

      // Check for i18n files
      try {
        const i18nPath = path.join(process.cwd(), 'lib', 'i18n')
        if (fs.existsSync(i18nPath)) {
          const i18nFiles = fs.readdirSync(i18nPath)

          i18nFiles.forEach(file => {
            if (file.includes('vi') || file.includes('vietnamese')) {
              metrics.localization.vietnamese_translations++
            }
            if (file.includes('en') || file.includes('english')) {
              metrics.localization.english_translations++
            }
          })
        }
      } catch (e) {
        // i18n directory not found
      }

      // Check security headers configuration
      try {
        const nextConfigPath = path.join(process.cwd(), 'next.config.js')
        if (fs.existsSync(nextConfigPath)) {
          const nextConfig = fs.readFileSync(nextConfigPath, 'utf8')
          if (
            nextConfig.includes('X-Frame-Options') ||
            nextConfig.includes('Content-Security-Policy') ||
            nextConfig.includes('securityHeaders')
          ) {
            metrics.compliance.security_headers = true
          }
        }
      } catch (e) {
        // next.config.js not readable
      }

      // Overall compliance score
      const complianceScore =
        Object.values(metrics.payment_gateways).filter(Boolean).length +
        (metrics.localization.vietnamese_translations > 0 ? 1 : 0) +
        (metrics.localization.currency_vnd ? 1 : 0) +
        Object.values(metrics.compliance).filter(Boolean).length

      this.metrics.vietnamese = {
        ...metrics,
        compliance_score: complianceScore,
        max_score: 7,
        status: complianceScore >= 5 ? 'PASS' : 'WARN',
      }

      console.log('✅ Vietnamese compliance metrics collected')
    } catch (error) {
      console.log('⚠️ Vietnamese metrics collection failed:', error.message)
      this.metrics.vietnamese.error = error.message
    }
  }

  /**
   * 📈 Generate Quality Summary
   */
  generateSummary() {
    const scores = {
      coverage: this.calculateCoverageScore(),
      security: this.calculateSecurityScore(),
      codeQuality: this.calculateCodeQualityScore(),
      vietnamese: this.calculateVietnameseScore(),
    }

    const overallScore =
      Object.values(scores).reduce((sum, score) => sum + score, 0) / 4

    this.metrics.summary = {
      overall_score: Math.round(overallScore),
      grade: this.getGrade(overallScore),
      scores,
      status:
        overallScore >= 80
          ? 'EXCELLENT'
          : overallScore >= 70
            ? 'GOOD'
            : overallScore >= 60
              ? 'ACCEPTABLE'
              : 'NEEDS_IMPROVEMENT',
      recommendations: this.generateRecommendations(scores),
    }
  }

  calculateCoverageScore() {
    if (!this.metrics.coverage.lines) return 0

    const lineScore = Math.min(
      (this.metrics.coverage.lines.percentage / 70) * 100,
      100
    )
    const branchScore = Math.min(
      (this.metrics.coverage.branches.percentage / 60) * 100,
      100
    )

    return Math.round((lineScore + branchScore) / 2)
  }

  calculateSecurityScore() {
    if (this.metrics.security.error) return 0

    let score = 100

    // Deduct for vulnerabilities
    if (this.metrics.security.vulnerabilities) {
      score -= this.metrics.security.vulnerabilities.critical * 25
      score -= this.metrics.security.vulnerabilities.high * 15
      score -= this.metrics.security.vulnerabilities.moderate * 5
    }

    return Math.max(score, 0)
  }

  calculateCodeQualityScore() {
    if (this.metrics.codeQuality.error) return 0

    let score = 100

    // Deduct for ESLint errors
    if (this.metrics.codeQuality.eslint) {
      score -= this.metrics.codeQuality.eslint.errors * 10
      score -= this.metrics.codeQuality.eslint.warnings * 2
    }

    // Deduct for TypeScript errors
    if (this.metrics.codeQuality.typescript?.errors) {
      score -= this.metrics.codeQuality.typescript.errors * 5
    }

    return Math.max(score, 0)
  }

  calculateVietnameseScore() {
    if (this.metrics.vietnamese.error) return 0

    return Math.round(
      (this.metrics.vietnamese.compliance_score /
        this.metrics.vietnamese.max_score) *
        100
    )
  }

  getGrade(score) {
    if (score >= 90) return 'A+'
    if (score >= 85) return 'A'
    if (score >= 80) return 'A-'
    if (score >= 75) return 'B+'
    if (score >= 70) return 'B'
    if (score >= 65) return 'B-'
    if (score >= 60) return 'C+'
    if (score >= 55) return 'C'
    if (score >= 50) return 'C-'
    return 'F'
  }

  generateRecommendations(scores) {
    const recommendations = []

    if (scores.coverage < 80) {
      recommendations.push(
        'Increase test coverage to ≥70% lines and ≥60% branches'
      )
    }

    if (scores.security < 90) {
      recommendations.push(
        'Address security vulnerabilities and implement security headers'
      )
    }

    if (scores.codeQuality < 85) {
      recommendations.push(
        'Fix ESLint errors and TypeScript compilation issues'
      )
    }

    if (scores.vietnamese < 80) {
      recommendations.push(
        'Enhance Vietnamese market compliance (payment gateways, localization)'
      )
    }

    return recommendations
  }

  /**
   * 📊 Run Complete Quality Analysis
   */
  async runAnalysis() {
    console.log('🚀 Starting Prismy Quality Dashboard Analysis...\n')

    // Skip coverage due to MSW polyfill issues
    // this.collectCoverageMetrics();
    this.collectSecurityMetrics()
    this.collectCodeQualityMetrics()
    this.collectVietnameseMetrics()
    this.generateSummary()

    console.log('\n✅ Quality analysis completed!')
    return this.metrics
  }

  /**
   * 📝 Generate Markdown Report
   */
  generateMarkdownReport() {
    const { summary, coverage, security, codeQuality, vietnamese } =
      this.metrics

    return `# 📊 Prismy Quality Dashboard

**Generated:** ${new Date(this.metrics.timestamp).toLocaleString()}  
**Overall Score:** ${summary.overall_score}/100 (${summary.grade})  
**Status:** ${summary.status}

## 🎯 Quality Summary

| Metric | Score | Status |
|--------|--------|--------|
| 📊 Test Coverage | ${summary.scores.coverage}/100 | ${coverage.status?.lines === 'PASS' ? '✅' : '❌'} |
| 🛡️ Security | ${summary.scores.security}/100 | ${security.status === 'PASS' ? '✅' : '❌'} |
| 🎨 Code Quality | ${summary.scores.codeQuality}/100 | ${codeQuality.eslint?.status === 'PASS' ? '✅' : '❌'} |
| 🇻🇳 Vietnamese Compliance | ${summary.scores.vietnamese}/100 | ${vietnamese.status === 'PASS' ? '✅' : '⚠️'} |

## 📊 Test Coverage Details

- **Lines:** ${coverage.lines?.percentage || 0}% (${coverage.lines?.covered || 0}/${coverage.lines?.total || 0})
- **Branches:** ${coverage.branches?.percentage || 0}% (${coverage.branches?.covered || 0}/${coverage.branches?.total || 0})
- **Functions:** ${coverage.functions?.percentage || 0}% (${coverage.functions?.covered || 0}/${coverage.functions?.total || 0})
- **Statements:** ${coverage.statements?.percentage || 0}% (${coverage.statements?.covered || 0}/${coverage.statements?.total || 0})

## 🛡️ Security Analysis

${
  security.vulnerabilities
    ? `
- **Critical:** ${security.vulnerabilities.critical}
- **High:** ${security.vulnerabilities.high}
- **Moderate:** ${security.vulnerabilities.moderate}
- **Low:** ${security.vulnerabilities.low}
`
    : 'Security metrics not available'
}

## 🇻🇳 Vietnamese Market Compliance

- **Payment Gateways:** VNPay ${vietnamese.payment_gateways?.vnpay ? '✅' : '❌'} | MoMo ${vietnamese.payment_gateways?.momo ? '✅' : '❌'} | Stripe ${vietnamese.payment_gateways?.stripe ? '✅' : '❌'}
- **Localization:** ${vietnamese.localization?.vietnamese_translations || 0} Vietnamese files, VND currency ${vietnamese.localization?.currency_vnd ? '✅' : '❌'}
- **Compliance Score:** ${vietnamese.compliance_score || 0}/${vietnamese.max_score || 7}

## 📝 Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

---
**🎯 Absolute Goal:** "Sản phẩm đầu ra không thoả hiệp về chất lượng"`
  }
}

// CLI Usage
if (require.main === module) {
  const dashboard = new QualityDashboard()
  const format =
    process.argv.find(arg => arg.startsWith('--format='))?.split('=')[1] ||
    'markdown'

  dashboard
    .runAnalysis()
    .then(metrics => {
      if (format === 'json') {
        console.log(JSON.stringify(metrics, null, 2))
      } else if (format === 'markdown') {
        console.log(dashboard.generateMarkdownReport())
      } else {
        console.log('📊 Quality Dashboard Results:')
        console.log(
          `Overall Score: ${metrics.summary.overall_score}/100 (${metrics.summary.grade})`
        )
        console.log(`Status: ${metrics.summary.status}`)
      }
    })
    .catch(console.error)
}

module.exports = QualityDashboard
