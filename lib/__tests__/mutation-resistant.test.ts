/**
 * Mutation-Resistant Test Examples
 * These tests are specifically designed to catch mutations
 * and demonstrate high-quality testing practices
 */

import { cn } from '../utils'

describe('Mutation-Resistant Tests for utils.ts', () => {
  describe('cn (className utility)', () => {
    it('should combine multiple classes correctly', () => {
      const result = cn('class1', 'class2', 'class3')

      // Test for exact output - mutations changing logic will fail
      expect(result).toBe('class1 class2 class3')

      // Test length to catch mutations that remove functionality
      expect(result.split(' ')).toHaveLength(3)

      // Test that all inputs are present
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle falsy values correctly', () => {
      const result = cn('class1', false, null, undefined, '', 'class2')

      // Should only include truthy values
      expect(result).toBe('class1 class2')

      // Mutations that change falsy handling will fail
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
      expect(result).not.toContain('undefined')
      expect(result.split(' ')).toHaveLength(2)
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class',
        !isDisabled && 'enabled-class'
      )

      // Test specific conditions to catch logical mutations
      expect(result).toBe('base-class active-class enabled-class')
      expect(result).toContain('active-class')
      expect(result).toContain('enabled-class')
      expect(result).not.toContain('disabled-class')
    })

    it('should handle empty input correctly', () => {
      const result = cn()

      // Mutations changing return behavior will fail
      expect(result).toBe('')
      expect(result).toHaveLength(0)
    })

    it('should handle array inputs', () => {
      const result = cn(['class1', 'class2'], 'class3')

      // Should flatten arrays properly
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle object inputs with boolean values', () => {
      const result = cn({
        active: true,
        disabled: false,
        loading: true,
      })

      // Should only include keys with true values
      expect(result).toContain('active')
      expect(result).toContain('loading')
      expect(result).not.toContain('disabled')
    })

    it('should handle complex mixed inputs', () => {
      const isActive = true
      const isLoading = false

      const result = cn(
        'base',
        ['array-class1', 'array-class2'],
        {
          'object-active': isActive,
          'object-loading': isLoading,
        },
        isActive && 'conditional-active',
        'final-class'
      )

      // Test comprehensive output
      expect(result).toContain('base')
      expect(result).toContain('array-class1')
      expect(result).toContain('array-class2')
      expect(result).toContain('object-active')
      expect(result).toContain('conditional-active')
      expect(result).toContain('final-class')
      expect(result).not.toContain('object-loading')
    })

    it('should preserve order of classes', () => {
      const result = cn('first', 'second', 'third')

      // Order matters for CSS precedence
      const classes = result.split(' ')
      expect(classes[0]).toBe('first')
      expect(classes[1]).toBe('second')
      expect(classes[2]).toBe('third')
    })

    it('should handle duplicate classes correctly', () => {
      // Note: This depends on the actual implementation
      // Some utilities dedupe, others don't - test what yours does
      const result = cn('class1', 'class2', 'class1')

      // Test that the function behaves consistently
      const classes = result.split(' ')
      expect(classes).toContain('class1')
      expect(classes).toContain('class2')

      // If your implementation dedupes:
      // expect(classes.filter(c => c === 'class1')).toHaveLength(1)
      // If it doesn't dedupe:
      // expect(classes.filter(c => c === 'class1')).toHaveLength(2)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long class names', () => {
      const longClassName = 'a'.repeat(1000)
      const result = cn(longClassName, 'short')

      expect(result).toContain(longClassName)
      expect(result).toContain('short')
      expect(result.length).toBeGreaterThan(1000)
    })

    it('should handle special characters in class names', () => {
      const result = cn(
        'class-with-dashes',
        'class_with_underscores',
        'class123'
      )

      expect(result).toContain('class-with-dashes')
      expect(result).toContain('class_with_underscores')
      expect(result).toContain('class123')
    })

    it('should handle numeric inputs correctly', () => {
      // Test how the function handles numbers
      const result = cn('class1', 123, 'class2')

      // This tests the type coercion behavior
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      // The exact behavior with numbers depends on implementation
    })
  })

  describe('Performance and Mutation Resistance', () => {
    it('should be consistent across multiple calls', () => {
      const inputs = ['class1', 'class2', 'class3']

      const result1 = cn(...inputs)
      const result2 = cn(...inputs)

      // Should always return the same result for same input
      expect(result1).toBe(result2)
    })

    it('should handle empty strings and whitespace', () => {
      const result = cn('  ', '', '   class1   ', '  class2  ')

      // Should handle whitespace appropriately
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      // Depending on implementation, might trim or not
    })

    it('should work with spread operator', () => {
      const classes = ['class1', 'class2', 'class3']
      const result = cn(...classes)

      expect(result).toBe('class1 class2 class3')
      expect(classes.every(cls => result.includes(cls))).toBe(true)
    })
  })
})
