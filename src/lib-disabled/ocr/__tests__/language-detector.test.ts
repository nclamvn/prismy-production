/**
 * Unit tests for language detection
 * 
 * Tests the requirement: Unit test detect("Hola") = 'es'
 */

import { detectLanguage, getLanguageName, getDetectionConfidence } from '../language-detector'

describe('Language Detection', () => {
  
  describe('detectLanguage', () => {
    test('should detect Spanish correctly', async () => {
      const result = await detectLanguage('Hola')
      expect(result).toBe('es')
    })

    test('should detect English correctly', async () => {
      const result = await detectLanguage('Hello world, this is a test')
      expect(result).toBe('en')
    })

    test('should detect Spanish with longer text', async () => {
      const spanishText = 'Hola, ¿cómo estás? Este es un documento en español con varias palabras comunes como el, la, de, que, y es.'
      const result = await detectLanguage(spanishText)
      expect(result).toBe('es')
    })

    test('should detect French correctly', async () => {
      const frenchText = 'Bonjour, comment allez-vous? Ceci est un document en français avec des mots comme le, de, et, un, une.'
      const result = await detectLanguage(frenchText)
      expect(result).toBe('fr')
    })

    test('should detect German correctly', async () => {
      const germanText = 'Hallo, wie geht es Ihnen? Das ist ein Dokument auf Deutsch mit Wörtern wie der, die, und, das, ist.'
      const result = await detectLanguage(germanText)
      expect(result).toBe('de')
    })

    test('should detect Vietnamese correctly', async () => {
      const vietnameseText = 'Xin chào, bạn có khỏe không? Đây là một tài liệu bằng tiếng Việt với các từ như và, của, có, trong, là.'
      const result = await detectLanguage(vietnameseText)
      expect(result).toBe('vi')
    })

    test('should detect Chinese correctly', async () => {
      const chineseText = '你好，你好吗？这是一个中文文档，包含一些常见的字符如的、是、在、有、了。'
      const result = await detectLanguage(chineseText)
      expect(result).toBe('zh')
    })

    test('should default to English for very short text', async () => {
      const result = await detectLanguage('Hi')
      expect(result).toBe('en')
    })

    test('should handle empty text', async () => {
      const result = await detectLanguage('')
      expect(result).toBe('en')
    })

    test('should handle mixed language text', async () => {
      const mixedText = 'Hello world. Hola mundo. Bonjour le monde.'
      const result = await detectLanguage(mixedText)
      // Should detect the most prevalent language or English as fallback
      expect(['en', 'es', 'fr']).toContain(result)
    })
  })

  describe('getLanguageName', () => {
    test('should return correct language names', () => {
      expect(getLanguageName('en')).toBe('English')
      expect(getLanguageName('es')).toBe('Spanish')
      expect(getLanguageName('fr')).toBe('French')
      expect(getLanguageName('de')).toBe('German')
      expect(getLanguageName('vi')).toBe('Vietnamese')
    })

    test('should return Unknown for invalid codes', () => {
      expect(getLanguageName('xx')).toBe('Unknown')
      expect(getLanguageName('')).toBe('Unknown')
    })
  })

  describe('getDetectionConfidence', () => {
    test('should return reasonable confidence for good matches', async () => {
      const confidence = await getDetectionConfidence('Hello world, this is a test with many English words', 'en')
      expect(confidence).toBeGreaterThan(0.2)
      expect(confidence).toBeLessThanOrEqual(1)
    })

    test('should return low confidence for short text', async () => {
      const confidence = await getDetectionConfidence('Hi', 'en')
      expect(confidence).toBeLessThanOrEqual(0.2)
    })

    test('should return low confidence for wrong language', async () => {
      const confidence = await getDetectionConfidence('Hello world', 'es')
      expect(confidence).toBeLessThan(0.5)
    })
  })

  describe('Specific test cases for MVP requirements', () => {
    test('MVP requirement: detect("Hola") should return "es"', async () => {
      const result = await detectLanguage('Hola')
      expect(result).toBe('es')
    })

    test('should handle common Spanish phrases', async () => {
      const testCases = [
        'Hola mundo',
        '¿Cómo estás?',
        'Este es un documento en español',
        'Buenos días, señor',
        'Gracias por su ayuda'
      ]

      for (const text of testCases) {
        const result = await detectLanguage(text)
        expect(result).toBe('es')
      }
    })

    test('should handle common English phrases', async () => {
      const testCases = [
        'Hello world',
        'How are you?',
        'This is a document in English',
        'Good morning, sir',
        'Thank you for your help'
      ]

      for (const text of testCases) {
        const result = await detectLanguage(text)
        expect(result).toBe('en')
      }
    })
  })
})