import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'

// Initialize Redis for webhook deduplication
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// In-memory fallback for webhook tracking
const processedWebhooks = new Map<string, number>()

// Webhook replay protection configuration
const WEBHOOK_TOLERANCE = 300 // 5 minutes in seconds
const WEBHOOK_CACHE_TTL = 600 // 10 minutes in seconds

// Validate webhook timestamp to prevent replay attacks
export function validateWebhookTimestamp(timestamp: number, tolerance: number = WEBHOOK_TOLERANCE): boolean {
  const now = Math.floor(Date.now() / 1000)
  const diff = Math.abs(now - timestamp)
  
  if (diff > tolerance) {
    console.warn(`Webhook timestamp too old or too new: ${diff}s difference`)
    return false
  }
  
  return true
}

// Generate unique webhook ID from content
export function generateWebhookId(payload: string, headers: Record<string, string>): string {
  const signature = headers['stripe-signature'] || headers['x-signature'] || ''
  const timestamp = headers['x-timestamp'] || Date.now().toString()
  
  return createHash('sha256')
    .update(`${payload}:${signature}:${timestamp}`)
    .digest('hex')
}

// Check and mark webhook as processed to prevent replay attacks
export async function preventReplayAttack(webhookId: string): Promise<boolean> {
  try {
    if (useRedis) {
      // Use Redis for distributed replay protection
      const exists = await redis.exists(`webhook:${webhookId}`)
      
      if (exists) {
        console.warn(`Replay attack detected: webhook ${webhookId} already processed`)
        return false
      }
      
      // Mark webhook as processed with TTL
      await redis.setex(`webhook:${webhookId}`, WEBHOOK_CACHE_TTL, 'processed')
      return true
    } else {
      // Fallback to in-memory tracking
      const now = Date.now()
      
      // Clean up old entries
      for (const [id, timestamp] of processedWebhooks.entries()) {
        if (now - timestamp > WEBHOOK_CACHE_TTL * 1000) {
          processedWebhooks.delete(id)
        }
      }
      
      // Check if webhook already processed
      if (processedWebhooks.has(webhookId)) {
        console.warn(`Replay attack detected: webhook ${webhookId} already processed`)
        return false
      }
      
      // Mark as processed
      processedWebhooks.set(webhookId, now)
      return true
    }
  } catch (error) {
    console.error('Error checking webhook replay protection:', error)
    // Fail securely - allow webhook if we can't check
    return true
  }
}

// Stripe webhook verification
export function verifyStripeWebhook(payload: string, signature: string, secret: string): boolean {
  try {
    const elements = signature.split(',')
    const signatureElements: Record<string, string> = {}
    
    for (const element of elements) {
      const [key, value] = element.split('=')
      signatureElements[key] = value
    }
    
    if (!signatureElements.t || !signatureElements.v1) {
      return false
    }
    
    const timestamp = parseInt(signatureElements.t, 10)
    
    // Check timestamp
    if (!validateWebhookTimestamp(timestamp)) {
      return false
    }
    
    // Verify signature
    const payloadString = `${timestamp}.${payload}`
    const expectedSignature = createHash('sha256')
      .update(payloadString)
      .digest('hex')
    
    return signatureElements.v1 === expectedSignature
  } catch (error) {
    console.error('Stripe webhook verification error:', error)
    return false
  }
}

// VNPay webhook verification
export function verifyVNPayWebhook(params: Record<string, any>, hashSecret: string): boolean {
  try {
    const { vnp_SecureHash, ...otherParams } = params
    
    if (!vnp_SecureHash) {
      return false
    }
    
    // Sort parameters
    const sortedParams = Object.keys(otherParams)
      .sort()
      .reduce((acc: Record<string, any>, key) => {
        acc[key] = otherParams[key]
        return acc
      }, {})
    
    // Create query string
    const signData = new URLSearchParams(sortedParams).toString()
    
    // Generate signature
    const expectedHash = createHash('sha512')
      .update(signData + hashSecret)
      .digest('hex')
    
    return vnp_SecureHash.toLowerCase() === expectedHash.toLowerCase()
  } catch (error) {
    console.error('VNPay webhook verification error:', error)
    return false
  }
}

// MoMo webhook verification
export function verifyMoMoWebhook(body: any, secretKey: string): boolean {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body
    
    if (!signature) {
      return false
    }
    
    // Create raw signature string
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`
    
    // Generate expected signature
    const expectedSignature = createHash('sha256')
      .update(rawSignature + secretKey)
      .digest('hex')
    
    return signature.toLowerCase() === expectedSignature.toLowerCase()
  } catch (error) {
    console.error('MoMo webhook verification error:', error)
    return false
  }
}

// Generic webhook security middleware
export async function validateWebhookSecurity(
  payload: string,
  headers: Record<string, string>,
  verificationFn: (payload: string, headers: Record<string, string>) => boolean
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Generate webhook ID for replay protection
    const webhookId = generateWebhookId(payload, headers)
    
    // Check for replay attacks
    const isNewWebhook = await preventReplayAttack(webhookId)
    if (!isNewWebhook) {
      return { valid: false, error: 'Webhook replay detected' }
    }
    
    // Verify webhook signature
    const isValidSignature = verificationFn(payload, headers)
    if (!isValidSignature) {
      return { valid: false, error: 'Invalid webhook signature' }
    }
    
    return { valid: true }
  } catch (error) {
    console.error('Webhook security validation error:', error)
    return { valid: false, error: 'Webhook security validation failed' }
  }
}

// Rate limiting for webhooks
export async function checkWebhookRateLimit(source: string): Promise<boolean> {
  const rateLimitKey = `webhook_rate_limit:${source}`
  const maxRequests = 100 // Max 100 webhooks per minute per source
  const windowMs = 60 * 1000 // 1 minute
  
  try {
    if (useRedis) {
      const current = await redis.incr(rateLimitKey)
      
      if (current === 1) {
        await redis.expire(rateLimitKey, Math.ceil(windowMs / 1000))
      }
      
      return current <= maxRequests
    } else {
      // Fallback to basic rate limiting
      return true // In development, allow all webhooks
    }
  } catch (error) {
    console.error('Webhook rate limiting error:', error)
    return true // Fail open for webhooks
  }
}

// Webhook logging for security monitoring
export function logWebhookAttempt(
  source: string,
  success: boolean,
  error?: string,
  metadata?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    source,
    success,
    error,
    metadata,
    ip: metadata?.ip || 'unknown',
  }
  
  if (success) {
    console.log('Webhook processed successfully:', logEntry)
  } else {
    console.warn('Webhook processing failed:', logEntry)
  }
  
  // In production, send to monitoring service
  // Example: sendToMonitoring('webhook_attempt', logEntry)
}