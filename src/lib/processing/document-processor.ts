import { createSupabaseClient } from '@/lib/supabase/server'
import { performOCR } from '@/lib/ocr/ocr-service'
import { translateText } from '@/lib/translation/translation-service'
import { rebuildDocument } from '@/lib/document/document-rebuilder'

export async function processDocument(documentId: string) {
  const supabase = createSupabaseClient()
  
  try {
    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()
    
    if (docError || !doc) {
      throw new Error('Document not found')
    }
    
    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)
    
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path)
    
    if (downloadError) {
      throw new Error('Failed to download file')
    }
    
    // Step 1: OCR
    await supabase
      .from('documents')
      .update({ status: 'ocr_processing' })
      .eq('id', documentId)
    
    const ocrResult = await performOCR(fileData, doc.file_type)
    
    // Step 2: Translation
    await supabase
      .from('documents')
      .update({ 
        status: 'translation_processing',
        extracted_text: ocrResult.text,
        detected_language: ocrResult.detectedLanguage
      })
      .eq('id', documentId)
    
    const translatedText = await translateText(
      ocrResult.text,
      ocrResult.detectedLanguage,
      doc.target_language
    )
    
    // Step 3: Rebuild document
    await supabase
      .from('documents')
      .update({ 
        status: 'rebuilding',
        translated_text: translatedText
      })
      .eq('id', documentId)
    
    const rebuiltDocument = await rebuildDocument(
      translatedText,
      doc.file_type,
      ocrResult.layout
    )
    
    // Upload rebuilt document
    const outputFileName = `translated-${doc.filename}`
    const { data: outputUpload, error: outputError } = await supabase.storage
      .from('documents')
      .upload(`output/${outputFileName}`, rebuiltDocument, {
        contentType: doc.file_type,
        upsert: true
      })
    
    if (outputError) {
      throw new Error('Failed to upload translated document')
    }
    
    // Update final status
    await supabase
      .from('documents')
      .update({ 
        status: 'completed',
        output_file_path: outputUpload.path,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
  } catch (error) {
    console.error('Processing error:', error)
    
    // Update status to failed
    await supabase
      .from('documents')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', documentId)
  }
}