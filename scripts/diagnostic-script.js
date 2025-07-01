/**
 * COMPREHENSIVE DIAGNOSTIC SCRIPT
 * Root Cause Analysis for CSP Violations & GoTrueClient Issues
 * 
 * This script provides detailed telemetry to identify the exact sources
 * of persistent CSP violations and multiple Supabase client instances
 */

console.log('🔍 [DIAGNOSTIC] Starting comprehensive root cause analysis...')

// =============================================================================
// 1. CSP VIOLATION MONITOR với detailed logging
// =============================================================================

window.__CSP_VIOLATIONS_DETAILED__ = []
window.__CSP_DIAGNOSTICS_ACTIVE__ = true

// Enhanced CSP violation listener with stack trace capture
document.addEventListener('securitypolicyviolation', (e) => {
  const violation = {
    timestamp: new Date().toISOString(),
    directive: e.effectiveDirective,
    blockedURI: e.blockedURI,
    sourceFile: e.sourceFile,
    lineNumber: e.lineNumber,
    columnNumber: e.columnNumber,
    sample: e.sample,
    stackTrace: new Error().stack,
    documentURI: e.documentURI,
    referrer: e.referrer,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
    // Additional context
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp_ms: Date.now()
  }
  
  window.__CSP_VIOLATIONS_DETAILED__.push(violation)
  
  console.error('🚨 [CSP VIOLATION]', {
    directive: violation.directive,
    blockedURI: violation.blockedURI,
    sourceFile: violation.sourceFile,
    line: violation.lineNumber,
    sample: violation.sample?.substring(0, 100)
  })
  
  // Real-time analysis of common patterns
  if (violation.sample) {
    // Check for styled-components patterns
    if (violation.sample.includes('styled-components') || violation.sample.includes('sc-')) {
      console.warn('🎯 [DIAGNOSTIC] Styled-components CSP violation detected')
    }
    
    // Check for inline style patterns
    if (violation.directive === 'style-src' && violation.sample.startsWith('{')) {
      console.warn('🎯 [DIAGNOSTIC] Inline CSS object detected')
    }
    
    // Check for React DevTools
    if (violation.sourceFile && violation.sourceFile.includes('react-devtools')) {
      console.warn('🎯 [DIAGNOSTIC] React DevTools CSP violation (development only)')
    }
  }
})

// =============================================================================
// 2. SUPABASE CLIENT INSTANCE MONITOR
// =============================================================================

window.__SUPABASE_INSTANCES_LOG__ = []
window.__GOTRUE_INSTANCES_LOG__ = []

// Monitor Supabase client creation
const originalCreateClient = window.createBrowserClient || window.createClient
if (originalCreateClient) {
  window.createBrowserClient = function(...args) {
    const instance = originalCreateClient.apply(this, args)
    
    window.__SUPABASE_INSTANCES_LOG__.push({
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
      args: args.map(arg => typeof arg === 'string' ? arg.substring(0, 50) + '...' : typeof arg),
      instanceId: Math.random().toString(36).substring(7)
    })
    
    console.warn('🚨 [SUPABASE DIAGNOSTIC] New Supabase client created', {
      totalInstances: window.__SUPABASE_INSTANCES_LOG__.length,
      stackTrace: new Error().stack.split('\n').slice(1, 4)
    })
    
    return instance
  }
}

// Monitor GoTrueClient instances specifically
let originalGoTrueClient
try {
  // Try to intercept GoTrueClient if available
  if (window.GoTrueClient || (window.supabase && window.supabase.GoTrueClient)) {
    originalGoTrueClient = window.GoTrueClient || window.supabase.GoTrueClient
    
    const GoTrueClientProxy = function(...args) {
      window.__GOTRUE_INSTANCES_LOG__.push({
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack,
        args: args.map(arg => typeof arg === 'string' ? arg.substring(0, 50) + '...' : typeof arg),
        instanceId: Math.random().toString(36).substring(7)
      })
      
      console.warn('🚨 [GOTRUE DIAGNOSTIC] New GoTrueClient created', {
        totalInstances: window.__GOTRUE_INSTANCES_LOG__.length,
        stackTrace: new Error().stack.split('\n').slice(1, 4)
      })
      
      return new originalGoTrueClient(...args)
    }
    
    // Preserve prototype
    GoTrueClientProxy.prototype = originalGoTrueClient.prototype
    
    if (window.GoTrueClient) window.GoTrueClient = GoTrueClientProxy
    if (window.supabase && window.supabase.GoTrueClient) {
      window.supabase.GoTrueClient = GoTrueClientProxy
    }
  }
} catch (error) {
  console.warn('🔍 [DIAGNOSTIC] Could not intercept GoTrueClient:', error.message)
}

// =============================================================================
// 3. DYNAMIC STYLE TAG MONITOR
// =============================================================================

window.__DYNAMIC_STYLES_LOG__ = []

// Monitor all style tag creation
const originalCreateElement = document.createElement
document.createElement = function(tagName) {
  const element = originalCreateElement.call(this, tagName)
  
  if (tagName.toLowerCase() === 'style') {
    window.__DYNAMIC_STYLES_LOG__.push({
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
      hasNonce: element.hasAttribute('nonce'),
      attributes: Array.from(element.attributes || []).map(attr => `${attr.name}="${attr.value}"`),
      createdBy: new Error().stack.split('\n').slice(1, 3).join('\n')
    })
    
    console.log('📝 [STYLE DIAGNOSTIC] New style element created', {
      hasNonce: element.hasAttribute('nonce'),
      stackTrace: new Error().stack.split('\n').slice(1, 3)
    })
  }
  
  return element
}

// Monitor appendChild for style elements
const originalAppendChild = Node.prototype.appendChild
Node.prototype.appendChild = function(child) {
  if (child.tagName === 'STYLE') {
    console.log('📝 [STYLE DIAGNOSTIC] Style element appended', {
      hasNonce: child.hasAttribute('nonce'),
      textContent: child.textContent?.substring(0, 100),
      parent: this.tagName || this.nodeName,
      stackTrace: new Error().stack.split('\n').slice(1, 3)
    })
    
    // Check if style needs nonce
    if (!child.hasAttribute('nonce')) {
      const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') || 
                   window.__CSP_NONCE__
      
      if (nonce) {
        console.warn('⚡ [STYLE FIX] Adding missing nonce to style element')
        child.setAttribute('nonce', nonce)
      }
    }
  }
  
  return originalAppendChild.call(this, child)
}

// =============================================================================
// 4. JAVASCRIPT BUNDLE ANALYSIS
// =============================================================================

window.__SCRIPT_LOADS_LOG__ = []

// Monitor script loading
const originalCreateScript = document.createElement
const originalCreateElementOverride = document.createElement
document.createElement = function(tagName) {
  const element = originalCreateElementOverride.call(this, tagName)
  
  if (tagName.toLowerCase() === 'script') {
    window.__SCRIPT_LOADS_LOG__.push({
      timestamp: new Date().toISOString(),
      src: element.src,
      stackTrace: new Error().stack,
      hasNonce: element.hasAttribute('nonce')
    })
    
    console.log('📜 [SCRIPT DIAGNOSTIC] New script element created', {
      src: element.src?.substring(0, 100),
      hasNonce: element.hasAttribute('nonce')
    })
  }
  
  return element
}

// =============================================================================
// 5. LIBRARY DETECTION
// =============================================================================

function detectLoadedLibraries() {
  const libraries = []
  
  // Check for common libraries that might cause CSP issues
  const libraryChecks = {
    'styled-components': () => window.styled || window.__styled__ || document.querySelector('[data-styled]'),
    'emotion': () => window.emotion || document.querySelector('[data-emotion]'),
    'material-ui': () => window.MaterialUI || document.querySelector('[class*="makeStyles"]'),
    'react': () => window.React,
    'supabase': () => window.supabase || window.__PRISMY_SUPABASE_CLIENT__,
    'next.js': () => window.__NEXT_DATA__,
    'framer-motion': () => window.FramerMotion || document.querySelector('[data-framer-motion]')
  }
  
  for (const [name, check] of Object.entries(libraryChecks)) {
    try {
      if (check()) {
        libraries.push(name)
      }
    } catch (error) {
      console.debug(`🔍 [LIBRARY CHECK] Error checking ${name}:`, error.message)
    }
  }
  
  return libraries
}

// =============================================================================
// 6. DIAGNOSTIC REPORTING FUNCTIONS
// =============================================================================

window.generateDiagnosticReport = function() {
  const report = {
    timestamp: new Date().toISOString(),
    uptime: Date.now() - window.__DIAGNOSTIC_START_TIME__,
    
    // CSP Violations
    cspViolations: {
      total: window.__CSP_VIOLATIONS_DETAILED__.length,
      byDirective: {},
      bySource: {},
      recentViolations: window.__CSP_VIOLATIONS_DETAILED__.slice(-10)
    },
    
    // Supabase Instances
    supabaseInstances: {
      total: window.__SUPABASE_INSTANCES_LOG__.length,
      goTrueInstances: window.__GOTRUE_INSTANCES_LOG__.length,
      globalClientExists: !!window.__PRISMY_SUPABASE_CLIENT__,
      recentCreations: window.__SUPABASE_INSTANCES_LOG__.slice(-5)
    },
    
    // Dynamic Styles
    dynamicStyles: {
      total: window.__DYNAMIC_STYLES_LOG__.length,
      withoutNonce: window.__DYNAMIC_STYLES_LOG__.filter(s => !s.hasNonce).length,
      recent: window.__DYNAMIC_STYLES_LOG__.slice(-5)
    },
    
    // Environment
    environment: {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      loadedLibraries: detectLoadedLibraries(),
      nonce: document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') || 'NOT_FOUND'
    }
  }
  
  // Aggregate CSP violations by directive
  window.__CSP_VIOLATIONS_DETAILED__.forEach(violation => {
    report.cspViolations.byDirective[violation.directive] = 
      (report.cspViolations.byDirective[violation.directive] || 0) + 1
    
    const source = violation.sourceFile || violation.blockedURI || 'unknown'
    report.cspViolations.bySource[source] = 
      (report.cspViolations.bySource[source] || 0) + 1
  })
  
  return report
}

window.exportDiagnosticData = function() {
  const data = {
    cspViolations: window.__CSP_VIOLATIONS_DETAILED__,
    supabaseInstances: window.__SUPABASE_INSTANCES_LOG__,
    goTrueInstances: window.__GOTRUE_INSTANCES_LOG__,
    dynamicStyles: window.__DYNAMIC_STYLES_LOG__,
    scriptLoads: window.__SCRIPT_LOADS_LOG__
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prismy-diagnostic-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  console.log('📁 [DIAGNOSTIC] Data exported to file')
}

window.printDiagnosticSummary = function() {
  const report = window.generateDiagnosticReport()
  
  console.group('🔍 DIAGNOSTIC SUMMARY')
  console.log('📊 CSP Violations:', report.cspViolations.total)
  console.log('📊 Supabase Instances:', report.supabaseInstances.total)
  console.log('📊 GoTrueClient Instances:', report.supabaseInstances.goTrueInstances)
  console.log('📊 Dynamic Styles:', report.dynamicStyles.total)
  console.log('📊 Loaded Libraries:', report.environment.loadedLibraries)
  console.log('📊 CSP Nonce:', report.environment.nonce)
  
  if (report.cspViolations.total > 0) {
    console.group('🚨 CSP Violations by Directive:')
    Object.entries(report.cspViolations.byDirective).forEach(([directive, count]) => {
      console.log(`- ${directive}: ${count}`)
    })
    console.groupEnd()
  }
  
  console.groupEnd()
  
  return report
}

// =============================================================================
// 7. INITIALIZE DIAGNOSTICS
// =============================================================================

window.__DIAGNOSTIC_START_TIME__ = Date.now()

// Set up periodic reporting
setInterval(() => {
  const report = window.generateDiagnosticReport()
  
  if (report.cspViolations.total > 0 || report.supabaseInstances.total > 1) {
    console.warn('🔔 [DIAGNOSTIC ALERT]', {
      cspViolations: report.cspViolations.total,
      supabaseInstances: report.supabaseInstances.total,
      goTrueInstances: report.supabaseInstances.goTrueInstances
    })
  }
}, 30000) // Every 30 seconds

// Report initial state after page load
setTimeout(() => {
  console.log('🚀 [DIAGNOSTIC] Initial page load analysis complete')
  window.printDiagnosticSummary()
}, 5000)

console.log('✅ [DIAGNOSTIC] Monitoring systems activated')
console.log('📋 Available commands:')
console.log('  - window.printDiagnosticSummary()')
console.log('  - window.generateDiagnosticReport()')
console.log('  - window.exportDiagnosticData()')