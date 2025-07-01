import { headers } from 'next/headers'

/**
 * CSP Nonce utilities for Master Prompt architecture
 * Provides secure nonce generation and retrieval for CSP compliance
 */

// Generate a cryptographically secure nonce
export function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

// Get the current CSP nonce from request headers (server-side)
export function getCSPNonce(): string | null {
  try {
    const headersList = headers()
    return headersList.get('X-CSP-Nonce')
  } catch (error) {
    // During static generation or when headers are not available
    return null
  }
}

// Get CSP nonce for client-side usage
export function getClientCSPNonce(): string | null {
  if (typeof window === 'undefined') return null
  
  // Try to get nonce from a meta tag or script attribute
  const metaTag = document.querySelector('meta[name="csp-nonce"]')
  if (metaTag) {
    return metaTag.getAttribute('content')
  }

  // Fallback: try to extract from existing script tag
  const scriptWithNonce = document.querySelector('script[nonce]')
  if (scriptWithNonce) {
    return scriptWithNonce.getAttribute('nonce')
  }

  return null
}

// CSP-compliant script tag helper
export function createScriptTag(content: string, nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : ''
  return `<script${nonceAttr}>${content}</script>`
}

// CSP-compliant style tag helper
export function createStyleTag(content: string, nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : ''
  return `<style${nonceAttr}>${content}</style>`
}

// React component for CSP-compliant inline scripts
export function CSPScript({ 
  children, 
  nonce 
}: { 
  children: string
  nonce?: string 
}) {
  const finalNonce = nonce || getCSPNonce()
  
  return (
    <script 
      nonce={finalNonce || undefined}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}

// React component for CSP-compliant inline styles
export function CSPStyle({ 
  children, 
  nonce 
}: { 
  children: string
  nonce?: string 
}) {
  const finalNonce = nonce || getCSPNonce()
  
  return (
    <style 
      nonce={finalNonce || undefined}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}

// Validate CSP directives for development
export function validateCSPDirectives(csp: string): boolean {
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'object-src',
    'base-uri',
    'frame-ancestors'
  ]

  const lowercaseCSP = csp.toLowerCase()
  
  for (const directive of requiredDirectives) {
    if (!lowercaseCSP.includes(directive)) {
      console.warn(`CSP missing required directive: ${directive}`)
      return false
    }
  }

  // Check for unsafe directives
  const unsafeDirectives = ['unsafe-inline', 'unsafe-eval']
  for (const unsafe of unsafeDirectives) {
    if (lowercaseCSP.includes(unsafe)) {
      console.warn(`CSP contains unsafe directive: ${unsafe}`)
      return false
    }
  }

  return true
}

// CSP reporting helper
export function createCSPReportHandler() {
  return function handleCSPReport(report: any) {
    console.error('CSP Violation:', {
      blockedURI: report['blocked-uri'],
      violatedDirective: report['violated-directive'],
      originalPolicy: report['original-policy'],
      documentURI: report['document-uri'],
      lineNumber: report['line-number'],
      sourceFile: report['source-file']
    })

    // In production, send to monitoring service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      fetch('/api/security/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      }).catch(error => {
        console.error('Failed to send CSP report:', error)
      })
    }
  }
}

// Development CSP monitoring
export function monitorCSPViolations() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    console.group('🚨 CSP Violation Detected')
    console.error('Blocked URI:', event.blockedURI)
    console.error('Violated Directive:', event.violatedDirective)
    console.error('Original Policy:', event.originalPolicy)
    console.error('Source File:', event.sourceFile)
    console.error('Line Number:', event.lineNumber)
    console.groupEnd()
  })

  console.log('🛡️ CSP monitoring enabled for development')
}