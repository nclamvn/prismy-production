/**
 * Webhook Management System
 * Secure webhook delivery with retry logic and verification
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { supabase } from '@/lib/supabase'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

export interface Webhook {
  id: string
  userId: string
  organizationId?: string
  name: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  headers?: Record<string, string>
  retryConfig: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  lastTriggeredAt?: Date
  successCount: number
  failureCount: number
  createdAt: Date
  updatedAt: Date
}

export interface WebhookEvent {
  id: string
  webhookId: string
  eventType: string
  payload: Record<string, any>
  status: 'pending' | 'delivered' | 'failed' | 'cancelled'
  attempts: number
  lastAttemptAt?: Date
  nextRetryAt?: Date
  responseStatus?: number
  responseBody?: string
  errorMessage?: string
  createdAt: Date
}

export interface WebhookCreateParams {
  userId: string
  organizationId?: string
  name: string
  url: string
  events: string[]
  headers?: Record<string, string>
  retryConfig?: {
    maxRetries?: number
    retryDelay?: number
    backoffMultiplier?: number
  }
}

export interface WebhookDeliveryOptions {
  timeout?: number
  retryImmediately?: boolean
  skipSignature?: boolean
}

export class WebhookManager {
  private static instance: WebhookManager

  private constructor() {}

  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager()
    }
    return WebhookManager.instance
  }

  /**
   * Create a new webhook
   */
  async createWebhook(params: WebhookCreateParams): Promise<Webhook> {
    try {
      // Generate webhook secret
      const secret = this.generateWebhookSecret()

      const defaultRetryConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        ...params.retryConfig
      }

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: params.userId,
          organization_id: params.organizationId,
          name: params.name,
          url: params.url,
          events: params.events,
          secret: secret,
          is_active: true,
          headers: params.headers || {},
          retry_config: defaultRetryConfig,
          success_count: 0,
          failure_count: 0
        })
        .select()
        .single()

      if (error) throw error

      const webhook: Webhook = {
        id: data.id,
        userId: data.user_id,
        organizationId: data.organization_id,
        name: data.name,
        url: data.url,
        events: data.events,
        secret: data.secret,
        isActive: data.is_active,
        headers: data.headers,
        retryConfig: data.retry_config,
        lastTriggeredAt: data.last_triggered_at ? new Date(data.last_triggered_at) : undefined,
        successCount: data.success_count,
        failureCount: data.failure_count,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      // Log webhook creation
      await auditLogger.logEvent({
        userId: params.userId,
        operation: 'webhook_created',
        resourceType: 'webhook',
        resourceId: webhook.id,
        organizationId: params.organizationId,
        metadata: {
          webhookName: params.name,
          url: params.url,
          events: params.events
        },
        severity: 'medium',
        outcome: 'success'
      })

      logger.info('Webhook created', { 
        webhookId: webhook.id, 
        userId: params.userId,
        organizationId: params.organizationId,
        name: params.name,
        url: params.url
      })

      return webhook

    } catch (error) {
      logger.error('Failed to create webhook', { error, params })
      throw new Error('Failed to create webhook')
    }
  }

  /**
   * Trigger webhook for specific event
   */
  async triggerWebhook(
    eventType: string,
    payload: Record<string, any>,
    organizationId?: string,
    userId?: string,
    options: WebhookDeliveryOptions = {}
  ): Promise<void> {
    try {
      // Find webhooks that should receive this event
      let query = supabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true)
        .contains('events', [eventType])

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      } else if (userId) {
        query = query.eq('user_id', userId).is('organization_id', null)
      }

      const { data: webhooks, error } = await query

      if (error) throw error

      if (!webhooks || webhooks.length === 0) {
        logger.debug('No webhooks found for event', { eventType, organizationId, userId })
        return
      }

      // Create webhook events and trigger deliveries
      const deliveryPromises = webhooks.map(async (webhookData) => {
        const webhook: Webhook = {
          id: webhookData.id,
          userId: webhookData.user_id,
          organizationId: webhookData.organization_id,
          name: webhookData.name,
          url: webhookData.url,
          events: webhookData.events,
          secret: webhookData.secret,
          isActive: webhookData.is_active,
          headers: webhookData.headers,
          retryConfig: webhookData.retry_config,
          lastTriggeredAt: webhookData.last_triggered_at ? new Date(webhookData.last_triggered_at) : undefined,
          successCount: webhookData.success_count,
          failureCount: webhookData.failure_count,
          createdAt: new Date(webhookData.created_at),
          updatedAt: new Date(webhookData.updated_at)
        }

        await this.deliverWebhook(webhook, eventType, payload, options)
      })

      await Promise.allSettled(deliveryPromises)

    } catch (error) {
      logger.error('Failed to trigger webhooks', { error, eventType, organizationId, userId })
    }
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(
    webhook: Webhook,
    eventType: string,
    payload: Record<string, any>,
    options: WebhookDeliveryOptions = {}
  ): Promise<void> {
    try {
      // Create webhook event record
      const webhookEvent = await this.createWebhookEvent(webhook.id, eventType, payload)

      // Prepare webhook payload
      const webhookPayload = {
        id: webhookEvent.id,
        event: eventType,
        created_at: new Date().toISOString(),
        data: payload
      }

      // Deliver webhook
      await this.attemptDelivery(webhook, webhookEvent, webhookPayload, options)

    } catch (error) {
      logger.error('Failed to deliver webhook', { error, webhookId: webhook.id, eventType })
    }
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(
    webhook: Webhook,
    webhookEvent: WebhookEvent,
    payload: Record<string, any>,
    options: WebhookDeliveryOptions = {}
  ): Promise<void> {
    const maxRetries = webhook.retryConfig.maxRetries
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        const isFirstAttempt = attempt === 0
        const deliveryResult = await this.makeHttpRequest(webhook, payload, options)

        if (deliveryResult.success) {
          // Mark as delivered
          await this.updateWebhookEvent(webhookEvent.id, {
            status: 'delivered',
            attempts: attempt + 1,
            lastAttemptAt: new Date(),
            responseStatus: deliveryResult.status,
            responseBody: deliveryResult.body?.slice(0, 1000) // Limit response body size
          })

          // Update webhook success count
          await this.updateWebhookStats(webhook.id, true)

          logger.info('Webhook delivered successfully', {
            webhookId: webhook.id,
            eventId: webhookEvent.id,
            attempt: attempt + 1,
            status: deliveryResult.status
          })

          return // Success, exit retry loop

        } else {
          // Delivery failed
          const isLastAttempt = attempt === maxRetries
          const nextRetryDelay = this.calculateRetryDelay(attempt, webhook.retryConfig)
          const nextRetryAt = isLastAttempt ? null : new Date(Date.now() + nextRetryDelay)

          await this.updateWebhookEvent(webhookEvent.id, {
            status: isLastAttempt ? 'failed' : 'pending',
            attempts: attempt + 1,
            lastAttemptAt: new Date(),
            nextRetryAt,
            responseStatus: deliveryResult.status,
            responseBody: deliveryResult.body?.slice(0, 1000),
            errorMessage: deliveryResult.error
          })

          if (isLastAttempt) {
            // Update webhook failure count
            await this.updateWebhookStats(webhook.id, false)

            logger.error('Webhook delivery failed after all retries', {
              webhookId: webhook.id,
              eventId: webhookEvent.id,
              totalAttempts: attempt + 1,
              lastError: deliveryResult.error
            })

            // Log security event for webhook failure
            await auditLogger.logEvent({
              userId: webhook.userId,
              operation: 'webhook_delivery_failed',
              resourceType: 'webhook',
              resourceId: webhook.id,
              organizationId: webhook.organizationId,
              metadata: {
                eventType: webhookEvent.eventType,
                url: webhook.url,
                attempts: attempt + 1,
                lastError: deliveryResult.error
              },
              severity: 'medium',
              outcome: 'failure'
            })

            return
          }

          // Schedule retry (in a real implementation, this would be handled by a job queue)
          if (!options.retryImmediately) {
            await new Promise(resolve => setTimeout(resolve, nextRetryDelay))
          }
        }

      } catch (error) {
        logger.error('Webhook delivery attempt error', {
          error,
          webhookId: webhook.id,
          eventId: webhookEvent.id,
          attempt: attempt + 1
        })
      }

      attempt++
    }
  }

  /**
   * Make HTTP request to webhook endpoint
   */
  private async makeHttpRequest(
    webhook: Webhook,
    payload: Record<string, any>,
    options: WebhookDeliveryOptions = {}
  ): Promise<{
    success: boolean
    status?: number
    body?: string
    error?: string
  }> {
    try {
      const payloadString = JSON.stringify(payload)
      const signature = options.skipSignature ? undefined : this.generateSignature(payloadString, webhook.secret)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Prismy-Webhooks/1.0',
        ...webhook.headers
      }

      if (signature) {
        headers['X-Prismy-Signature'] = signature
        headers['X-Prismy-Timestamp'] = Math.floor(Date.now() / 1000).toString()
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const responseBody = await response.text()
      const isSuccess = response.status >= 200 && response.status < 300

      return {
        success: isSuccess,
        status: response.status,
        body: responseBody,
        error: isSuccess ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timeout' }
        }
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Unknown error' }
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string
  ): boolean {
    try {
      // Check timestamp if provided (prevent replay attacks)
      if (timestamp) {
        const requestTime = parseInt(timestamp)
        const currentTime = Math.floor(Date.now() / 1000)
        const timeDiff = Math.abs(currentTime - requestTime)
        
        // Reject requests older than 5 minutes
        if (timeDiff > 300) {
          return false
        }
      }

      const expectedSignature = this.generateSignature(payload, secret)
      
      // Use timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex')
      const expectedBuffer = Buffer.from(expectedSignature.replace('sha256=', ''), 'hex')

      return signatureBuffer.length === expectedBuffer.length &&
             timingSafeEqual(signatureBuffer, expectedBuffer)

    } catch (error) {
      logger.error('Failed to verify webhook signature', { error })
      return false
    }
  }

  /**
   * List webhooks for user or organization
   */
  async listWebhooks(
    userId: string,
    organizationId?: string,
    includeInactive: boolean = false
  ): Promise<Webhook[]> {
    try {
      let query = supabase
        .from('webhooks')
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
        url: item.url,
        events: item.events,
        secret: item.secret,
        isActive: item.is_active,
        headers: item.headers,
        retryConfig: item.retry_config,
        lastTriggeredAt: item.last_triggered_at ? new Date(item.last_triggered_at) : undefined,
        successCount: item.success_count,
        failureCount: item.failure_count,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))

    } catch (error) {
      logger.error('Failed to list webhooks', { error, userId, organizationId })
      return []
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<{
      name: string
      url: string
      events: string[]
      isActive: boolean
      headers: Record<string, string>
      retryConfig: Webhook['retryConfig']
    }>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.url !== undefined) updateData.url = updates.url
      if (updates.events !== undefined) updateData.events = updates.events
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.headers !== undefined) updateData.headers = updates.headers
      if (updates.retryConfig !== undefined) updateData.retry_config = updates.retryConfig

      const { error } = await supabase
        .from('webhooks')
        .update(updateData)
        .eq('id', webhookId)

      if (error) throw error

      // Log the update
      await auditLogger.logEvent({
        userId: updatedBy,
        operation: 'webhook_updated',
        resourceType: 'webhook',
        resourceId: webhookId,
        metadata: updates,
        severity: 'medium',
        outcome: 'success'
      })

      logger.info('Webhook updated', { webhookId, updates, updatedBy })
      return true

    } catch (error) {
      logger.error('Failed to update webhook', { error, webhookId, updates })
      return false
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string, deletedBy: string): Promise<boolean> {
    try {
      // Get webhook details for logging
      const { data: webhook } = await supabase
        .from('webhooks')
        .select('name, url, user_id, organization_id')
        .eq('id', webhookId)
        .single()

      // Delete the webhook
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)

      if (error) throw error

      // Log the deletion
      await auditLogger.logEvent({
        userId: deletedBy,
        operation: 'webhook_deleted',
        resourceType: 'webhook',
        resourceId: webhookId,
        organizationId: webhook?.organization_id,
        metadata: {
          webhookName: webhook?.name,
          url: webhook?.url,
          originalOwner: webhook?.user_id
        },
        severity: 'high',
        outcome: 'success'
      })

      logger.info('Webhook deleted', { webhookId, deletedBy })
      return true

    } catch (error) {
      logger.error('Failed to delete webhook', { error, webhookId, deletedBy })
      return false
    }
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    return createHash('sha256')
      .update(Math.random().toString())
      .digest('hex')
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string, secret: string): string {
    return 'sha256=' + createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, retryConfig: Webhook['retryConfig']): number {
    return retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt)
  }

  /**
   * Create webhook event record
   */
  private async createWebhookEvent(
    webhookId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<WebhookEvent> {
    const { data, error } = await supabase
      .from('webhook_events')
      .insert({
        webhook_id: webhookId,
        event_type: eventType,
        payload,
        status: 'pending',
        attempts: 0
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      webhookId: data.webhook_id,
      eventType: data.event_type,
      payload: data.payload,
      status: data.status,
      attempts: data.attempts,
      lastAttemptAt: data.last_attempt_at ? new Date(data.last_attempt_at) : undefined,
      nextRetryAt: data.next_retry_at ? new Date(data.next_retry_at) : undefined,
      responseStatus: data.response_status,
      responseBody: data.response_body,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at)
    }
  }

  /**
   * Update webhook event record
   */
  private async updateWebhookEvent(
    eventId: string,
    updates: Partial<{
      status: WebhookEvent['status']
      attempts: number
      lastAttemptAt: Date
      nextRetryAt?: Date | null
      responseStatus?: number
      responseBody?: string
      errorMessage?: string
    }>
  ): Promise<void> {
    const updateData: any = {}

    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.attempts !== undefined) updateData.attempts = updates.attempts
    if (updates.lastAttemptAt !== undefined) updateData.last_attempt_at = updates.lastAttemptAt.toISOString()
    if (updates.nextRetryAt !== undefined) updateData.next_retry_at = updates.nextRetryAt?.toISOString() || null
    if (updates.responseStatus !== undefined) updateData.response_status = updates.responseStatus
    if (updates.responseBody !== undefined) updateData.response_body = updates.responseBody
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage

    await supabase
      .from('webhook_events')
      .update(updateData)
      .eq('id', eventId)
  }

  /**
   * Update webhook statistics
   */
  private async updateWebhookStats(webhookId: string, success: boolean): Promise<void> {
    const incrementField = success ? 'success_count' : 'failure_count'
    
    await supabase
      .from('webhooks')
      .update({
        [incrementField]: supabase.rpc(`increment_${incrementField}`),
        last_triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', webhookId)
  }
}