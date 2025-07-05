// Fix 'self is not defined' error for server-side rendering
export function register() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
    (globalThis as any).self = globalThis;
  }
  
  if (typeof global !== 'undefined' && typeof (global as any).self === 'undefined') {
    (global as any).self = global;
  }
}