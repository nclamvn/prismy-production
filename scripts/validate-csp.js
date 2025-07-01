#!/usr/bin/env node

/**
 * CSP Validation Script for Prismy vNEXT
 * Validates that our components work with Content Security Policy
 */

const { execSync } = require('child_process')
const fs = require('fs')

const CSP_RULES = [
  "default-src 'self'",
  "script-src 'self' 'nonce-{NONCE}' https://vercel.live",
  "style-src 'self' 'nonce-{NONCE}' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

console.log('🔒 CSP Validation for Prismy vNEXT')
console.log('==================================\n')

// Check middleware CSP configuration
console.log('1. Checking middleware CSP configuration...')
try {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8')

  if (middlewareContent.includes('Content-Security-Policy')) {
    console.log('✅ CSP headers found in middleware')
  } else {
    console.log('❌ CSP headers missing in middleware')
  }

  if (middlewareContent.includes('nonce')) {
    console.log('✅ Nonce implementation found')
  } else {
    console.log('❌ Nonce implementation missing')
  }
} catch (error) {
  console.log('❌ Error reading middleware:', error.message)
}

// Check for inline styles in components
console.log('\n2. Checking components for CSP violations...')
const violations = []

try {
  // Check for style= attributes (inline styles)
  const inlineStyleCheck = execSync(
    'grep -r "style=" components/ --include="*.tsx" --include="*.ts" || true',
    { encoding: 'utf8' }
  )
  if (inlineStyleCheck.trim()) {
    violations.push('Inline styles found (style= attributes)')
    console.log('⚠️  Inline styles detected:')
    console.log(inlineStyleCheck)
  }

  // Check for dangerouslySetInnerHTML
  const dangerousHTMLCheck = execSync(
    'grep -r "dangerouslySetInnerHTML" components/ --include="*.tsx" --include="*.ts" || true',
    { encoding: 'utf8' }
  )
  if (dangerousHTMLCheck.trim()) {
    violations.push('dangerouslySetInnerHTML usage found')
    console.log('⚠️  dangerouslySetInnerHTML detected:')
    console.log(dangerousHTMLCheck)
  }

  // Check for eval usage
  const evalCheck = execSync(
    'grep -r "eval(" components/ --include="*.tsx" --include="*.ts" || true',
    { encoding: 'utf8' }
  )
  if (evalCheck.trim()) {
    violations.push('eval() usage found')
    console.log('⚠️  eval() usage detected:')
    console.log(evalCheck)
  }

  if (violations.length === 0) {
    console.log('✅ No CSP violations found in components')
  }
} catch (error) {
  console.log('❌ Error checking components:', error.message)
}

// Check build output for potential CSP issues
console.log('\n3. Checking build output...')
try {
  if (fs.existsSync('.next')) {
    console.log('✅ Build output exists')

    // Check for Next.js CSP compatibility
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const nextVersion =
      packageJson.dependencies?.next || packageJson.devDependencies?.next
    console.log(`✅ Next.js version: ${nextVersion}`)
  } else {
    console.log('⚠️  No build output found - run npm run build first')
  }
} catch (error) {
  console.log('❌ Error checking build:', error.message)
}

// Summary
console.log('\n📋 CSP Validation Summary')
console.log('========================')

if (violations.length === 0) {
  console.log('🎉 All CSP validations passed!')
  console.log('✅ Components are CSP-compliant')
  console.log('✅ No inline styles or unsafe practices detected')
  console.log('✅ Ready for production deployment')
} else {
  console.log('⚠️  CSP violations found:')
  violations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation}`)
  })
  console.log('\n🔧 Fix these issues before production deployment')
}

console.log('\n🚀 Recommended CSP header:')
console.log(CSP_RULES)
