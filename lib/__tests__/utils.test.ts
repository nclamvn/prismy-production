/**
 * Utils Test Suite
 * Target: 95% coverage for core utility functions
 */

import { cn, formatDate, formatNumber, slugify } from '../utils'

describe('Utils', () => {
  describe('cn (className merge)', () => {
    it('should merge class names', () => {
      expect(cn('px-2 py-1', 'bg-red hover:bg-dark-red')).toBe(
        'px-2 py-1 bg-red hover:bg-dark-red'
      )
    })

    it('should handle conditional classes', () => {
      expect(cn('px-2', true && 'py-1', false && 'bg-red')).toBe('px-2 py-1')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 px-4')).toBe('px-4')
      expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined)).toBe('')
    })

    it('should handle arrays', () => {
      expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1')
      expect(cn(['px-2', false, 'py-1'])).toBe('px-2 py-1')
    })

    it('should handle objects', () => {
      expect(cn({ 'px-2': true, 'py-1': false, 'bg-red': true })).toBe(
        'px-2 bg-red'
      )
    })
  })

  describe('formatDate', () => {
    it('should format date with default locale', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/January/)
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should handle different dates', () => {
      const date1 = new Date('2024-06-01T00:00:00Z')
      const date2 = new Date('2024-12-25T00:00:00Z')

      expect(formatDate(date1)).toContain('June')
      expect(formatDate(date2)).toContain('December')
    })

    it('should handle edge cases', () => {
      const date = new Date('2024-02-29T00:00:00Z') // Leap year
      expect(formatDate(date)).toContain('February')
      expect(formatDate(date)).toContain('29')
    })

    it('should be consistent with same dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z')
      const date2 = new Date('2024-01-01T00:00:00Z')

      expect(formatDate(date1)).toBe(formatDate(date2))
    })
  })

  describe('formatNumber', () => {
    it('should format integers', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('should format decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
      expect(formatNumber(0.123)).toBe('0.123')
    })

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(-1234)).toBe('-1,234')
      expect(formatNumber(-1234.56)).toBe('-1,234.56')
    })

    it('should handle large numbers', () => {
      expect(formatNumber(1234567890)).toBe('1,234,567,890')
      expect(formatNumber(9876543210.123)).toBe('9,876,543,210.123')
    })

    it('should handle edge cases', () => {
      expect(formatNumber(1)).toBe('1')
      expect(formatNumber(12)).toBe('12')
      expect(formatNumber(123)).toBe('123')
      expect(formatNumber(1234)).toBe('1,234')
    })
  })

  describe('slugify', () => {
    it('should convert text to URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('This is a Test!')).toBe('this-is-a-test')
      expect(slugify('Special Characters @#$%')).toBe('special-characters')
    })

    it('should handle Vietnamese characters', () => {
      expect(slugify('Tài liệu dịch thuật')).toBe('ti-liu-dch-thut')
      expect(slugify('Xin chào Việt Nam')).toBe('xin-cho-vit-nam')
    })

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
    })

    it('should handle special cases', () => {
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces')
      expect(slugify('---dashes---')).toBe('dashes')
      expect(slugify('123 Numbers 456')).toBe('123-numbers-456')
    })

    it('should remove leading/trailing dashes', () => {
      expect(slugify('-leading dash')).toBe('leading-dash')
      expect(slugify('trailing dash-')).toBe('trailing-dash')
      expect(slugify('-both-')).toBe('both')
    })

    it('should collapse multiple dashes', () => {
      expect(slugify('multiple -- dashes')).toBe('multiple-dashes')
      expect(slugify('many --- dashes')).toBe('many-dashes')
    })

    it('should handle mixed case', () => {
      expect(slugify('CamelCase')).toBe('camelcase')
      expect(slugify('MiXeD CaSe')).toBe('mixed-case')
    })

    it('should preserve numbers', () => {
      expect(slugify('Version 2.0')).toBe('version-20')
      expect(slugify('2024 Report')).toBe('2024-report')
    })
  })

  describe('Error Handling', () => {
    it('should handle null/undefined inputs for cn', () => {
      expect(() => cn(null, undefined)).not.toThrow()
      expect(cn(null, undefined)).toBe('')
    })

    it('should throw for null inputs to slugify', () => {
      expect(() => slugify(null as any)).toThrow()
      expect(() => slugify(undefined as any)).toThrow()
    })

    it('should throw for invalid date inputs', () => {
      expect(() => formatDate(new Date('invalid'))).toThrow()
    })

    it('should handle non-string inputs for slugify that can be converted', () => {
      expect(slugify(123 as any)).toBe('123')
      expect(() => slugify({} as any)).not.toThrow()
    })

    it('should handle non-number inputs for formatNumber', () => {
      expect(() => formatNumber('123' as any)).not.toThrow()
      expect(() => formatNumber({} as any)).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle large strings in slugify efficiently', () => {
      const largeText =
        'This is a very long string that needs to be slugified. '.repeat(100)
      const start = Date.now()

      const result = slugify(largeText)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100) // Should complete within 100ms
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle many className merges efficiently', () => {
      const classes = Array(100).fill('px-2 py-1 bg-red hover:bg-blue')
      const start = Date.now()

      const result = cn(...classes)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(50) // Should complete within 50ms
      expect(result).toBeDefined()
    })

    it('should format large numbers efficiently', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        formatNumber(Math.random() * 1000000)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('Integration', () => {
    it('should work together in realistic scenarios', () => {
      // Simulate blog post processing
      const title = 'My Blog Post Title!'
      const views = 1234567
      const publishDate = new Date('2024-01-15T10:30:00Z')

      const slug = slugify(title)
      const formattedViews = formatNumber(views)
      const formattedDate = formatDate(publishDate)
      const className = cn('blog-post', views > 1000000 && 'popular')

      expect(slug).toBe('my-blog-post-title')
      expect(formattedViews).toBe('1,234,567')
      expect(formattedDate).toContain('January')
      expect(className).toBe('blog-post popular')
    })

    it('should handle user profile scenarios', () => {
      const username = 'User Name 123!'
      const score = 98765.43
      const joinDate = new Date('2024-06-01T00:00:00Z')

      const userSlug = slugify(username)
      const formattedScore = formatNumber(score)
      const memberSince = formatDate(joinDate)
      const avatarClass = cn(
        'avatar',
        score > 90000 && 'premium',
        'rounded-full'
      )

      expect(userSlug).toBe('user-name-123')
      expect(formattedScore).toBe('98,765.43')
      expect(memberSince).toContain('June')
      expect(avatarClass).toBe('avatar premium rounded-full')
    })
  })
})
