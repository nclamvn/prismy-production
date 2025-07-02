/**
 * MSW Request Handlers
 * Central location for all API mocks used in tests
 * Ensures consistency between tests and production API contracts
 */

import { http, HttpResponse } from 'msw'

// Base API URL - should match your actual API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export const handlers = [
  // Translation API endpoints
  http.post(`${API_BASE}/api/translate`, async ({ request }) => {
    const body = (await request.json()) as any

    // Validate request contract
    if (!body.text || !body.targetLang) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Mock translation response matching production contract
    return HttpResponse.json({
      translatedText: `[Translated to ${body.targetLang}]: ${body.text}`,
      sourceLang: body.sourceLang || 'auto',
      targetLang: body.targetLang,
      confidence: 0.95,
      qualityScore: 0.9,
      timestamp: new Date().toISOString(),
      cached: false,
    })
  }),

  // Language detection endpoint
  http.post(`${API_BASE}/api/detect-language`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.text) {
      return HttpResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    return HttpResponse.json({
      detectedLanguage: 'en',
      confidence: 0.98,
    })
  }),

  // Supported languages endpoint
  http.get(`${API_BASE}/api/languages`, () => {
    return HttpResponse.json({
      languages: [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'fr', name: 'French' },
        { code: 'es', name: 'Spanish' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
      ],
    })
  }),

  // Payment endpoints
  http.post(`${API_BASE}/api/payments/create-checkout`, async ({ request }) => {
    const body = (await request.json()) as any

    // Validate payment request contract
    if (!body.planId || !body.paymentMethod) {
      return HttpResponse.json(
        { error: 'Invalid payment request' },
        { status: 400 }
      )
    }

    // Mock successful checkout session
    return HttpResponse.json({
      sessionId: 'cs_test_' + Math.random().toString(36).substring(7),
      paymentUrl: 'https://checkout.stripe.com/pay/cs_test_example',
      amount: body.planId === 'premium' ? 2999 : 999,
      currency: body.currency || 'USD',
    })
  }),

  // Webhook endpoint for payment confirmations
  http.post(`${API_BASE}/api/payments/webhook`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.type || !body.data) {
      return HttpResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Acknowledge webhook receipt
    return HttpResponse.json({ received: true })
  }),

  // User profile endpoint
  http.get(`${API_BASE}/api/user/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({
      id: 'user_123',
      email: 'test@example.com',
      fullName: 'Test User',
      tier: 'standard',
      usageCount: 25,
      usageLimit: 50,
      createdAt: '2024-01-01T00:00:00Z',
    })
  }),

  // Credit usage endpoint
  http.post(`${API_BASE}/api/user/use-credit`, async ({ request }) => {
    const body = (await request.json()) as any
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!body.featureType || !body.units) {
      return HttpResponse.json(
        { error: 'Invalid credit usage request' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      remainingCredits: 45,
      usedCredits: 5,
      feature: body.featureType,
    })
  }),

  // Health check endpoint
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  }),

  // Error simulation endpoints for testing error handling
  http.get(`${API_BASE}/api/test/500`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE}/api/test/timeout`, async () => {
    // Simulate timeout
    await new Promise(resolve => setTimeout(resolve, 5000))
    return HttpResponse.json({ data: 'Too late' })
  }),
]
