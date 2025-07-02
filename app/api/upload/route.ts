import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

export async function POST(request: NextRequest) {
  try {
    console.group('🔍 [SERVER] Upload Request Pipeline Start')
    const requestStartTime = performance.now()

    // PHASE 2: Server-side request arrival trace
    console.log('[SERVER] Request arrived:', {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
    })

    // Check required environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('[SERVER] Environment check:', {
      hasUrl,
      hasServiceKey,
      hasAnonKey,
    })
    console.log('[SERVER] Runtime environment:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      runtime: 'edge',
      memoryUsage: process.memoryUsage
        ? process.memoryUsage()
        : 'N/A (Edge Runtime)',
    })

    if (!hasUrl || !hasServiceKey) {
      console.error('[upload] Missing required environment variables:', {
        hasUrl,
        hasServiceKey,
      })
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: { hasUrl, hasServiceKey, hasAnonKey },
        },
        { status: 500 }
      )
    }

    console.log('[upload] Creating simple Supabase client (bypassing SSR)')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log('[upload] Supabase client created successfully')

    // PHASE 2: Session handling and cookie trace
    console.log('[SERVER] Processing session and cookies...')
    const cookies = request.cookies
    const existingSessionId = cookies.get('session_id')?.value
    const sessionId = existingSessionId || uuidv4()

    console.log('[SERVER] Session handling:', {
      hasExistingSession: !!existingSessionId,
      sessionId: sessionId,
      isNewSession: !existingSessionId,
      allCookies: Array.from(cookies.entries()).map(([name, cookie]) => ({
        name,
        value:
          cookie.value?.substring(0, 50) +
          (cookie.value?.length > 50 ? '...' : ''),
        hasValue: !!cookie.value,
      })),
    })

    // PHASE 2: FormData parsing with detailed tracing
    console.log('[SERVER] Starting FormData parsing...')
    const formDataParseStart = performance.now()

    let formData
    let formDataError = null

    try {
      formData = await request.formData()
      const formDataParseEnd = performance.now()
      console.log('[SERVER] FormData parsed successfully:', {
        parseTime: `${(formDataParseEnd - formDataParseStart).toFixed(2)}ms`,
        entryCount: Array.from(formData.entries()).length,
      })

      // Log all FormData entries
      console.log('[SERVER] FormData entries:')
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
          )
        } else {
          console.log(
            `  ${key}: ${typeof value}(${String(value).substring(0, 100)})`
          )
        }
      }
    } catch (parseError) {
      const formDataParseEnd = performance.now()
      formDataError = parseError
      console.error('[SERVER] FormData parsing failed:', {
        error:
          parseError instanceof Error ? parseError.message : 'Unknown error',
        parseTime: `${(formDataParseEnd - formDataParseStart).toFixed(2)}ms`,
        stack: parseError instanceof Error ? parseError.stack : undefined,
      })
    }

    if (formDataError) {
      console.error('[SERVER] Returning FormData parse error')
      console.groupEnd()
      return NextResponse.json(
        {
          error: 'Failed to parse form data',
          details:
            formDataError instanceof Error
              ? formDataError.message
              : 'Unknown parse error',
          code: 'FORMDATA_PARSE_ERROR',
        },
        { status: 400 }
      )
    }

    // Extract and validate file
    const file = formData!.get('file') as File

    console.log('[SERVER] File extraction and validation:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      fileLastModified: file?.lastModified
        ? new Date(file.lastModified).toISOString()
        : undefined,
      constructor: file?.constructor?.name,
    })

    if (!file) {
      console.error('[upload] No file provided in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 413 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PDF, DOCX, TXT, MD, PPTX' },
        { status: 422 }
      )
    }

    // Generate unique filename and storage path
    const jobId = uuidv4()
    const fileExtension = file.name.split('.').pop()
    const storagePath = `uploads/${sessionId}/${jobId}.${fileExtension}`

    // TEMPORARY: Skip storage upload for debugging
    console.log('[upload] SKIPPING STORAGE UPLOAD FOR DEBUGGING')
    console.log('[upload] Would upload to path:', storagePath)

    // Estimate page count (rough approximation)
    const estimatedPages = Math.max(1, Math.ceil(file.size / (1024 * 2))) // ~2KB per page average

    // PHASE 3: Database operation deep trace with pre-insert validation
    console.log('[SERVER] Starting database operations...')
    const dbOperationStart = performance.now()

    // Pre-insert validation and data preparation
    const insertData = {
      id: jobId,
      user_id: null, // Anonymous upload - no user_id
      session_id: sessionId, // Use session_id for anonymous users
      filename: jobId,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: `mock://${storagePath}`, // Mock path for debugging
      pages: estimatedPages,
      status: 'queued' as const,
      progress: 0,
    }

    console.log('[SERVER] Pre-insert validation:', {
      dataSize: JSON.stringify(insertData).length,
      requiredFields: {
        id: !!insertData.id,
        session_id: !!insertData.session_id,
        filename: !!insertData.filename,
        original_name: !!insertData.original_name,
        file_size: typeof insertData.file_size === 'number',
        mime_type: !!insertData.mime_type,
        storage_path: !!insertData.storage_path,
        status: !!insertData.status,
      },
      insertData: insertData,
    })

    // Database connection and table verification
    console.log('[SERVER] Testing database connection...')
    let connectionTest = null
    let connectionError = null

    try {
      const { data: testData, error: testError } = await supabase
        .from('translation_jobs')
        .select('count', { count: 'exact', head: true })

      connectionTest = testData
      connectionError = testError

      console.log('[SERVER] Database connection test:', {
        success: !testError,
        error: testError?.message,
        canAccessTable: !testError,
      })
    } catch (connErr) {
      connectionError = connErr
      console.error('[SERVER] Database connection failed:', {
        error: connErr instanceof Error ? connErr.message : 'Unknown error',
        stack: connErr instanceof Error ? connErr.stack : undefined,
      })
    }

    if (connectionError) {
      console.error('[SERVER] Database connection error, aborting insert')
      console.groupEnd()
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details:
            connectionError instanceof Error
              ? connectionError.message
              : 'Unknown connection error',
          code: 'DATABASE_CONNECTION_ERROR',
        },
        { status: 500 }
      )
    }

    // Actual database insert with comprehensive tracing
    console.log('[SERVER] Executing database insert...')
    const insertStart = performance.now()

    let jobData = null
    let jobError = null

    try {
      const result = await supabase
        .from('translation_jobs')
        .insert(insertData)
        .select()
        .single()

      const insertEnd = performance.now()
      const insertTime = insertEnd - insertStart

      jobData = result.data
      jobError = result.error

      console.log('[SERVER] Database insert completed:', {
        success: !jobError,
        jobId: jobData?.id,
        hasData: !!jobData,
        insertTime: `${insertTime.toFixed(2)}ms`,
        returnedFields: jobData ? Object.keys(jobData) : [],
      })

      if (jobError) {
        console.error('[SERVER] Database insert error details:', {
          message: jobError.message,
          details: jobError.details,
          hint: jobError.hint,
          code: jobError.code,
          fullError: JSON.stringify(jobError, null, 2),
        })
      } else {
        console.log('[SERVER] Database insert successful:', {
          jobId: jobData?.id,
          createdAt: jobData?.created_at,
          status: jobData?.status,
        })
      }
    } catch (dbErr) {
      const insertEnd = performance.now()
      const insertTime = insertEnd - insertStart

      console.error('[SERVER] Database operation exception:', {
        error: dbErr instanceof Error ? dbErr.message : 'Unknown error',
        stack: dbErr instanceof Error ? dbErr.stack : undefined,
        insertTime: `${insertTime.toFixed(2)}ms`,
        type: dbErr instanceof Error ? dbErr.constructor.name : typeof dbErr,
      })
      jobError = dbErr
      jobData = null
    }

    const dbOperationEnd = performance.now()
    const totalDbTime = dbOperationEnd - dbOperationStart

    console.log('[SERVER] Database operation summary:', {
      totalTime: `${totalDbTime.toFixed(2)}ms`,
      success: !jobError,
      hasResult: !!jobData,
    })

    if (jobError) {
      console.error('[upload] Database insert failed, returning error response')
      return NextResponse.json(
        {
          error: 'Failed to create translation job',
          details: jobError.message || 'Database error',
          code: jobError.code || 'DATABASE_ERROR',
          hint: jobError.hint || null,
          supabaseError: jobError.details || null,
          insertData: insertData, // Include attempted data for debugging
          environment: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            nodeEnv: process.env.NODE_ENV,
          },
        },
        { status: 500 }
      )
    }

    console.log('[upload] Job created successfully:', jobId)

    // PHASE 4: Response pipeline and success trace
    console.log('[SERVER] Creating success response...')
    const requestEndTime = performance.now()
    const totalRequestTime = requestEndTime - requestStartTime

    const response = NextResponse.json({
      jobId,
      originalName: file.name,
      size: file.size,
      status: 'queued',
    })

    // Set session cookie for anonymous users (always set since we're doing anonymous uploads)
    console.log('[SERVER] Setting session cookie for anonymous user')
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    console.log('[SERVER] Upload request completed successfully:', {
      jobId,
      fileName: file.name,
      fileSize: file.size,
      totalProcessingTime: `${totalRequestTime.toFixed(2)}ms`,
      sessionId: sessionId,
      isNewSession: !existingSessionId,
    })

    console.groupEnd()
    return response
  } catch (error) {
    console.error('[SERVER] Critical pipeline error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
    })

    console.groupEnd() // End server pipeline group

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
