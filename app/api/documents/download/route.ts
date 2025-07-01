import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { DocumentProcessor } from '@/lib/document-processor'
import { cookies } from 'next/headers'

interface DownloadRequest {
  documentId: string
  format?: 'txt' | 'docx' | 'xlsx' | 'pdf' | 'original'
  quality?: 'standard' | 'high'
  includeMetadata?: boolean
}

/**
 * Download translated documents in various formats
 * Supports TXT, DOCX, XLSX, and PDF outputs
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: DownloadRequest = await request.json()
    const {
      documentId,
      format = 'original',
      quality = 'standard',
      includeMetadata = false,
    } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', session.user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Get translation results
    const { data: translations, error: translationError } = await supabase
      .from('translations')
      .select('*')
      .eq('document_id', documentId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (translationError || !translations || translations.length === 0) {
      return NextResponse.json(
        { error: 'No completed translation found for this document' },
        { status: 404 }
      )
    }

    const translation = translations[0]

    // Determine output format
    const outputFormat = format === 'original' ? document.file_type : format

    // Generate the output file
    const outputBlob = await generateOutput(
      document,
      translation,
      outputFormat,
      quality,
      includeMetadata
    )

    // Generate filename
    const baseFileName = document.original_filename.replace(/\.[^/.]+$/, '')
    const targetLang = translation.target_language
    const fileExtension = getFileExtension(outputFormat)
    const fileName = `${baseFileName}_translated_${targetLang}.${fileExtension}`

    // Return file as download
    const headers = new Headers()
    headers.set('Content-Type', getContentType(outputFormat))
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(outputBlob, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      {
        error: 'Download failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate output file in specified format
 */
async function generateOutput(
  document: any,
  translation: any,
  format: string,
  quality: string,
  includeMetadata: boolean
): Promise<Blob> {
  const translatedText =
    translation.translated_text || translation.result?.translatedText || ''

  switch (format) {
    case 'txt':
      return generateTextOutput(
        translatedText,
        document,
        translation,
        includeMetadata
      )

    case 'docx':
      return generateDocxOutput(translatedText, document, translation, quality)

    case 'xlsx':
      return generateExcelOutput(translatedText, document, translation)

    case 'pdf':
      return generatePdfOutput(translatedText, document, translation, quality)

    default:
      // Default to text
      return generateTextOutput(
        translatedText,
        document,
        translation,
        includeMetadata
      )
  }
}

/**
 * Generate plain text output
 */
function generateTextOutput(
  translatedText: string,
  document: any,
  translation: any,
  includeMetadata: boolean
): Blob {
  let content = translatedText

  if (includeMetadata) {
    const metadata = `
=== TRANSLATION METADATA ===
Original File: ${document.original_filename}
Source Language: ${translation.source_language || 'auto-detect'}
Target Language: ${translation.target_language}
Translation Date: ${new Date(translation.created_at).toLocaleString()}
Quality Score: ${translation.quality_score || 'N/A'}
Word Count: ${translatedText.split(/\s+/).length}
Character Count: ${translatedText.length}

=== TRANSLATED CONTENT ===
${translatedText}
`
    content = metadata
  }

  return new Blob([content], { type: 'text/plain;charset=utf-8' })
}

/**
 * Generate DOCX output
 */
async function generateDocxOutput(
  translatedText: string,
  document: any,
  translation: any,
  quality: string
): Promise<Blob> {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
      'docx'
    )

    const children = []

    // Add title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Translation: ${document.original_filename}`,
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.TITLE,
      })
    )

    // Add metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Translated from ${translation.source_language || 'auto-detect'} to ${translation.target_language}`,
            italics: true,
          }),
        ],
      })
    )

    children.push(new Paragraph({ text: '' })) // Empty line

    // Add translated content - split by paragraphs
    const paragraphs = translatedText.split('\n').filter(p => p.trim())

    paragraphs.forEach(paragraphText => {
      if (paragraphText.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun(paragraphText)],
          })
        )
      }
    })

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  } catch (error) {
    console.error('DOCX generation failed:', error)
    // Fallback to text
    return generateTextOutput(translatedText, document, translation, true)
  }
}

/**
 * Generate Excel output
 */
async function generateExcelOutput(
  translatedText: string,
  document: any,
  translation: any
): Promise<Blob> {
  try {
    const ExcelJS = await import('exceljs')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Translation')

    // Create metadata section
    worksheet.addRow(['Translation Information'])
    worksheet.addRow(['Original File', document.original_filename])
    worksheet.addRow(['Source Language', translation.source_language || 'auto-detect'])
    worksheet.addRow(['Target Language', translation.target_language])
    worksheet.addRow(['Translation Date', new Date(translation.created_at).toLocaleString()])
    worksheet.addRow(['Quality Score', translation.quality_score || 'N/A'])
    worksheet.addRow(['Word Count', translatedText.split(/\s+/).length])
    worksheet.addRow(['Character Count', translatedText.length])
    worksheet.addRow([])
    worksheet.addRow(['Translated Content:'])

    // Add translated content (split by lines)
    const contentLines = translatedText.split('\n')
    contentLines.forEach(line => {
      worksheet.addRow([line])
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  } catch (error) {
    console.error('Excel generation failed:', error)
    // Fallback to text
    return generateTextOutput(translatedText, document, translation, true)
  }
}

/**
 * Generate PDF output (placeholder)
 */
async function generatePdfOutput(
  translatedText: string,
  document: any,
  translation: any,
  quality: string
): Promise<Blob> {
  // For now, return as text. In production, use jsPDF or puppeteer
  console.log('PDF generation not implemented, returning text format')
  return generateTextOutput(translatedText, document, translation, true)
}

/**
 * Get file extension for format
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'docx':
      return 'docx'
    case 'xlsx':
      return 'xlsx'
    case 'pdf':
      return 'pdf'
    case 'txt':
    default:
      return 'txt'
  }
}

/**
 * Get content type for format
 */
function getContentType(format: string): string {
  switch (format) {
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'pdf':
      return 'application/pdf'
    case 'txt':
    default:
      return 'text/plain;charset=utf-8'
  }
}

/**
 * Get download status for a document
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if document exists and has completed translation
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(
        `
        id,
        original_filename,
        file_type,
        translations!inner(
          id,
          status,
          target_language,
          created_at,
          quality_score
        )
      `
      )
      .eq('id', documentId)
      .eq('user_id', session.user.id)
      .eq('translations.status', 'completed')
      .single()

    if (docError || !document) {
      return NextResponse.json({
        available: false,
        reason: 'Document not found or no completed translation',
      })
    }

    return NextResponse.json({
      available: true,
      document: {
        id: document.id,
        filename: document.original_filename,
        fileType: document.file_type,
      },
      translations: document.translations,
      supportedFormats: ['txt', 'docx', 'xlsx', 'original'],
    })
  } catch (error) {
    console.error('Download status check error:', error)
    return NextResponse.json(
      {
        available: false,
        reason: 'Status check failed',
      },
      { status: 500 }
    )
  }
}
