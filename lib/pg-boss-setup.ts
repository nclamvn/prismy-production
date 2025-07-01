/**
 * PG-Boss Setup and Configuration
 * Initializes and manages the job queue system
 */

import PgBoss from 'pg-boss'
import { logger } from '@/lib/logger'

let bossInstance: PgBoss | null = null
let isInitialized = false

export interface JobQueueConfig {
  connectionString: string
  schema?: string
  poolSize?: number
  retentionDays?: number
  archiveCompletedAfterSeconds?: number
  newJobCheckInterval?: number
  expireCheckInterval?: number
}

export async function initializePgBoss(config?: Partial<JobQueueConfig>): Promise<PgBoss> {
  if (bossInstance && isInitialized) {
    return bossInstance
  }

  try {
    const defaultConfig: JobQueueConfig = {
      connectionString: process.env.DATABASE_URL || '',
      schema: 'pgboss',
      poolSize: 5,
      retentionDays: 7,
      archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
      newJobCheckInterval: 2000, // 2 seconds
      expireCheckInterval: 60000, // 1 minute
    }

    const finalConfig = { ...defaultConfig, ...config }

    if (!finalConfig.connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    bossInstance = new PgBoss({
      connectionString: finalConfig.connectionString,
      schema: finalConfig.schema,
      max: finalConfig.poolSize,
      deleteAfterDays: finalConfig.retentionDays,
      archiveCompletedAfterSeconds: finalConfig.archiveCompletedAfterSeconds,
      newJobCheckInterval: finalConfig.newJobCheckInterval,
      expireCheckInterval: finalConfig.expireCheckInterval,
      // Performance optimizations
      noScheduling: false,
      noSupervisor: false,
      monitorStateIntervalSeconds: 30,
    })

    // Event handlers for monitoring
    bossInstance.on('error', (error) => {
      logger.error('PG-Boss error', { error })
    })

    bossInstance.on('monitor-states', (states) => {
      logger.debug('PG-Boss monitor states', { states })
    })

    // Start the boss
    await bossInstance.start()
    isInitialized = true

    logger.info('PG-Boss initialized successfully', {
      schema: finalConfig.schema,
      poolSize: finalConfig.poolSize,
      retentionDays: finalConfig.retentionDays
    })

    return bossInstance

  } catch (error) {
    logger.error('Failed to initialize PG-Boss', { error })
    throw error
  }
}

export async function getPgBossInstance(): Promise<PgBoss> {
  if (!bossInstance || !isInitialized) {
    return await initializePgBoss()
  }
  return bossInstance
}

export async function shutdownPgBoss(): Promise<void> {
  if (bossInstance && isInitialized) {
    try {
      await bossInstance.stop()
      bossInstance = null
      isInitialized = false
      logger.info('PG-Boss shut down successfully')
    } catch (error) {
      logger.error('Error shutting down PG-Boss', { error })
      throw error
    }
  }
}

// Health check function
export async function checkPgBossHealth(): Promise<{
  isHealthy: boolean
  version?: string
  queueStats?: any
  error?: string
}> {
  try {
    if (!bossInstance || !isInitialized) {
      return { isHealthy: false, error: 'PG-Boss not initialized' }
    }

    // Try to get queue stats as a health check
    const queueStats = await Promise.race([
      bossInstance.getQueueSize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      )
    ])

    return {
      isHealthy: true,
      queueStats
    }

  } catch (error) {
    logger.error('PG-Boss health check failed', { error })
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down PG-Boss gracefully...`)
    try {
      await shutdownPgBoss()
      process.exit(0)
    } catch (error) {
      logger.error('Error during graceful shutdown', { error })
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}