// Stub for PDF.js in serverless environments
export const GlobalWorkerOptions = {
  workerSrc: '',
}

export const getDocument = () => {
  throw new Error('PDF processing not available in serverless environment')
}

export default {
  GlobalWorkerOptions,
  getDocument,
}
