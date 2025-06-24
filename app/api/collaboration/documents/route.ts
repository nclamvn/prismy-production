/**
 * COLLABORATION DOCUMENTS API
 * Real-time collaborative document editing endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { collaborativeEditor } from '@/lib/collaboration/collaborative-editor'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

// Create Document
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user tier for rate limiting
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', session.user.id)
      .single()

    const userTier = profile?.subscription_tier || 'free'

    // Apply rate limiting
    const rateLimitResult = await getRateLimitForTier(request, userTier as any)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { title, content = '', permissions = {} } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Document title is required' },
        { status: 400 }
      )
    }

    logger.info(`Creating collaborative document`, {
      userId: session.user.id,
      title
    })

    // Create document
    const document = await collaborativeEditor.createDocument(
      session.user.id,
      title,
      content,
      permissions
    )

    // Store document metadata in database
    await supabase
      .from('collaborative_documents')
      .insert({
        id: document.id,
        title: document.title,
        owner_id: session.user.id,
        version: document.version,
        permissions: document.permissions,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        version: document.version,
        permissions: document.permissions,
        collaborators: document.collaborators.map(c => ({
          userId: c.userId,
          userName: c.userName,
          role: c.role,
          status: c.status
        }))
      }
    })

  } catch (error) {
    logger.error('Failed to create collaborative document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

// Get Document or List Documents
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    const action = searchParams.get('action')

    if (documentId) {
      if (action === 'join') {
        // Join document
        const userName = searchParams.get('userName') || 'Anonymous User'
        const userEmail = session.user.email || ''

        const success = await collaborativeEditor.joinDocument(
          documentId,
          session.user.id,
          userName,
          userEmail
        )

        if (!success) {
          return NextResponse.json(
            { error: 'Document not found or access denied' },
            { status: 404 }
          )
        }

        const document = await collaborativeEditor.getDocument(documentId)
        
        return NextResponse.json({
          success: true,
          document: {
            id: document!.id,
            title: document!.title,
            content: document!.content,
            version: document!.version,
            permissions: document!.permissions,
            collaborators: document!.collaborators
          }
        })
      }

      if (action === 'leave') {
        // Leave document
        await collaborativeEditor.leaveDocument(documentId, session.user.id)
        
        return NextResponse.json({
          success: true,
          message: 'Left document successfully'
        })
      }

      if (action === 'history') {
        // Get document history
        const limit = parseInt(searchParams.get('limit') || '20')
        const history = await collaborativeEditor.getDocumentHistory(documentId, limit)
        
        return NextResponse.json({
          success: true,
          history
        })
      }

      if (action === 'stats') {
        // Get document statistics
        const stats = await collaborativeEditor.getDocumentStats(documentId)
        
        if (!stats) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({
          success: true,
          stats
        })
      }

      // Get single document
      const document = await collaborativeEditor.getDocument(documentId)
      
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          content: document.content,
          version: document.version,
          lastModified: document.lastModified,
          permissions: document.permissions,
          collaborators: document.collaborators
        }
      })
    }

    // List user's documents
    const { data: documents } = await supabase
      .from('collaborative_documents')
      .select('*')
      .or(`owner_id.eq.${session.user.id},collaborators.cs.{"${session.user.id}"}`)
      .order('updated_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      success: true,
      documents: documents || []
    })

  } catch (error) {
    logger.error('Failed to get collaborative document:', error)
    return NextResponse.json(
      { error: 'Failed to get document' },
      { status: 500 }
    )
  }
}

// Update Document
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { documentId, action, ...data } = body

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'Document ID and action are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'apply_changes':
        const { operations, version } = data
        const changes = {
          documentId,
          operations,
          version,
          userId: session.user.id,
          timestamp: Date.now()
        }

        const success = await collaborativeEditor.applyChanges(documentId, changes)
        
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to apply changes, possible conflict' },
            { status: 409 }
          )
        }

        const updatedDocument = await collaborativeEditor.getDocument(documentId)
        
        return NextResponse.json({
          success: true,
          document: {
            version: updatedDocument!.version,
            content: updatedDocument!.content
          }
        })

      case 'update_cursor':
        const { cursor } = data
        await collaborativeEditor.updateCursor(documentId, session.user.id, cursor)
        
        return NextResponse.json({
          success: true,
          message: 'Cursor updated'
        })

      case 'update_selection':
        const { selection } = data
        await collaborativeEditor.updateSelection(documentId, session.user.id, selection)
        
        return NextResponse.json({
          success: true,
          message: 'Selection updated'
        })

      case 'update_permissions':
        const { targetUserId, role } = data
        const permissionSuccess = await collaborativeEditor.updatePermissions(
          documentId,
          session.user.id,
          targetUserId,
          role
        )
        
        if (!permissionSuccess) {
          return NextResponse.json(
            { error: 'Permission denied or invalid request' },
            { status: 403 }
          )
        }
        
        return NextResponse.json({
          success: true,
          message: 'Permissions updated'
        })

      case 'revert_version':
        const { targetVersion } = data
        const revertSuccess = await collaborativeEditor.revertToVersion(
          documentId,
          session.user.id,
          targetVersion
        )
        
        if (!revertSuccess) {
          return NextResponse.json(
            { error: 'Failed to revert document' },
            { status: 400 }
          )
        }
        
        return NextResponse.json({
          success: true,
          message: 'Document reverted successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Failed to update collaborative document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// Delete Document
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the document
    const { data: document } = await supabase
      .from('collaborative_documents')
      .select('owner_id')
      .eq('id', documentId)
      .single()

    if (!document || document.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from database
    await supabase
      .from('collaborative_documents')
      .delete()
      .eq('id', documentId)

    // Note: In a production system, you'd also clean up the document from memory
    // and notify all active collaborators

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    logger.error('Failed to delete collaborative document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}