/**
 * Application Metrics Collection
 * Custom metrics for business and technical monitoring
 */

import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { NextRequest } from 'next/server';

// ===============================================
// Business Metrics
// ===============================================

// Translation metrics
export const translationCounter = new Counter({
  name: 'prismy_translations_total',
  help: 'Total number of translations processed',
  labelNames: ['source_lang', 'target_lang', 'status', 'tier'],
  registers: [register]
});

export const translationDuration = new Histogram({
  name: 'prismy_translation_duration_seconds',
  help: 'Translation processing duration in seconds',
  labelNames: ['source_lang', 'target_lang', 'model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register]
});

export const translationCharacters = new Counter({
  name: 'prismy_translation_characters_total',
  help: 'Total characters translated',
  labelNames: ['source_lang', 'target_lang', 'tier'],
  registers: [register]
});

// User activity metrics
export const activeUsers = new Gauge({
  name: 'prismy_active_users',
  help: 'Number of active users in the last 5 minutes',
  registers: [register]
});

export const userSignups = new Counter({
  name: 'prismy_user_signups_total',
  help: 'Total number of user signups',
  labelNames: ['plan', 'source'],
  registers: [register]
});

export const userChurn = new Counter({
  name: 'prismy_user_churn_total',
  help: 'Total number of users who churned',
  labelNames: ['plan', 'reason'],
  registers: [register]
});

// Revenue metrics
export const revenue = new Counter({
  name: 'prismy_revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['plan', 'currency', 'type'],
  registers: [register]
});

export const mrr = new Gauge({
  name: 'prismy_mrr',
  help: 'Monthly Recurring Revenue in cents',
  labelNames: ['currency'],
  registers: [register]
});

export const subscriptionCount = new Gauge({
  name: 'prismy_subscriptions_active',
  help: 'Number of active subscriptions',
  labelNames: ['plan', 'status'],
  registers: [register]
});

// Job queue metrics
export const jobsQueued = new Gauge({
  name: 'prismy_jobs_queued',
  help: 'Number of jobs in queue',
  labelNames: ['queue', 'priority'],
  registers: [register]
});

export const jobsProcessed = new Counter({
  name: 'prismy_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['queue', 'status'],
  registers: [register]
});

export const jobDuration = new Histogram({
  name: 'prismy_job_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['queue', 'type'],
  buckets: [1, 5, 10, 30, 60, 300, 600],
  registers: [register]
});

// ===============================================
// Technical Metrics
// ===============================================

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'handler', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'handler', 'status'],
  registers: [register]
});

// Database metrics
export const dbConnectionsActive = new Gauge({
  name: 'prismy_db_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

export const dbConnectionsMax = new Gauge({
  name: 'prismy_db_connections_max',
  help: 'Maximum number of database connections',
  registers: [register]
});

export const dbQueryDuration = new Histogram({
  name: 'prismy_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'prismy_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache', 'operation'],
  registers: [register]
});

export const cacheMisses = new Counter({
  name: 'prismy_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache', 'operation'],
  registers: [register]
});

// External API metrics
export const externalApiCalls = new Counter({
  name: 'prismy_external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['api', 'endpoint', 'status'],
  registers: [register]
});

export const externalApiDuration = new Histogram({
  name: 'prismy_external_api_duration_seconds',
  help: 'External API call duration in seconds',
  labelNames: ['api', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

// ===============================================
// Metric Collection Helpers
// ===============================================

/**
 * Record HTTP request metrics
 */
export function recordHttpMetrics(
  method: string,
  handler: string,
  status: number,
  duration: number
) {
  httpRequestsTotal.labels(method, handler, status.toString()).inc();
  httpRequestDuration.labels(method, handler, status.toString()).observe(duration);
}

/**
 * Record translation metrics
 */
export function recordTranslationMetrics(
  sourceLang: string,
  targetLang: string,
  status: 'success' | 'failure',
  tier: string,
  characterCount: number,
  duration: number,
  model?: string
) {
  translationCounter.labels(sourceLang, targetLang, status, tier).inc();
  if (status === 'success') {
    translationCharacters.labels(sourceLang, targetLang, tier).inc(characterCount);
    translationDuration
      .labels(sourceLang, targetLang, model || 'default')
      .observe(duration);
  }
}

/**
 * Record job metrics
 */
export function recordJobMetrics(
  queue: string,
  type: string,
  status: 'success' | 'failure',
  duration: number
) {
  jobsProcessed.labels(queue, status).inc();
  jobDuration.labels(queue, type).observe(duration);
}

/**
 * Record database query metrics
 */
export function recordDbQueryMetrics(
  operation: string,
  table: string,
  duration: number
) {
  dbQueryDuration.labels(operation, table).observe(duration);
}

/**
 * Record cache metrics
 */
export function recordCacheMetrics(
  cache: string,
  operation: string,
  hit: boolean
) {
  if (hit) {
    cacheHits.labels(cache, operation).inc();
  } else {
    cacheMisses.labels(cache, operation).inc();
  }
}

/**
 * Record external API metrics
 */
export function recordExternalApiMetrics(
  api: string,
  endpoint: string,
  status: number,
  duration: number
) {
  externalApiCalls.labels(api, endpoint, status.toString()).inc();
  externalApiDuration.labels(api, endpoint).observe(duration);
}

/**
 * Collect and return all metrics
 */
export async function collectMetrics(format: 'prometheus' | 'json' = 'prometheus') {
  if (format === 'json') {
    const metrics = await register.getMetricsAsJSON();
    return JSON.stringify(metrics);
  }
  
  return register.metrics();
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
  register.clear();
}

/**
 * Initialize metric collection
 */
export async function initializeMetrics() {
  // Set up periodic metric updates
  
  // Update active users every minute
  setInterval(async () => {
    try {
      // This would query your database for active users
      // const count = await getActiveUserCount();
      // activeUsers.set(count);
    } catch (error) {
      console.error('Failed to update active users metric:', error);
    }
  }, 60000);
  
  // Update MRR every hour
  setInterval(async () => {
    try {
      // This would calculate MRR from your billing system
      // const mrrData = await calculateMRR();
      // Object.entries(mrrData).forEach(([currency, amount]) => {
      //   mrr.labels(currency).set(amount);
      // });
    } catch (error) {
      console.error('Failed to update MRR metric:', error);
    }
  }, 3600000);
  
  // Update subscription counts every 5 minutes
  setInterval(async () => {
    try {
      // This would query subscription counts
      // const counts = await getSubscriptionCounts();
      // Object.entries(counts).forEach(([plan, statusCounts]) => {
      //   Object.entries(statusCounts).forEach(([status, count]) => {
      //     subscriptionCount.labels(plan, status).set(count);
      //   });
      // });
    } catch (error) {
      console.error('Failed to update subscription count metric:', error);
    }
  }, 300000);
  
  // Update job queue metrics every 30 seconds
  setInterval(async () => {
    try {
      // This would query job queue status
      // const queueStats = await getQueueStats();
      // Object.entries(queueStats).forEach(([queue, priorities]) => {
      //   Object.entries(priorities).forEach(([priority, count]) => {
      //     jobsQueued.labels(queue, priority).set(count);
      //   });
      // });
    } catch (error) {
      console.error('Failed to update job queue metrics:', error);
    }
  }, 30000);
  
  // Update database connection metrics every 30 seconds
  setInterval(async () => {
    try {
      // This would query database pool status
      // const poolStats = await getDbPoolStats();
      // dbConnectionsActive.set(poolStats.active);
      // dbConnectionsMax.set(poolStats.max);
    } catch (error) {
      console.error('Failed to update database connection metrics:', error);
    }
  }, 30000);
}

/**
 * Middleware for automatic HTTP metric collection
 */
export function metricsMiddleware(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const method = req.method;
    const handler = req.nextUrl.pathname;
    
    try {
      const response = await handler(req);
      const duration = (Date.now() - start) / 1000;
      
      recordHttpMetrics(method, handler, response.status, duration);
      
      return response;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      recordHttpMetrics(method, handler, 500, duration);
      throw error;
    }
  };
}