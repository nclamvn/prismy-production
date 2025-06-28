// Enhanced Validation System with Strict TypeScript Integration
// Production-ready validation with comprehensive type safety

import { z } from 'zod'
import validator from 'validator'
import DOMPurify from 'isomorphic-dompurify'

// Import comprehensive type definitions and validators
import type {
  ValidationResult,
  ValidationError,
  LoginRequest,
  RegisterRequest,
  TranslationRequest,
} from '../types'
// import {
//   isString,
//   isNumber,
//   isSupportedLanguage,
//   validateEmail,
//   validatePassword,
//   validateURL as validateURLUtil,
//   validatePhoneNumber
// } from './type-guards'

// Basic type guards for immediate use
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

// Sanitization helper with enhanced security
export function sanitizeHtml(input: string): string {
  if (!isString(input)) {
    throw new TypeError('Input must be a string')
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    FORBID_CONTENTS: ['script', 'style'], // Extra security
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
  }).trim()
}

// Custom Zod transformers
const sanitizedString = z.string().transform(val => sanitizeHtml(val.trim()))
const emailString = z
  .string()
  .email()
  .transform(val => validator.normalizeEmail(val) || val)

// Translation request validation
export const translationSchema = z.object({
  text: z
    .string()
    .min(1, 'Text cannot be empty')
    .max(
      2000000,
      'Text too long (maximum 2,000,000 characters - ultra-long documents supported)'
    )
    .transform(val => sanitizeHtml(val.trim()))
    .refine(
      text => text.length > 0 && text.trim().length > 0,
      'Text cannot be only whitespace'
    ),
  sourceLang: z
    .string()
    .length(2, 'Language code must be exactly 2 characters')
    .regex(/^[a-z]{2}$/, 'Language code must be lowercase letters only')
    .refine(
      lang =>
        [
          'en',
          'vi',
          'fr',
          'es',
          'de',
          'it',
          'pt',
          'ru',
          'ja',
          'ko',
          'zh',
        ].includes(lang),
      'Unsupported language code'
    )
    .optional(),
  targetLang: z
    .string()
    .length(2, 'Language code must be exactly 2 characters')
    .regex(/^[a-z]{2}$/, 'Language code must be lowercase letters only')
    .refine(
      lang =>
        [
          'en',
          'vi',
          'fr',
          'es',
          'de',
          'it',
          'pt',
          'ru',
          'ja',
          'ko',
          'zh',
        ].includes(lang),
      'Unsupported language code'
    ),
  qualityTier: z
    .enum(['free', 'standard', 'premium', 'enterprise'], {
      errorMap: () => ({ message: 'Invalid quality tier' }),
    })
    .optional()
    .default('standard'),
  serviceType: z
    .enum(['google_translate', 'llm'], {
      errorMap: () => ({ message: 'Invalid service type' }),
    })
    .optional(),
  trackHistory: z.boolean().optional(),
  createTask: z.boolean().optional(),
})

// User authentication validation
export const signUpSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => validator.normalizeEmail(val) || val),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name too long')
    .regex(
      /^[a-zA-ZÀ-ÿ\s'-]+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .transform(val => sanitizeHtml(val.trim())),
  csrf_token: z.string().min(1, 'CSRF token is required'),
})

export const signInSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => validator.normalizeEmail(val) || val),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
  csrf_token: z.string().min(1, 'CSRF token is required'),
})

// Payment validation
export const paymentSchema = z.object({
  planKey: z.enum(['standard', 'premium', 'enterprise'], {
    errorMap: () => ({ message: 'Invalid subscription plan' }),
  }),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(10000, 'Amount too large')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  currency: z.enum(['USD', 'VND'], {
    errorMap: () => ({ message: 'Invalid currency' }),
  }),
  csrf_token: z.string().min(1, 'CSRF token is required'),
})

// VNPay callback validation
export const vnpayCallbackSchema = z.object({
  vnp_Amount: z.string().regex(/^\d+$/, 'Invalid amount format'),
  vnp_BankCode: z.string().max(20, 'Bank code too long').optional(),
  vnp_BankTranNo: z
    .string()
    .max(255, 'Bank transaction number too long')
    .optional(),
  vnp_CardType: z.string().max(20, 'Card type too long').optional(),
  vnp_OrderInfo: z
    .string()
    .max(255, 'Order info too long')
    .transform(val => sanitizeHtml(val.trim())),
  vnp_PayDate: z.string().regex(/^\d{14}$/, 'Invalid payment date format'),
  vnp_ResponseCode: z.string().regex(/^\d{2}$/, 'Invalid response code format'),
  vnp_TmnCode: z.string().max(8, 'Terminal code too long'),
  vnp_TransactionNo: z.string().max(255, 'Transaction number too long'),
  vnp_TransactionStatus: z
    .string()
    .regex(/^\d{2}$/, 'Invalid transaction status format'),
  vnp_TxnRef: z.string().max(100, 'Transaction reference too long'),
  vnp_SecureHashType: z.string().max(10, 'Hash type too long').optional(),
  vnp_SecureHash: z.string().max(255, 'Secure hash too long'),
})

// MoMo callback validation
export const momoCallbackSchema = z.object({
  partnerCode: z.string().max(50, 'Partner code too long'),
  orderId: z.string().max(50, 'Order ID too long'),
  requestId: z.string().max(50, 'Request ID too long'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .or(z.string().transform(Number)),
  orderInfo: z
    .string()
    .max(255, 'Order info too long')
    .transform(val => sanitizeHtml(val.trim())),
  orderType: z.string().max(50, 'Order type too long'),
  transId: z.number().positive().or(z.string().transform(Number)),
  resultCode: z.number().or(z.string().transform(Number)),
  message: z
    .string()
    .max(255, 'Message too long')
    .transform(val => sanitizeHtml(val.trim())),
  payType: z.string().max(50, 'Pay type too long'),
  responseTime: z.number().positive().or(z.string().transform(Number)),
  extraData: z.string().max(1000, 'Extra data too long').optional().default(''),
  signature: z.string().max(255, 'Signature too long'),
})

// File upload validation
export const fileUploadSchema = z.object({
  fileName: z
    .string()
    .max(255, 'File name too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'File name contains invalid characters')
    .transform(val => sanitizeHtml(val.trim())),
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(10 * 1024 * 1024, 'File too large (maximum 10MB)'),
  fileType: z.enum(
    [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    {
      errorMap: () => ({ message: 'Unsupported file type' }),
    }
  ),
  csrf_token: z.string().min(1, 'CSRF token is required'),
})

// User profile update validation
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name too long')
    .regex(
      /^[a-zA-ZÀ-ÿ\s'-]+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .transform(val => sanitizeHtml(val.trim()))
    .optional(),
  avatar_url: z
    .string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL too long')
    .optional(),
  csrf_token: z.string().min(1, 'CSRF token is required'),
})

// Generic validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (
    data: unknown
  ): Promise<
    { success: true; data: T } | { success: false; errors: string[] }
  > => {
    try {
      const validatedData = await schema.parseAsync(data)
      return { success: true, data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        )
        return { success: false, errors }
      }
      return { success: false, errors: ['Validation failed'] }
    }
  }
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeHtml(key)] = sanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

// IP address validation
export function validateIPAddress(ip: string): boolean {
  return validator.isIP(ip)
}

// URL validation with enhanced security
export function validateURL(url: string): boolean {
  if (!isString(url)) {
    return false
  }

  // Use our type-safe validator first
  if (!validateURLUtil(url)) {
    return false
  }

  // Additional validation with validator library
  return validator.isURL(url, {
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
    host_whitelist: [], // Can be configured for specific allowed hosts
    host_blacklist: ['localhost', '127.0.0.1', '0.0.0.0'], // Security: block local hosts
  })
}

// Enhanced type-safe validation functions
export function createValidationResult<T>(
  success: boolean,
  data?: T,
  errors?: string[]
): ValidationResult<T> {
  return {
    success,
    data,
    errors:
      errors?.map(error => ({
        path: 'root',
        message: error,
        code: 'VALIDATION_ERROR',
      })) || [],
  }
}

// Type-safe validation wrappers
export function validateLoginRequest(
  data: unknown
): ValidationResult<LoginRequest> {
  try {
    const result = signInSchema.parse(data)
    return createValidationResult(true, result as LoginRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      )
      return createValidationResult(false, undefined, errors)
    }
    return createValidationResult(false, undefined, ['Validation failed'])
  }
}

export function validateRegisterRequest(
  data: unknown
): ValidationResult<RegisterRequest> {
  try {
    const result = signUpSchema.parse(data)
    return createValidationResult(true, result as RegisterRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      )
      return createValidationResult(false, undefined, errors)
    }
    return createValidationResult(false, undefined, ['Validation failed'])
  }
}

export function validateTranslationRequest(
  data: unknown
): ValidationResult<TranslationRequest> {
  try {
    const result = translationSchema.parse(data)
    return createValidationResult(true, result as TranslationRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      )
      return createValidationResult(false, undefined, errors)
    }
    return createValidationResult(false, undefined, ['Validation failed'])
  }
}

// Vietnamese phone number validation
export function validateVietnamesePhone(phone: string): boolean {
  // Vietnamese mobile number format: +84 or 0 followed by 9 digits
  const phoneRegex =
    /^(\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}
