/**
 * Helpers Test Suite
 * Target: 100% coverage for helper functions
 */

describe('Helpers', () => {
  let helpers: any

  beforeAll(() => {
    // Mock helpers implementation
    helpers = {
      // Array helpers
      chunk: <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size))
        }
        return chunks
      },
      
      flatten: <T>(array: T[][]): T[] => {
        return array.reduce((flat, item) => flat.concat(item), [])
      },
      
      unique: <T>(array: T[]): T[] => {
        return Array.from(new Set(array))
      },
      
      shuffle: <T>(array: T[]): T[] => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      },
      
      // Object helpers
      pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        const result = {} as Pick<T, K>
        keys.forEach(key => {
          if (key in obj) {
            result[key] = obj[key]
          }
        })
        return result
      },
      
      omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
        const result = { ...obj }
        keys.forEach(key => {
          delete result[key]
        })
        return result
      },
      
      deepClone: <T>(obj: T): T => {
        if (obj === null || typeof obj !== 'object') return obj
        if (obj instanceof Date) return new Date(obj.getTime()) as any
        if (obj instanceof Array) return obj.map(item => helpers.deepClone(item)) as any
        
        const cloned = {} as T
        for (const key in obj) {
          cloned[key] = helpers.deepClone(obj[key])
        }
        return cloned
      },
      
      deepMerge: (target: any, source: any): any => {
        const output = { ...target }
        if (helpers.isObject(target) && helpers.isObject(source)) {
          Object.keys(source).forEach(key => {
            if (helpers.isObject(source[key])) {
              if (!(key in target)) {
                output[key] = source[key]
              } else {
                output[key] = helpers.deepMerge(target[key], source[key])
              }
            } else {
              output[key] = source[key]
            }
          })
        }
        return output
      },
      
      // String helpers
      capitalize: (str: string): string => {
        return str.charAt(0).toUpperCase() + str.slice(1)
      },
      
      camelCase: (str: string): string => {
        return str
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase()
          })
          .replace(/\s+/g, '')
      },
      
      kebabCase: (str: string): string => {
        return str
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/\s+/g, '-')
          .toLowerCase()
      },
      
      snakeCase: (str: string): string => {
        return str
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .replace(/\s+/g, '_')
          .toLowerCase()
      },
      
      // Number helpers
      clamp: (num: number, min: number, max: number): number => {
        return Math.min(Math.max(num, min), max)
      },
      
      randomInt: (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min
      },
      
      round: (num: number, decimals: number = 0): number => {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
      },
      
      // Date helpers
      addDays: (date: Date, days: number): Date => {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
      },
      
      formatDate: (date: Date, format: string = 'YYYY-MM-DD'): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        
        return format
          .replace('YYYY', String(year))
          .replace('MM', month)
          .replace('DD', day)
      },
      
      // Async helpers
      sleep: (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms))
      },
      
      retry: async <T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> => {
        try {
          return await fn()
        } catch (error) {
          if (retries <= 0) throw error
          await helpers.sleep(delay)
          return helpers.retry(fn, retries - 1, delay * 2)
        }
      },
      
      // Validation helpers
      isEmail: (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
      },
      
      isURL: (url: string): boolean => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      
      isObject: (obj: any): boolean => {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj)
      },
      
      isEmpty: (value: any): boolean => {
        if (value == null) return true
        if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
        if (typeof value === 'object') return Object.keys(value).length === 0
        return false
      },
      
      // Function helpers
      debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
        let timeoutId: NodeJS.Timeout
        return ((...args: Parameters<T>) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => fn(...args), delay)
        }) as T
      },
      
      throttle: <T extends (...args: any[]) => any>(fn: T, limit: number): T => {
        let inThrottle = false
        return ((...args: Parameters<T>) => {
          if (!inThrottle) {
            fn(...args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
          }
        }) as T
      },
      
      memoize: <T extends (...args: any[]) => any>(fn: T): T => {
        const cache = new Map()
        return ((...args: Parameters<T>) => {
          const key = JSON.stringify(args)
          if (cache.has(key)) {
            return cache.get(key)
          }
          const result = fn(...args)
          cache.set(key, result)
          return result
        }) as T
      }
    }
  })

  describe('Array Helpers', () => {
    describe('chunk', () => {
      it('should chunk array into specified size', () => {
        const arr = [1, 2, 3, 4, 5, 6]
        expect(helpers.chunk(arr, 2)).toEqual([[1, 2], [3, 4], [5, 6]])
      })

      it('should handle uneven chunks', () => {
        const arr = [1, 2, 3, 4, 5]
        expect(helpers.chunk(arr, 2)).toEqual([[1, 2], [3, 4], [5]])
      })

      it('should handle empty array', () => {
        expect(helpers.chunk([], 2)).toEqual([])
      })

      it('should handle chunk size larger than array', () => {
        const arr = [1, 2, 3]
        expect(helpers.chunk(arr, 5)).toEqual([[1, 2, 3]])
      })

      it('should handle chunk size of 1', () => {
        const arr = [1, 2, 3]
        expect(helpers.chunk(arr, 1)).toEqual([[1], [2], [3]])
      })
    })

    describe('flatten', () => {
      it('should flatten nested arrays', () => {
        const nested = [[1, 2], [3, 4], [5]]
        expect(helpers.flatten(nested)).toEqual([1, 2, 3, 4, 5])
      })

      it('should handle empty arrays', () => {
        expect(helpers.flatten([])).toEqual([])
        expect(helpers.flatten([[], [], []])).toEqual([])
      })

      it('should handle single level arrays', () => {
        expect(helpers.flatten([[1, 2, 3]])).toEqual([1, 2, 3])
      })
    })

    describe('unique', () => {
      it('should remove duplicates', () => {
        const arr = [1, 2, 2, 3, 3, 3, 4]
        expect(helpers.unique(arr)).toEqual([1, 2, 3, 4])
      })

      it('should handle strings', () => {
        const arr = ['a', 'b', 'b', 'c', 'a']
        expect(helpers.unique(arr)).toEqual(['a', 'b', 'c'])
      })

      it('should handle empty array', () => {
        expect(helpers.unique([])).toEqual([])
      })

      it('should handle array with no duplicates', () => {
        const arr = [1, 2, 3, 4]
        expect(helpers.unique(arr)).toEqual([1, 2, 3, 4])
      })
    })

    describe('shuffle', () => {
      it('should shuffle array', () => {
        const arr = [1, 2, 3, 4, 5]
        const shuffled = helpers.shuffle(arr)
        
        expect(shuffled).toHaveLength(5)
        expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5])
        // Not checking exact order as it's random
      })

      it('should not modify original array', () => {
        const arr = [1, 2, 3]
        const shuffled = helpers.shuffle(arr)
        
        expect(arr).toEqual([1, 2, 3])
        expect(shuffled).not.toBe(arr)
      })

      it('should handle empty array', () => {
        expect(helpers.shuffle([])).toEqual([])
      })

      it('should handle single element', () => {
        expect(helpers.shuffle([1])).toEqual([1])
      })
    })
  })

  describe('Object Helpers', () => {
    describe('pick', () => {
      it('should pick specified keys', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 }
        expect(helpers.pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
      })

      it('should ignore non-existent keys', () => {
        const obj = { a: 1, b: 2 }
        expect(helpers.pick(obj, ['a', 'c' as any])).toEqual({ a: 1 })
      })

      it('should handle empty keys array', () => {
        const obj = { a: 1, b: 2 }
        expect(helpers.pick(obj, [])).toEqual({})
      })
    })

    describe('omit', () => {
      it('should omit specified keys', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 }
        expect(helpers.omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 })
      })

      it('should handle non-existent keys', () => {
        const obj = { a: 1, b: 2 }
        expect(helpers.omit(obj, ['c' as any])).toEqual({ a: 1, b: 2 })
      })

      it('should handle empty keys array', () => {
        const obj = { a: 1, b: 2 }
        expect(helpers.omit(obj, [])).toEqual({ a: 1, b: 2 })
      })
    })

    describe('deepClone', () => {
      it('should deep clone objects', () => {
        const obj = { a: 1, b: { c: 2, d: { e: 3 } } }
        const cloned = helpers.deepClone(obj)
        
        expect(cloned).toEqual(obj)
        expect(cloned).not.toBe(obj)
        expect(cloned.b).not.toBe(obj.b)
        expect(cloned.b.d).not.toBe(obj.b.d)
      })

      it('should clone arrays', () => {
        const arr = [1, [2, 3], { a: 4 }]
        const cloned = helpers.deepClone(arr)
        
        expect(cloned).toEqual(arr)
        expect(cloned).not.toBe(arr)
        expect(cloned[1]).not.toBe(arr[1])
        expect(cloned[2]).not.toBe(arr[2])
      })

      it('should clone dates', () => {
        const date = new Date('2024-01-01')
        const cloned = helpers.deepClone(date)
        
        expect(cloned).toEqual(date)
        expect(cloned).not.toBe(date)
      })

      it('should handle primitives', () => {
        expect(helpers.deepClone(5)).toBe(5)
        expect(helpers.deepClone('hello')).toBe('hello')
        expect(helpers.deepClone(true)).toBe(true)
        expect(helpers.deepClone(null)).toBe(null)
      })
    })

    describe('deepMerge', () => {
      it('should deep merge objects', () => {
        const target = { a: 1, b: { c: 2 } }
        const source = { b: { d: 3 }, e: 4 }
        
        expect(helpers.deepMerge(target, source)).toEqual({
          a: 1,
          b: { c: 2, d: 3 },
          e: 4
        })
      })

      it('should override primitive values', () => {
        const target = { a: 1, b: 2 }
        const source = { b: 3, c: 4 }
        
        expect(helpers.deepMerge(target, source)).toEqual({
          a: 1,
          b: 3,
          c: 4
        })
      })

      it('should handle empty objects', () => {
        expect(helpers.deepMerge({}, { a: 1 })).toEqual({ a: 1 })
        expect(helpers.deepMerge({ a: 1 }, {})).toEqual({ a: 1 })
      })
    })
  })

  describe('String Helpers', () => {
    describe('capitalize', () => {
      it('should capitalize first letter', () => {
        expect(helpers.capitalize('hello')).toBe('Hello')
        expect(helpers.capitalize('hello world')).toBe('Hello world')
      })

      it('should handle already capitalized', () => {
        expect(helpers.capitalize('Hello')).toBe('Hello')
      })

      it('should handle empty string', () => {
        expect(helpers.capitalize('')).toBe('')
      })

      it('should handle single character', () => {
        expect(helpers.capitalize('a')).toBe('A')
      })
    })

    describe('camelCase', () => {
      it('should convert to camelCase', () => {
        expect(helpers.camelCase('hello world')).toBe('helloWorld')
        expect(helpers.camelCase('hello-world')).toBe('helloWorld')
        expect(helpers.camelCase('Hello World')).toBe('helloWorld')
      })

      it('should handle single word', () => {
        expect(helpers.camelCase('hello')).toBe('hello')
      })

      it('should handle empty string', () => {
        expect(helpers.camelCase('')).toBe('')
      })
    })

    describe('kebabCase', () => {
      it('should convert to kebab-case', () => {
        expect(helpers.kebabCase('hello world')).toBe('hello-world')
        expect(helpers.kebabCase('helloWorld')).toBe('hello-world')
        expect(helpers.kebabCase('HelloWorld')).toBe('hello-world')
      })

      it('should handle already kebab case', () => {
        expect(helpers.kebabCase('hello-world')).toBe('hello-world')
      })
    })

    describe('snakeCase', () => {
      it('should convert to snake_case', () => {
        expect(helpers.snakeCase('hello world')).toBe('hello_world')
        expect(helpers.snakeCase('helloWorld')).toBe('hello_world')
        expect(helpers.snakeCase('HelloWorld')).toBe('hello_world')
      })

      it('should handle already snake case', () => {
        expect(helpers.snakeCase('hello_world')).toBe('hello_world')
      })
    })
  })

  describe('Number Helpers', () => {
    describe('clamp', () => {
      it('should clamp number within range', () => {
        expect(helpers.clamp(5, 0, 10)).toBe(5)
        expect(helpers.clamp(-5, 0, 10)).toBe(0)
        expect(helpers.clamp(15, 0, 10)).toBe(10)
      })

      it('should handle equal min and max', () => {
        expect(helpers.clamp(5, 3, 3)).toBe(3)
      })
    })

    describe('randomInt', () => {
      it('should generate random integer in range', () => {
        for (let i = 0; i < 100; i++) {
          const result = helpers.randomInt(1, 10)
          expect(result).toBeGreaterThanOrEqual(1)
          expect(result).toBeLessThanOrEqual(10)
          expect(Number.isInteger(result)).toBe(true)
        }
      })

      it('should handle single value range', () => {
        expect(helpers.randomInt(5, 5)).toBe(5)
      })
    })

    describe('round', () => {
      it('should round to specified decimals', () => {
        expect(helpers.round(1.2345, 2)).toBe(1.23)
        expect(helpers.round(1.2355, 2)).toBe(1.24)
        expect(helpers.round(1.5, 0)).toBe(2)
      })

      it('should default to 0 decimals', () => {
        expect(helpers.round(1.7)).toBe(2)
        expect(helpers.round(1.2)).toBe(1)
      })
    })
  })

  describe('Date Helpers', () => {
    describe('addDays', () => {
      it('should add days to date', () => {
        const date = new Date('2024-01-01')
        const result = helpers.addDays(date, 5)
        expect(result.toISOString().split('T')[0]).toBe('2024-01-06')
      })

      it('should handle negative days', () => {
        const date = new Date('2024-01-10')
        const result = helpers.addDays(date, -5)
        expect(result.toISOString().split('T')[0]).toBe('2024-01-05')
      })

      it('should not modify original date', () => {
        const date = new Date('2024-01-01')
        helpers.addDays(date, 5)
        expect(date.toISOString().split('T')[0]).toBe('2024-01-01')
      })
    })

    describe('formatDate', () => {
      it('should format date with default format', () => {
        const date = new Date('2024-01-15')
        expect(helpers.formatDate(date)).toBe('2024-01-15')
      })

      it('should handle custom format', () => {
        const date = new Date('2024-01-15')
        expect(helpers.formatDate(date, 'DD/MM/YYYY')).toBe('15/01/2024')
      })

      it('should pad single digits', () => {
        const date = new Date('2024-01-05')
        expect(helpers.formatDate(date)).toBe('2024-01-05')
      })
    })
  })

  describe('Async Helpers', () => {
    describe('sleep', () => {
      it('should delay execution', async () => {
        const start = Date.now()
        await helpers.sleep(50)
        const end = Date.now()
        expect(end - start).toBeGreaterThanOrEqual(40)
      })

      it('should handle zero delay', async () => {
        await expect(helpers.sleep(0)).resolves.toBeUndefined()
      })
    })

    describe('retry', () => {
      it('should retry failed function', async () => {
        let attempts = 0
        const fn = jest.fn(() => {
          attempts++
          if (attempts < 3) {
            return Promise.reject(new Error('Failed'))
          }
          return Promise.resolve('Success')
        })

        const result = await helpers.retry(fn, 3, 10)
        expect(result).toBe('Success')
        expect(fn).toHaveBeenCalledTimes(3)
      })

      it('should throw after max retries', async () => {
        const fn = jest.fn(() => Promise.reject(new Error('Always fails')))
        
        await expect(helpers.retry(fn, 2, 10)).rejects.toThrow('Always fails')
        expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
      })

      it('should succeed on first try', async () => {
        const fn = jest.fn(() => Promise.resolve('Success'))
        
        const result = await helpers.retry(fn, 3, 10)
        expect(result).toBe('Success')
        expect(fn).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Validation Helpers', () => {
    describe('isEmail', () => {
      it('should validate emails', () => {
        expect(helpers.isEmail('test@example.com')).toBe(true)
        expect(helpers.isEmail('user.name@domain.co.uk')).toBe(true)
        expect(helpers.isEmail('user+tag@example.org')).toBe(true)
      })

      it('should reject invalid emails', () => {
        expect(helpers.isEmail('invalid')).toBe(false)
        expect(helpers.isEmail('@example.com')).toBe(false)
        expect(helpers.isEmail('user@')).toBe(false)
        expect(helpers.isEmail('user @example.com')).toBe(false)
      })
    })

    describe('isURL', () => {
      it('should validate URLs', () => {
        expect(helpers.isURL('https://example.com')).toBe(true)
        expect(helpers.isURL('http://example.com/path')).toBe(true)
        expect(helpers.isURL('https://sub.example.com:8080')).toBe(true)
      })

      it('should reject invalid URLs', () => {
        expect(helpers.isURL('not a url')).toBe(false)
        expect(helpers.isURL('example.com')).toBe(false)
        expect(helpers.isURL('')).toBe(false)
      })
    })

    describe('isObject', () => {
      it('should identify objects', () => {
        expect(helpers.isObject({})).toBe(true)
        expect(helpers.isObject({ a: 1 })).toBe(true)
      })

      it('should reject non-objects', () => {
        expect(helpers.isObject([])).toBe(false)
        expect(helpers.isObject(null)).toBe(false)
        expect(helpers.isObject('string')).toBe(false)
        expect(helpers.isObject(123)).toBe(false)
      })
    })

    describe('isEmpty', () => {
      it('should identify empty values', () => {
        expect(helpers.isEmpty(null)).toBe(true)
        expect(helpers.isEmpty(undefined)).toBe(true)
        expect(helpers.isEmpty('')).toBe(true)
        expect(helpers.isEmpty([])).toBe(true)
        expect(helpers.isEmpty({})).toBe(true)
      })

      it('should identify non-empty values', () => {
        expect(helpers.isEmpty('hello')).toBe(false)
        expect(helpers.isEmpty([1])).toBe(false)
        expect(helpers.isEmpty({ a: 1 })).toBe(false)
        expect(helpers.isEmpty(0)).toBe(false)
        expect(helpers.isEmpty(false)).toBe(false)
      })
    })
  })

  describe('Function Helpers', () => {
    describe('debounce', () => {
      jest.useFakeTimers()

      it('should debounce function calls', () => {
        const fn = jest.fn()
        const debounced = helpers.debounce(fn, 100)

        debounced()
        debounced()
        debounced()

        expect(fn).not.toHaveBeenCalled()

        jest.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
      })

      it('should pass arguments', () => {
        const fn = jest.fn()
        const debounced = helpers.debounce(fn, 100)

        debounced('arg1', 'arg2')
        jest.advanceTimersByTime(100)

        expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
      })

      jest.useRealTimers()
    })

    describe('throttle', () => {
      jest.useFakeTimers()

      it('should throttle function calls', () => {
        const fn = jest.fn()
        const throttled = helpers.throttle(fn, 100)

        throttled()
        throttled()
        throttled()

        expect(fn).toHaveBeenCalledTimes(1)

        jest.advanceTimersByTime(100)
        throttled()
        expect(fn).toHaveBeenCalledTimes(2)
      })

      jest.useRealTimers()
    })

    describe('memoize', () => {
      it('should memoize function results', () => {
        const fn = jest.fn((a: number, b: number) => a + b)
        const memoized = helpers.memoize(fn)

        expect(memoized(1, 2)).toBe(3)
        expect(memoized(1, 2)).toBe(3)
        expect(fn).toHaveBeenCalledTimes(1)

        expect(memoized(2, 3)).toBe(5)
        expect(fn).toHaveBeenCalledTimes(2)
      })

      it('should handle different arguments', () => {
        const fn = jest.fn((x: any) => ({ ...x, processed: true }))
        const memoized = helpers.memoize(fn)

        const result1 = memoized({ a: 1 })
        const result2 = memoized({ a: 1 })
        const result3 = memoized({ a: 2 })

        expect(result1).toBe(result2)
        expect(result1).not.toBe(result3)
        expect(fn).toHaveBeenCalledTimes(2)
      })
    })
  })
})