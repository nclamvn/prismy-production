// Type Guards and Validation Utilities
// Production-ready type checking and validation system

// Basic Type Guards
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function'
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

// Schema Validation
export type ValidationSchema<T> = {
  [K in keyof T]: (value: unknown) => value is T[K]
}

export function validateSchema<T>(
  value: unknown,
  schema: ValidationSchema<T>
): value is T {
  if (!isObject(value)) {
    return false
  }

  return Object.entries(schema).every(([key, guard]) => {
    return guard((value as any)[key])
  })
}
