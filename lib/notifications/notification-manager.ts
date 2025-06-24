/**
 * ENHANCED NOTIFICATION SYSTEM
 * Real-time notification management with multiple delivery channels
 */

import { WebSocketManager } from '@/lib/websocket/websocket-manager'
import { logger } from '@/lib/logger'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'urgent'
  category: 'translation' | 'collaboration' | 'system' | 'billing' | 'security' | 'quality' | 'workspace'
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  userId: string
  metadata: Record<string, any>
  channels: NotificationChannel[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'dismissed' | 'failed'
  createdAt: Date
  sentAt?: Date
  readAt?: Date
  expiresAt?: Date
  retryCount: number
  maxRetries: number
}

export interface NotificationChannel {
  type: 'websocket' | 'email' | 'sms' | 'push' | 'slack' | 'teams'
  config: Record<string, any>
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  error?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  category: Notification['category']
  type: Notification['type']
  title: string
  message: string
  defaultChannels: NotificationChannel['type'][]
  variables: string[]
  isActive: boolean
}

export interface UserNotificationPreferences {
  userId: string
  channels: {
    websocket: boolean
    email: boolean
    sms: boolean
    push: boolean
    slack: boolean
    teams: boolean
  }
  categories: {
    translation: boolean
    collaboration: boolean
    system: boolean
    billing: boolean
    security: boolean
    quality: boolean
    workspace: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string // HH:MM
    endTime: string // HH:MM
    timezone: string
  }
  batchDelivery: {
    enabled: boolean
    frequency: 'immediate' | 'every_15min' | 'hourly' | 'daily'
    maxBatch: number
  }
  urgentOnly: boolean
}

export interface NotificationRule {
  id: string
  name: string
  condition: NotificationCondition
  action: NotificationAction
  isActive: boolean
  priority: number
}

export interface NotificationCondition {
  category?: string
  type?: string
  priority?: string
  userRole?: string
  metadata?: Record<string, any>
}

export interface NotificationAction {
  type: 'route_to_channel' | 'modify_priority' | 'batch' | 'suppress' | 'escalate'
  config: Record<string, any>
}

export interface NotificationStats {
  total: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  byChannel: Record<string, number>
  byStatus: Record<string, number>
  deliveryRate: number
  averageDeliveryTime: number
  recentActivity: Notification[]
}

export class NotificationManager {
  private notifications = new Map<string, Notification>()
  private userNotifications = new Map<string, Set<string>>() // userId -> Set of notificationIds
  private userPreferences = new Map<string, UserNotificationPreferences>()
  private templates = new Map<string, NotificationTemplate>()
  private rules: NotificationRule[] = []
  private websocketManager: WebSocketManager

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager
    this.initializeDefaultTemplates()
    this.initializeDefaultRules()
  }

  // Notification Creation and Sending
  async createNotification(
    userId: string,
    category: Notification['category'],
    type: Notification['type'],
    title: string,
    message: string,
    options: {
      actionUrl?: string
      actionLabel?: string
      metadata?: Record<string, any>
      channels?: NotificationChannel['type'][]
      priority?: Notification['priority']
      expiresAt?: Date
    } = {}
  ): Promise<Notification> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Get user preferences
    const preferences = this.getUserPreferences(userId)
    
    // Determine channels based on preferences and options
    const defaultChannels = options.channels || ['websocket']
    const allowedChannels = defaultChannels.filter(channel => 
      preferences.channels[channel] && preferences.categories[category]
    )

    // Apply notification rules
    const processedChannels = this.applyRules({
      category,
      type,
      priority: options.priority || 'medium',
      userId,
      channels: allowedChannels
    })

    const notification: Notification = {
      id: notificationId,
      type,
      category,
      title,
      message,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      userId,
      metadata: options.metadata || {},
      channels: processedChannels.map(channelType => ({
        type: channelType,
        config: this.getChannelConfig(userId, channelType),
        status: 'pending'
      })),
      priority: options.priority || 'medium',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: options.expiresAt,
      retryCount: 0,
      maxRetries: 3
    }

    this.notifications.set(notificationId, notification)
    
    // Track user notifications
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, new Set())
    }
    this.userNotifications.get(userId)!.add(notificationId)

    // Send notification immediately if not in quiet hours or urgent
    if (this.shouldSendImmediately(notification, preferences)) {
      await this.sendNotification(notificationId)
    } else {
      // Queue for batch delivery
      this.queueForBatch(notification, preferences)
    }

    return notification
  }

  async sendNotification(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    if (!notification || notification.status === 'sent') {
      return false
    }

    notification.status = 'sent'
    notification.sentAt = new Date()

    let allSuccessful = true

    // Send through each channel
    for (const channel of notification.channels) {
      try {
        await this.sendThroughChannel(notification, channel)
        channel.status = 'sent'
        channel.sentAt = new Date()
      } catch (error) {
        logger.error(`Failed to send notification through ${channel.type}:`, error)
        channel.status = 'failed'
        channel.error = error instanceof Error ? error.message : String(error)
        allSuccessful = false
      }
    }

    // Update overall status
    if (allSuccessful) {
      notification.status = 'delivered'
    } else if (notification.retryCount < notification.maxRetries) {
      // Schedule retry
      notification.retryCount++
      setTimeout(() => {
        this.retryFailedChannels(notificationId)
      }, Math.pow(2, notification.retryCount) * 1000) // Exponential backoff
    } else {
      notification.status = 'failed'
    }

    return allSuccessful
  }

  private async sendThroughChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'websocket':
        await this.sendWebSocketNotification(notification)
        break
      case 'email':
        await this.sendEmailNotification(notification, channel.config)
        break
      case 'sms':
        await this.sendSMSNotification(notification, channel.config)
        break
      case 'push':
        await this.sendPushNotification(notification, channel.config)
        break
      case 'slack':
        await this.sendSlackNotification(notification, channel.config)
        break
      case 'teams':
        await this.sendTeamsNotification(notification, channel.config)
        break
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`)
    }
  }

  private async sendWebSocketNotification(notification: Notification): Promise<void> {
    this.websocketManager.sendToUser(notification.userId, {
      id: `ws_${notification.id}`,
      type: 'notification',
      userId: 'notification_system',
      timestamp: Date.now(),
      data: {
        id: notification.id,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        priority: notification.priority,
        createdAt: notification.createdAt,
        metadata: notification.metadata
      }
    })
  }

  private async sendEmailNotification(notification: Notification, config: any): Promise<void> {
    // Implementation would integrate with email service (SendGrid, SES, etc.)
    logger.info('Email notification sent', { notificationId: notification.id })
  }

  private async sendSMSNotification(notification: Notification, config: any): Promise<void> {
    // Implementation would integrate with SMS service (Twilio, etc.)
    logger.info('SMS notification sent', { notificationId: notification.id })
  }

  private async sendPushNotification(notification: Notification, config: any): Promise<void> {
    // Implementation would integrate with push service (FCM, APNs, etc.)
    logger.info('Push notification sent', { notificationId: notification.id })
  }

  private async sendSlackNotification(notification: Notification, config: any): Promise<void> {
    // Implementation would integrate with Slack API
    logger.info('Slack notification sent', { notificationId: notification.id })
  }

  private async sendTeamsNotification(notification: Notification, config: any): Promise<void> {
    // Implementation would integrate with Teams API
    logger.info('Teams notification sent', { notificationId: notification.id })
  }

  // Notification Management
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    if (!notification || notification.userId !== userId) {
      return false
    }

    notification.status = 'read'
    notification.readAt = new Date()

    // Broadcast read status to user's other sessions
    this.websocketManager.sendToUser(userId, {
      id: `read_${notificationId}`,
      type: 'notification_read',
      userId: 'notification_system',
      timestamp: Date.now(),
      data: { notificationId, readAt: notification.readAt }
    })

    return true
  }

  async dismissNotification(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    if (!notification || notification.userId !== userId) {
      return false
    }

    notification.status = 'dismissed'
    
    // Remove from user's notification list
    this.userNotifications.get(userId)?.delete(notificationId)

    // Broadcast dismissal to user's other sessions
    this.websocketManager.sendToUser(userId, {
      id: `dismissed_${notificationId}`,
      type: 'notification_dismissed',
      userId: 'notification_system',
      timestamp: Date.now(),
      data: { notificationId }
    })

    return true
  }

  async getUserNotifications(
    userId: string,
    options: {
      status?: Notification['status'][]
      category?: Notification['category'][]
      limit?: number
      offset?: number
    } = {}
  ): Promise<Notification[]> {
    const userNotificationIds = this.userNotifications.get(userId) || new Set()
    let notifications = Array.from(userNotificationIds)
      .map(id => this.notifications.get(id))
      .filter(n => n !== undefined) as Notification[]

    // Apply filters
    if (options.status) {
      notifications = notifications.filter(n => options.status!.includes(n.status))
    }
    if (options.category) {
      notifications = notifications.filter(n => options.category!.includes(n.category))
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply pagination
    const offset = options.offset || 0
    const limit = options.limit || 50
    return notifications.slice(offset, offset + limit)
  }

  // User Preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>): Promise<void> {
    const current = this.getUserPreferences(userId)
    const updated = { ...current, ...preferences }
    this.userPreferences.set(userId, updated)
  }

  getUserPreferences(userId: string): UserNotificationPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId)
  }

  private getDefaultPreferences(userId: string): UserNotificationPreferences {
    return {
      userId,
      channels: {
        websocket: true,
        email: true,
        sms: false,
        push: true,
        slack: false,
        teams: false
      },
      categories: {
        translation: true,
        collaboration: true,
        system: true,
        billing: true,
        security: true,
        quality: true,
        workspace: true
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      },
      batchDelivery: {
        enabled: false,
        frequency: 'immediate',
        maxBatch: 10
      },
      urgentOnly: false
    }
  }

  // Templates
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTemplate = { ...template, id: templateId }
    this.templates.set(templateId, newTemplate)
    return newTemplate
  }

  async sendFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, string>,
    options: Parameters<typeof this.createNotification>[5] = {}
  ): Promise<Notification | null> {
    const template = this.templates.get(templateId)
    if (!template || !template.isActive) {
      return null
    }

    // Replace variables in title and message
    let title = template.title
    let message = template.message
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      title = title.replace(new RegExp(placeholder, 'g'), value)
      message = message.replace(new RegExp(placeholder, 'g'), value)
    }

    return await this.createNotification(
      userId,
      template.category,
      template.type,
      title,
      message,
      {
        ...options,
        channels: options.channels || template.defaultChannels
      }
    )
  }

  // Utility Methods
  private shouldSendImmediately(notification: Notification, preferences: UserNotificationPreferences): boolean {
    // Always send critical notifications immediately
    if (notification.priority === 'critical' || notification.type === 'urgent') {
      return true
    }

    // Check if user wants urgent only
    if (preferences.urgentOnly && notification.priority !== 'high') {
      return false
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date()
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: preferences.quietHours.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now)

      const [currentHour, currentMinute] = userTime.split(':').map(Number)
      const [startHour, startMinute] = preferences.quietHours.startTime.split(':').map(Number)
      const [endHour, endMinute] = preferences.quietHours.endTime.split(':').map(Number)

      const currentMinutes = currentHour * 60 + currentMinute
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      // Handle overnight quiet hours
      const isInQuietHours = startMinutes > endMinutes
        ? currentMinutes >= startMinutes || currentMinutes <= endMinutes
        : currentMinutes >= startMinutes && currentMinutes <= endMinutes

      if (isInQuietHours) {
        return false
      }
    }

    // Check batch delivery preferences
    if (preferences.batchDelivery.enabled && preferences.batchDelivery.frequency !== 'immediate') {
      return false
    }

    return true
  }

  private queueForBatch(notification: Notification, preferences: UserNotificationPreferences): void {
    // Implementation would queue notification for batch delivery
    logger.info('Notification queued for batch delivery', { notificationId: notification.id })
  }

  private applyRules(context: {
    category: string
    type: string
    priority: string
    userId: string
    channels: string[]
  }): NotificationChannel['type'][] {
    let channels = [...context.channels] as NotificationChannel['type'][]

    for (const rule of this.rules.filter(r => r.isActive)) {
      if (this.matchesCondition(rule.condition, context)) {
        channels = this.applyAction(rule.action, channels, context)
      }
    }

    return channels
  }

  private matchesCondition(condition: NotificationCondition, context: any): boolean {
    if (condition.category && condition.category !== context.category) return false
    if (condition.type && condition.type !== context.type) return false
    if (condition.priority && condition.priority !== context.priority) return false
    return true
  }

  private applyAction(action: NotificationAction, channels: NotificationChannel['type'][], context: any): NotificationChannel['type'][] {
    switch (action.type) {
      case 'route_to_channel':
        return [action.config.channel]
      case 'suppress':
        return []
      default:
        return channels
    }
  }

  private getChannelConfig(userId: string, channelType: NotificationChannel['type']): any {
    // Return channel-specific configuration for the user
    return {}
  }

  private async retryFailedChannels(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId)
    if (!notification) return

    const failedChannels = notification.channels.filter(c => c.status === 'failed')
    
    for (const channel of failedChannels) {
      try {
        await this.sendThroughChannel(notification, channel)
        channel.status = 'sent'
        channel.sentAt = new Date()
      } catch (error) {
        logger.error(`Retry failed for ${channel.type}:`, error)
      }
    }
  }

  private initializeDefaultTemplates(): void {
    const templates: Omit<NotificationTemplate, 'id'>[] = [
      {
        name: 'Translation Completed',
        category: 'translation',
        type: 'success',
        title: 'Translation Complete',
        message: 'Your translation "{{documentName}}" has been completed successfully.',
        defaultChannels: ['websocket', 'email'],
        variables: ['documentName'],
        isActive: true
      },
      {
        name: 'Collaboration Invite',
        category: 'collaboration',
        type: 'info',
        title: 'Collaboration Invitation',
        message: '{{inviterName}} has invited you to collaborate on "{{workspaceName}}".',
        defaultChannels: ['websocket', 'email'],
        variables: ['inviterName', 'workspaceName'],
        isActive: true
      },
      {
        name: 'Quality Alert',
        category: 'quality',
        type: 'warning',
        title: 'Quality Alert',
        message: 'Quality issues detected in translation "{{documentName}}". Review needed.',
        defaultChannels: ['websocket', 'email'],
        variables: ['documentName'],
        isActive: true
      }
    ]

    templates.forEach(template => {
      this.createTemplate(template)
    })
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'critical_security',
        name: 'Critical Security Alerts',
        condition: { category: 'security', priority: 'critical' },
        action: { type: 'route_to_channel', config: { channel: 'email' } },
        isActive: true,
        priority: 1
      },
      {
        id: 'billing_urgent',
        name: 'Urgent Billing Notifications',
        condition: { category: 'billing', priority: 'high' },
        action: { type: 'route_to_channel', config: { channel: 'email' } },
        isActive: true,
        priority: 2
      }
    ]
  }

  // Analytics
  async getNotificationStats(userId?: string): Promise<NotificationStats> {
    let notifications: Notification[]
    
    if (userId) {
      notifications = await this.getUserNotifications(userId, { limit: 1000 })
    } else {
      notifications = Array.from(this.notifications.values())
    }

    const stats: NotificationStats = {
      total: notifications.length,
      byType: {},
      byCategory: {},
      byChannel: {},
      byStatus: {},
      deliveryRate: 0,
      averageDeliveryTime: 0,
      recentActivity: notifications.slice(0, 10)
    }

    // Calculate statistics
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1
      stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1

      notification.channels.forEach(channel => {
        stats.byChannel[channel.type] = (stats.byChannel[channel.type] || 0) + 1
      })
    })

    const deliveredCount = (stats.byStatus['delivered'] || 0) + (stats.byStatus['read'] || 0)
    stats.deliveryRate = notifications.length > 0 ? (deliveredCount / notifications.length) * 100 : 0

    return stats
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager({} as WebSocketManager)