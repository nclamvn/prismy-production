declare module 'mammoth' {
  export function extractRawText(buffer: Buffer, options?: any): Promise<{ value: string; messages: any[] }>
  export function convertToHtml(buffer: Buffer, options?: any): Promise<{ value: string; messages: any[] }>
  export function extractImages(buffer: Buffer): Promise<{ value: any[] }>
}