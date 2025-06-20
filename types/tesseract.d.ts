declare module 'tesseract.js' {
  export function createWorker(options?: any): Promise<any>
  
  export interface Worker {
    loadLanguage(language: string): Promise<void>
    initialize(language: string): Promise<void>
    recognize(image: any, options?: any): Promise<any>
    terminate(): Promise<void>
    setParameters(params: any): Promise<void>
  }

  export interface RecognizeResult {
    data: {
      text: string
      confidence: number
      words: any[]
      lines: any[]
      paragraphs: any[]
    }
  }
}