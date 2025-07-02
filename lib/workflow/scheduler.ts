/**
 * Workflow Scheduler
 * Handles cron-based and time-based workflow triggers
 */

import { supabase } from '@/lib/supabase'
import { WorkflowAutomationEngine } from './automation-engine'
import { logger } from '@/lib/logger'

interface ScheduledJob {
  id: string
  workflowId: string
  scheduleType: 'cron' | 'interval' | 'once'
  scheduleConfig: any
  nextRunAt: Date
  timezone: string
  enabled: boolean
}

export class WorkflowScheduler {
  private static instance: WorkflowScheduler
  private scheduledJobs = new Map<string, NodeJS.Timeout>()
  private isRunning = false

  private constructor() {}

  static getInstance(): WorkflowScheduler {
    if (!WorkflowScheduler.instance) {
      WorkflowScheduler.instance = new WorkflowScheduler()
    }
    return WorkflowScheduler.instance
  }

  async start(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    logger.info('Workflow scheduler starting')

    // Load existing schedules
    await this.loadSchedules()

    // Start the scheduler loop
    this.scheduleLoop()
  }

  async stop(): Promise<void> {
    this.isRunning = false

    // Clear all scheduled jobs
    for (const timeout of this.scheduledJobs.values()) {
      clearTimeout(timeout)
    }
    this.scheduledJobs.clear()

    logger.info('Workflow scheduler stopped')
  }

  private async loadSchedules(): Promise<void> {
    try {
      const { data: schedules, error } = await supabase
        .from('workflow_schedules')
        .select(
          `
          *,
          workflow_rules(id, name, enabled)
        `
        )
        .eq('enabled', true)

      if (error) throw error

      for (const schedule of schedules || []) {
        if (schedule.workflow_rules?.enabled) {
          await this.scheduleJob(schedule)
        }
      }

      logger.info('Loaded workflow schedules', {
        count: schedules?.length || 0,
      })
    } catch (error) {
      logger.error('Failed to load schedules', { error })
    }
  }

  private scheduleLoop(): void {
    if (!this.isRunning) return

    // Check for jobs to run every minute
    setTimeout(async () => {
      await this.checkScheduledJobs()
      this.scheduleLoop()
    }, 60000) // 1 minute
  }

  private async checkScheduledJobs(): Promise<void> {
    try {
      const now = new Date()

      // Get jobs that are due to run
      const { data: dueJobs, error } = await supabase
        .from('workflow_schedules')
        .select(
          `
          *,
          workflow_rules(id, name, enabled)
        `
        )
        .eq('enabled', true)
        .lte('next_run_at', now.toISOString())

      if (error) throw error

      for (const job of dueJobs || []) {
        if (job.workflow_rules?.enabled) {
          await this.executeScheduledJob(job)
        }
      }
    } catch (error) {
      logger.error('Failed to check scheduled jobs', { error })
    }
  }

  private async executeScheduledJob(job: ScheduledJob): Promise<void> {
    try {
      const workflowEngine = WorkflowAutomationEngine.getInstance()

      // Execute the workflow
      const executionId = await workflowEngine.executeWorkflow(
        job.workflowId,
        {
          scheduledJob: true,
          scheduleId: job.id,
          executedAt: new Date().toISOString(),
        },
        'schedule'
      )

      // Update execution count
      await supabase
        .from('workflow_schedules')
        .update({
          execution_count: (job as any).execution_count + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      // Calculate next run time
      const nextRunAt = this.calculateNextRun(job)

      if (nextRunAt) {
        await supabase
          .from('workflow_schedules')
          .update({
            next_run_at: nextRunAt.toISOString(),
          })
          .eq('id', job.id)

        // Reschedule if needed
        await this.scheduleJob({ ...job, nextRunAt })
      } else {
        // Disable schedule if no next run (e.g., one-time job)
        await supabase
          .from('workflow_schedules')
          .update({ enabled: false })
          .eq('id', job.id)
      }

      logger.info('Scheduled workflow executed', {
        scheduleId: job.id,
        workflowId: job.workflowId,
        executionId,
        nextRun: nextRunAt?.toISOString(),
      })
    } catch (error) {
      logger.error('Failed to execute scheduled job', {
        error,
        scheduleId: job.id,
        workflowId: job.workflowId,
      })
    }
  }

  private async scheduleJob(job: ScheduledJob): Promise<void> {
    // Clear existing schedule for this job
    const existingTimeout = this.scheduledJobs.get(job.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const now = new Date()
    const delay = job.nextRunAt.getTime() - now.getTime()

    if (delay <= 0) {
      // Job is overdue, execute immediately
      await this.executeScheduledJob(job)
      return
    }

    // Schedule for future execution
    const timeout = setTimeout(async () => {
      await this.executeScheduledJob(job)
      this.scheduledJobs.delete(job.id)
    }, delay)

    this.scheduledJobs.set(job.id, timeout)

    logger.debug('Job scheduled', {
      scheduleId: job.id,
      workflowId: job.workflowId,
      nextRun: job.nextRunAt.toISOString(),
      delay: `${Math.round(delay / 1000)}s`,
    })
  }

  private calculateNextRun(job: ScheduledJob): Date | null {
    const { scheduleType, scheduleConfig } = job
    const now = new Date()

    switch (scheduleType) {
      case 'interval':
        // Interval in seconds
        const intervalSeconds = scheduleConfig.interval || 3600 // default 1 hour
        return new Date(now.getTime() + intervalSeconds * 1000)

      case 'cron':
        // Parse cron expression and calculate next run
        return this.calculateCronNext(scheduleConfig.cron, job.timezone)

      case 'once':
        // One-time execution, no next run
        return null

      default:
        logger.error('Unknown schedule type', { scheduleType })
        return null
    }
  }

  private calculateCronNext(
    cronExpression: string,
    timezone: string
  ): Date | null {
    try {
      // Simple cron parser - in production, use a proper cron library
      const [minute, hour, dayOfMonth, month, dayOfWeek] =
        cronExpression.split(' ')

      const now = new Date()
      const next = new Date(now)

      // Simplified cron calculation for common patterns
      if (
        minute === '0' &&
        hour === '0' &&
        dayOfMonth === '*' &&
        month === '*' &&
        dayOfWeek === '*'
      ) {
        // Daily at midnight
        next.setHours(0, 0, 0, 0)
        next.setDate(next.getDate() + 1)
        return next
      }

      if (
        minute === '0' &&
        hour !== '*' &&
        dayOfMonth === '*' &&
        month === '*' &&
        dayOfWeek === '*'
      ) {
        // Hourly at specific hour
        const targetHour = parseInt(hour)
        next.setHours(targetHour, 0, 0, 0)
        if (next <= now) {
          next.setDate(next.getDate() + 1)
        }
        return next
      }

      // For complex cron expressions, use a proper cron library
      // This is a simplified implementation
      logger.warn('Complex cron expression not fully supported', {
        cronExpression,
      })
      return null
    } catch (error) {
      logger.error('Failed to parse cron expression', { error, cronExpression })
      return null
    }
  }

  async createSchedule(
    workflowId: string,
    scheduleType: 'cron' | 'interval' | 'once',
    scheduleConfig: any,
    timezone: string = 'UTC'
  ): Promise<string> {
    try {
      const nextRunAt = this.calculateNextRun({
        id: '',
        workflowId,
        scheduleType,
        scheduleConfig,
        nextRunAt: new Date(),
        timezone,
        enabled: true,
      })

      if (!nextRunAt) {
        throw new Error('Unable to calculate next run time')
      }

      const { data, error } = await supabase
        .from('workflow_schedules')
        .insert({
          workflow_id: workflowId,
          schedule_type: scheduleType,
          schedule_config: scheduleConfig,
          next_run_at: nextRunAt.toISOString(),
          timezone,
          enabled: true,
          execution_count: 0,
        })
        .select('id')
        .single()

      if (error) throw error

      const scheduleId = data.id

      // Schedule the job
      await this.scheduleJob({
        id: scheduleId,
        workflowId,
        scheduleType,
        scheduleConfig,
        nextRunAt,
        timezone,
        enabled: true,
      })

      logger.info('Schedule created', {
        scheduleId,
        workflowId,
        scheduleType,
        nextRun: nextRunAt.toISOString(),
      })

      return scheduleId
    } catch (error) {
      logger.error('Failed to create schedule', { error, workflowId })
      throw error
    }
  }

  async updateSchedule(
    scheduleId: string,
    updates: Partial<{
      scheduleConfig: any
      timezone: string
      enabled: boolean
    }>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_schedules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)

      if (error) throw error

      // Reload the updated schedule
      const { data: schedule } = await supabase
        .from('workflow_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()

      if (schedule) {
        if (schedule.enabled) {
          await this.scheduleJob(schedule)
        } else {
          // Remove from scheduler if disabled
          const existingTimeout = this.scheduledJobs.get(scheduleId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            this.scheduledJobs.delete(scheduleId)
          }
        }
      }

      logger.info('Schedule updated', { scheduleId, updates })
    } catch (error) {
      logger.error('Failed to update schedule', { error, scheduleId })
      throw error
    }
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      // Remove from scheduler
      const existingTimeout = this.scheduledJobs.get(scheduleId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        this.scheduledJobs.delete(scheduleId)
      }

      // Delete from database
      const { error } = await supabase
        .from('workflow_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      logger.info('Schedule deleted', { scheduleId })
    } catch (error) {
      logger.error('Failed to delete schedule', { error, scheduleId })
      throw error
    }
  }

  getActiveJobs(): string[] {
    return Array.from(this.scheduledJobs.keys())
  }

  isJobScheduled(scheduleId: string): boolean {
    return this.scheduledJobs.has(scheduleId)
  }
}
