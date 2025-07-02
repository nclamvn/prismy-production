/**
 * Validation System Test Suite
 * Comprehensive testing for all validation schemas and functions
 * Target: 95%+ coverage with edge case and security testing
 */

import {
  sanitizeHtml,
  sanitizeObject,
  validateIPAddress,
  validateURL,
  validateVietnamesePhone,
  validateRequest,
  createValidationResult,
  validateLoginRequest,
  validateRegisterRequest,
  validateTranslationRequest,
  translationSchema,
  signUpSchema,
  signInSchema,
  paymentSchema,
  vnpayCallbackSchema,
  momoCallbackSchema,
  fileUploadSchema,
  profileUpdateSchema,
} from '../validation'

describe('Validation System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HTML Sanitization', () => {
    it('should sanitize malicious HTML', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const result = sanitizeHtml(maliciousInput)
      expect(result).toBe('Hello')
      expect(result).not.toContain('script')
    })

    it('should remove HTML tags but keep content', () => {
      const input = '<p>Hello <b>world</b></p>'
      const result = sanitizeHtml(input)
      expect(result).toBe('Hello world')
    })

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml('   ')).toBe('')
    })

    it('should throw error for non-string input', () => {
      expect(() => sanitizeHtml(null as any)).toThrow('Input must be a string')
      expect(() => sanitizeHtml(undefined as any)).toThrow(
        'Input must be a string'
      )
      expect(() => sanitizeHtml(123 as any)).toThrow('Input must be a string')
    })

    it('should remove dangerous attributes', () => {
      const input = '<div onclick="alert(1)" onload="hack()">Content</div>'
      const result = sanitizeHtml(input)
      expect(result).toBe('Content')
    })

    it('should handle unicode and special characters', () => {
      const input = 'Xin chào 你好 🎉'
      const result = sanitizeHtml(input)
      expect(result).toBe('Xin chào 你好 🎉')
    })
  })

  describe('Object Sanitization', () => {
    it('should sanitize object properties recursively', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        details: {
          bio: '<p>Hello <b>world</b></p>',
          tags: ['<em>tag1</em>', 'tag2'],
        },
      }

      const result = sanitizeObject(input)
      expect(result.name).toBe('John')
      expect(result.details.bio).toBe('Hello world')
      expect(result.details.tags[0]).toBe('tag1')
      expect(result.details.tags[1]).toBe('tag2')
    })

    it('should handle arrays', () => {
      const input = ['<script>test</script>', 'safe content']
      const result = sanitizeObject(input)
      expect(result[0]).toBe('') // Script tags are completely removed
      expect(result[1]).toBe('safe content')
    })

    it('should handle primitives', () => {
      expect(sanitizeObject('hello')).toBe('hello')
      expect(sanitizeObject(123)).toBe(123)
      expect(sanitizeObject(null)).toBe(null)
      expect(sanitizeObject(undefined)).toBe(undefined)
    })

    it('should sanitize object keys', () => {
      const input = {
        '<script>malicious</script>': 'value',
      }
      const result = sanitizeObject(input)
      expect(result['']).toBe('value') // Key becomes empty string after sanitization
      expect(result['<script>malicious</script>']).toBeUndefined()
    })
  })

  describe('Translation Schema Validation', () => {
    const validTranslationData = {
      text: 'Hello world',
      sourceLang: 'en',
      targetLang: 'vi',
      qualityTier: 'standard',
      serviceType: 'google_translate',
    }

    it('should validate correct translation data', async () => {
      const result = translationSchema.parse(validTranslationData)
      expect(result.text).toBe('Hello world')
      expect(result.sourceLang).toBe('en')
      expect(result.targetLang).toBe('vi')
      expect(result.qualityTier).toBe('standard')
    })

    it('should sanitize text input', async () => {
      const data = {
        ...validTranslationData,
        text: '<script>alert("xss")</script>Hello world',
      }
      const result = translationSchema.parse(data)
      expect(result.text).toBe('Hello world')
    })

    it('should enforce text length limits', async () => {
      await expect(
        translationSchema.parseAsync({
          ...validTranslationData,
          text: 'a'.repeat(2000001),
        })
      ).rejects.toThrow('Text too long')
    })

    it('should reject empty text', async () => {
      await expect(
        translationSchema.parseAsync({
          ...validTranslationData,
          text: '',
        })
      ).rejects.toThrow('Text cannot be empty')
    })

    it('should reject whitespace-only text', async () => {
      await expect(
        translationSchema.parseAsync({
          ...validTranslationData,
          text: '   \n\t   ',
        })
      ).rejects.toThrow('Text cannot be only whitespace')
    })

    it('should validate language codes', async () => {
      await expect(
        translationSchema.parseAsync({
          ...validTranslationData,
          targetLang: 'xx',
        })
      ).rejects.toThrow('Unsupported language code')
    })

    it('should validate quality tiers', async () => {
      await expect(
        translationSchema.parseAsync({
          ...validTranslationData,
          qualityTier: 'invalid' as any,
        })
      ).rejects.toThrow('Invalid quality tier')
    })

    it('should set default quality tier', () => {
      const data = { ...validTranslationData }
      delete data.qualityTier
      const result = translationSchema.parse(data)
      expect(result.qualityTier).toBe('standard')
    })

    it('should handle optional fields', () => {
      const minimalData = {
        text: 'Hello',
        targetLang: 'vi',
      }
      const result = translationSchema.parse(minimalData)
      expect(result.text).toBe('Hello')
      expect(result.targetLang).toBe('vi')
      expect(result.qualityTier).toBe('standard')
    })
  })

  describe('Authentication Schema Validation', () => {
    describe('Sign Up Schema', () => {
      const validSignUpData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
        csrf_token: 'valid-token',
      }

      it('should validate correct sign up data', () => {
        const result = signUpSchema.parse(validSignUpData)
        expect(result.email).toBe('test@example.com')
        expect(result.fullName).toBe('John Doe')
      })

      it('should normalize email addresses', () => {
        const data = {
          ...validSignUpData,
          email: 'Test.User+tag@EXAMPLE.COM',
        }
        const result = signUpSchema.parse(data)
        // Email normalization may convert to lowercase but keep the format
        expect(result.email).toBe('test.user+tag@example.com')
      })

      it('should enforce password complexity', async () => {
        await expect(
          signUpSchema.parseAsync({
            ...validSignUpData,
            password: 'weak',
          })
        ).rejects.toThrow('Password must contain at least one uppercase')
      })

      it('should validate email format', async () => {
        await expect(
          signUpSchema.parseAsync({
            ...validSignUpData,
            email: 'invalid-email',
          })
        ).rejects.toThrow('Invalid email format')
      })

      it('should sanitize full name with transform', () => {
        const data = {
          ...validSignUpData,
          fullName: '  John Doe  ', // Test trimming and sanitization
        }
        const result = signUpSchema.parse(data)
        expect(result.fullName).toBe('John Doe') // Should be trimmed
      })

      it('should reject full name with HTML tags', async () => {
        await expect(
          signUpSchema.parseAsync({
            ...validSignUpData,
            fullName: '<script>John</script>',
          })
        ).rejects.toThrow('Full name can only contain letters')
      })
    })

    describe('Sign In Schema', () => {
      const validSignInData = {
        email: 'test@example.com',
        password: 'password123',
        csrf_token: 'valid-token',
      }

      it('should validate correct sign in data', () => {
        const result = signInSchema.parse(validSignInData)
        expect(result.email).toBe('test@example.com')
        expect(result.password).toBe('password123')
      })

      it('should require password', async () => {
        await expect(
          signInSchema.parseAsync({
            ...validSignInData,
            password: '',
          })
        ).rejects.toThrow('Password is required')
      })
    })
  })

  describe('Utility Functions', () => {
    describe('IP Address Validation', () => {
      it('should validate IPv4 addresses', () => {
        expect(validateIPAddress('192.168.1.1')).toBe(true)
        expect(validateIPAddress('127.0.0.1')).toBe(true)
        expect(validateIPAddress('255.255.255.255')).toBe(true)
      })

      it('should validate IPv6 addresses', () => {
        expect(
          validateIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
        ).toBe(true)
        expect(validateIPAddress('::1')).toBe(true)
      })

      it('should reject invalid IP addresses', () => {
        expect(validateIPAddress('256.256.256.256')).toBe(false)
        expect(validateIPAddress('not-an-ip')).toBe(false)
        expect(validateIPAddress('')).toBe(false)
      })
    })

    describe('URL Validation', () => {
      it('should validate HTTPS URLs', () => {
        expect(validateURL('https://example.com')).toBe(true)
        expect(validateURL('https://subdomain.example.com/path')).toBe(true)
      })

      it('should reject HTTP URLs', () => {
        expect(validateURL('http://example.com')).toBe(false)
      })

      it('should reject local URLs for security', () => {
        expect(validateURL('https://localhost')).toBe(false)
        expect(validateURL('https://127.0.0.1')).toBe(false)
      })

      it('should reject invalid URLs', () => {
        expect(validateURL('not-a-url')).toBe(false)
        expect(validateURL('')).toBe(false)
        expect(validateURL(null as any)).toBe(false)
      })
    })

    describe('Vietnamese Phone Validation', () => {
      it('should validate Vietnamese mobile numbers', () => {
        expect(validateVietnamesePhone('+84987654321')).toBe(true)
        expect(validateVietnamesePhone('0987654321')).toBe(true)
      })

      it('should reject invalid Vietnamese numbers', () => {
        expect(validateVietnamesePhone('123456789')).toBe(false)
        expect(validateVietnamesePhone('not-a-phone')).toBe(false)
      })
    })
  })

  describe('Generic Validation Functions', () => {
    describe('validateRequest', () => {
      it('should validate correct data', async () => {
        const validator = validateRequest(signInSchema)
        const result = await validator({
          email: 'test@example.com',
          password: 'password123',
          csrf_token: 'token',
        })

        expect(result.success).toBe(true)
        expect(result.data?.email).toBe('test@example.com')
      })

      it('should return errors for invalid data', async () => {
        const validator = validateRequest(signInSchema)
        const result = await validator({
          email: 'invalid-email',
          password: '',
        })

        expect(result.success).toBe(false)
        expect(result.errors).toHaveLength(3) // email, password, csrf_token
      })
    })

    describe('createValidationResult', () => {
      it('should create success result', () => {
        const result = createValidationResult(true, { test: 'data' })
        expect(result.success).toBe(true)
        expect(result.data).toEqual({ test: 'data' })
        expect(result.errors).toEqual([])
      })

      it('should create error result', () => {
        const result = createValidationResult(false, undefined, [
          'Error 1',
          'Error 2',
        ])
        expect(result.success).toBe(false)
        expect(result.data).toBeUndefined()
        expect(result.errors).toHaveLength(2)
        expect(result.errors[0].message).toBe('Error 1')
      })
    })

    describe('Typed Validation Wrappers', () => {
      describe('validateLoginRequest', () => {
        it('should validate correct login data', () => {
          const result = validateLoginRequest({
            email: 'test@example.com',
            password: 'password123',
            csrf_token: 'token',
          })

          expect(result.success).toBe(true)
          expect(result.data?.email).toBe('test@example.com')
        })

        it('should return errors for invalid data', () => {
          const result = validateLoginRequest({
            email: 'invalid',
            password: '',
          })

          expect(result.success).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
        })
      })

      describe('validateRegisterRequest', () => {
        it('should validate correct register data', () => {
          const result = validateRegisterRequest({
            email: 'test@example.com',
            password: 'SecurePass123!',
            fullName: 'John Doe',
            csrf_token: 'token',
          })

          expect(result.success).toBe(true)
          expect(result.data?.email).toBe('test@example.com')
        })
      })

      describe('validateTranslationRequest', () => {
        it('should validate correct translation data', () => {
          const result = validateTranslationRequest({
            text: 'Hello world',
            targetLang: 'vi',
          })

          expect(result.success).toBe(true)
          expect(result.data?.text).toBe('Hello world')
        })
      })
    })
  })
})
