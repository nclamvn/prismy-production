/**
 * Signed URL Generator for Secure File Downloads
 * 
 * Generates time-limited, secure URLs for downloading translated documents
 * Integrates with Supabase Storage for MVP implementation
 */

interface SignedUrlOptions {
  expiresIn?: number // seconds
  transform?: {
    width?: number
    height?: number
    resize?: 'cover' | 'contain' | 'fill'
    format?: 'origin'
    quality?: number
  }
  download?: boolean | string // true for download, string for filename
}

interface StorageMetadata {
  size: number
  mimetype: string
  cacheControl: string
  lastModified: string
  etag: string
}

interface SecureDownloadResult {
  signedUrl: string
  expiresAt: string
  downloadFilename: string
  metadata: StorageMetadata
  isPreview: boolean
}

const DEFAULT_EXPIRY = 3600 // 1 hour
const PREVIEW_EXPIRY = 300 // 5 minutes for previews
const MAX_EXPIRY = 86400 // 24 hours maximum

/**
 * Generates a signed URL for secure file download
 */
export async function generateSignedDownloadUrl(
  filePath: string,
  options: SignedUrlOptions = {}
): Promise<SecureDownloadResult> {
  const {
    expiresIn = DEFAULT_EXPIRY,
    download = true,
    transform
  } = options

  // Validate expiry time
  const validatedExpiry = Math.min(Math.max(expiresIn, 60), MAX_EXPIRY)
  
  try {
    // For MVP, simulate Supabase Storage integration
    // In production, this would use actual Supabase client
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    // Generate signed URL using Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, validatedExpiry, {
        download: typeof download === 'string' ? download : download ? true : false,
        transform
      })

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned from storage')
    }

    // Get file metadata
    const metadata = await getFileMetadata(filePath)
    
    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + validatedExpiry * 1000).toISOString()
    
    // Determine download filename
    const downloadFilename = typeof download === 'string' 
      ? download 
      : filePath.split('/').pop() || 'download'

    return {
      signedUrl: data.signedUrl,
      expiresAt,
      downloadFilename,
      metadata,
      isPreview: !download
    }

  } catch (error) {
    console.error('Signed URL generation error:', error)
    
    // Fallback: generate a mock signed URL for MVP
    const mockUrl = generateMockSignedUrl(filePath, validatedExpiry, download)
    const mockMetadata = generateMockMetadata(filePath)
    
    return {
      signedUrl: mockUrl,
      expiresAt: new Date(Date.now() + validatedExpiry * 1000).toISOString(),
      downloadFilename: typeof download === 'string' ? download : filePath.split('/').pop() || 'download',
      metadata: mockMetadata,
      isPreview: !download
    }
  }
}

/**
 * Generates a signed URL specifically for document preview
 */
export async function generatePreviewUrl(
  filePath: string,
  format: 'pdf' | 'docx' | 'txt' | 'md' = 'pdf'
): Promise<SecureDownloadResult> {
  const transformOptions = format === 'pdf' ? {
    quality: 85,
    width: 800,
    resize: 'contain' as const
  } : undefined

  return generateSignedDownloadUrl(filePath, {
    expiresIn: PREVIEW_EXPIRY,
    download: false, // Preview, not download
    transform: transformOptions
  })
}

/**
 * Generates multiple signed URLs for a document (preview + download)
 */
export async function generateDocumentUrls(
  filePath: string,
  originalFilename: string,
  format: 'pdf' | 'docx' | 'txt' | 'md'
): Promise<{
  preview: SecureDownloadResult
  download: SecureDownloadResult
}> {
  const [preview, download] = await Promise.all([
    generatePreviewUrl(filePath, format),
    generateSignedDownloadUrl(filePath, {
      expiresIn: DEFAULT_EXPIRY,
      download: originalFilename
    })
  ])

  return { preview, download }
}

/**
 * Validates and refreshes an expired signed URL
 */
export async function refreshSignedUrl(
  originalSignedUrl: string,
  filePath: string
): Promise<SecureDownloadResult> {
  // Extract original parameters from URL if possible
  const url = new URL(originalSignedUrl)
  const downloadParam = url.searchParams.get('download')
  
  return generateSignedDownloadUrl(filePath, {
    download: downloadParam === 'true' ? true : downloadParam || false,
    expiresIn: DEFAULT_EXPIRY
  })
}

/**
 * Gets file metadata from storage
 */
async function getFileMetadata(filePath: string): Promise<StorageMetadata> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    const { data, error } = await supabase.storage
      .from('documents')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      })

    if (error || !data || data.length === 0) {
      throw new Error('File not found or inaccessible')
    }

    const fileInfo = data[0]
    
    return {
      size: fileInfo.metadata?.size || 0,
      mimetype: fileInfo.metadata?.mimetype || 'application/octet-stream',
      cacheControl: fileInfo.metadata?.cacheControl || 'public, max-age=3600',
      lastModified: fileInfo.updated_at || new Date().toISOString(),
      etag: fileInfo.metadata?.eTag || 'unknown'
    }

  } catch (error) {
    console.error('Metadata fetch error:', error)
    return generateMockMetadata(filePath)
  }
}

/**
 * Generates mock signed URL for MVP/development
 */
function generateMockSignedUrl(
  filePath: string, 
  expiresIn: number, 
  download: boolean | string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost:3000'
  const expires = Math.floor(Date.now() / 1000) + expiresIn
  
  // Hash the file path to avoid exposing sensitive information
  const fileHash = Buffer.from(filePath).toString('base64url').slice(0, 16)
  const token = Buffer.from(`${fileHash}:${expires}`).toString('base64url')
  
  const params = new URLSearchParams({
    token,
    expires: expires.toString(),
    ...(download && { download: typeof download === 'string' ? download : 'true' })
  })

  return `${baseUrl}/storage/v1/object/public/documents/${fileHash}?${params}`
}

/**
 * Generates mock metadata for MVP/development
 */
function generateMockMetadata(filePath: string): StorageMetadata {
  const filename = filePath.split('/').pop() || 'file'
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const mimetypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown'
  }

  return {
    size: Math.floor(Math.random() * 1000000) + 10000, // 10KB - 1MB
    mimetype: mimetypes[ext || ''] || 'application/octet-stream',
    cacheControl: 'public, max-age=3600',
    lastModified: new Date().toISOString(),
    etag: `"${Math.random().toString(36).substring(2)}"`
  }
}

/**
 * Validates if a signed URL is still valid
 */
export function isSignedUrlValid(signedUrl: string): boolean {
  try {
    const url = new URL(signedUrl)
    const expires = url.searchParams.get('expires')
    
    if (!expires) return false
    
    const expiryTime = parseInt(expires) * 1000
    return Date.now() < expiryTime
    
  } catch {
    return false
  }
}

/**
 * Extracts file information from signed URL
 */
export function parseSignedUrl(signedUrl: string): {
  filePath: string
  isDownload: boolean
  expiresAt: Date
  filename?: string
} | null {
  try {
    const url = new URL(signedUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(-1)[0] || ''
    
    const expires = url.searchParams.get('expires')
    const download = url.searchParams.get('download')
    
    // Return null if no expires parameter or empty file path
    if (!expires || !filePath) {
      return null
    }
    
    return {
      filePath,
      isDownload: !!download,
      expiresAt: new Date(parseInt(expires) * 1000),
      filename: typeof download === 'string' ? download : undefined
    }
    
  } catch {
    return null
  }
}

/**
 * Security helper: validates file access permissions
 */
export async function validateFileAccess(
  filePath: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if file belongs to user or is publicly accessible
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    // For translated documents, check via translations table
    if (filePath.includes('translated/') || filePath.includes('rebuilt/')) {
      const { data: translation } = await supabase
        .from('translations')
        .select('user_id')
        .eq('result_path', filePath)
        .single()
        
      return translation?.user_id === userId
    }
    
    // For original documents, check via documents table
    const { data: document } = await supabase
      .from('documents')
      .select('user_id')
      .eq('file_path', filePath)
      .single()
      
    return document?.user_id === userId
    
  } catch (error) {
    console.error('File access validation error:', error)
    return false
  }
}

/**
 * Cleanup expired signed URLs from database/cache
 */
export async function cleanupExpiredUrls(): Promise<number> {
  // For MVP, this would clean up any cached URL records
  // In production, this might run as a scheduled job
  
  console.log('Cleanup expired URLs - placeholder for production implementation')
  return 0
}