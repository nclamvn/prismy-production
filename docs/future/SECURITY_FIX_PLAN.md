# Security Fix and Improvement Plan

## Executive Summary

Based on the comprehensive security audit, this document outlines a prioritized plan to address critical vulnerabilities and implement security improvements for the Prismy platform.

## Priority 1: Critical Security Fixes (Fix Immediately)

### 1. Implement Security Headers Middleware

**Issue**: Missing Content Security Policy and security headers
**Risk**: XSS, clickjacking, and CSRF vulnerabilities
**Timeline**: 1-2 days

**Implementation**:

Create `/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.vnpayment.vn https://*.momo.vn",
    "frame-src 'self' https://js.stripe.com"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
```

### 2. Replace In-Memory Rate Limiting

**Issue**: Rate limiting resets on server restart
**Risk**: DDoS and abuse vulnerability
**Timeline**: 2-3 days

**Implementation**:

Update `/lib/rate-limiter.ts`:
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const window = Math.floor(now / windowMs)
  const windowKey = `${key}:${window}`

  const current = await redis.incr(windowKey)
  
  if (current === 1) {
    await redis.expire(windowKey, Math.ceil(windowMs / 1000))
  }

  const success = current <= limit
  const resetTime = (window + 1) * windowMs

  return {
    success,
    limit,
    remaining: Math.max(0, limit - current),
    resetTime,
  }
}
```

### 3. Add CSRF Protection

**Issue**: Missing CSRF protection for forms
**Risk**: Cross-site request forgery attacks
**Timeline**: 1-2 days

**Implementation**:

Create CSRF middleware and add tokens to all forms:
```typescript
// lib/csrf.ts
import { randomBytes } from 'crypto'

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}
```

### 4. Enhanced Input Validation

**Issue**: Insufficient input sanitization
**Risk**: Injection attacks and data corruption
**Timeline**: 2-3 days

**Implementation**:

Create validation middleware:
```typescript
// lib/validation.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

export const translationSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(10000, 'Text too long')
    .transform(text => DOMPurify.sanitize(text)),
  sourceLanguage: z.string().regex(/^[a-z]{2}$/, 'Invalid language code'),
  targetLanguage: z.string().regex(/^[a-z]{2}$/, 'Invalid language code'),
  qualityTier: z.enum(['free', 'standard', 'premium', 'enterprise']),
})

export const paymentSchema = z.object({
  planKey: z.enum(['standard', 'premium', 'enterprise']),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'VND']),
})
```

## Priority 2: High Security Fixes (Fix Within 1 Week)

### 5. Webhook Replay Attack Protection

**Issue**: Payment webhooks vulnerable to replay attacks
**Timeline**: 2-3 days

**Implementation**:

Add timestamp validation to webhook handlers:
```typescript
// lib/webhook-security.ts
export function validateWebhookTimestamp(timestamp: number, tolerance: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000)
  return Math.abs(now - timestamp) <= tolerance
}

export function preventReplayAttack(webhookId: string): Promise<boolean> {
  // Use Redis to store processed webhook IDs
  // Return false if webhook was already processed
}
```

### 6. API Authentication Middleware

**Issue**: Inconsistent authentication across API routes
**Timeline**: 3-4 days

**Implementation**:

Create reusable auth middleware:
```typescript
// lib/auth-middleware.ts
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function withAuth(handler: Function) {
  return async (request: Request) => {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    return handler(request, { user: session.user, supabase })
  }
}
```

### 7. Enhanced Error Handling

**Issue**: Error messages may leak sensitive information
**Timeline**: 2-3 days

**Implementation**:

Create secure error handler:
```typescript
// lib/error-handler.ts
export class SecureError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage: string = 'An unexpected error occurred'
  ) {
    super(message)
  }
}

export function handleSecureError(error: unknown) {
  if (error instanceof SecureError) {
    return {
      message: error.userMessage,
      statusCode: error.statusCode
    }
  }
  
  // Log full error details but return generic message
  console.error('Unexpected error:', error)
  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  }
}
```

## Priority 3: Medium Priority Improvements (Fix Within 1 Month)

### 8. Security Monitoring and Logging

**Timeline**: 1-2 weeks

**Implementation**:
- Add structured logging for security events
- Implement failed login attempt monitoring
- Set up alerts for suspicious activity
- Add audit trail for sensitive operations

### 9. API Request Logging

**Timeline**: 1 week

**Implementation**:
- Log all API requests with user context
- Monitor for unusual patterns
- Add request rate analytics
- Implement security dashboard

### 10. Automated Security Testing

**Timeline**: 2-3 weeks

**Implementation**:
- Add security tests to CI/CD pipeline
- Implement dependency vulnerability scanning
- Add OWASP ZAP integration
- Set up security regression testing

## Implementation Checklist

### Week 1: Critical Fixes
- [ ] Create security headers middleware
- [ ] Set up Redis for rate limiting
- [ ] Implement CSRF protection
- [ ] Add input validation middleware
- [ ] Test all security fixes

### Week 2: High Priority Fixes
- [ ] Implement webhook replay protection
- [ ] Create API authentication middleware
- [ ] Add secure error handling
- [ ] Update all API routes with new middleware
- [ ] Security testing and validation

### Week 3-4: Medium Priority Improvements
- [ ] Set up security monitoring
- [ ] Implement request logging
- [ ] Add security alerts
- [ ] Create security documentation
- [ ] Team security training

## Dependencies Required

```json
{
  "@upstash/redis": "^1.28.0",
  "zod": "^3.22.4",
  "isomorphic-dompurify": "^2.14.0",
  "bcryptjs": "^2.4.3",
  "helmet": "^7.1.0"
}
```

## Environment Variables Needed

```env
# Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Security Configuration
CSRF_SECRET=your_csrf_secret
WEBHOOK_TOLERANCE=300
SECURITY_LOG_LEVEL=warn
```

## Testing Strategy

### Security Testing
1. **Penetration Testing**: Conduct before production
2. **Vulnerability Scanning**: Weekly automated scans
3. **Code Security Review**: Peer review for all security-related code
4. **Dependency Auditing**: Daily dependency checks

### Monitoring
1. **Security Events**: Log all auth failures, suspicious requests
2. **Performance Impact**: Monitor security middleware performance
3. **Error Rates**: Track security-related errors
4. **Compliance**: Regular compliance audits

## Post-Implementation Validation

### Security Verification
- [ ] Run security scanner (OWASP ZAP)
- [ ] Verify CSRF protection works
- [ ] Test rate limiting under load
- [ ] Validate webhook security
- [ ] Check error handling doesn't leak info

### Performance Testing
- [ ] Measure middleware performance impact
- [ ] Test Redis connection reliability
- [ ] Validate rate limiting performance
- [ ] Check CSP doesn't break functionality

## Maintenance Plan

### Regular Security Tasks
- **Weekly**: Dependency updates and vulnerability scans
- **Monthly**: Security configuration review
- **Quarterly**: Penetration testing and security audit
- **Annually**: Complete security architecture review

### Monitoring and Alerts
- Set up alerts for failed authentication attempts
- Monitor for unusual API usage patterns
- Track security header compliance
- Alert on dependency vulnerabilities

This comprehensive security fix plan addresses all critical vulnerabilities while establishing a strong security foundation for the Prismy platform. Implementation should begin immediately with Priority 1 items.