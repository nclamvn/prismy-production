/**
 * SHARED WORKSPACES API
 * Real-time collaborative workspace management endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { workspaceManager } from '@/lib/collaboration/workspace-manager'
import { getRateLimitForTier } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

// Create Workspace
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
    const { 
      name, 
      description, 
      type = 'general',
      settings = {}
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      )
    }

    logger.info(`Creating shared workspace`, {
      userId: session.user.id,
      name,
      type
    })

    // Create workspace
    const workspace = await workspaceManager.createWorkspace(
      session.user.id,
      name,
      description || '',
      type,
      settings
    )

    // Store workspace metadata in database
    await supabase
      .from('workspaces')
      .insert({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        type: workspace.type,
        owner_id: session.user.id,
        settings: workspace.settings,
        permissions: workspace.permissions,
        status: workspace.status,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        type: workspace.type,
        status: workspace.status,
        members: workspace.members.map(m => ({
          userId: m.userId,
          userName: m.userName,
          role: m.role,
          status: m.status,
          color: m.color
        })),
        settings: workspace.settings,
        createdAt: workspace.createdAt
      }
    })

  } catch (error) {
    logger.error('Failed to create shared workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}

// Get Workspace or List Workspaces
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
    const workspaceId = searchParams.get('id')
    const action = searchParams.get('action')

    if (workspaceId) {
      if (action === 'join') {
        // Join workspace
        const userName = searchParams.get('userName') || session.user.email?.split('@')[0] || 'Anonymous'
        const userEmail = session.user.email || ''
        const role = searchParams.get('role') as any || 'editor'

        const success = await workspaceManager.joinWorkspace(
          workspaceId,
          session.user.id,
          userName,
          userEmail,
          role
        )

        if (!success) {
          return NextResponse.json(
            { error: 'Workspace not found or access denied' },
            { status: 404 }
          )
        }

        const workspace = await workspaceManager.getWorkspace(workspaceId)
        
        return NextResponse.json({
          success: true,
          workspace
        })
      }

      if (action === 'leave') {
        // Leave workspace
        await workspaceManager.leaveWorkspace(workspaceId, session.user.id)
        
        return NextResponse.json({
          success: true,
          message: 'Left workspace successfully'
        })
      }

      if (action === 'stats') {
        // Get workspace statistics
        const stats = await workspaceManager.getWorkspaceStats(workspaceId)
        
        if (!stats) {
          return NextResponse.json(
            { error: 'Workspace not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({
          success: true,
          stats
        })
      }

      if (action === 'activities') {
        // Get workspace activities
        const workspace = await workspaceManager.getWorkspace(workspaceId)
        
        if (!workspace) {
          return NextResponse.json(
            { error: 'Workspace not found' },
            { status: 404 }
          )
        }

        const limit = parseInt(searchParams.get('limit') || '50')
        const activities = workspace.activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit)
        
        return NextResponse.json({
          success: true,
          activities
        })
      }

      // Get single workspace
      const workspace = await workspaceManager.getWorkspace(workspaceId)
      
      if (!workspace) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        workspace
      })
    }

    // List user's workspaces
    const userWorkspaces = await workspaceManager.getUserWorkspaces(session.user.id)

    return NextResponse.json({
      success: true,
      workspaces: userWorkspaces.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        type: w.type,
        status: w.status,
        memberCount: w.members.length,
        documentCount: w.documents.length,
        role: w.members.find(m => m.userId === session.user.id)?.role,
        lastActivity: w.activities[w.activities.length - 1]?.timestamp,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      }))
    })

  } catch (error) {
    logger.error('Failed to get shared workspace:', error)
    return NextResponse.json(
      { error: 'Failed to get workspace' },
      { status: 500 }
    )
  }
}

// Update Workspace
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
    const { workspaceId, action, ...data } = body

    if (!workspaceId || !action) {
      return NextResponse.json(
        { error: 'Workspace ID and action are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create_document':
        const { name, type, content, metadata } = data
        
        const document = await workspaceManager.createDocument(
          workspaceId,
          session.user.id,
          name,
          type,
          content || '',
          metadata || {}
        )
        
        if (!document) {
          return NextResponse.json(
            { error: 'Failed to create document or insufficient permissions' },
            { status: 403 }
          )
        }

        return NextResponse.json({
          success: true,
          document
        })

      case 'update_document':
        const { documentId, updates } = data
        
        const updateSuccess = await workspaceManager.updateDocument(
          workspaceId,
          documentId,
          session.user.id,
          updates
        )
        
        if (!updateSuccess) {
          return NextResponse.json(
            { error: 'Failed to update document or insufficient permissions' },
            { status: 403 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Document updated successfully'
        })

      case 'update_activity':
        const { activity } = data
        
        await workspaceManager.updateMemberActivity(
          workspaceId,
          session.user.id,
          activity
        )

        return NextResponse.json({
          success: true,
          message: 'Activity updated successfully'
        })

      case 'invite_member':
        const { email, role } = data
        
        const invitation = await workspaceManager.createInvitation(
          workspaceId,
          session.user.id,
          email,
          role || 'editor'
        )
        
        if (!invitation) {
          return NextResponse.json(
            { error: 'Failed to create invitation or insufficient permissions' },
            { status: 403 }
          )
        }

        // Store invitation in database
        await supabase
          .from('workspace_invitations')
          .insert({
            id: invitation.id,
            workspace_id: invitation.workspaceId,
            inviter_id: invitation.inviterUserId,
            invitee_email: invitation.inviteeEmail,
            role: invitation.role,
            token: invitation.token,
            expires_at: invitation.expiresAt.toISOString(),
            status: invitation.status,
            created_at: invitation.createdAt.toISOString()
          })

        return NextResponse.json({
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.inviteeEmail,
            role: invitation.role,
            expiresAt: invitation.expiresAt
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Failed to update shared workspace:', error)
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    )
  }
}

// Delete Workspace
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
    const workspaceId = searchParams.get('id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single()

    if (!workspace || workspace.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from database
    await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    // Note: In production, also clean up in-memory workspace and notify members

    return NextResponse.json({
      success: true,
      message: 'Workspace deleted successfully'
    })

  } catch (error) {
    logger.error('Failed to delete shared workspace:', error)
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    )
  }
}