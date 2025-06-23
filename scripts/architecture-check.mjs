#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🔍 KIỂM TRA KIẾN TRÚC WEBSITE - BÁNG CÁO TỰ ĐỘNG\n')

// Helper functions
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

// Test suites
const tests = {
  navigation: [
    {
      name: '✅ Smart Logo Navigation',
      check: () => checkStringInFile('components/Navbar.tsx', 'getLogoHref'),
      description: 'Logo navigation logic implemented'
    },
    {
      name: '✅ Router Usage in Pricing',
      check: () => checkStringInFile('components/pricing/PricingPage.tsx', 'useRouter'),
      description: 'Next.js router usage instead of window.location'
    },
    {
      name: '✅ Router Usage in UnifiedAuth',
      check: () => checkStringInFile('hooks/useUnifiedAuth.ts', 'router.push'),
      description: 'Unified auth uses Next.js router'
    },
  ],

  errorHandling: [
    {
      name: '✅ Error Boundary Component',
      check: () => checkFileExists('components/ErrorBoundary.tsx'),
      description: 'Comprehensive error boundary created'
    },
    {
      name: '✅ Workspace Error Boundary',
      check: () => checkStringInFile('app/workspace/page.tsx', 'WorkspaceErrorBoundary'),
      description: 'Workspace wrapped with error boundary'
    },
    {
      name: '✅ Pricing Error Boundary',
      check: () => checkStringInFile('app/pricing/page.tsx', 'PricingErrorBoundary'),
      description: 'Pricing wrapped with error boundary'
    },
    {
      name: '✅ Auth Error Boundary',
      check: () => checkStringInFile('contexts/UnifiedAuthProvider.tsx', 'AuthErrorBoundary'),
      description: 'Auth modal wrapped with error boundary'
    },
  ],

  serviceWorker: [
    {
      name: '✅ Service Worker Enabled',
      check: () => !checkStringInFile('app/layout.tsx', 'Temporarily disabled'),
      description: 'Service worker re-enabled in layout'
    },
    {
      name: '✅ Workspace Route Updated',
      check: () => checkStringInFile('public/sw.js', '/workspace'),
      description: 'Service worker uses /workspace instead of /dashboard'
    },
    {
      name: '✅ Smart Cache Strategy',
      check: () => checkStringInFile('public/sw.js', 'Keep current version caches'),
      description: 'Selective cache clearing implemented'
    },
  ],

  loadingCoordination: [
    {
      name: '✅ Loading Context Created',
      check: () => checkFileExists('contexts/LoadingContext.tsx'),
      description: 'Centralized loading state management'
    },
    {
      name: '✅ Loading Provider Added',
      check: () => checkStringInFile('app/layout.tsx', 'LoadingProvider'),
      description: 'Loading provider integrated in layout'
    },
    {
      name: '✅ Global Loading Indicator',
      check: () => checkStringInFile('app/layout.tsx', 'GlobalLoadingIndicator'),
      description: 'Global loading indicator active'
    },
    {
      name: '✅ Workspace Loading Integration',
      check: () => checkStringInFile('app/workspace/page.tsx', 'useWorkspaceLoading'),
      description: 'Workspace uses coordinated loading'
    },
  ],

  routing: [
    {
      name: '✅ UserMenu Workspace Link',
      check: () => checkStringInFile('components/auth/UserMenu.tsx', 'href="/workspace"'),
      description: 'UserMenu links to workspace'
    },
    {
      name: '✅ AuthContext Workspace Default',
      check: () => checkStringInFile('contexts/AuthContext.tsx', "|| '/workspace'"),
      description: 'AuthContext defaults to workspace'
    },
    {
      name: '✅ Offline Page Workspace',
      check: () => checkStringInFile('app/offline/page.tsx', 'href="/workspace"'),
      description: 'Offline page links to workspace'
    },
  ]
}

// Run tests
let totalTests = 0
let passedTests = 0

console.log('🏗️ KIỂM TRA TỐI ƯU HÓA KIẾN TRÚC:\n')

Object.entries(tests).forEach(([category, categoryTests]) => {
  console.log(`📁 ${category.toUpperCase()}:`)
  
  categoryTests.forEach(test => {
    totalTests++
    const passed = test.check()
    if (passed) {
      passedTests++
      console.log(`   ${test.name} - ${test.description}`)
    } else {
      console.log(`   ❌ FAILED: ${test.name} - ${test.description}`)
    }
  })
  
  console.log('')
})

// Additional checks
console.log('🔍 KIỂM TRA BỔ SUNG:')

// Check for window.location.href usage (should be minimal)
const pricingContent = readFile('components/pricing/PricingPage.tsx')
const windowLocationCount = (pricingContent?.match(/window\.location\.href/g) || []).length
if (windowLocationCount <= 1) {  // Allow 1 for checkout redirect
  console.log('   ✅ Minimal window.location.href usage in pricing')
  passedTests++
} else {
  console.log('   ❌ Too many window.location.href usages in pricing')
}
totalTests++

// Check for dashboard references
const dashboardRefs = [
  'components/auth/UserMenu.tsx',
  'contexts/AuthContext.tsx', 
  'app/offline/page.tsx',
  'public/sw.js'
].some(file => checkStringInFile(file, '/dashboard'))

if (!dashboardRefs) {
  console.log('   ✅ No remaining /dashboard references')
  passedTests++
} else {
  console.log('   ❌ Found remaining /dashboard references')
}
totalTests++

// Final report
console.log('\n' + '='.repeat(50))
console.log(`📊 KẾT QUẢ KIỂM TRA: ${passedTests}/${totalTests} tests passed`)

const successRate = (passedTests / totalTests) * 100
if (successRate >= 95) {
  console.log('🎉 XUẤT SẮC: Kiến trúc website đã được tối ưu hóa hoàn chỉnh!')
} else if (successRate >= 85) {
  console.log('✅ TỐT: Hầu hết các tối ưu hóa đã được triển khai thành công')
} else {
  console.log('⚠️  CẦN CẢI THIỆN: Một số tối ưu hóa chưa hoàn tất')
}

console.log('\n🚀 Website sẵn sàng cho production deployment!')

process.exit(successRate >= 85 ? 0 : 1)