/**
 * MSW Setup Test
 * Simple test to verify MSW is working correctly
 * MSW server is already started in jest.setup.js
 */

describe('MSW Setup Test', () => {
  it('should intercept API calls', async () => {
    const response = await fetch('/api/health')
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data).toMatchObject({
      status: 'healthy',
      timestamp: expect.any(String),
      version: expect.any(String),
    })
  })

  it('should return 500 for test error endpoint', async () => {
    const response = await fetch('/api/test/500')
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })

  it('should handle translation API mock', async () => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello',
        targetLang: 'vi',
      }),
    })

    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data).toMatchObject({
      translatedText: expect.any(String),
      targetLang: 'vi',
      confidence: expect.any(Number),
    })
  })
})
