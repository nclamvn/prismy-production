#!/usr/bin/env node

/**
 * 🩺 OAuth Doctor Script - Endoscope Method Health Check
 * 
 * Validates all 9 OAuth pipeline steps and provides ✔️/❌ status
 * reporting for each component before deployment.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class OAuthDoctor {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  // Utility methods
  log(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌', 
      warning: '⚠️',
      info: 'ℹ️'
    };
    console.log(`${icons[type]} ${message}`);
  }

  addResult(check, passed, details = '', fix = '') {
    this.results.push({ check, passed, details, fix });
    this.log(`${check}: ${details}`, passed ? 'success' : 'error');
    if (!passed && fix) {
      this.log(`   Fix: ${fix}`, 'warning');
    }
  }

  // File existence checks
  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  // Environment validation
  async checkEnvironmentVariables() {
    console.log('\n🔬 Checking Environment Variables...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const envFile = this.readFile('.env.local') || this.readFile('.env');
    const hasEnvFile = !!envFile;
    
    this.addResult(
      'Environment file exists',
      hasEnvFile,
      hasEnvFile ? 'Found .env.local or .env' : 'No environment file found',
      'Create .env.local with required variables'
    );

    for (const envVar of requiredEnvVars) {
      const hasVar = envFile && envFile.includes(envVar);
      const isPlaceholder = envFile && envFile.includes(`${envVar}=your_`) || envFile && envFile.includes(`${envVar}=placeholder`);
      
      this.addResult(
        `${envVar} configured`,
        hasVar && !isPlaceholder,
        hasVar ? (isPlaceholder ? 'Contains placeholder value' : 'Configured') : 'Missing',
        `Add ${envVar} to your .env.local file`
      );
    }
  }

  // OAuth pipeline file checks
  async checkOAuthPipelineFiles() {
    console.log('\n🔬 Checking OAuth Pipeline Files...');

    const criticalFiles = [
      {
        path: 'app/auth/callback/page.tsx',
        description: 'OAuth callback handler',
        requiredContent: ['exchangeCodeForSession', 'oauth_callback_enter']
      },
      {
        path: 'contexts/AuthContext.tsx', 
        description: 'Auth context provider',
        requiredContent: ['signInWithGoogle', 'signOut', 'logAuthEvent']
      },
      {
        path: 'lib/auth-analytics.ts',
        description: 'Auth analytics system',
        requiredContent: ['startOAuthFlow', 'logAuthEvent', 'authAnalytics']
      },
      {
        path: 'lib/supabase-events.ts',
        description: 'Supabase event logger',
        requiredContent: ['SupabaseEventLogger', 'onAuthStateChange']
      },
      {
        path: 'lib/supabase-browser.ts',
        description: 'Supabase browser client',
        requiredContent: ['createClient', 'getBrowserClient']
      }
    ];

    for (const file of criticalFiles) {
      const exists = this.fileExists(file.path);
      this.addResult(
        `${file.description} exists`,
        exists,
        exists ? `Found ${file.path}` : `Missing ${file.path}`,
        `Create ${file.path} with required implementation`
      );

      if (exists) {
        const content = this.readFile(file.path);
        const hasRequiredContent = file.requiredContent.every(required => 
          content && content.includes(required)
        );
        
        this.addResult(
          `${file.description} implementation`,
          hasRequiredContent,
          hasRequiredContent ? 'All required functions present' : 'Missing required functions',
          `Ensure ${file.path} includes: ${file.requiredContent.join(', ')}`
        );
      }
    }
  }

  // CSS layout checks
  async checkCSSLayout() {
    console.log('\n🔬 Checking CSS Layout Configuration...');

    const cssFile = this.readFile('styles/globals.css');
    const hasCSS = !!cssFile;

    this.addResult(
      'Global CSS file exists',
      hasCSS,
      hasCSS ? 'Found styles/globals.css' : 'Missing global CSS',
      'Create styles/globals.css'
    );

    if (hasCSS) {
      const requiredCSSRules = [
        { rule: 'html.*height.*100%', description: 'HTML height 100%' },
        { rule: 'body.*height.*100%', description: 'Body height 100%' },
        { rule: '#__next.*height.*100%', description: 'Next.js root height 100%' },
        { rule: 'overflow.*hidden', description: 'Overflow hidden rules' },
        { rule: 'overscrollBehavior.*contain', description: 'Overscroll behavior containment' }
      ];

      for (const { rule, description } of requiredCSSRules) {
        const hasRule = new RegExp(rule, 'i').test(cssFile.replace(/\\s+/g, ' '));
        this.addResult(
          description,
          hasRule,
          hasRule ? 'Configured' : 'Missing CSS rule',
          `Add ${rule} to styles/globals.css`
        );
      }
    }
  }

  // Next.js configuration checks
  async checkNextJSConfig() {
    console.log('\n🔬 Checking Next.js Configuration...');

    const packageJson = this.readFile('package.json');
    const hasPackageJson = !!packageJson;

    this.addResult(
      'package.json exists',
      hasPackageJson,
      hasPackageJson ? 'Found package.json' : 'Missing package.json',
      'Initialize package.json with npm init'
    );

    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const hasNextJS = pkg.dependencies?.['next'] || pkg.devDependencies?.['next'];
        const hasSupabase = pkg.dependencies?.['@supabase/supabase-js'];
        
        this.addResult(
          'Next.js dependency',
          !!hasNextJS,
          hasNextJS ? `Next.js ${hasNextJS}` : 'Next.js not found',
          'Install Next.js: npm install next react react-dom'
        );

        this.addResult(
          'Supabase dependency',
          !!hasSupabase,
          hasSupabase ? `Supabase ${hasSupabase}` : 'Supabase not found',
          'Install Supabase: npm install @supabase/supabase-js'
        );
      } catch (error) {
        this.addResult(
          'package.json format',
          false,
          'Invalid JSON format',
          'Fix package.json syntax errors'
        );
      }
    }

    const nextConfig = this.fileExists('next.config.js') || this.fileExists('next.config.mjs');
    this.addResult(
      'Next.js config file',
      nextConfig,
      nextConfig ? 'Found Next.js config' : 'Using default config',
      ''
    );
  }

  // Build validation
  async checkBuildValidation() {
    console.log('\n🔬 Checking Build Validation...');

    try {
      // Check if build command exists in package.json
      const packageJson = this.readFile('package.json');
      if (packageJson) {
        const pkg = JSON.parse(packageJson);
        const hasBuildScript = pkg.scripts?.build;
        
        this.addResult(
          'Build script configured',
          !!hasBuildScript,
          hasBuildScript ? `Build script: ${hasBuildScript}` : 'No build script',
          'Add "build": "next build" to package.json scripts'
        );
      }

      // Check TypeScript configuration
      const hasTSConfig = this.fileExists('tsconfig.json');
      this.addResult(
        'TypeScript configuration',
        hasTSConfig,
        hasTSConfig ? 'Found tsconfig.json' : 'No TypeScript config',
        'Create tsconfig.json for TypeScript support'
      );

      // Check if there are obvious TypeScript errors
      if (hasTSConfig) {
        try {
          const { stdout } = await execAsync('npx tsc --noEmit --skipLibCheck', { timeout: 30000 });
          this.addResult(
            'TypeScript compilation',
            true,
            'No TypeScript errors found',
            ''
          );
        } catch (error) {
          this.addResult(
            'TypeScript compilation',
            false,
            'TypeScript errors detected',
            'Fix TypeScript compilation errors'
          );
        }
      }

    } catch (error) {
      this.addResult(
        'Build validation',
        false,
        `Build check failed: ${error.message}`,
        'Ensure build environment is properly configured'
      );
    }
  }

  // Runtime checks
  async checkRuntimeDiagnostics() {
    console.log('\n🔬 Checking Runtime Diagnostics...');

    // Check for analytics integration
    const authAnalytics = this.readFile('lib/auth-analytics.ts');
    const hasWindowIntegration = authAnalytics && authAnalytics.includes('window.authAnalytics');
    
    this.addResult(
      'Browser diagnostics integration',
      hasWindowIntegration,
      hasWindowIntegration ? 'Analytics available in browser console' : 'No browser integration',
      'Add window.authAnalytics for debugging'
    );

    // Check for Sentry integration
    const hasSentryIntegration = authAnalytics && authAnalytics.includes('window.Sentry');
    this.addResult(
      'Error tracking integration',
      hasSentryIntegration,
      hasSentryIntegration ? 'Sentry integration configured' : 'No error tracking',
      'Consider adding Sentry for production error tracking'
    );

    // Check for development mode optimizations
    const callbackPage = this.readFile('app/auth/callback/page.tsx');
    const hasDevDiagnostics = callbackPage && callbackPage.includes('NODE_ENV === \'development\'');
    
    this.addResult(
      'Development mode diagnostics',
      hasDevDiagnostics,
      hasDevDiagnostics ? 'Development diagnostics enabled' : 'No dev-specific diagnostics',
      'Add development-only diagnostic displays'
    );
  }

  // Security checks
  async checkSecurityConfiguration() {
    console.log('\n🔬 Checking Security Configuration...');

    const envFile = this.readFile('.env.local') || this.readFile('.env');
    
    // Check for exposed secrets
    const hasExposedSecrets = envFile && (
      envFile.includes('service_role') && envFile.includes('NEXT_PUBLIC') ||
      envFile.includes('secret') && envFile.includes('NEXT_PUBLIC')
    );

    this.addResult(
      'No exposed secrets',
      !hasExposedSecrets,
      hasExposedSecrets ? 'Service role key exposed to client' : 'Secrets properly protected',
      'Never expose service_role keys with NEXT_PUBLIC prefix'
    );

    // Check for HTTPS enforcement
    const nextConfig = this.readFile('next.config.js') || this.readFile('next.config.mjs');
    const hasHTTPSConfig = nextConfig && nextConfig.includes('headers') && nextConfig.includes('Strict-Transport-Security');

    this.addResult(
      'HTTPS security headers',
      hasHTTPSConfig,
      hasHTTPSConfig ? 'Security headers configured' : 'Consider adding security headers',
      'Add security headers in next.config.js'
    );

    // Check for rate limiting
    const hasRateLimiting = this.fileExists('lib/rate-limiter.ts') || this.fileExists('lib/rate-limit.ts');
    this.addResult(
      'Rate limiting protection',
      hasRateLimiting,
      hasRateLimiting ? 'Rate limiting configured' : 'No rate limiting detected',
      'Consider adding rate limiting for auth endpoints'
    );
  }

  // Performance checks  
  async checkPerformanceOptimization() {
    console.log('\n🔬 Checking Performance Optimization...');

    // Check callback page size
    const callbackPage = this.readFile('app/auth/callback/page.tsx');
    const callbackLines = callbackPage ? callbackPage.split('\\n').length : 0;
    const callbackSize = callbackPage ? Buffer.byteLength(callbackPage, 'utf8') : 0;

    this.addResult(
      'Callback page optimization',
      callbackSize < 10000, // Less than 10KB
      `Callback page: ${callbackLines} lines, ${(callbackSize/1024).toFixed(1)}KB`,
      'Optimize callback page size for faster loading'
    );

    // Check for dynamic imports
    const hasDynamicImports = callbackPage && callbackPage.includes('dynamic(');
    this.addResult(
      'Dynamic imports usage',
      hasDynamicImports,
      hasDynamicImports ? 'Dynamic imports detected' : 'No dynamic imports found',
      'Consider using dynamic imports for non-critical components'
    );

    // Check for bundle analyzer
    const packageJson = this.readFile('package.json');
    if (packageJson) {
      const pkg = JSON.parse(packageJson);
      const hasBundleAnalyzer = pkg.dependencies?.['@next/bundle-analyzer'] || pkg.devDependencies?.['@next/bundle-analyzer'];
      
      this.addResult(
        'Bundle analysis tools',
        !!hasBundleAnalyzer,
        hasBundleAnalyzer ? 'Bundle analyzer available' : 'No bundle analysis',
        'Install @next/bundle-analyzer for bundle size monitoring'
      );
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\\n' + '='.repeat(60));
    console.log('🩺 OAUTH DOCTOR REPORT');
    console.log('='.repeat(60));

    const totalChecks = this.results.length;
    const passedChecks = this.results.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    console.log(`\\nTotal Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${passedChecks}`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log(`Success Rate: ${((passedChecks/totalChecks) * 100).toFixed(1)}%`);

    if (failedChecks > 0) {
      console.log('\\n❌ ISSUES FOUND:');
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`   • ${result.check}: ${result.details}`);
          if (result.fix) {
            console.log(`     Fix: ${result.fix}`);
          }
        });
    }

    const healthStatus = passedChecks >= totalChecks * 0.8 ? 'HEALTHY' : 
                        passedChecks >= totalChecks * 0.6 ? 'WARNING' : 'CRITICAL';
    
    console.log(`\\n🎯 Overall Health: ${healthStatus}`);
    
    if (healthStatus === 'HEALTHY') {
      console.log('\\n🚀 Ready for deployment!');
    } else {
      console.log('\\n⚠️  Fix issues before deploying to production.');
    }

    console.log('\\n' + '='.repeat(60));
    
    return {
      totalChecks,
      passedChecks,
      failedChecks,
      successRate: (passedChecks/totalChecks) * 100,
      healthStatus,
      details: this.results
    };
  }

  // Main execution
  async run() {
    console.log('🩺 Starting OAuth Pipeline Health Check...');
    console.log('='.repeat(60));

    try {
      await this.checkEnvironmentVariables();
      await this.checkOAuthPipelineFiles();
      await this.checkCSSLayout();
      await this.checkNextJSConfig();
      await this.checkBuildValidation();
      await this.checkRuntimeDiagnostics();
      await this.checkSecurityConfiguration();
      await this.checkPerformanceOptimization();

      const report = this.generateReport();
      
      // Exit with error code if health is critical
      if (report.healthStatus === 'CRITICAL') {
        process.exit(1);
      }
      
      return report;
    } catch (error) {
      console.error('❌ Doctor check failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const doctor = new OAuthDoctor();
  doctor.run();
}

module.exports = OAuthDoctor;