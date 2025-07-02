declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string
    IsAcroFormPresent?: boolean
    IsXFAPresent?: boolean
    [key: string]: any
  }

  interface PDFMetadata {
    _metadata?: {
      [key: string]: any
    }
    [key: string]: any
  }

  interface PDFPage {
    pageNumber: number
    [key: string]: any
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata: PDFMetadata
    version: string
    text: string
  }

  interface PDFOptions {
    pagerender?: (pageData: PDFPage) => string
    max?: number
    version?: string
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>

  export = pdfParse
}
