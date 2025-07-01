import { NextRequest, NextResponse } from 'next/server'

interface CSPViolationReport {
  'document-uri': string
  'referrer': string
  'violated-directive': string
  'effective-directive': string
  'original-policy': string
  'disposition': string
  'blocked-uri': string
  'line-number': number
  'column-number': number
  'source-file': string
  'status-code': number
  'script-sample': string
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    let report: CSPViolationReport
    
    // Handle both JSON and form-encoded CSP reports
    if (contentType.includes('application/json')) {
      const body = await request.json()
      report = body['csp-report'] || body
    } else {
      // Some browsers send CSP reports as form data
      const formData = await request.formData()
      const reportData = formData.get('csp-report')
      
      if (typeof reportData === 'string') {
        report = JSON.parse(reportData)
      } else {
        throw new Error('Invalid CSP report format')
      }
    }

    // Log CSP violation for monitoring
    console.error('🚨 CSP Violation Report:', {
      documentURI: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedURI: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      originalPolicy: report['original-policy'],
      timestamp: new Date().toISOString()
    })

    // In production, you might want to:
    // 1. Store violations in database for analysis
    // 2. Send alerts for critical violations
    // 3. Update CSP policies based on legitimate violations
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Store in database for analysis
      // await storeCSPViolation(report)
      
      // Example: Send to monitoring service
      // await sendToMonitoring(report)
      
      // Check if this is a known violation that needs policy update
      await analyzeCSPViolation(report)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Failed to process CSP report:', error)
    return NextResponse.json(
      { error: 'Failed to process CSP report' },
      { status: 400 }
    )
  }
}

async function analyzeCSPViolation(report: CSPViolationReport) {
  const violatedDirective = report['violated-directive']
  const blockedURI = report['blocked-uri']
  const sourceFile = report['source-file']

  // Common patterns that might indicate legitimate violations
  const legitimatePatterns = [
    // Browser extensions
    /chrome-extension:/,
    /moz-extension:/,
    /safari-extension:/,
    
    // Browser internal URIs
    /about:/,
    /data:/,
    
    // CDN resources that might be legitimate
    /\.googleapis\.com/,
    /\.gstatic\.com/,
    /fonts\.gstatic\.com/,
  ]

  const isLegitimate = legitimatePatterns.some(pattern => 
    pattern.test(blockedURI) || pattern.test(sourceFile)
  )

  if (!isLegitimate) {
    // This might be a real security issue or a policy that needs updating
    console.warn('🔍 Potential security issue or CSP policy update needed:', {
      directive: violatedDirective,
      blocked: blockedURI,
      source: sourceFile
    })

    // In a real application, you might:
    // 1. Send alerts for potential security issues
    // 2. Create tickets for CSP policy reviews
    // 3. Automatically suggest policy updates
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}