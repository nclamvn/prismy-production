// Stub for Tesseract.js in serverless environments
export const createWorker = () => {
  throw new Error(
    'Tesseract.js OCR not available in serverless environment. Use Google Vision API instead.'
  )
}

export const PSM = {
  OSD_ONLY: 0,
  AUTO_OSD: 1,
  AUTO_ONLY: 2,
  AUTO: 3,
  SINGLE_COLUMN: 4,
  SINGLE_BLOCK_VERT_TEXT: 5,
  SINGLE_BLOCK: 6,
  SINGLE_LINE: 7,
  SINGLE_WORD: 8,
  CIRCLE_WORD: 9,
  SINGLE_CHAR: 10,
  SPARSE_TEXT: 11,
  SPARSE_TEXT_OSD: 12,
  RAW_LINE: 13,
}

export const OEM = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3,
}

export default {
  createWorker,
  PSM,
  OEM,
}
