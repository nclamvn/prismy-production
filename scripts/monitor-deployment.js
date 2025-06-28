#!/usr/bin/env node

/**
 * PRISMY DEPLOYMENT MONITORING SCRIPT
 * Monitors deployment health and sends alerts
 * Used by CI/CD pipeline to verify successful deployment
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

class DeploymentMonitor {
  constructor() {
    this.config = {
      baseUrl: process.env.DEPLOYMENT_URL || 'https://prismy.ai',
      timeout: 30000, // 30 seconds
      retries: 5,
      retryDelay: 10000, // 10 seconds
      healthEndpoints: [
        '/api/health',
        '/api/health/database',
        '/api/health/ai-services'
      ],
      criticalPages: [
        '/',
        '/translate',
        '/documents'
      ]
    }
    this.results = {
      success: false,
      timestamp: new Date().toISOString(),
      checks: [],
      errors: [],
      deployment: {
        url: this.config.baseUrl,
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
        environment: process.env.VERCEL_ENV || 'production'
      }
    }
  }

  async monitor() {
    console.log('🔍 Starting deployment monitoring...')
    console.log(`📍 Target URL: ${this.config.baseUrl}`)
    console.log(`🔄 Max retries: ${this.config.retries}`)
    
    try {
      // Wait for deployment to be ready
      await this.waitForDeployment()
      
      // Check health endpoints
      await this.checkHealthEndpoints()
      
      // Check critical pages
      await this.checkCriticalPages()
      
      // Validate API functionality
      await this.validateAPIFunctionality()
      
      // Check performance metrics
      await this.checkPerformanceMetrics()
      
      this.results.success = this.results.errors.length === 0
      
      // Generate report
      this.generateReport()
      
      // Send notifications
      await this.sendNotifications()
      
      console.log(`✅ Deployment monitoring completed: ${this.results.success ? 'SUCCESS' : 'FAILED'}`)
      
      // Exit with appropriate code
      process.exit(this.results.success ? 0 : 1)
      
    } catch (error) {
      console.error('❌ Deployment monitoring failed:', error)
      this.results.errors.push({
        type: 'monitor_error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
      this.results.success = false
      process.exit(1)
    }
  }

  async waitForDeployment() {
    console.log('⏳ Waiting for deployment to be ready...')
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.makeRequest('/')
        
        if (response.statusCode === 200) {
          console.log(`✅ Deployment is ready (attempt ${attempt})`)
          this.results.checks.push({
            type: 'deployment_ready',
            success: true,
            attempt,
            timestamp: new Date().toISOString()
          })
          return
        }
        
        throw new Error(`HTTP ${response.statusCode}`)
        
      } catch (error) {
        console.log(`⚠️ Attempt ${attempt}/${this.config.retries} failed: ${error.message}`)
        
        if (attempt === this.config.retries) {
          throw new Error(`Deployment not ready after ${this.config.retries} attempts`)
        }
        
        await this.sleep(this.config.retryDelay)
      }
    }
  }

  async checkHealthEndpoints() {
    console.log('🏥 Checking health endpoints...')
    
    for (const endpoint of this.config.healthEndpoints) {
      try {
        const response = await this.makeRequest(endpoint)
        const data = JSON.parse(response.body)
        
        const isHealthy = response.statusCode === 200 && 
                         (data.status === 'healthy' || data.status === 'degraded')
        
        if (isHealthy) {
          console.log(`✅ ${endpoint}: ${data.status}`)
          this.results.checks.push({
            type: 'health_check',
            endpoint,
            success: true,
            status: data.status,
            responseTime: response.responseTime,
            timestamp: new Date().toISOString()
          })
        } else {
          const error = `Health check failed: ${data.status || 'unknown'}`
          console.log(`❌ ${endpoint}: ${error}`)
          this.results.errors.push({
            type: 'health_check_failed',
            endpoint,
            error,
            statusCode: response.statusCode,
            timestamp: new Date().toISOString()
          })
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`)
        this.results.errors.push({
          type: 'health_endpoint_error',
          endpoint,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  async checkCriticalPages() {
    console.log('📄 Checking critical pages...')
    
    for (const page of this.config.criticalPages) {
      try {
        const response = await this.makeRequest(page)
        
        if (response.statusCode === 200) {
          const hasContent = response.body && response.body.length > 100
          
          if (hasContent) {
            console.log(`✅ ${page}: OK (${response.body.length} bytes)`)
            this.results.checks.push({
              type: 'page_check',
              page,
              success: true,
              statusCode: response.statusCode,
              contentLength: response.body.length,
              responseTime: response.responseTime,
              timestamp: new Date().toISOString()
            })
          } else {
            const error = 'Page content too small or empty'
            console.log(`❌ ${page}: ${error}`)
            this.results.errors.push({
              type: 'page_content_error',
              page,
              error,
              contentLength: response.body.length,
              timestamp: new Date().toISOString()
            })
          }
        } else {
          const error = `HTTP ${response.statusCode}`
          console.log(`❌ ${page}: ${error}`)
          this.results.errors.push({
            type: 'page_http_error',
            page,
            error,
            statusCode: response.statusCode,
            timestamp: new Date().toISOString()
          })
        }
        
      } catch (error) {
        console.log(`❌ ${page}: ${error.message}`)
        this.results.errors.push({
          type: 'page_request_error',
          page,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  async validateAPIFunctionality() {
    console.log('🔧 Validating API functionality...')
    
    try {
      // Test translation API (minimal test)
      const testPayload = {
        text: 'Hello',
        from: 'en',
        to: 'vi'
      }
      
      const response = await this.makeRequest('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      })
      
      if (response.statusCode === 200 || response.statusCode === 401) {
        // 401 is acceptable if authentication is required
        console.log('✅ Translation API: Accessible')
        this.results.checks.push({
          type: 'api_validation',
          api: 'translation',
          success: true,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString()
        })
      } else {
        throw new Error(`Translation API returned ${response.statusCode}`)
      }
      
    } catch (error) {
      console.log(`❌ API validation: ${error.message}`)
      this.results.errors.push({
        type: 'api_validation_error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  async checkPerformanceMetrics() {
    console.log('⚡ Checking performance metrics...')
    
    const performanceThresholds = {
      responseTime: 5000, // 5 seconds
      contentSize: 10 * 1024 * 1024 // 10 MB
    }
    
    try {
      const startTime = Date.now()
      const response = await this.makeRequest('/')
      const responseTime = Date.now() - startTime
      
      const metrics = {
        responseTime,
        contentSize: response.body.length,
        statusCode: response.statusCode
      }
      
      // Check thresholds
      const issues = []
      if (responseTime > performanceThresholds.responseTime) {
        issues.push(`Slow response time: ${responseTime}ms > ${performanceThresholds.responseTime}ms`)
      }
      
      if (response.body.length > performanceThresholds.contentSize) {
        issues.push(`Large content size: ${response.body.length} > ${performanceThresholds.contentSize}`)
      }
      
      if (issues.length === 0) {
        console.log(`✅ Performance: Response time ${responseTime}ms, Size ${response.body.length} bytes`)
        this.results.checks.push({
          type: 'performance_check',
          success: true,
          metrics,
          timestamp: new Date().toISOString()
        })
      } else {
        console.log(`⚠️ Performance issues: ${issues.join(', ')}`)
        this.results.errors.push({
          type: 'performance_warning',
          issues,
          metrics,
          timestamp: new Date().toISOString()
        })
      }
      
    } catch (error) {
      console.log(`❌ Performance check: ${error.message}`)
      this.results.errors.push({
        type: 'performance_error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  generateReport() {
    const report = {
      summary: {
        success: this.results.success,
        totalChecks: this.results.checks.length,
        totalErrors: this.results.errors.length,
        duration: Date.now() - new Date(this.results.timestamp).getTime()
      },
      deployment: this.results.deployment,
      checks: this.results.checks,
      errors: this.results.errors,
      timestamp: this.results.timestamp
    }
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'deployment-monitor-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📄 Report saved to: ${reportPath}`)
    
    // Log summary
    console.log('\n📊 DEPLOYMENT MONITORING SUMMARY')
    console.log('================================')
    console.log(`Status: ${report.summary.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total Checks: ${report.summary.totalChecks}`)
    console.log(`Total Errors: ${report.summary.totalErrors}`)
    console.log(`Duration: ${Math.round(report.summary.duration / 1000)}s`)
    
    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type}: ${error.error || error.message}`)
      })
    }
    
    if (report.checks.length > 0) {
      console.log('\n✅ SUCCESSFUL CHECKS:')
      report.checks.forEach((check, index) => {
        console.log(`${index + 1}. ${check.type}: ${check.endpoint || check.page || check.api || 'general'}`)
      })
    }
  }

  async sendNotifications() {
    // Send Slack notification if webhook is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await this.sendSlackNotification()
      } catch (error) {
        console.log(`⚠️ Failed to send Slack notification: ${error.message}`)
      }
    }
  }

  async sendSlackNotification() {
    const color = this.results.success ? 'good' : 'danger'
    const emoji = this.results.success ? '✅' : '❌'
    
    const payload = {
      text: `${emoji} Prismy Deployment Monitor`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Status',
            value: this.results.success ? 'SUCCESS' : 'FAILED',
            short: true
          },
          {
            title: 'Environment',
            value: this.results.deployment.environment,
            short: true
          },
          {
            title: 'Version',
            value: this.results.deployment.version.substring(0, 8),
            short: true
          },
          {
            title: 'URL',
            value: this.results.deployment.url,
            short: true
          },
          {
            title: 'Checks Passed',
            value: `${this.results.checks.length}`,
            short: true
          },
          {
            title: 'Errors',
            value: `${this.results.errors.length}`,
            short: true
          }
        ],
        footer: 'Prismy Deployment Monitor',
        ts: Math.floor(Date.now() / 1000)
      }]
    }
    
    await this.makeRequest(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      external: true
    })
    
    console.log('📬 Slack notification sent')
  }

  makeRequest(urlOrPath, options = {}) {
    return new Promise((resolve, reject) => {
      const isExternal = options.external
      const url = isExternal ? urlOrPath : `${this.config.baseUrl}${urlOrPath}`
      const urlObj = new URL(url)
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Prismy-Deployment-Monitor/1.0',
          ...options.headers
        },
        timeout: this.config.timeout
      }
      
      const startTime = Date.now()
      const req = https.request(requestOptions, (res) => {
        let body = ''
        
        res.on('data', (chunk) => {
          body += chunk
        })
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            responseTime: Date.now() - startTime
          })
        })
      })
      
      req.on('error', (error) => {
        reject(error)
      })
      
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
      
      if (options.body) {
        req.write(options.body)
      }
      
      req.end()
    })
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Run the monitor if this script is executed directly
if (require.main === module) {
  const monitor = new DeploymentMonitor()
  monitor.monitor().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = DeploymentMonitor