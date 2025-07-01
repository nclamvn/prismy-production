import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyManager } from '@/lib/api/key-manager'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const supabase = createRouteHandlerClient({ cookies })
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

// Helper function to check organization access
async function hasOrgAccess(userId: string, organizationId: string, requiredRoles: string[] = ['owner', 'admin']): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return membership && requiredRoles.includes(membership.role)
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const apiKeyManager = ApiKeyManager.getInstance()

    switch (action) {
      case 'list':
        // List API keys for user or organization
        const organizationId = searchParams.get('organizationId')
        const includeInactive = searchParams.get('includeInactive') === 'true'

        // Verify organization access if specified
        if (organizationId) {
          const hasAccess = await hasOrgAccess(userId, organizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }

        const apiKeys = await apiKeyManager.listApiKeys(userId, organizationId, includeInactive)

        return NextResponse.json({
          success: true,
          apiKeys: apiKeys.map(key => ({
            ...key,
            secret: undefined // Never return the actual secret
          }))
        })

      case 'validate':
        // Validate an API key (for testing purposes)
        const keyToValidate = searchParams.get('key')
        const requiredPermissions = searchParams.get('permissions')?.split(',')

        if (!keyToValidate) {
          return NextResponse.json(
            { error: 'API key required for validation' },
            { status: 400 }
          )
        }

        const validation = await apiKeyManager.validateApiKey(keyToValidate, requiredPermissions)

        return NextResponse.json({
          success: true,
          validation: {
            isValid: validation.isValid,
            error: validation.error,
            rateLimitExceeded: validation.rateLimitExceeded,
            keyInfo: validation.apiKey ? {
              id: validation.apiKey.id,
              name: validation.apiKey.name,
              permissions: validation.apiKey.permissions,
              rateLimit: validation.apiKey.rateLimit,
              lastUsedAt: validation.apiKey.lastUsedAt,
              usageCount: validation.apiKey.usageCount
            } : undefined
          }
        })

      case 'usage':
        // Get usage statistics for an API key
        const keyId = searchParams.get('keyId')
        const days = parseInt(searchParams.get('days') || '30')

        if (!keyId) {
          return NextResponse.json(
            { error: 'API key ID required' },
            { status: 400 }
          )
        }

        // Verify user has access to this API key
        const apiKey = (await apiKeyManager.listApiKeys(userId)).find(k => k.id === keyId)
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key not found or access denied' },
            { status: 404 }
          )
        }

        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

        const usageStats = await apiKeyManager.getUsageStats(keyId, {
          start: startDate,
          end: endDate
        })

        return NextResponse.json({
          success: true,
          usage: usageStats
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('API keys GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const apiKeyManager = ApiKeyManager.getInstance()

    switch (action) {
      case 'create':
        // Create a new API key
        const {
          name,
          organizationId,
          permissions = {},
          rateLimit = 1000,
          expiresAt
        } = data

        if (!name) {
          return NextResponse.json(
            { error: 'API key name is required' },
            { status: 400 }
          )
        }

        // Verify organization access if specified
        if (organizationId) {
          const hasAccess = await hasOrgAccess(userId, organizationId)
          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Insufficient permissions to create organization API key' },
              { status: 403 }
            )
          }
        }

        const { apiKey, rawKey } = await apiKeyManager.generateApiKey({
          userId,
          organizationId,
          name,
          permissions,
          rateLimit,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        })

        return NextResponse.json({
          success: true,
          apiKey: {
            ...apiKey,
            secret: undefined // Don't include secret in response
          },
          key: rawKey, // Only returned once during creation
          message: 'API key created successfully. Save this key - it will not be shown again.'
        })

      case 'regenerate':
        // Regenerate an existing API key (creates new key, revokes old one)
        const { keyId } = data

        if (!keyId) {
          return NextResponse.json(
            { error: 'API key ID is required' },
            { status: 400 }
          )
        }

        // Get existing key to verify ownership and get details
        const existingKeys = await apiKeyManager.listApiKeys(userId)
        const existingKey = existingKeys.find(k => k.id === keyId)

        if (!existingKey) {
          return NextResponse.json(
            { error: 'API key not found or access denied' },
            { status: 404 }
          )
        }

        // Create new key with same settings
        const { apiKey: newApiKey, rawKey: newRawKey } = await apiKeyManager.generateApiKey({
          userId: existingKey.userId,
          organizationId: existingKey.organizationId,
          name: existingKey.name,
          permissions: existingKey.permissions,
          rateLimit: existingKey.rateLimit,
          expiresAt: existingKey.expiresAt
        })

        // Revoke old key
        await apiKeyManager.revokeApiKey(keyId, userId)

        return NextResponse.json({
          success: true,
          apiKey: {
            ...newApiKey,
            secret: undefined
          },
          key: newRawKey,
          message: 'API key regenerated successfully. The old key has been revoked.'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('API keys POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyId, ...updates } = body

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this API key
    const apiKeyManager = ApiKeyManager.getInstance()
    const userKeys = await apiKeyManager.listApiKeys(userId)
    const apiKey = userKeys.find(k => k.id === keyId)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    // Update the API key
    const success = await apiKeyManager.updateApiKey(keyId, updates, userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'API key updated successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to update API key' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('API keys PUT API error', { error })
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('keyId')

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this API key
    const apiKeyManager = ApiKeyManager.getInstance()
    const userKeys = await apiKeyManager.listApiKeys(userId)
    const apiKey = userKeys.find(k => k.id === keyId)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    // Revoke the API key
    const success = await apiKeyManager.revokeApiKey(keyId, userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'API key revoked successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('API keys DELETE API error', { error })
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}