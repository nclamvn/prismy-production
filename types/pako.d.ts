declare module 'pako' {
  export function deflate(data: string | Uint8Array, options?: any): Uint8Array
  export function inflate(data: Uint8Array): Uint8Array
}