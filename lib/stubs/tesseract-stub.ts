// Stub for Tesseract.js in serverless environments
export const createWorker = () => {
  throw new Error('OCR not available in serverless environment')
}

export default {
  createWorker
}