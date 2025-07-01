import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Redis connection using Upstash (production-ready serverless Redis)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiting with Redis
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
})

export const redisCache = {
  isHealthy: async (): Promise<boolean> => {
    try {
      await redis.ping()
      return true
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  },
  
  get: async (key: string): Promise<any> => {
    try {
      const value = await redis.get(key)
      return value
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  },
  
  set: async (key: string, value: any, ttl?: number): Promise<boolean> => {
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  },

  del: async (key: string): Promise<boolean> => {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis delete error:', error)
      return false
    }
  },

  // Cache with automatic JSON parsing
  getJSON: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value as string) : null
    } catch (error) {
      console.error('Redis getJSON error:', error)
      return null
    }
  },

  setJSON: async (key: string, value: any, ttl?: number): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await redis.setex(key, ttl, serialized)
      } else {
        await redis.set(key, serialized)
      }
      return true
    } catch (error) {
      console.error('Redis setJSON error:', error)
      return false
    }
  },

  // Increment counter with expiry
  incr: async (key: string, ttl?: number): Promise<number> => {
    try {
      const value = await redis.incr(key)
      if (ttl && value === 1) {
        await redis.expire(key, ttl)
      }
      return value
    } catch (error) {
      console.error('Redis incr error:', error)
      return 0
    }
  },
  
  getConnectionStatus: async () => {
    try {
      const info = await redis.ping()
      return {
        status: info === 'PONG' ? 'connected' : 'disconnected',
        ping: info,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export Redis instance for advanced operations
export { redis }
export default redisCache