/**
 * LIVE TRANSLATION PROGRESS TRACKER
 * Real-time progress tracking for translation workflows
 */

import { WebSocketManager } from '@/lib/websocket/websocket-manager'
import { logger } from '@/lib/logger'

export interface TranslationProgress {
  translationId: string
  userId: string
  type: 'single' | 'batch' | 'collaborative' | 'document'
  status: 'queued' | 'initializing' | 'processing' | 'quality_check' | 'completed' | 'failed' | 'cancelled'
  
  // Progress metrics
  progress: {
    percentage: number
    currentStep: string
    totalSteps: number
    completedSteps: number
    estimatedTimeRemaining: number // milliseconds
    startedAt: Date
    lastUpdatedAt: Date
    completedAt?: Date
  }

  // Content metrics
  content: {
    totalWords: number
    processedWords: number
    totalCharacters: number
    processedCharacters: number
    sourceLanguage: string
    targetLanguage: string
    complexity: 'simple' | 'medium' | 'complex' | 'technical'
  }

  // Quality metrics
  quality: {
    confidence: number
    issuesDetected: number
    autoCorrections: number
    reviewRequired: boolean
  }

  // Performance metrics
  performance: {
    processingSpeed: number // words per minute
    averageResponseTime: number
    cacheHitRate: number
    memoryUsage: number
  }

  // Steps breakdown
  steps: TranslationStep[]
  
  // Error handling
  errors: TranslationError[]
  warnings: TranslationWarning[]

  // Metadata
  metadata: {
    documentId?: string
    batchId?: string
    collaborationSessionId?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    retryCount: number
    maxRetries: number
  }
}

export interface TranslationStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  duration?: number
  progress: number // 0-100
  details?: {
    wordsProcessed?: number
    charactersProcessed?: number
    memoryUsage?: number
    cacheHits?: number
  }
  subSteps?: TranslationSubStep[]
}

export interface TranslationSubStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startedAt?: Date
  completedAt?: Date
}

export interface TranslationError {
  id: string
  type: 'validation' | 'processing' | 'quality' | 'network' | 'quota' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: string
  timestamp: Date
  recoverable: boolean
  retryable: boolean
}

export interface TranslationWarning {
  id: string
  type: 'quality' | 'content' | 'performance' | 'limit'
  message: string
  timestamp: Date
  suggestion?: string
}

export interface ProgressSubscription {
  translationId: string
  userId: string
  subscriptionId: string
  channels: ('websocket' | 'email' | 'webhook')[]
  filters: {
    minProgressChange?: number // minimum % change to trigger update
    statusChanges?: boolean
    errorsOnly?: boolean
    completionOnly?: boolean
  }
  createdAt: Date
}

export interface ProgressAnalytics {
  avgCompletionTime: number
  avgProcessingSpeed: number
  successRate: number
  commonErrors: { type: string; count: number; percentage: number }[]
  performanceTrends: {
    date: string
    avgSpeed: number
    avgTime: number
    successRate: number
  }[]
  userStats: {
    userId: string
    totalTranslations: number
    avgCompletionTime: number
    successRate: number
  }[]
}

export class TranslationProgressTracker {
  private activeProgress = new Map<string, TranslationProgress>()
  private subscriptions = new Map<string, Set<ProgressSubscription>>() // translationId -> subscriptions
  private userSubscriptions = new Map<string, Set<string>>() // userId -> translationIds
  private progressHistory = new Map<string, TranslationProgress[]>() // userId -> recent progress
  private websocketManager: WebSocketManager

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager
  }

  // Progress Management
  async startTracking(
    translationId: string,
    userId: string,
    type: TranslationProgress['type'],
    content: TranslationProgress['content'],
    metadata: Partial<TranslationProgress['metadata']> = {}
  ): Promise<TranslationProgress> {
    const steps = this.generateStepsForType(type, content)
    
    const progress: TranslationProgress = {
      translationId,
      userId,
      type,
      status: 'queued',
      progress: {
        percentage: 0,
        currentStep: steps[0]?.name || 'Initializing',
        totalSteps: steps.length,
        completedSteps: 0,
        estimatedTimeRemaining: this.estimateCompletionTime(content, type),
        startedAt: new Date(),
        lastUpdatedAt: new Date()
      },
      content,
      quality: {
        confidence: 0,
        issuesDetected: 0,
        autoCorrections: 0,
        reviewRequired: false
      },
      performance: {
        processingSpeed: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0
      },
      steps,
      errors: [],
      warnings: [],
      metadata: {
        priority: 'medium',
        retryCount: 0,
        maxRetries: 3,
        ...metadata
      }
    }

    this.activeProgress.set(translationId, progress)
    
    // Auto-subscribe the user to their own translation progress
    await this.subscribe(translationId, userId, ['websocket'], {
      statusChanges: true,
      minProgressChange: 5
    })

    // Broadcast initial progress
    this.broadcastProgress(progress)

    logger.info('Started tracking translation progress', {
      translationId,
      userId,
      type,
      totalWords: content.totalWords
    })

    return progress
  }

  async updateProgress(
    translationId: string,
    updates: {
      status?: TranslationProgress['status']
      percentage?: number
      currentStep?: string
      completedSteps?: number
      processedWords?: number
      processedCharacters?: number
      quality?: Partial<TranslationProgress['quality']>
      performance?: Partial<TranslationProgress['performance']>
      stepUpdates?: { stepId: string; status?: TranslationStep['status']; progress?: number }[]
    }
  ): Promise<boolean> {
    const progress = this.activeProgress.get(translationId)
    if (!progress) return false

    const previousPercentage = progress.progress.percentage
    const previousStatus = progress.status

    // Update progress fields
    if (updates.status) progress.status = updates.status
    if (updates.percentage !== undefined) progress.progress.percentage = updates.percentage
    if (updates.currentStep) progress.progress.currentStep = updates.currentStep
    if (updates.completedSteps !== undefined) progress.progress.completedSteps = updates.completedSteps
    if (updates.processedWords !== undefined) progress.content.processedWords = updates.processedWords
    if (updates.processedCharacters !== undefined) progress.content.processedCharacters = updates.processedCharacters

    // Update quality metrics
    if (updates.quality) {
      progress.quality = { ...progress.quality, ...updates.quality }
    }

    // Update performance metrics
    if (updates.performance) {
      progress.performance = { ...progress.performance, ...updates.performance }
    }

    // Update steps
    if (updates.stepUpdates) {
      for (const stepUpdate of updates.stepUpdates) {
        const step = progress.steps.find(s => s.id === stepUpdate.stepId)
        if (step) {
          if (stepUpdate.status) {
            step.status = stepUpdate.status
            if (stepUpdate.status === 'running' && !step.startedAt) {
              step.startedAt = new Date()
            } else if (stepUpdate.status === 'completed' && !step.completedAt) {
              step.completedAt = new Date()
              if (step.startedAt) {
                step.duration = step.completedAt.getTime() - step.startedAt.getTime()
              }
            }
          }
          if (stepUpdate.progress !== undefined) {
            step.progress = stepUpdate.progress
          }
        }
      }
    }

    // Update timing
    progress.progress.lastUpdatedAt = new Date()
    
    // Calculate estimated time remaining
    if (progress.progress.percentage > 0) {
      const elapsedTime = progress.progress.lastUpdatedAt.getTime() - progress.progress.startedAt.getTime()
      const estimatedTotalTime = (elapsedTime / progress.progress.percentage) * 100
      progress.progress.estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime)
    }

    // Mark as completed if all steps are done
    if (progress.status === 'completed' && !progress.progress.completedAt) {
      progress.progress.completedAt = new Date()
      progress.progress.percentage = 100
    }

    // Check if we should broadcast update
    const shouldBroadcast = this.shouldBroadcastUpdate(
      previousStatus,
      previousPercentage,
      progress.status,
      progress.progress.percentage
    )

    if (shouldBroadcast) {
      this.broadcastProgress(progress)
    }

    // Store in history if completed or failed
    if (['completed', 'failed', 'cancelled'].includes(progress.status)) {
      await this.archiveProgress(progress)
    }

    return true
  }

  async addError(
    translationId: string,
    error: Omit<TranslationError, 'id' | 'timestamp'>
  ): Promise<void> {
    const progress = this.activeProgress.get(translationId)
    if (!progress) return

    const errorWithId: TranslationError = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date()
    }

    progress.errors.push(errorWithId)

    // Broadcast error immediately
    this.broadcastProgress(progress, { errorAdded: errorWithId })

    logger.warn('Translation error added', {
      translationId,
      errorType: error.type,
      severity: error.severity,
      message: error.message
    })
  }

  async addWarning(
    translationId: string,
    warning: Omit<TranslationWarning, 'id' | 'timestamp'>
  ): Promise<void> {
    const progress = this.activeProgress.get(translationId)
    if (!progress) return

    const warningWithId: TranslationWarning = {
      ...warning,
      id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date()
    }

    progress.warnings.push(warningWithId)

    // Broadcast warning
    this.broadcastProgress(progress, { warningAdded: warningWithId })
  }

  // Subscription Management
  async subscribe(
    translationId: string,
    userId: string,
    channels: ProgressSubscription['channels'],
    filters: ProgressSubscription['filters'] = {}
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const subscription: ProgressSubscription = {
      translationId,
      userId,
      subscriptionId,
      channels,
      filters,
      createdAt: new Date()
    }

    // Store subscription
    if (!this.subscriptions.has(translationId)) {
      this.subscriptions.set(translationId, new Set())
    }
    this.subscriptions.get(translationId)!.add(subscription)

    // Track user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set())
    }
    this.userSubscriptions.get(userId)!.add(translationId)

    // Send current progress immediately
    const progress = this.activeProgress.get(translationId)
    if (progress) {
      this.sendProgressToSubscriber(progress, subscription)
    }

    return subscriptionId
  }

  async unsubscribe(subscriptionId: string): Promise<boolean> {
    for (const [translationId, subscriptions] of this.subscriptions) {
      for (const subscription of subscriptions) {
        if (subscription.subscriptionId === subscriptionId) {
          subscriptions.delete(subscription)
          
          // Clean up user subscriptions if no more subscriptions for this translation
          if (subscriptions.size === 0) {
            this.userSubscriptions.get(subscription.userId)?.delete(translationId)
          }
          
          return true
        }
      }
    }
    return false
  }

  // Progress Retrieval
  async getProgress(translationId: string): Promise<TranslationProgress | null> {
    return this.activeProgress.get(translationId) || null
  }

  async getUserProgress(userId: string, limit: number = 10): Promise<TranslationProgress[]> {
    const userTranslationIds = this.userSubscriptions.get(userId) || new Set()
    const activeProgress: TranslationProgress[] = []
    
    for (const translationId of userTranslationIds) {
      const progress = this.activeProgress.get(translationId)
      if (progress) {
        activeProgress.push(progress)
      }
    }

    // Sort by most recent
    activeProgress.sort((a, b) => 
      b.progress.lastUpdatedAt.getTime() - a.progress.lastUpdatedAt.getTime()
    )

    return activeProgress.slice(0, limit)
  }

  async getProgressHistory(userId: string, limit: number = 20): Promise<TranslationProgress[]> {
    const history = this.progressHistory.get(userId) || []
    return history.slice(0, limit)
  }

  // Analytics
  async getProgressAnalytics(userId?: string): Promise<ProgressAnalytics> {
    let allProgress: TranslationProgress[] = []
    
    if (userId) {
      const history = this.progressHistory.get(userId) || []
      const active = await this.getUserProgress(userId)
      allProgress = [...history, ...active]
    } else {
      // Get all progress from all users
      for (const history of this.progressHistory.values()) {
        allProgress.push(...history)
      }
      for (const progress of this.activeProgress.values()) {
        allProgress.push(progress)
      }
    }

    const completedProgress = allProgress.filter(p => p.status === 'completed')
    const totalProgress = allProgress.length

    const analytics: ProgressAnalytics = {
      avgCompletionTime: this.calculateAverageCompletionTime(completedProgress),
      avgProcessingSpeed: this.calculateAverageProcessingSpeed(completedProgress),
      successRate: totalProgress > 0 ? (completedProgress.length / totalProgress) * 100 : 0,
      commonErrors: this.calculateCommonErrors(allProgress),
      performanceTrends: this.calculatePerformanceTrends(allProgress),
      userStats: this.calculateUserStats(allProgress)
    }

    return analytics
  }

  // Private Methods
  private generateStepsForType(type: TranslationProgress['type'], content: TranslationProgress['content']): TranslationStep[] {
    const baseSteps: TranslationStep[] = [
      {
        id: 'validation',
        name: 'Input Validation',
        description: 'Validating source text and parameters',
        status: 'pending',
        progress: 0
      },
      {
        id: 'preprocessing',
        name: 'Text Preprocessing',
        description: 'Preparing text for translation',
        status: 'pending',
        progress: 0
      },
      {
        id: 'translation',
        name: 'Translation Processing',
        description: 'Performing AI translation',
        status: 'pending',
        progress: 0
      },
      {
        id: 'quality_check',
        name: 'Quality Check',
        description: 'Analyzing translation quality',
        status: 'pending',
        progress: 0
      },
      {
        id: 'postprocessing',
        name: 'Post-processing',
        description: 'Finalizing translation output',
        status: 'pending',
        progress: 0
      }
    ]

    // Add type-specific steps
    if (type === 'batch') {
      baseSteps.splice(2, 0, {
        id: 'batching',
        name: 'Batch Processing',
        description: 'Processing multiple translations',
        status: 'pending',
        progress: 0
      })
    }

    if (type === 'collaborative') {
      baseSteps.push({
        id: 'collaboration',
        name: 'Collaboration Sync',
        description: 'Synchronizing with collaboration session',
        status: 'pending',
        progress: 0
      })
    }

    if (content.complexity === 'technical') {
      baseSteps.splice(3, 0, {
        id: 'terminology',
        name: 'Terminology Check',
        description: 'Validating technical terminology',
        status: 'pending',
        progress: 0
      })
    }

    return baseSteps
  }

  private estimateCompletionTime(content: TranslationProgress['content'], type: TranslationProgress['type']): number {
    const baseTimePerWord = 100 // ms per word
    let multiplier = 1

    switch (content.complexity) {
      case 'simple': multiplier = 0.8; break
      case 'medium': multiplier = 1.0; break
      case 'complex': multiplier = 1.5; break
      case 'technical': multiplier = 2.0; break
    }

    if (type === 'batch') multiplier *= 1.2
    if (type === 'collaborative') multiplier *= 1.3

    return content.totalWords * baseTimePerWord * multiplier
  }

  private shouldBroadcastUpdate(
    previousStatus: string,
    previousPercentage: number,
    currentStatus: string,
    currentPercentage: number
  ): boolean {
    // Always broadcast status changes
    if (previousStatus !== currentStatus) return true
    
    // Broadcast significant progress changes
    if (Math.abs(currentPercentage - previousPercentage) >= 5) return true
    
    // Broadcast completion
    if (currentPercentage === 100) return true
    
    return false
  }

  private broadcastProgress(progress: TranslationProgress, metadata?: any): void {
    const subscriptions = this.subscriptions.get(progress.translationId)
    if (!subscriptions) return

    for (const subscription of subscriptions) {
      // Apply filters
      if (!this.passesFilters(progress, subscription.filters, metadata)) continue
      
      this.sendProgressToSubscriber(progress, subscription, metadata)
    }
  }

  private passesFilters(
    progress: TranslationProgress,
    filters: ProgressSubscription['filters'],
    metadata?: any
  ): boolean {
    if (filters.errorsOnly && !metadata?.errorAdded && progress.errors.length === 0) return false
    if (filters.completionOnly && progress.status !== 'completed') return false
    
    return true
  }

  private sendProgressToSubscriber(
    progress: TranslationProgress,
    subscription: ProgressSubscription,
    metadata?: any
  ): void {
    const message = {
      id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'translation_progress',
      userId: 'progress_system',
      timestamp: Date.now(),
      data: {
        translationId: progress.translationId,
        status: progress.status,
        progress: progress.progress,
        content: progress.content,
        quality: progress.quality,
        performance: progress.performance,
        currentStep: progress.steps.find(s => s.status === 'running'),
        errors: progress.errors.slice(-5), // Last 5 errors
        warnings: progress.warnings.slice(-5), // Last 5 warnings
        metadata
      }
    }

    // Send via WebSocket
    if (subscription.channels.includes('websocket')) {
      this.websocketManager.sendToUser(subscription.userId, message)
    }

    // Other channels would be implemented here (email, webhook)
  }

  private async archiveProgress(progress: TranslationProgress): Promise<void> {
    // Store in user history
    if (!this.progressHistory.has(progress.userId)) {
      this.progressHistory.set(progress.userId, [])
    }
    
    const userHistory = this.progressHistory.get(progress.userId)!
    userHistory.unshift(progress)
    
    // Limit history size
    if (userHistory.length > 100) {
      userHistory.splice(50)
    }

    // Remove from active tracking
    this.activeProgress.delete(progress.translationId)
    
    // Clean up subscriptions
    this.subscriptions.delete(progress.translationId)
  }

  private calculateAverageCompletionTime(completedProgress: TranslationProgress[]): number {
    if (completedProgress.length === 0) return 0
    
    const totalTime = completedProgress.reduce((sum, p) => {
      if (p.progress.completedAt && p.progress.startedAt) {
        return sum + (p.progress.completedAt.getTime() - p.progress.startedAt.getTime())
      }
      return sum
    }, 0)
    
    return totalTime / completedProgress.length
  }

  private calculateAverageProcessingSpeed(completedProgress: TranslationProgress[]): number {
    if (completedProgress.length === 0) return 0
    
    const totalSpeed = completedProgress.reduce((sum, p) => sum + p.performance.processingSpeed, 0)
    return totalSpeed / completedProgress.length
  }

  private calculateCommonErrors(allProgress: TranslationProgress[]): { type: string; count: number; percentage: number }[] {
    const errorCounts: Record<string, number> = {}
    let totalErrors = 0

    allProgress.forEach(p => {
      p.errors.forEach(error => {
        errorCounts[error.type] = (errorCounts[error.type] || 0) + 1
        totalErrors++
      })
    })

    return Object.entries(errorCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private calculatePerformanceTrends(allProgress: TranslationProgress[]): ProgressAnalytics['performanceTrends'] {
    // Group by date and calculate averages
    const dailyStats: Record<string, { speeds: number[]; times: number[]; total: number; successful: number }> = {}

    allProgress.forEach(p => {
      const date = p.progress.startedAt.toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { speeds: [], times: [], total: 0, successful: 0 }
      }

      dailyStats[date].total++
      if (p.status === 'completed') {
        dailyStats[date].successful++
        dailyStats[date].speeds.push(p.performance.processingSpeed)
        if (p.progress.completedAt) {
          const duration = p.progress.completedAt.getTime() - p.progress.startedAt.getTime()
          dailyStats[date].times.push(duration)
        }
      }
    })

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        avgSpeed: stats.speeds.length > 0 ? stats.speeds.reduce((a, b) => a + b, 0) / stats.speeds.length : 0,
        avgTime: stats.times.length > 0 ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length : 0,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)
  }

  private calculateUserStats(allProgress: TranslationProgress[]): ProgressAnalytics['userStats'] {
    const userStats: Record<string, { total: number; completed: number; totalTime: number; completedTimes: number }> = {}

    allProgress.forEach(p => {
      if (!userStats[p.userId]) {
        userStats[p.userId] = { total: 0, completed: 0, totalTime: 0, completedTimes: 0 }
      }

      userStats[p.userId].total++
      if (p.status === 'completed') {
        userStats[p.userId].completed++
        if (p.progress.completedAt) {
          const duration = p.progress.completedAt.getTime() - p.progress.startedAt.getTime()
          userStats[p.userId].totalTime += duration
          userStats[p.userId].completedTimes++
        }
      }
    })

    return Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId,
        totalTranslations: stats.total,
        avgCompletionTime: stats.completedTimes > 0 ? stats.totalTime / stats.completedTimes : 0,
        successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }))
      .filter(user => user.totalTranslations > 0)
      .sort((a, b) => b.totalTranslations - a.totalTranslations)
  }
}

// Export singleton instance
export const translationProgressTracker = new TranslationProgressTracker({} as WebSocketManager)