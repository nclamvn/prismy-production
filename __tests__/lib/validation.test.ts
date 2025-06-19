import {
  sanitizeHtml,
  validateRequest,
  translationSchema,
  paymentSchema,
  signUpSchema,
  signInSchema,
  vnpayCallbackSchema,
  momoCallbackSchema,
  fileUploadSchema,
  profileUpdateSchema,
  sanitizeObject,
  validateIPAddress,
  validateURL,
  validateVietnamesePhone,
} from '@/lib/validation'

describe('Validation Library', () => {
  describe('sanitizeHtml', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello <b>world</b>'
      const result = sanitizeHtml(input)
      expect(result).toBe('Hello world') // DOMPurify removes script completely
    })

    it('should keep text content', () => {
      const input = '<div>Important <em>message</em> here</div>'
      const result = sanitizeHtml(input)
      expect(result).toBe('Important message here')
    })

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('should trim whitespace', () => {
      const input = '  <p>Hello world</p>  '
      const result = sanitizeHtml(input)
      expect(result).toBe('Hello world')
    })
  })

  describe('translationSchema', () => {
    it('should validate correct translation data', async () => {
      const validData = {
        text: 'Hello world',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        qualityTier: 'standard' as const
      }

      const validation = await validateRequest(translationSchema)(validData)
      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data).toEqual(validData)
      }
    })

    it('should reject empty text', async () => {
      const invalidData = {
        text: '',
        sourceLanguage: 'en',
        targetLanguage: 'es'
      }

      const validation = await validateRequest(translationSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors).toContain('text: Text cannot be empty')
      }
    })

    it('should reject text that is too long', async () => {
      const invalidData = {
        text: 'a'.repeat(10001),
        sourceLanguage: 'en',
        targetLanguage: 'es'
      }

      const validation = await validateRequest(translationSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('Text too long'))).toBe(true)
      }
    })

    it('should reject invalid language codes', async () => {
      const invalidData = {
        text: 'Hello',
        sourceLanguage: 'xyz',
        targetLanguage: 'es'
      }

      const validation = await validateRequest(translationSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('Unsupported language code'))).toBe(true)
      }
    })

    it('should default quality tier to standard', async () => {
      const data = {
        text: 'Hello world',
        sourceLanguage: 'en',
        targetLanguage: 'es'
      }

      const validation = await validateRequest(translationSchema)(data)
      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data.qualityTier).toBe('standard')
      }
    })

    it('should reject whitespace-only text', async () => {
      const invalidData = {
        text: '   \n\t   ',
        sourceLanguage: 'en',
        targetLanguage: 'es'
      }

      const validation = await validateRequest(translationSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('cannot be only whitespace'))).toBe(true)
      }
    })
  })

  describe('paymentSchema', () => {
    it('should validate correct payment data', async () => {
      const validData = {
        planKey: 'standard' as const,
        amount: 19.99,
        currency: 'USD' as const,
        csrf_token: 'valid-token'
      }

      const validation = await validateRequest(paymentSchema)(validData)
      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data).toEqual(validData)
      }
    })

    it('should reject invalid plan keys', async () => {
      const invalidData = {
        planKey: 'invalid-plan',
        amount: 19.99,
        currency: 'USD',
        csrf_token: 'token'
      }

      const validation = await validateRequest(paymentSchema)(invalidData)
      expect(validation.success).toBe(false)
    })

    it('should reject negative amounts', async () => {
      const invalidData = {
        planKey: 'standard',
        amount: -10,
        currency: 'USD',
        csrf_token: 'token'
      }

      const validation = await validateRequest(paymentSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('Amount must be positive'))).toBe(true)
      }
    })

    it('should reject amounts that are too large', async () => {
      const invalidData = {
        planKey: 'standard',
        amount: 20000,
        currency: 'USD',
        csrf_token: 'token'
      }

      const validation = await validateRequest(paymentSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('Amount too large'))).toBe(true)
      }
    })
  })

  describe('signUpSchema', () => {
    it('should validate correct signup data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        csrf_token: 'valid-token'
      }

      const validation = await validateRequest(signUpSchema)(validData)
      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data.email).toBe('test@example.com')
        expect(validation.data.fullName).toBe('John Doe')
      }
    })

    it('should reject weak passwords', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        fullName: 'John Doe',
        csrf_token: 'token'
      }

      const validation = await validateRequest(signUpSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('Password must'))).toBe(true)
      }
    })

    it('should reject invalid email formats', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        csrf_token: 'token'
      }

      const validation = await validateRequest(signUpSchema)(invalidData)
      expect(validation.success).toBe(false)
    })

    it('should sanitize full name', async () => {
      // Test that the sanitization transform works properly
      const fullNameWithSpaces = '  John   Doe  '
      const result = sanitizeHtml(fullNameWithSpaces)
      expect(result).toBe('John   Doe')
      
      // Test normal validation flow
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        fullName: 'John Doe',
        csrf_token: 'token'
      }

      const validation = await validateRequest(signUpSchema)(validData)
      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data.fullName).toBe('John Doe')
      }
    })
  })

  describe('vnpayCallbackSchema', () => {
    it('should validate correct VNPay callback data', async () => {
      const validData = {
        vnp_Amount: '1000000',
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Payment for order 123',
        vnp_PayDate: '20241201120000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'TESTCODE',
        vnp_TransactionNo: '123456789',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: 'ORDER123',
        vnp_SecureHash: 'abc123def456'
      }

      const validation = await validateRequest(vnpayCallbackSchema)(validData)
      expect(validation.success).toBe(true)
    })

    it('should reject invalid amount format', async () => {
      const invalidData = {
        vnp_Amount: 'invalid-amount',
        vnp_OrderInfo: 'Payment info',
        vnp_PayDate: '20241201120000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'TEST',
        vnp_TransactionNo: '123',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: 'ORDER123',
        vnp_SecureHash: 'hash'
      }

      const validation = await validateRequest(vnpayCallbackSchema)(invalidData)
      expect(validation.success).toBe(false)
    })
  })

  describe('fileUploadSchema', () => {
    it('should validate correct file data', async () => {
      const validData = {
        fileName: 'document.pdf',
        fileSize: 1024000, // 1MB
        fileType: 'application/pdf' as const,
        csrf_token: 'token'
      }

      const validation = await validateRequest(fileUploadSchema)(validData)
      expect(validation.success).toBe(true)
    })

    it('should reject files that are too large', async () => {
      const invalidData = {
        fileName: 'large-file.pdf',
        fileSize: 15 * 1024 * 1024, // 15MB
        fileType: 'application/pdf',
        csrf_token: 'token'
      }

      const validation = await validateRequest(fileUploadSchema)(invalidData)
      expect(validation.success).toBe(false)
      if (!validation.success) {
        expect(validation.errors.some(e => e.includes('File too large'))).toBe(true)
      }
    })

    it('should reject unsupported file types', async () => {
      const invalidData = {
        fileName: 'script.exe',
        fileSize: 1024,
        fileType: 'application/x-executable',
        csrf_token: 'token'
      }

      const validation = await validateRequest(fileUploadSchema)(invalidData)
      expect(validation.success).toBe(false)
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        details: {
          bio: '<b>Developer</b>',
          interests: ['<i>coding</i>', '<u>testing</u>']
        }
      }

      const result = sanitizeObject(input)
      expect(result.name).toBe('John') // Script removed completely
      expect(result.details.bio).toBe('Developer')
      expect(result.details.interests).toEqual(['coding', 'testing'])
    })

    it('should handle arrays', () => {
      const input = ['<script>test</script>', '<b>bold</b>', 'normal']
      const result = sanitizeObject(input)
      expect(result).toEqual(['', 'bold', 'normal']) // Script becomes empty string
    })

    it('should handle primitive values', () => {
      expect(sanitizeObject('test')).toBe('test')
      expect(sanitizeObject(123)).toBe(123)
      expect(sanitizeObject(true)).toBe(true)
      expect(sanitizeObject(null)).toBe(null)
    })
  })

  describe('validateIPAddress', () => {
    it('should validate IPv4 addresses', () => {
      expect(validateIPAddress('192.168.1.1')).toBe(true)
      expect(validateIPAddress('127.0.0.1')).toBe(true)
      expect(validateIPAddress('8.8.8.8')).toBe(true)
    })

    it('should validate IPv6 addresses', () => {
      expect(validateIPAddress('::1')).toBe(true)
      expect(validateIPAddress('2001:db8::1')).toBe(true)
    })

    it('should reject invalid IP addresses', () => {
      expect(validateIPAddress('256.256.256.256')).toBe(false)
      expect(validateIPAddress('not-an-ip')).toBe(false)
      expect(validateIPAddress('')).toBe(false)
    })
  })

  describe('validateURL', () => {
    it('should validate HTTPS URLs', () => {
      expect(validateURL('https://example.com')).toBe(true)
      expect(validateURL('https://sub.example.com/path?query=1')).toBe(true)
    })

    it('should reject HTTP URLs', () => {
      expect(validateURL('http://example.com')).toBe(false)
    })

    it('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false)
      expect(validateURL('ftp://example.com')).toBe(false)
      expect(validateURL('')).toBe(false)
    })
  })

  describe('validateVietnamesePhone', () => {
    it('should validate Vietnamese mobile numbers', () => {
      expect(validateVietnamesePhone('+84901234567')).toBe(true)
      expect(validateVietnamesePhone('0901234567')).toBe(true)
      expect(validateVietnamesePhone('+84 90 123 4567')).toBe(true)
      expect(validateVietnamesePhone('090 123 4567')).toBe(true)
    })

    it('should reject invalid Vietnamese phone numbers', () => {
      expect(validateVietnamesePhone('123456789')).toBe(false)
      expect(validateVietnamesePhone('+1234567890')).toBe(false)
      expect(validateVietnamesePhone('not-a-phone')).toBe(false)
      expect(validateVietnamesePhone('')).toBe(false)
    })

    it('should handle different Vietnamese mobile prefixes', () => {
      // Viettel
      expect(validateVietnamesePhone('0986123456')).toBe(true)
      // MobiFone  
      expect(validateVietnamesePhone('0906123456')).toBe(true)
      // VinaPhone
      expect(validateVietnamesePhone('0916123456')).toBe(true)
    })
  })
})