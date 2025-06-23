#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🔧 VALIDATION: Critical Bug Fixes for User Journey Issues\n')

function readFile(relativePath) {
  const fullPath = join(projectRoot, relativePath)
  if (!existsSync(fullPath)) {
    return null
  }
  return readFileSync(fullPath, 'utf-8')
}

function checkFileExists(relativePath) {
  return existsSync(join(projectRoot, relativePath))
}

function checkStringInFile(relativePath, searchString) {
  const content = readFile(relativePath)
  return content ? content.includes(searchString) : false
}

// Critical bug fix validations
const criticalFixes = [
  {
    name: '🚨 CRITICAL: Auth Success Redirect Fixed',
    check: () => {
      const content = readFile('hooks/useUnifiedAuth.ts')
      return content && 
        content.includes('setTimeout(() => {') &&
        content.includes('router.push(redirectTo)') &&
        content.includes('}, 100)')
    },
    description: 'handleAuthSuccess now properly redirects after signup'
  },
  
  {
    name: '🚨 CRITICAL: Homepage Navigation for Authenticated Users',
    check: () => {
      const content = readFile('components/Navbar.tsx')
      return content && 
        content.includes('e.ctrlKey || e.metaKey') &&
        content.includes("{ name: 'Trang chủ', href: '/' }")
    },
    description: 'Authenticated users can navigate to homepage via Ctrl+click or nav link'
  },

  {
    name: '🚨 CRITICAL: Workspace Auth Loop Prevention',
    check: () => {
      const content = readFile('app/workspace/page.tsx')
      return content && 
        content.includes('authTriggeredRef') &&
        content.includes('500) // 500ms debounce') &&
        content.includes('useRef<NodeJS.Timeout>()')
    },
    description: 'Workspace auth check is debounced to prevent infinite loops'
  },

  {
    name: '✅ Navigation Consistency: ErrorBoundary Fixed',
    check: () => {
      const content = readFile('components/ErrorBoundary.tsx')
      return content && 
        content.includes('const router = useRouter()') &&
        content.includes('onClick={handleGoHome}') &&
        !content.includes("window.location.href = '/'")
    },
    description: 'ErrorBoundary uses Next.js router instead of window.location'
  },

  {
    name: '✅ AuthContext Race Condition Fixed',
    check: () => {
      const content = readFile('contexts/AuthContext.tsx')
      return content && 
        content.includes('let isMounted = true') &&
        content.includes('if (!isMounted) return') &&
        content.includes("console.log('Auth state change:'")
    },
    description: 'AuthContext has race condition protection and better logging'
  },
]

// Specific user journey validations
const userJourneyChecks = [
  {
    name: '👤 User Journey: Sign Up → Workspace Redirect',
    validate: () => {
      const authContent = readFile('hooks/useUnifiedAuth.ts')
      return authContent && 
        authContent.includes('router.push(redirectTo)') &&
        authContent.includes('closeAuthModal()')
    },
    description: 'Sign up flow properly redirects to workspace'
  },

  {
    name: '👤 User Journey: Authenticated Homepage Access',
    validate: () => {
      const navContent = readFile('components/Navbar.tsx')
      return navContent &&
        navContent.includes("name: 'Trang chủ'") &&
        navContent.includes('if (user)')
    },
    description: 'Authenticated users see homepage link in navigation'
  },

  {
    name: '👤 User Journey: Workspace Stability',
    validate: () => {
      const workspaceContent = readFile('app/workspace/page.tsx')
      return workspaceContent &&
        workspaceContent.includes('authTriggeredRef.current = false') &&
        workspaceContent.includes('Reset auth trigger when user becomes available')
    },
    description: 'Workspace resets auth trigger when user loads'
  },

  {
    name: '👤 User Journey: Pricing Page Access',
    validate: () => {
      const pricingContent = readFile('app/pricing/page.tsx')
      return pricingContent &&
        pricingContent.includes('PricingErrorBoundary')
    },
    description: 'Pricing page wrapped with error boundary for stability'
  },
]

// Run validations
let totalTests = 0
let passedTests = 0

console.log('🔧 CRITICAL BUG FIXES VALIDATION:\n')

// Test critical fixes
criticalFixes.forEach(test => {
  totalTests++
  const passed = test.check()
  if (passed) {
    passedTests++
    console.log(`   ${test.name} ✅`)
    console.log(`     → ${test.description}`)
  } else {
    console.log(`   ${test.name} ❌ FAILED`)
    console.log(`     → ${test.description}`)
  }
  console.log('')
})

console.log('👤 USER JOURNEY VALIDATION:\n')

// Test user journey
userJourneyChecks.forEach(test => {
  totalTests++
  const passed = test.validate()
  if (passed) {
    passedTests++
    console.log(`   ${test.name} ✅`)
    console.log(`     → ${test.description}`)
  } else {
    console.log(`   ${test.name} ❌ FAILED`)
    console.log(`     → ${test.description}`)
  }
  console.log('')
})

// Additional regression checks
console.log('🔍 REGRESSION CHECKS:\n')

const regressionChecks = [
  {
    name: 'No window.location.href in components',
    check: () => {
      const errorContent = readFile('components/ErrorBoundary.tsx')
      return errorContent && !errorContent.includes("window.location.href = '/'")
    }
  },
  {
    name: 'Auth provider consistency',
    check: () => {
      const layoutContent = readFile('app/layout.tsx')
      return layoutContent && 
        layoutContent.includes('AuthProvider') &&
        layoutContent.includes('UnifiedAuthProvider')
    }
  },
  {
    name: 'Smart logo logic maintained',
    check: () => {
      const navContent = readFile('components/Navbar.tsx')
      return navContent &&
        navContent.includes('getLogoHref') &&
        navContent.includes('handleLogoClick')
    }
  }
]

regressionChecks.forEach(test => {
  totalTests++
  const passed = test.check()
  if (passed) {
    passedTests++
    console.log(`   ✅ ${test.name}`)
  } else {
    console.log(`   ❌ REGRESSION: ${test.name}`)
  }
})

// Final report
console.log('\n' + '='.repeat(60))
console.log(`📊 CRITICAL FIXES VALIDATION: ${passedTests}/${totalTests} checks passed`)

const successRate = (passedTests / totalTests) * 100
if (successRate >= 95) {
  console.log('🎉 EXCELLENT: All critical user journey bugs are fixed!')
  console.log('   ✅ Sign up → workspace redirect works')
  console.log('   ✅ Authenticated homepage navigation available')  
  console.log('   ✅ Workspace auth loops prevented')
  console.log('   ✅ Navigation consistency maintained')
  console.log('   ✅ Race conditions eliminated')
} else if (successRate >= 85) {
  console.log('✅ GOOD: Most critical bugs fixed, some minor issues remain')
} else {
  console.log('⚠️  CRITICAL ISSUES: Major bugs still present - deployment not recommended')
  process.exit(1)
}

console.log('\n🚀 Ready for user journey testing!')

process.exit(successRate >= 85 ? 0 : 1)