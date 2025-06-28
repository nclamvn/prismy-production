// Utility TypeScript definitions
// Helper types and generic utilities for type safety

import type { ComponentType, ReactNode } from 'react'

// Generic Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P]
}

export type Nullable<T> = T | null

export type NonNullable<T> = T extends null | undefined ? never : T

export type ValueOf<T> = T[keyof T]

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// Array and Object Utilities
export type NonEmptyArray<T> = [T, ...T[]]

export type Head<T extends readonly any[]> = T extends readonly [infer H, ...any[]] ? H : never

export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer R] ? R : []

export type Last<T extends readonly any[]> = T extends readonly [...any[], infer L] ? L : never

export type Length<T extends readonly any[]> = T['length']

export type Reverse<T extends readonly any[]> = T extends readonly [...infer Rest, infer Last]
  ? [Last, ...Reverse<Rest>]
  : []

export type Flatten<T extends readonly any[]> = T extends readonly [infer First, ...infer Rest]
  ? First extends readonly any[]
    ? [...Flatten<First>, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : []

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export type UnionToTuple<T> = UnionToIntersection<T extends any ? (t: T) => T : never> extends (_: any) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : []

// String Utilities
export type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Lowercase<F>}${R}` : S

export type KebabCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? First extends Lowercase<First>
      ? `${First}${KebabCase<Rest>}`
      : `-${Lowercase<First>}${KebabCase<Rest>}`
    : `${First}${KebabCase<Rest>}`
  : S

export type CamelCase<S extends string> = S extends `${infer P1}-${infer P2}${infer P3}`
  ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
  : S

export type PascalCase<S extends string> = Capitalize<CamelCase<S>>

export type SnakeCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? First extends Lowercase<First>
      ? `${First}${SnakeCase<Rest>}`
      : `_${Lowercase<First>}${SnakeCase<Rest>}`
    : `${First}${SnakeCase<Rest>}`
  : S

// Function Utilities
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never

export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R>
  ? R
  : never

export type Awaited<T> = T extends Promise<infer U> ? U : T

export type Curry<T> = T extends (...args: infer A) => infer R
  ? A extends [infer First, ...infer Rest]
    ? (arg: First) => Rest extends []
      ? R
      : Curry<(...args: Rest) => R>
    : R
  : never

// Promise Utilities
export type PromiseValue<T> = T extends Promise<infer U> ? U : T

export type PromiseTuple<T extends readonly Promise<any>[]> = {
  [K in keyof T]: PromiseValue<T[K]>
}

export type AllSettled<T extends readonly Promise<any>[]> = {
  [K in keyof T]: PromiseSettledResult<PromiseValue<T[K]>>
}

// Validation Types
export type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
  value?: any
}

export type Validator<T> = (value: unknown) => ValidationResult<T>

export type Schema<T> = {
  [K in keyof T]: Validator<T[K]>
}

// Event System Types
export type EventMap = Record<string, any>

export type EventKey<T extends EventMap> = string & keyof T

export type EventReceiver<T> = (params: T) => void

export interface EventEmitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void
}

// State Management Types
export type StateUpdater<T> = T | ((prevState: T) => T)

export type Reducer<S, A> = (state: S, action: A) => S

export type MiddlewareAPI<S, A> = {
  getState(): S
  dispatch(action: A): A
}

export type Middleware<S, A> = (api: MiddlewareAPI<S, A>) => (next: (action: A) => A) => (action: A) => A

export interface Store<S, A> {
  getState(): S
  dispatch(action: A): A
  subscribe(listener: () => void): () => void
}

// Serialization Types
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | SerializableObject 
  | SerializableArray

export type SerializableObject = { [key: string]: Serializable }

export type SerializableArray = Serializable[]

export type Serialized<T> = T extends Serializable ? T : never

// Database/API Types
export type PrimaryKey = string | number

export interface Entity {
  id: PrimaryKey
}

export type CreateInput<T extends Entity> = Omit<T, 'id'>

export type UpdateInput<T extends Entity> = Partial<Omit<T, 'id'>>

export interface Repository<T extends Entity> {
  findById(id: PrimaryKey): Promise<T | null>
  findAll(): Promise<T[]>
  create(input: CreateInput<T>): Promise<T>
  update(id: PrimaryKey, input: UpdateInput<T>): Promise<T>
  delete(id: PrimaryKey): Promise<void>
}

// Error Handling Types
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export type Maybe<T> = T | null | undefined

export type Either<L, R> = 
  | { type: 'left'; value: L }
  | { type: 'right'; value: R }

export interface Try<T> {
  isSuccess(): boolean
  isFailure(): boolean
  get(): T
  getOrElse(defaultValue: T): T
  map<U>(fn: (value: T) => U): Try<U>
  flatMap<U>(fn: (value: T) => Try<U>): Try<U>
  filter(predicate: (value: T) => boolean): Try<T>
  recover(fn: (error: Error) => T): Try<T>
}

// Component and HOC Types
export type ComponentProps<T> = T extends ComponentType<infer P> ? P : never

export type HOC<InjectProps, OuterProps = {}> = <C extends ComponentType<any>>(
  component: C
) => ComponentType<Omit<ComponentProps<C>, keyof InjectProps> & OuterProps>

export type InferProps<T> = T extends ComponentType<infer P> ? P : never

export type InferRef<T> = T extends ComponentType<any> 
  ? T extends React.ForwardRefExoticComponent<any> 
    ? React.ComponentRef<T>
    : never
  : never

// Conditional Types
export type If<C extends boolean, T, F> = C extends true ? T : F

export type IsEqual<T, U> = T extends U ? (U extends T ? true : false) : false

export type IsNever<T> = [T] extends [never] ? true : false

export type IsAny<T> = 0 extends (1 & T) ? true : false

export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false

export type IsFunction<T> = T extends (...args: any[]) => any ? true : false

export type IsArray<T> = T extends readonly any[] ? true : false

export type IsObject<T> = T extends object ? (IsArray<T> extends true ? false : true) : false

// Type Guards
export type TypeGuard<T> = (value: unknown) => value is T

export type AssertsType<T> = (value: unknown) => asserts value is T

export type Predicate<T> = (value: T) => boolean

// Configuration Types
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    required?: boolean
    default?: any
    validation?: (value: any) => boolean
    description?: string
  }
}

export type InferConfig<T extends ConfigSchema> = {
  [K in keyof T]: T[K]['required'] extends true
    ? T[K]['type'] extends 'string'
      ? string
      : T[K]['type'] extends 'number'
      ? number
      : T[K]['type'] extends 'boolean'
      ? boolean
      : T[K]['type'] extends 'object'
      ? object
      : T[K]['type'] extends 'array'
      ? any[]
      : any
    : T[K]['type'] extends 'string'
    ? string | undefined
    : T[K]['type'] extends 'number'
    ? number | undefined
    : T[K]['type'] extends 'boolean'
    ? boolean | undefined
    : T[K]['type'] extends 'object'
    ? object | undefined
    : T[K]['type'] extends 'array'
    ? any[] | undefined
    : any
}

// Mocking and Testing Types
export type Mock<T> = T & {
  mockImplementation: (fn: T) => Mock<T>
  mockReturnValue: T extends (...args: any[]) => infer R ? (value: R) => Mock<T> : never
  mockResolvedValue: T extends (...args: any[]) => Promise<infer R> ? (value: R) => Mock<T> : never
  mockRejectedValue: T extends (...args: any[]) => Promise<any> ? (value: any) => Mock<T> : never
  mockClear: () => void
  mockReset: () => void
  mockRestore: () => void
}

export type MockedFunction<T extends (...args: any[]) => any> = Mock<T> & T

export type MockedObject<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? MockedFunction<T[K]> : T[K]
}

// Brand Types (for nominal typing)
export type Brand<T, B> = T & { __brand: B }

export type UserId = Brand<string, 'UserId'>
export type Email = Brand<string, 'Email'>
export type Timestamp = Brand<number, 'Timestamp'>
export type UUID = Brand<string, 'UUID'>

// Opaque Types
export type Opaque<T, K> = T & { readonly __opaque__: K }

export type AbsolutePath = Opaque<string, 'AbsolutePath'>
export type RelativePath = Opaque<string, 'RelativePath'>
export type URL = Opaque<string, 'URL'>
export type Base64 = Opaque<string, 'Base64'>

// Builder Pattern Types
export interface Builder<T> {
  build(): T
}

export type FluentBuilder<T> = {
  [K in keyof T]: (value: T[K]) => FluentBuilder<T>
} & Builder<T>

// Plugin System Types
export interface Plugin<T = any> {
  name: string
  version: string
  dependencies?: string[]
  install(context: T): void | Promise<void>
  uninstall?(context: T): void | Promise<void>
}

export interface PluginManager<T> {
  register(plugin: Plugin<T>): void
  unregister(name: string): void
  get(name: string): Plugin<T> | undefined
  getAll(): Plugin<T>[]
  install(name: string): Promise<void>
  uninstall(name: string): Promise<void>
}

// Cache Types
export interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl?: number
}

export interface Cache<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V, ttl?: number): void
  has(key: K): boolean
  delete(key: K): boolean
  clear(): void
  size(): number
}

// Queue and Task Types
export interface Task<T = any> {
  id: string
  type: string
  payload: T
  priority?: number
  delay?: number
  attempts?: number
  maxAttempts?: number
  createdAt: Date
  scheduledAt?: Date
}

export interface Queue<T = any> {
  add(task: Omit<Task<T>, 'id' | 'createdAt'>): Promise<Task<T>>
  process(processor: (task: Task<T>) => Promise<void>): void
  pause(): void
  resume(): void
  clear(): Promise<void>
  getWaiting(): Promise<Task<T>[]>
  getActive(): Promise<Task<T>[]>
  getCompleted(): Promise<Task<T>[]>
  getFailed(): Promise<Task<T>[]>
}

// Rate Limiting Types
export interface RateLimit {
  limit: number
  window: number
  remaining: number
  reset: Date
}

export interface RateLimiter {
  check(key: string): Promise<RateLimit>
  consume(key: string, tokens?: number): Promise<RateLimit>
  reset(key: string): Promise<void>
}