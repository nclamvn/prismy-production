/**
 * AI SERVICES HEALTH CHECK API
 * Comprehensive monitoring of all AI service providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export interface AIServicesHealthResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  services: {
    openai: AIServiceHealth
    anthropic: AIServiceHealth
    cohere: AIServiceHealth
    google: AIServiceHealth
    azure: AIServiceHealth
  }
  summary: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
  }
  primaryProvider: string
  fallbackAvailable: boolean
}

export interface AIServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'not_configured'
  responseTime: number
  error?: string
  details?: {
    modelsAvailable?: number
    rateLimit?: {
      remaining: number
      resetTime?: string
    }
    quotaUsage?: {
      used: number
      limit: number
    }
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const result = await checkAIServicesHealth()
    
    const httpStatus = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 200 : 503

    return NextResponse.json(result, { status: httpStatus })

  } catch (error) {
    logger.error({ error }, 'AI services health check failed')
    
    const errorResult: AIServicesHealthResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        openai: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        anthropic: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        cohere: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        google: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        azure: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' }
      },
      summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 5 },
      primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'anthropic',
      fallbackAvailable: false
    }

    return NextResponse.json(errorResult, { status: 503 })
  }
}

async function checkAIServicesHealth(): Promise<AIServicesHealthResult> {
  // Run all service checks in parallel
  const [openai, anthropic, cohere, google, azure] = await Promise.allSettled([
    checkOpenAI(),
    checkAnthropic(),
    checkCohere(),
    checkGoogleAI(),
    checkAzureOpenAI()
  ])

  const services = {
    openai: getServiceResult(openai),
    anthropic: getServiceResult(anthropic),
    cohere: getServiceResult(cohere),
    google: getServiceResult(google),
    azure: getServiceResult(azure)
  }

  // Calculate summary
  const healthCounts = Object.values(services).reduce(
    (acc, service) => {
      acc.total++
      if (service.status === 'healthy') acc.healthy++
      else if (service.status === 'degraded') acc.degraded++
      else if (service.status === 'unhealthy') acc.unhealthy++
      return acc
    },
    { total: 0, healthy: 0, degraded: 0, unhealthy: 0 }
  )

  // Determine overall status
  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'anthropic'
  const primaryHealth = services[primaryProvider as keyof typeof services]
  const fallbackProviders = (process.env.AI_FALLBACK_PROVIDERS || 'openai,cohere').split(',')
  const fallbackHealthy = fallbackProviders.some(provider => 
    services[provider.trim() as keyof typeof services]?.status === 'healthy'
  )

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
  if (primaryHealth?.status === 'healthy') {
    overallStatus = 'healthy'
  } else if (fallbackHealthy) {
    overallStatus = 'degraded'
  } else if (healthCounts.healthy > 0) {
    overallStatus = 'degraded'
  } else {
    overallStatus = 'unhealthy'
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    summary: healthCounts,
    primaryProvider,
    fallbackAvailable: fallbackHealthy
  }
}

function getServiceResult(result: PromiseSettledResult<AIServiceHealth>): AIServiceHealth {
  if (result.status === 'fulfilled') {
    return result.value
  } else {
    return {
      status: 'unhealthy',
      responseTime: 0,
      error: result.reason?.message || 'Unknown error'
    }
  }
}

async function checkOpenAI(): Promise<AIServiceHealth> {
  const startTime = Date.now()
  
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: 'not_configured',
      responseTime: 0,
      error: 'OpenAI API key not configured'
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        modelsAvailable: data.data?.length || 0,
        rateLimit: {
          remaining: parseInt(response.headers.get('x-ratelimit-remaining-requests') || '0'),
          resetTime: response.headers.get('x-ratelimit-reset-requests')
        }
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'OpenAI check failed'
    }
  }
}

async function checkAnthropic(): Promise<AIServiceHealth> {
  const startTime = Date.now()
  
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: 'not_configured',
      responseTime: 0,
      error: 'Anthropic API key not configured'
    }
  }

  try {
    // Anthropic doesn't have a simple health endpoint
    // We'll validate the API key format and test with a minimal request
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key format')
    }

    // Test with a minimal completion request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      // Check if it's a rate limit or quota issue
      if (response.status === 429) {
        return {
          status: 'degraded',
          responseTime,
          error: 'Rate limited',
          details: {
            rateLimit: {
              remaining: 0,
              resetTime: response.headers.get('retry-after')
            }
          }
        }
      }
      
      throw new Error(`Anthropic API returned ${response.status}: ${response.statusText}`)
    }

    return {
      status: 'healthy',
      responseTime,
      details: {
        rateLimit: {
          remaining: parseInt(response.headers.get('anthropic-ratelimit-requests-remaining') || '0')
        }
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Anthropic check failed'
    }
  }
}

async function checkCohere(): Promise<AIServiceHealth> {
  const startTime = Date.now()
  
  if (!process.env.COHERE_API_KEY) {
    return {
      status: 'not_configured',
      responseTime: 0,
      error: 'Cohere API key not configured'
    }
  }

  try {
    const response = await fetch('https://api.cohere.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`Cohere API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        modelsAvailable: data.models?.length || 0
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Cohere check failed'
    }
  }
}

async function checkGoogleAI(): Promise<AIServiceHealth> {
  const startTime = Date.now()
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    return {
      status: 'not_configured',
      responseTime: 0,
      error: 'Google AI API key not configured'
    }
  }

  try {
    // Check Google AI Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        signal: AbortSignal.timeout(10000)
      }
    )

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`Google AI API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        modelsAvailable: data.models?.length || 0
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Google AI check failed'
    }
  }
}

async function checkAzureOpenAI(): Promise<AIServiceHealth> {
  const startTime = Date.now()
  
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    return {
      status: 'not_configured',
      responseTime: 0,
      error: 'Azure OpenAI credentials not configured'
    }
  }

  try {
    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2023-12-01-preview'}`,
      {
        headers: {
          'api-key': process.env.AZURE_OPENAI_API_KEY,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      }
    )

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`Azure OpenAI API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        modelsAvailable: data.data?.length || 0
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Azure OpenAI check failed'
    }
  }
}