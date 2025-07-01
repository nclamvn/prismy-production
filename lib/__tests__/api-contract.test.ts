/**
 * API Contract Tests using MSW
 * Validates that our API calls match expected contracts
 * and handles various scenarios including errors
 */

import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'

// Example API client functions to test
async function translateText(text: string, targetLang: string, sourceLang?: string) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      targetLang,
      sourceLang
    })
  })

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.statusText}`)
  }

  return response.json()
}

async function detectLanguage(text: string) {
  const response = await fetch('/api/detect-language', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text })
  })

  if (!response.ok) {
    throw new Error(`Language detection failed: ${response.statusText}`)
  }

  return response.json()
}

async function getSupportedLanguages() {
  const response = await fetch('/api/languages')
  
  if (!response.ok) {
    throw new Error(`Failed to fetch languages: ${response.statusText}`)
  }

  return response.json()
}

async function createCheckoutSession(planId: string, paymentMethod: string) {
  const response = await fetch('/api/payments/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      paymentMethod
    })
  })

  if (!response.ok) {
    throw new Error(`Checkout creation failed: ${response.statusText}`)
  }

  return response.json()
}

describe('API Contract Tests with MSW', () => {
  describe('Translation API', () => {
    it('should translate text with correct contract', async () => {
      const result = await translateText('Hello world', 'vi')

      expect(result).toMatchObject({
        translatedText: expect.any(String),
        sourceLang: expect.any(String),
        targetLang: 'vi',
        confidence: expect.any(Number),
        qualityScore: expect.any(Number),
        timestamp: expect.any(String),
        cached: expect.any(Boolean)
      })

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.qualityScore).toBeGreaterThanOrEqual(0)
      expect(result.qualityScore).toBeLessThanOrEqual(1)
    })

    it('should handle translation errors gracefully', async () => {
      // Override handler for this test
      server.use(
        http.post('/api/translate', () => {
          return HttpResponse.json(
            { error: 'Translation service unavailable' },
            { status: 503 }
          )
        })
      )

      await expect(translateText('Hello', 'vi')).rejects.toThrow('Translation failed')
    })

    it('should validate required fields', async () => {
      // Test with missing targetLang
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' })
      })

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error).toHaveProperty('error')
    })
  })

  describe('Language Detection API', () => {
    it('should detect language with correct contract', async () => {
      const result = await detectLanguage('Hello world')

      expect(result).toMatchObject({
        detectedLanguage: expect.any(String),
        confidence: expect.any(Number)
      })

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle empty text', async () => {
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Languages API', () => {
    it('should return supported languages list', async () => {
      const result = await getSupportedLanguages()

      expect(result).toHaveProperty('languages')
      expect(Array.isArray(result.languages)).toBe(true)
      expect(result.languages.length).toBeGreaterThan(0)

      // Validate language object structure
      result.languages.forEach((lang: any) => {
        expect(lang).toMatchObject({
          code: expect.any(String),
          name: expect.any(String)
        })
        expect(lang.code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // ISO language code format
      })
    })
  })

  describe('Payment API', () => {
    it('should create checkout session with correct contract', async () => {
      const result = await createCheckoutSession('premium', 'stripe')

      expect(result).toMatchObject({
        sessionId: expect.any(String),
        paymentUrl: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String)
      })

      expect(result.sessionId).toMatch(/^cs_test_/)
      expect(result.paymentUrl).toMatch(/^https:\/\//)
    })

    it('should validate payment request fields', async () => {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'premium' }) // Missing paymentMethod
      })

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error).toHaveProperty('error')
    })
  })

  describe('User API', () => {
    it('should fetch user profile with auth', async () => {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })

      expect(response.ok).toBe(true)
      const profile = await response.json()

      expect(profile).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        fullName: expect.any(String),
        tier: expect.stringMatching(/^(free|standard|premium|enterprise)$/),
        usageCount: expect.any(Number),
        usageLimit: expect.any(Number),
        createdAt: expect.any(String)
      })
    })

    it('should require authentication for profile', async () => {
      const response = await fetch('/api/user/profile')

      expect(response.status).toBe(401)
      const error = await response.json()
      expect(error).toHaveProperty('error', 'Unauthorized')
    })

    it('should track credit usage', async () => {
      const response = await fetch('/api/user/use-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          featureType: 'translation',
          units: 5
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()

      expect(result).toMatchObject({
        success: true,
        remainingCredits: expect.any(Number),
        usedCredits: expect.any(Number),
        feature: 'translation'
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle 500 errors appropriately', async () => {
      const response = await fetch('/api/test/500')

      expect(response.status).toBe(500)
      const error = await response.json()
      expect(error).toHaveProperty('error')
    })

    it('should handle network timeouts', async () => {
      // Set a short timeout for this test
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 100)

      try {
        await fetch('/api/test/timeout', {
          signal: controller.signal
        })
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
      } finally {
        clearTimeout(timeoutId)
      }
    })
  })

  describe('Contract Validation Helpers', () => {
    it('should validate ISO date strings', () => {
      const isISODate = (str: string) => {
        return !isNaN(Date.parse(str)) && new Date(str).toISOString() === str
      }

      expect(isISODate('2024-01-01T00:00:00.000Z')).toBe(true)
      expect(isISODate('invalid-date')).toBe(false)
    })

    it('should validate email format', () => {
      const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      }

      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
    })

    it('should validate currency codes', () => {
      const isValidCurrency = (code: string) => {
        return /^[A-Z]{3}$/.test(code)
      }

      expect(isValidCurrency('USD')).toBe(true)
      expect(isValidCurrency('VND')).toBe(true)
      expect(isValidCurrency('us')).toBe(false)
    })
  })
})