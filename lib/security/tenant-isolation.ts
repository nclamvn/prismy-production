/**
 * Multi-Tenant Security Isolation
 * Advanced RLS policies and tenant data separation
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface TenantContext {
  userId: string
  organizationId?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: string[]
  subscriptionTier: 'free' | 'standard' | 'premium' | 'enterprise'
}

export interface SecurityPolicy {
  table: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  policy: string
  conditions: string[]
}

export class TenantIsolationManager {
  private static instance: TenantIsolationManager
  private activePolicies: Map<string, SecurityPolicy[]> = new Map()

  private constructor() {}

  static getInstance(): TenantIsolationManager {
    if (!TenantIsolationManager.instance) {
      TenantIsolationManager.instance = new TenantIsolationManager()
    }
    return TenantIsolationManager.instance
  }

  /**
   * Create secure tenant context for user
   */
  async createTenantContext(userId: string): Promise<TenantContext> {
    try {
      // Get user profile with organization info
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(
          `
          *,
          organization_members!inner(
            organization_id,
            role,
            permissions
          ),
          organizations!inner(
            id,
            subscription_tier,
            security_settings
          )
        `
        )
        .eq('user_id', userId)
        .single()

      if (error || !profile) {
        // Individual user without organization
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('subscription_tier')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        return {
          userId,
          role: 'owner',
          permissions: ['read', 'write', 'delete'],
          subscriptionTier: subscription?.subscription_tier || 'free',
        }
      }

      const orgMember = profile.organization_members[0]
      const organization = profile.organizations[0]

      return {
        userId,
        organizationId: orgMember.organization_id,
        role: orgMember.role,
        permissions: orgMember.permissions || [],
        subscriptionTier: organization.subscription_tier,
      }
    } catch (error) {
      logger.error('Failed to create tenant context', { error, userId })
      throw new Error('Unable to establish secure tenant context')
    }
  }

  /**
   * Validate user access to resource
   */
  async validateResourceAccess(
    context: TenantContext,
    resourceType: string,
    resourceId: string,
    operation: 'read' | 'write' | 'delete' | 'admin'
  ): Promise<boolean> {
    try {
      // Check basic permissions
      if (!this.hasPermission(context, operation)) {
        return false
      }

      // Validate resource ownership/access
      const hasAccess = await this.checkResourceAccess(
        context,
        resourceType,
        resourceId
      )

      if (!hasAccess) {
        logger.warn('Unauthorized resource access attempt', {
          userId: context.userId,
          organizationId: context.organizationId,
          resourceType,
          resourceId,
          operation,
        })
      }

      return hasAccess
    } catch (error) {
      logger.error('Resource access validation failed', {
        error,
        context,
        resourceType,
        resourceId,
      })
      return false
    }
  }

  /**
   * Check if user has specific permission
   */
  private hasPermission(context: TenantContext, operation: string): boolean {
    const rolePermissions = {
      owner: ['read', 'write', 'delete', 'admin'],
      admin: ['read', 'write', 'delete', 'admin'],
      member: ['read', 'write'],
      viewer: ['read'],
    }

    const allowedOperations = rolePermissions[context.role] || []
    return (
      allowedOperations.includes(operation) ||
      context.permissions.includes(operation)
    )
  }

  /**
   * Check access to specific resource
   */
  private async checkResourceAccess(
    context: TenantContext,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    const accessCheckers = {
      document: this.checkDocumentAccess.bind(this),
      translation: this.checkTranslationAccess.bind(this),
      project: this.checkProjectAccess.bind(this),
      usage_log: this.checkUsageLogAccess.bind(this),
      billing: this.checkBillingAccess.bind(this),
    }

    const checker = accessCheckers[resourceType]
    if (!checker) {
      logger.warn('Unknown resource type for access check', { resourceType })
      return false
    }

    return await checker(context, resourceId)
  }

  /**
   * Document access validation
   */
  private async checkDocumentAccess(
    context: TenantContext,
    documentId: string
  ): Promise<boolean> {
    const { data: document } = await supabase
      .from('documents')
      .select('user_id, organization_id, visibility')
      .eq('id', documentId)
      .single()

    if (!document) return false

    // Individual user
    if (!context.organizationId) {
      return document.user_id === context.userId
    }

    // Organization member
    return (
      document.organization_id === context.organizationId ||
      (document.visibility === 'organization' &&
        document.organization_id === context.organizationId) ||
      document.user_id === context.userId
    )
  }

  /**
   * Translation access validation
   */
  private async checkTranslationAccess(
    context: TenantContext,
    translationId: string
  ): Promise<boolean> {
    const { data: translation } = await supabase
      .from('translations')
      .select('user_id, document_id')
      .eq('id', translationId)
      .single()

    if (!translation) return false

    // Check if user owns translation
    if (translation.user_id === context.userId) return true

    // Check document access if translation is linked to document
    if (translation.document_id) {
      return await this.checkDocumentAccess(context, translation.document_id)
    }

    return false
  }

  /**
   * Project access validation
   */
  private async checkProjectAccess(
    context: TenantContext,
    projectId: string
  ): Promise<boolean> {
    const { data: project } = await supabase
      .from('projects')
      .select('user_id, organization_id, team_members')
      .eq('id', projectId)
      .single()

    if (!project) return false

    // Owner check
    if (project.user_id === context.userId) return true

    // Organization check
    if (
      context.organizationId &&
      project.organization_id === context.organizationId
    ) {
      return true
    }

    // Team member check
    if (project.team_members && Array.isArray(project.team_members)) {
      return project.team_members.includes(context.userId)
    }

    return false
  }

  /**
   * Usage log access validation
   */
  private async checkUsageLogAccess(
    context: TenantContext,
    logId: string
  ): Promise<boolean> {
    const { data: log } = await supabase
      .from('usage_logs')
      .select('user_id')
      .eq('id', logId)
      .single()

    if (!log) return false

    // Only owner or admin can view usage logs
    return (
      log.user_id === context.userId ||
      context.role === 'admin' ||
      context.role === 'owner'
    )
  }

  /**
   * Billing access validation
   */
  private async checkBillingAccess(
    context: TenantContext,
    billingId: string
  ): Promise<boolean> {
    // Only admin/owner can access billing
    if (!['admin', 'owner'].includes(context.role)) {
      return false
    }

    const { data: billing } = await supabase
      .from('billing_records')
      .select('user_id, organization_id')
      .eq('id', billingId)
      .single()

    if (!billing) return false

    if (context.organizationId) {
      return billing.organization_id === context.organizationId
    }

    return billing.user_id === context.userId
  }

  /**
   * Apply dynamic RLS policies based on context
   */
  async applyDynamicRLS(context: TenantContext): Promise<void> {
    try {
      const policies = this.generateDynamicPolicies(context)

      for (const policy of policies) {
        await this.createOrUpdatePolicy(policy)
      }

      logger.info('Dynamic RLS policies applied', {
        userId: context.userId,
        organizationId: context.organizationId,
        policiesCount: policies.length,
      })
    } catch (error) {
      logger.error('Failed to apply dynamic RLS', { error, context })
      throw error
    }
  }

  /**
   * Generate dynamic security policies
   */
  private generateDynamicPolicies(context: TenantContext): SecurityPolicy[] {
    const policies: SecurityPolicy[] = []

    // Enhanced document policies for organizations
    if (context.organizationId) {
      policies.push({
        table: 'documents',
        operation: 'SELECT',
        policy: `org_document_access_${context.organizationId}`,
        conditions: [
          `organization_id = '${context.organizationId}'`,
          `user_id = auth.uid()`,
          `visibility IN ('public', 'organization')`,
        ],
      })

      policies.push({
        table: 'translations',
        operation: 'SELECT',
        policy: `org_translation_access_${context.organizationId}`,
        conditions: [
          `user_id = auth.uid()`,
          `organization_id = '${context.organizationId}'`,
        ],
      })
    }

    // Role-based policies
    if (context.role === 'viewer') {
      policies.push({
        table: 'usage_logs',
        operation: 'SELECT',
        policy: `viewer_usage_restriction_${context.userId}`,
        conditions: [`user_id = auth.uid()`],
      })
    }

    // Subscription tier policies
    if (context.subscriptionTier === 'free') {
      policies.push({
        table: 'documents',
        operation: 'INSERT',
        policy: `free_tier_limit_${context.userId}`,
        conditions: [
          `user_id = auth.uid()`,
          `(SELECT COUNT(*) FROM documents WHERE user_id = auth.uid()) < 10`,
        ],
      })
    }

    return policies
  }

  /**
   * Create or update RLS policy
   */
  private async createOrUpdatePolicy(policy: SecurityPolicy): Promise<void> {
    const policySQL = `
      CREATE POLICY IF NOT EXISTS "${policy.policy}" 
      ON ${policy.table}
      FOR ${policy.operation}
      USING (${policy.conditions.join(' OR ')})
    `

    try {
      await supabase.rpc('execute_sql', { sql: policySQL })

      // Track active policies
      if (!this.activePolicies.has(policy.table)) {
        this.activePolicies.set(policy.table, [])
      }

      const tablePolicies = this.activePolicies.get(policy.table)!
      const existingIndex = tablePolicies.findIndex(
        p => p.policy === policy.policy
      )

      if (existingIndex >= 0) {
        tablePolicies[existingIndex] = policy
      } else {
        tablePolicies.push(policy)
      }
    } catch (error) {
      logger.error('Failed to create/update policy', { error, policy })
    }
  }

  /**
   * Clean up inactive policies
   */
  async cleanupInactivePolicies(): Promise<void> {
    try {
      // Get all active policies from database
      const { data: dbPolicies } = await supabase.rpc(
        'get_row_security_policies'
      )

      if (!dbPolicies) return

      const activePolicyNames = new Set()
      for (const tablePolicies of this.activePolicies.values()) {
        tablePolicies.forEach(p => activePolicyNames.add(p.policy))
      }

      // Drop policies that are no longer active
      for (const dbPolicy of dbPolicies) {
        if (
          !activePolicyNames.has(dbPolicy.policyname) &&
          dbPolicy.policyname.includes('_')
        ) {
          await supabase.rpc('execute_sql', {
            sql: `DROP POLICY IF EXISTS "${dbPolicy.policyname}" ON ${dbPolicy.tablename}`,
          })

          logger.info('Dropped inactive policy', {
            policy: dbPolicy.policyname,
            table: dbPolicy.tablename,
          })
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup inactive policies', { error })
    }
  }

  /**
   * Audit security access patterns
   */
  async auditSecurityAccess(
    context: TenantContext,
    operation: string,
    resourceType: string,
    resourceId: string,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.from('security_audit_logs').insert({
        user_id: context.userId,
        organization_id: context.organizationId,
        operation,
        resource_type: resourceType,
        resource_id: resourceId,
        success,
        user_role: context.role,
        subscription_tier: context.subscriptionTier,
        metadata,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('Failed to log security audit', { error })
    }
  }
}
