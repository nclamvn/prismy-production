/**
 * Focused Mutation Testing for utils.ts cn function
 * Small, targeted test to validate Stryker setup
 */

import { cn } from '../utils'

describe('Focused Mutation Test - cn function', () => {
  it('should combine basic classes correctly', () => {
    const result = cn('class1', 'class2')
    
    // Multiple assertions to catch mutations
    expect(result).toBe('class1 class2')
    expect(result.split(' ')).toHaveLength(2)
    expect(result).toContain('class1')
    expect(result).toContain('class2')
  })

  it('should filter falsy values', () => {
    const result = cn('valid', false, null, undefined, '', 'also-valid')
    
    // Test filtering logic thoroughly
    expect(result).toBe('valid also-valid')
    expect(result).not.toContain('false')
    expect(result).not.toContain('null')
    expect(result).not.toContain('undefined')
    expect(result.split(' ')).toHaveLength(2)
  })

  it('should handle empty input', () => {
    const result = cn()
    
    expect(result).toBe('')
    expect(result.length).toBe(0)
  })

  it('should handle single class', () => {
    const result = cn('single')
    
    expect(result).toBe('single')
    expect(result.split(' ')).toHaveLength(1)
  })
})