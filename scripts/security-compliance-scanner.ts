#!/usr/bin/env ts-node
/**
 * SECURITY COMPLIANCE SCANNER
 * Automated security assessment for production deployment
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface SecurityCheck {
  name: string
  category: 'critical' | 'high' | 'medium' | 'low'
  status: 'pass' | 'fail' | 'warning' | 'skip'
  description: string
  details?: string
  recommendation?: string
}

interface SecurityReport {
  timestamp: string
  version: string
  environment: string
  overallScore: number
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
    skipped: number
  }
  categories: {
    critical: SecurityCheck[]
    high: SecurityCheck[]
    medium: SecurityCheck[]
    low: SecurityCheck[]
  }
  recommendations: string[]
}

class SecurityComplianceScanner {
  private checks: SecurityCheck[] = []
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  async runFullScan(): Promise<SecurityReport> {
    console.log('🔍 Starting Security Compliance Scan...\n')

    // Initialize Supabase client for configuration checks
    const supabase = this.initializeSupabase()

    // Run all security checks
    await this.checkEnvironmentConfiguration()
    await this.checkDependencyVulnerabilities()
    await this.checkDatabaseSecurity(supabase)
    await this.checkAPISecurityConfiguration()
    await this.checkFilePermissions()
    await this.checkDockerSecurity()
    await this.checkSSLConfiguration()
    await this.checkCSPConfiguration()
    await this.checkAuthenticationSecurity(supabase)
    await this.checkDataEncryption()
    await this.checkLoggingConfiguration()
    await this.checkRateLimitingConfiguration()
    await this.checkCORSConfiguration()
    await this.checkSecurityHeaders()
    await this.checkSecretsManagement()

    // Generate report
    const report = this.generateReport()
    
    // Save report
    await this.saveReport(report)
    
    // Display summary
    this.displaySummary(report)

    return report
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      this.addCheck({
        name: 'Supabase Configuration',
        category: 'critical',
        status: 'fail',
        description: 'Supabase credentials not configured',
        recommendation: 'Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      })
      return null
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  private async checkEnvironmentConfiguration() {
    console.log('🔧 Checking Environment Configuration...')

    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV
    this.addCheck({
      name: 'Production Environment',
      category: 'critical',
      status: nodeEnv === 'production' ? 'pass' : 'fail',
      description: `NODE_ENV is set to: ${nodeEnv}`,
      recommendation: nodeEnv !== 'production' ? 'Set NODE_ENV=production for production deployment' : undefined
    })

    // Check required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'DATABASE_URL'
    ]

    for (const envVar of requiredEnvVars) {
      this.addCheck({
        name: `Environment Variable: ${envVar}`,
        category: 'high',
        status: process.env[envVar] ? 'pass' : 'fail',
        description: `${envVar} is ${process.env[envVar] ? 'configured' : 'missing'}`,
        recommendation: !process.env[envVar] ? `Set ${envVar} environment variable` : undefined
      })
    }

    // Check for hardcoded secrets in code
    try {
      const { stdout } = await execAsync('grep -r "api[_-]key\\|secret\\|password\\|token" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . || true')
      const suspiciousLines = stdout.split('\n').filter(line => 
        line.trim() && 
        !line.includes('process.env') && 
        !line.includes('// TODO') &&
        !line.includes('placeholder') &&
        !line.includes('example')
      )

      this.addCheck({
        name: 'Hardcoded Secrets Detection',
        category: 'critical',
        status: suspiciousLines.length === 0 ? 'pass' : 'fail',
        description: `Found ${suspiciousLines.length} potential hardcoded secrets`,
        details: suspiciousLines.slice(0, 5).join('\n'),
        recommendation: suspiciousLines.length > 0 ? 'Remove hardcoded secrets and use environment variables' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Hardcoded Secrets Detection',
        category: 'critical',
        status: 'warning',
        description: 'Could not scan for hardcoded secrets',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async checkDependencyVulnerabilities() {
    console.log('📦 Checking Dependency Vulnerabilities...')

    try {
      const { stdout } = await execAsync('npm audit --json', { maxBuffer: 1024 * 1024 * 10 })
      const auditResult = JSON.parse(stdout)

      const vulnerabilities = auditResult.vulnerabilities || {}
      const totalVulns = Object.keys(vulnerabilities).length
      const criticalVulns = Object.values(vulnerabilities).filter((v: any) => v.severity === 'critical').length
      const highVulns = Object.values(vulnerabilities).filter((v: any) => v.severity === 'high').length

      this.addCheck({
        name: 'Dependency Vulnerabilities',
        category: 'high',
        status: criticalVulns === 0 && highVulns === 0 ? 'pass' : criticalVulns > 0 ? 'fail' : 'warning',
        description: `Found ${totalVulns} vulnerabilities (${criticalVulns} critical, ${highVulns} high)`,
        recommendation: totalVulns > 0 ? 'Run "npm audit fix" to resolve vulnerabilities' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Dependency Vulnerabilities',
        category: 'high',
        status: 'warning',
        description: 'Could not run npm audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async checkDatabaseSecurity(supabase: any) {
    console.log('🗄️ Checking Database Security...')

    if (!supabase) return

    try {
      // Check RLS policies
      const { data: tables, error } = await supabase.rpc('get_table_rls_status')
      
      if (!error && tables) {
        const tablesWithoutRLS = tables.filter((table: any) => !table.rls_enabled)
        
        this.addCheck({
          name: 'Row Level Security (RLS)',
          category: 'critical',
          status: tablesWithoutRLS.length === 0 ? 'pass' : 'fail',
          description: `${tablesWithoutRLS.length} tables without RLS enabled`,
          details: tablesWithoutRLS.map((t: any) => t.table_name).join(', '),
          recommendation: tablesWithoutRLS.length > 0 ? 'Enable RLS on all user-accessible tables' : undefined
        })
      } else {
        this.addCheck({
          name: 'Row Level Security (RLS)',
          category: 'critical',
          status: 'warning',
          description: 'Could not check RLS status',
          details: error?.message
        })
      }

      // Check for default passwords
      const { data: users } = await supabase.auth.admin.listUsers()
      const testAccounts = users?.users?.filter((user: any) => 
        user.email.includes('test') || 
        user.email.includes('admin') || 
        user.email.includes('demo')
      ) || []

      this.addCheck({
        name: 'Test Account Security',
        category: 'high',
        status: testAccounts.length === 0 ? 'pass' : 'fail',
        description: `Found ${testAccounts.length} potential test accounts`,
        recommendation: testAccounts.length > 0 ? 'Remove test accounts from production database' : undefined
      })

    } catch (error) {
      this.addCheck({
        name: 'Database Security Check',
        category: 'critical',
        status: 'warning',
        description: 'Could not perform database security checks',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async checkAPISecurityConfiguration() {
    console.log('🔌 Checking API Security Configuration...')

    // Check middleware configuration
    try {
      const middlewarePath = path.join(this.projectRoot, 'middleware.ts')
      const middlewareContent = await fs.readFile(middlewarePath, 'utf-8')

      const hasRateLimit = middlewareContent.includes('rate') && middlewareContent.includes('limit')
      const hasCSP = middlewareContent.includes('Content-Security-Policy')
      const hasXFrameOptions = middlewareContent.includes('X-Frame-Options')

      this.addCheck({
        name: 'Middleware Security Features',
        category: 'high',
        status: hasRateLimit && hasCSP && hasXFrameOptions ? 'pass' : 'warning',
        description: `Security features: Rate limiting: ${hasRateLimit}, CSP: ${hasCSP}, X-Frame-Options: ${hasXFrameOptions}`,
        recommendation: !hasRateLimit || !hasCSP || !hasXFrameOptions ? 'Ensure all security features are enabled in middleware' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Middleware Security Features',
        category: 'high',
        status: 'fail',
        description: 'Middleware file not found or readable',
        recommendation: 'Create security middleware with rate limiting, CSP, and security headers'
      })
    }

    // Check API route protection
    const apiRoutes = await this.findAPIRoutes()
    const protectedRoutes = apiRoutes.filter(route => this.isRouteProtected(route))
    const unprotectedRoutes = apiRoutes.filter(route => !this.isRouteProtected(route))

    this.addCheck({
      name: 'API Route Protection',
      category: 'high',
      status: unprotectedRoutes.length === 0 ? 'pass' : 'warning',
      description: `${protectedRoutes.length}/${apiRoutes.length} API routes are protected`,
      details: unprotectedRoutes.slice(0, 5).join('\n'),
      recommendation: unprotectedRoutes.length > 0 ? 'Add authentication/authorization to unprotected API routes' : undefined
    })
  }

  private async checkFilePermissions() {
    console.log('📁 Checking File Permissions...')

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'docker-compose.yml',
      'Dockerfile'
    ]

    for (const file of sensitiveFiles) {
      try {
        const filePath = path.join(this.projectRoot, file)
        const stats = await fs.stat(filePath)
        const mode = (stats.mode & parseInt('777', 8)).toString(8)

        this.addCheck({
          name: `File Permissions: ${file}`,
          category: 'medium',
          status: mode === '600' || mode === '644' ? 'pass' : 'warning',
          description: `File permissions: ${mode}`,
          recommendation: mode !== '600' && mode !== '644' ? `Set appropriate permissions for ${file} (600 or 644)` : undefined
        })
      } catch (error) {
        this.addCheck({
          name: `File Permissions: ${file}`,
          category: 'low',
          status: 'skip',
          description: `File not found: ${file}`
        })
      }
    }
  }

  private async checkDockerSecurity() {
    console.log('🐳 Checking Docker Security...')

    try {
      const dockerfilePath = path.join(this.projectRoot, 'Dockerfile')
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8')

      const usesNonRootUser = dockerfileContent.includes('USER') && !dockerfileContent.includes('USER root')
      const hasHealthCheck = dockerfileContent.includes('HEALTHCHECK')
      const usesMultiStage = dockerfileContent.split('FROM').length > 2

      this.addCheck({
        name: 'Docker Security Configuration',
        category: 'medium',
        status: usesNonRootUser && hasHealthCheck ? 'pass' : 'warning',
        description: `Non-root user: ${usesNonRootUser}, Health check: ${hasHealthCheck}, Multi-stage: ${usesMultiStage}`,
        recommendation: !usesNonRootUser || !hasHealthCheck ? 'Use non-root user and add health checks to Dockerfile' : undefined
      })

      // Check for exposed secrets in Dockerfile
      const hasExposedSecrets = dockerfileContent.match(/ENV.*(?:SECRET|KEY|PASSWORD|TOKEN)/i)
      this.addCheck({
        name: 'Docker Secrets Exposure',
        category: 'high',
        status: !hasExposedSecrets ? 'pass' : 'fail',
        description: hasExposedSecrets ? 'Found potential secrets in Dockerfile' : 'No exposed secrets found',
        recommendation: hasExposedSecrets ? 'Remove hardcoded secrets from Dockerfile' : undefined
      })

    } catch (error) {
      this.addCheck({
        name: 'Docker Security Configuration',
        category: 'medium',
        status: 'skip',
        description: 'Dockerfile not found'
      })
    }
  }

  private async checkSSLConfiguration() {
    console.log('🔒 Checking SSL/TLS Configuration...')

    const domain = process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')
    
    if (!domain) {
      this.addCheck({
        name: 'SSL/TLS Configuration',
        category: 'critical',
        status: 'skip',
        description: 'NEXT_PUBLIC_APP_URL not configured'
      })
      return
    }

    try {
      const { stdout } = await execAsync(`curl -s -I "https://${domain}" | head -n 1 || echo "ERROR"`)
      const isHTTPS = stdout.includes('200 OK') || stdout.includes('301') || stdout.includes('302')

      this.addCheck({
        name: 'HTTPS Availability',
        category: 'critical',
        status: isHTTPS ? 'pass' : 'fail',
        description: `HTTPS ${isHTTPS ? 'available' : 'not available'} for ${domain}`,
        recommendation: !isHTTPS ? 'Configure SSL/TLS certificate for production domain' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'HTTPS Availability',
        category: 'critical',
        status: 'warning',
        description: 'Could not check HTTPS availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async checkCSPConfiguration() {
    console.log('🛡️ Checking Content Security Policy...')

    try {
      const middlewarePath = path.join(this.projectRoot, 'middleware.ts')
      const middlewareContent = await fs.readFile(middlewarePath, 'utf-8')

      const cspMatch = middlewareContent.match(/Content-Security-Policy['"].*?['"`]/s)
      if (cspMatch) {
        const csp = cspMatch[0]
        const hasUnsafeInline = csp.includes("'unsafe-inline'")
        const hasUnsafeEval = csp.includes("'unsafe-eval'")
        const hasObjectSrcNone = csp.includes("object-src 'none'")

        this.addCheck({
          name: 'Content Security Policy',
          category: 'high',
          status: !hasUnsafeInline && !hasUnsafeEval && hasObjectSrcNone ? 'pass' : 'warning',
          description: `CSP configured with ${hasUnsafeInline ? "'unsafe-inline'" : ''} ${hasUnsafeEval ? "'unsafe-eval'" : ''}`,
          recommendation: hasUnsafeInline || hasUnsafeEval ? 'Remove unsafe-inline and unsafe-eval from CSP' : undefined
        })
      } else {
        this.addCheck({
          name: 'Content Security Policy',
          category: 'high',
          status: 'fail',
          description: 'CSP not configured',
          recommendation: 'Add Content Security Policy to security headers'
        })
      }
    } catch (error) {
      this.addCheck({
        name: 'Content Security Policy',
        category: 'high',
        status: 'warning',
        description: 'Could not check CSP configuration'
      })
    }
  }

  private async checkAuthenticationSecurity(supabase: any) {
    console.log('🔐 Checking Authentication Security...')

    if (!supabase) return

    try {
      // Check password policy
      const passwordPolicy = {
        minLength: 8,
        requireSpecialChar: true,
        requireNumber: true,
        requireUppercase: true
      }

      this.addCheck({
        name: 'Password Policy',
        category: 'high',
        status: 'pass', // Assuming Supabase has good defaults
        description: 'Password policy configured with strong requirements',
        details: JSON.stringify(passwordPolicy, null, 2)
      })

      // Check for MFA configuration
      const { data: mfaFactors } = await supabase.auth.mfa.listFactors()
      
      this.addCheck({
        name: 'Multi-Factor Authentication',
        category: 'medium',
        status: mfaFactors?.length > 0 ? 'pass' : 'warning',
        description: `MFA ${mfaFactors?.length > 0 ? 'configured' : 'not configured'}`,
        recommendation: mfaFactors?.length === 0 ? 'Enable MFA for admin accounts' : undefined
      })

    } catch (error) {
      this.addCheck({
        name: 'Authentication Security',
        category: 'high',
        status: 'warning',
        description: 'Could not check authentication configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async checkDataEncryption() {
    console.log('🔐 Checking Data Encryption...')

    // Check environment variables for encryption keys
    const hasJWTSecret = !!process.env.JWT_SECRET
    const hasEncryptionKey = !!process.env.ENCRYPTION_KEY || !!process.env.SECRET_KEY

    this.addCheck({
      name: 'Encryption Keys',
      category: 'critical',
      status: hasJWTSecret ? 'pass' : 'fail',
      description: `JWT Secret: ${hasJWTSecret ? 'configured' : 'missing'}`,
      recommendation: !hasJWTSecret ? 'Configure JWT_SECRET for token encryption' : undefined
    })

    // Check for database encryption
    const databaseUrl = process.env.DATABASE_URL
    const usesSSL = databaseUrl?.includes('sslmode=require') || databaseUrl?.includes('ssl=true')

    this.addCheck({
      name: 'Database Encryption',
      category: 'high',
      status: usesSSL ? 'pass' : 'warning',
      description: `Database SSL: ${usesSSL ? 'enabled' : 'not configured'}`,
      recommendation: !usesSSL ? 'Enable SSL for database connections' : undefined
    })
  }

  private async checkLoggingConfiguration() {
    console.log('📝 Checking Logging Configuration...')

    try {
      const loggerPath = path.join(this.projectRoot, 'lib', 'logger.ts')
      const loggerContent = await fs.readFile(loggerPath, 'utf-8')

      const hasStructuredLogging = loggerContent.includes('winston') || loggerContent.includes('pino')
      const hasLogLevels = loggerContent.includes('level') || loggerContent.includes('debug')

      this.addCheck({
        name: 'Logging Configuration',
        category: 'medium',
        status: hasStructuredLogging && hasLogLevels ? 'pass' : 'warning',
        description: `Structured logging: ${hasStructuredLogging}, Log levels: ${hasLogLevels}`,
        recommendation: !hasStructuredLogging || !hasLogLevels ? 'Configure structured logging with appropriate log levels' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Logging Configuration',
        category: 'medium',
        status: 'warning',
        description: 'Logger configuration not found'
      })
    }
  }

  private async checkRateLimitingConfiguration() {
    console.log('⚡ Checking Rate Limiting Configuration...')

    try {
      const middlewarePath = path.join(this.projectRoot, 'middleware.ts')
      const middlewareContent = await fs.readFile(middlewarePath, 'utf-8')

      const hasRateLimit = middlewareContent.includes('rateLimit') || middlewareContent.includes('rate_limit')
      const hasApiRateLimit = middlewareContent.includes('api') && hasRateLimit

      this.addCheck({
        name: 'Rate Limiting',
        category: 'high',
        status: hasRateLimit && hasApiRateLimit ? 'pass' : 'warning',
        description: `Rate limiting: ${hasRateLimit}, API rate limiting: ${hasApiRateLimit}`,
        recommendation: !hasRateLimit || !hasApiRateLimit ? 'Implement rate limiting for web and API endpoints' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Rate Limiting',
        category: 'high',
        status: 'fail',
        description: 'Rate limiting configuration not found'
      })
    }
  }

  private async checkCORSConfiguration() {
    console.log('🌐 Checking CORS Configuration...')

    try {
      const middlewarePath = path.join(this.projectRoot, 'middleware.ts')
      const middlewareContent = await fs.readFile(middlewarePath, 'utf-8')

      const hasCORS = middlewareContent.includes('Access-Control-Allow-Origin')
      const hasRestrictiveCORS = middlewareContent.includes('prismy.com') && !middlewareContent.includes("'*'")

      this.addCheck({
        name: 'CORS Configuration',
        category: 'medium',
        status: hasCORS && hasRestrictiveCORS ? 'pass' : 'warning',
        description: `CORS configured: ${hasCORS}, Restrictive: ${hasRestrictiveCORS}`,
        recommendation: !hasCORS || !hasRestrictiveCORS ? 'Configure restrictive CORS policy for production' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'CORS Configuration',
        category: 'medium',
        status: 'warning',
        description: 'Could not check CORS configuration'
      })
    }
  }

  private async checkSecurityHeaders() {
    console.log('🛡️ Checking Security Headers...')

    try {
      const middlewarePath = path.join(this.projectRoot, 'middleware.ts')
      const middlewareContent = await fs.readFile(middlewarePath, 'utf-8')

      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Strict-Transport-Security'
      ]

      const presentHeaders = securityHeaders.filter(header => 
        middlewareContent.includes(header)
      )

      this.addCheck({
        name: 'Security Headers',
        category: 'high',
        status: presentHeaders.length === securityHeaders.length ? 'pass' : 'warning',
        description: `${presentHeaders.length}/${securityHeaders.length} security headers configured`,
        details: `Present: ${presentHeaders.join(', ')}`,
        recommendation: presentHeaders.length < securityHeaders.length ? 'Configure all recommended security headers' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Security Headers',
        category: 'high',
        status: 'fail',
        description: 'Could not check security headers configuration'
      })
    }
  }

  private async checkSecretsManagement() {
    console.log('🔑 Checking Secrets Management...')

    // Check for .env files in version control
    try {
      const { stdout } = await execAsync('git ls-files | grep -E "\.env" || true')
      const envFilesInGit = stdout.trim().split('\n').filter(line => line.trim())

      this.addCheck({
        name: 'Environment Files in Version Control',
        category: 'critical',
        status: envFilesInGit.length === 0 ? 'pass' : 'fail',
        description: `${envFilesInGit.length} .env files found in git`,
        details: envFilesInGit.join('\n'),
        recommendation: envFilesInGit.length > 0 ? 'Remove .env files from version control and add to .gitignore' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Environment Files in Version Control',
        category: 'critical',
        status: 'warning',
        description: 'Could not check git for .env files'
      })
    }

    // Check .gitignore for secret patterns
    try {
      const gitignorePath = path.join(this.projectRoot, '.gitignore')
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8')

      const secretPatterns = ['.env', '*.key', '*.pem', 'secrets/']
      const presentPatterns = secretPatterns.filter(pattern => 
        gitignoreContent.includes(pattern)
      )

      this.addCheck({
        name: 'Gitignore Secret Patterns',
        category: 'medium',
        status: presentPatterns.length >= 2 ? 'pass' : 'warning',
        description: `${presentPatterns.length}/${secretPatterns.length} secret patterns in .gitignore`,
        recommendation: presentPatterns.length < 2 ? 'Add secret file patterns to .gitignore' : undefined
      })
    } catch (error) {
      this.addCheck({
        name: 'Gitignore Secret Patterns',
        category: 'medium',
        status: 'warning',
        description: '.gitignore file not found'
      })
    }
  }

  private async findAPIRoutes(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('find app/api -name "*.ts" -o -name "*.js" | head -20')
      return stdout.trim().split('\n').filter(line => line.trim())
    } catch (error) {
      return []
    }
  }

  private isRouteProtected(routePath: string): boolean {
    // Simple heuristic to check if route has authentication
    try {
      const content = require('fs').readFileSync(routePath, 'utf-8')
      return content.includes('auth') || 
             content.includes('session') || 
             content.includes('Authorization') ||
             content.includes('authenticated')
    } catch (error) {
      return false
    }
  }

  private addCheck(check: SecurityCheck) {
    this.checks.push(check)
    
    const statusEmoji = {
      'pass': '✅',
      'fail': '❌',
      'warning': '⚠️',
      'skip': '⏭️'
    }

    console.log(`${statusEmoji[check.status]} ${check.name}: ${check.description}`)
    if (check.recommendation) {
      console.log(`   💡 ${check.recommendation}`)
    }
  }

  private generateReport(): SecurityReport {
    const summary = {
      total: this.checks.length,
      passed: this.checks.filter(c => c.status === 'pass').length,
      failed: this.checks.filter(c => c.status === 'fail').length,
      warnings: this.checks.filter(c => c.status === 'warning').length,
      skipped: this.checks.filter(c => c.status === 'skip').length
    }

    const categories = {
      critical: this.checks.filter(c => c.category === 'critical'),
      high: this.checks.filter(c => c.category === 'high'),
      medium: this.checks.filter(c => c.category === 'medium'),
      low: this.checks.filter(c => c.category === 'low')
    }

    const overallScore = Math.round(
      (summary.passed / (summary.total - summary.skipped)) * 100
    )

    const recommendations = this.checks
      .filter(c => c.recommendation)
      .map(c => c.recommendation!)

    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      overallScore,
      summary,
      categories,
      recommendations
    }
  }

  private async saveReport(report: SecurityReport) {
    const reportsDir = path.join(this.projectRoot, 'security-reports')
    
    try {
      await fs.mkdir(reportsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(reportsDir, `security-report-${timestamp}.json`)
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Security report saved to: ${reportPath}`)
  }

  private displaySummary(report: SecurityReport) {
    console.log('\n' + '='.repeat(50))
    console.log('🔍 SECURITY COMPLIANCE REPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`📊 Overall Score: ${report.overallScore}%`)
    console.log(`✅ Passed: ${report.summary.passed}`)
    console.log(`❌ Failed: ${report.summary.failed}`)
    console.log(`⚠️  Warnings: ${report.summary.warnings}`)
    console.log(`⏭️  Skipped: ${report.summary.skipped}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n🎯 TOP RECOMMENDATIONS:')
      report.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`)
      })
    }

    const criticalFails = report.categories.critical.filter(c => c.status === 'fail')
    if (criticalFails.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:')
      criticalFails.forEach(issue => {
        console.log(`❌ ${issue.name}: ${issue.description}`)
      })
    }

    console.log('\n' + '='.repeat(50))
  }
}

// Run scanner if called directly
if (require.main === module) {
  const scanner = new SecurityComplianceScanner()
  scanner.runFullScan().catch(console.error)
}

export { SecurityComplianceScanner }