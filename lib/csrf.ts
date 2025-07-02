import { createHash, randomBytes } from 'crypto'
import { NextRequest } from 'next/server'

// CSRF Token Configuration
const CSRF_SECRET =
  process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'
const TOKEN_LENGTH = 32

// Generate a secure CSRF token
export function generateCSRFToken(sessionId?: string): string {
  const timestamp = Date.now().toString()
  const randomData = randomBytes(TOKEN_LENGTH).toString('hex')
  const sessionData = sessionId || 'anonymous'

  // Create a hash that includes session data for validation
  const payload = `${timestamp}:${randomData}:${sessionData}`
  const signature = createHash('sha256')
    .update(payload + CSRF_SECRET)
    .digest('hex')

  return Buffer.from(`${payload}:${signature}`).toString('base64')
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionId?: string): boolean {
  try {
    if (!token) return false

    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')

    if (parts.length !== 4) return false

    const [timestamp, randomData, tokenSessionId, signature] = parts
    const sessionData = sessionId || 'anonymous'

    // Validate session consistency
    if (tokenSessionId !== sessionData) return false

    // Validate signature
    const payload = `${timestamp}:${randomData}:${tokenSessionId}`
    const expectedSignature = createHash('sha256')
      .update(payload + CSRF_SECRET)
      .digest('hex')

    if (signature !== expectedSignature) return false

    // Check token age (valid for 24 hours)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (now - tokenTime > maxAge) return false

    return true
  } catch (error) {
    console.error('CSRF token validation error:', error)
    return false
  }
}

// Extract CSRF token from request
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get('x-csrf-token')
  if (headerToken) return headerToken

  // Check body for form submissions (would need to be parsed elsewhere)
  // This is handled in individual API routes
  return null
}

// Generate CSRF token for forms
export function getCSRFTokenForSession(sessionId?: string): {
  token: string
  formField: string
} {
  const token = generateCSRFToken(sessionId)
  return {
    token,
    formField: `<input type="hidden" name="csrf_token" value="${token}" />`,
  }
}

// Middleware to validate CSRF tokens
export async function validateCSRFMiddleware(
  request: NextRequest,
  sessionId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF validation for GET requests and safe methods
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }

  // Get CSRF token from request
  const token = getCSRFTokenFromRequest(request)

  if (!token) {
    return { valid: false, error: 'CSRF token missing' }
  }

  const isValid = validateCSRFToken(token, sessionId)

  if (!isValid) {
    return { valid: false, error: 'Invalid CSRF token' }
  }

  return { valid: true }
}

// React hook for CSRF protection (to be used in components)
export const useCSRFToken = () => {
  // This would typically get the session ID from your auth context
  // For now, we'll use a placeholder
  const sessionId = 'user-session' // Replace with actual session ID

  return getCSRFTokenForSession(sessionId)
}

// Helper to add CSRF token to API requests
export function addCSRFToHeaders(
  headers: HeadersInit = {},
  sessionId?: string
): HeadersInit {
  const { token } = getCSRFTokenForSession(sessionId)

  return {
    ...headers,
    'X-CSRF-Token': token,
    'Content-Type': 'application/json',
  }
}
