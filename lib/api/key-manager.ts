/**
 * API Key Management System
 * Secure API key generation, validation, and management
 */

import { createHash, randomBytes } from 'crypto'
import { supabase } from '@/lib/supabase'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

export interface ApiKey {
  id: string
  userId: string
  organizationId?: string
  name: string
  keyPrefix: string
  permissions: Record<string, any>
  rateLimit: number
  lastUsedAt?: Date
  usageCount: number
  isActive: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ApiKeyCreateParams {
  userId: string
  organizationId?: string
  name: string
  permissions: Record<string, any>
  rateLimit?: number
  expiresAt?: Date
}

export interface ApiKeyValidation {
  isValid: boolean
  apiKey?: ApiKey
  error?: string
  rateLimitExceeded?: boolean
}

export class ApiKeyManager {
  private static instance: ApiKeyManager

  private constructor() {}

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager()
    }
    return ApiKeyManager.instance
  }

  /**
   * Generate a new API key
   */
  async generateApiKey(params: ApiKeyCreateParams): Promise<{
    apiKey: ApiKey
    rawKey: string
  }> {
    try {
      // Generate secure random key
      const keyBytes = randomBytes(32)
      const rawKey = `pk_${keyBytes.toString('hex')}`
      const keyPrefix = rawKey.slice(0, 12) // First 12 characters for identification
      const keyHash = this.hashApiKey(rawKey)

      // Create API key record
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: params.userId,
          organization_id: params.organizationId,
          name: params.name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: params.permissions,
          rate_limit: params.rateLimit || 1000,
          expires_at: params.expiresAt?.toISOString(),
          is_active: true,
          usage_count: 0
        })
        .select()
        .single()

      if (error) throw error

      const apiKey: ApiKey = {
        id: data.id,
        userId: data.user_id,
        organizationId: data.organization_id,
        name: data.name,
        keyPrefix: data.key_prefix,
        permissions: data.permissions,
        rateLimit: data.rate_limit,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
        usageCount: data.usage_count,
        isActive: data.is_active,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      // Log API key creation
      await auditLogger.logEvent({
        userId: params.userId,
        operation: 'api_key_created',
        resourceType: 'api_key',
        resourceId: apiKey.id,
        organizationId: params.organizationId,
        metadata: {
          keyName: params.name,
          keyPrefix: keyPrefix,
          permissions: params.permissions,
          rateLimit: params.rateLimit || 1000
        },
        severity: 'medium',
        outcome: 'success'
      })

      logger.info('API key generated', { 
        keyId: apiKey.id, 
        userId: params.userId,
        organizationId: params.organizationId,
        name: params.name 
      })

      return { apiKey, rawKey }

    } catch (error) {
      logger.error('Failed to generate API key', { error, params })
      throw new Error('Failed to generate API key')
    }
  }

  /**
   * Validate an API key
   */
  async validateApiKey(rawKey: string, requiredPermissions?: string[]): Promise<ApiKeyValidation> {
    try {
      if (!rawKey || !rawKey.startsWith('pk_')) {
        return { isValid: false, error: 'Invalid API key format' }
      }

      const keyHash = this.hashApiKey(rawKey)
      const keyPrefix = rawKey.slice(0, 12)

      // Get API key from database
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('key_prefix', keyPrefix)
        .single()

      if (error || !data) {
        await this.logInvalidKeyAttempt(rawKey)
        return { isValid: false, error: 'API key not found' }
      }

      const apiKey: ApiKey = {
        id: data.id,
        userId: data.user_id,
        organizationId: data.organization_id,
        name: data.name,
        keyPrefix: data.key_prefix,
        permissions: data.permissions,
        rateLimit: data.rate_limit,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
        usageCount: data.usage_count,
        isActive: data.is_active,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      // Check if key is active
      if (!apiKey.isActive) {
        return { isValid: false, error: 'API key is disabled' }
      }

      // Check if key is expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { isValid: false, error: 'API key has expired' }
      }

      // Check rate limiting
      const rateLimitExceeded = await this.checkRateLimit(apiKey)
      if (rateLimitExceeded) {
        return { 
          isValid: false, 
          error: 'Rate limit exceeded',
          rateLimitExceeded: true 
        }
      }

      // Check permissions
      if (requiredPermissions && !this.hasPermissions(apiKey, requiredPermissions)) {
        return { isValid: false, error: 'Insufficient permissions' }
      }

      // Update usage statistics
      await this.updateUsageStats(apiKey.id)

      return { isValid: true, apiKey }

    } catch (error) {
      logger.error('Failed to validate API key', { error })
      return { isValid: false, error: 'Validation failed' }
    }
  }

  /**
   * List API keys for a user or organization
   */
  async listApiKeys(
    userId: string,
    organizationId?: string,
    includeInactive: boolean = false
  ): Promise<ApiKey[]> {
    try {
      let query = supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      } else {
        query = query.eq('user_id', userId).is('organization_id', null)
      }

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        organizationId: item.organization_id,
        name: item.name,
        keyPrefix: item.key_prefix,
        permissions: item.permissions,
        rateLimit: item.rate_limit,
        lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : undefined,
        usageCount: item.usage_count,
        isActive: item.is_active,
        expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))

    } catch (error) {
      logger.error('Failed to list API keys', { error, userId, organizationId })
      return []
    }
  }

  /**
   * Update API key settings
   */
  async updateApiKey(
    keyId: string,
    updates: Partial<{
      name: string
      permissions: Record<string, any>
      rateLimit: number
      isActive: boolean
      expiresAt: Date | null
    }>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions
      if (updates.rateLimit !== undefined) updateData.rate_limit = updates.rateLimit
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt?.toISOString() || null
      }

      const { error } = await supabase
        .from('api_keys')
        .update(updateData)
        .eq('id', keyId)

      if (error) throw error

      // Log the update
      await auditLogger.logEvent({
        userId: updatedBy,
        operation: 'api_key_updated',
        resourceType: 'api_key',
        resourceId: keyId,
        metadata: updates,
        severity: 'medium',
        outcome: 'success'
      })

      logger.info('API key updated', { keyId, updates, updatedBy })
      return true

    } catch (error) {
      logger.error('Failed to update API key', { error, keyId, updates })
      return false
    }
  }

  /**
   * Revoke/delete an API key
   */
  async revokeApiKey(keyId: string, revokedBy: string): Promise<boolean> {
    try {
      // Get API key details for logging
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('name, user_id, organization_id')
        .eq('id', keyId)
        .single()

      // Delete the API key
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

      if (error) throw error

      // Log the revocation
      await auditLogger.logEvent({
        userId: revokedBy,
        operation: 'api_key_revoked',
        resourceType: 'api_key',
        resourceId: keyId,
        organizationId: keyData?.organization_id,
        metadata: {
          keyName: keyData?.name,
          originalOwner: keyData?.user_id
        },
        severity: 'high',
        outcome: 'success'
      })

      logger.info('API key revoked', { keyId, revokedBy })
      return true

    } catch (error) {
      logger.error('Failed to revoke API key', { error, keyId, revokedBy })
      return false
    }
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(
    keyId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    timelineData: Array<{ date: string; requests: number }>
  }> {
    try {
      // This would typically query API usage logs
      // For now, return basic stats from the API key record
      const { data } = await supabase
        .from('api_keys')
        .select('usage_count, last_used_at')
        .eq('id', keyId)
        .single()

      return {
        totalRequests: data?.usage_count || 0,
        successfulRequests: Math.floor((data?.usage_count || 0) * 0.95), // Estimate
        failedRequests: Math.floor((data?.usage_count || 0) * 0.05), // Estimate
        timelineData: [] // Would be populated from usage logs
      }

    } catch (error) {
      logger.error('Failed to get usage stats', { error, keyId })
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        timelineData: []
      }
    }
  }

  /**
   * Hash API key for secure storage
   */
  private hashApiKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex')
  }

  /**
   * Check if API key has required permissions
   */
  private hasPermissions(apiKey: ApiKey, requiredPermissions: string[]): boolean {
    const permissions = apiKey.permissions

    // If key has 'all' permission, grant access
    if (permissions.all === true) {
      return true
    }

    // Check each required permission
    return requiredPermissions.every(permission => {
      const [resource, action] = permission.split(':')
      
      // Check specific permission
      if (permissions[permission] === true) {
        return true
      }

      // Check resource-level permission
      if (permissions[resource] === true) {
        return true
      }

      // Check wildcard permissions
      if (permissions[`${resource}:*`] === true) {
        return true
      }

      return false
    })
  }

  /**
   * Check rate limiting for API key
   */
  private async checkRateLimit(apiKey: ApiKey): Promise<boolean> {
    try {
      // Get current usage count in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      // This would typically check a rate limiting store (Redis)
      // For now, we'll use a simple check based on recent requests
      const { data } = await supabase
        .from('api_usage_logs')
        .select('id')
        .eq('api_key_id', apiKey.id)
        .gte('created_at', oneHourAgo.toISOString())

      const recentRequests = data?.length || 0
      const hourlyLimit = Math.floor(apiKey.rateLimit / 24) // Rough hourly limit

      return recentRequests >= hourlyLimit

    } catch (error) {
      logger.error('Failed to check rate limit', { error, keyId: apiKey.id })
      return false // Allow if we can't check
    }
  }

  /**
   * Update usage statistics for API key
   */
  private async updateUsageStats(keyId: string): Promise<void> {
    try {
      await supabase
        .from('api_keys')
        .update({
          usage_count: supabase.rpc('increment_usage_count'),
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)

    } catch (error) {
      logger.error('Failed to update usage stats', { error, keyId })
    }
  }

  /**
   * Log invalid API key attempt
   */
  private async logInvalidKeyAttempt(rawKey: string): Promise<void> {
    try {
      await auditLogger.logSuspiciousActivity(
        undefined,
        'invalid_api_key_attempt',
        'Attempt to use invalid or non-existent API key',
        undefined,
        undefined,
        {
          keyPrefix: rawKey.slice(0, 12),
          timestamp: new Date().toISOString()
        }
      )
    } catch (error) {
      logger.error('Failed to log invalid key attempt', { error })
    }
  }
}