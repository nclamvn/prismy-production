import { NextRequest, NextResponse } from 'next/server'
import { cacheCoordinator } from '@/lib/cache/cache-coordinator'
import { cacheAnalytics } from '@/lib/cache/cache-analytics'
import { cacheInvalidator } from '@/lib/cache/cache-invalidation'
import { cacheWarmingSystem } from '@/lib/cache/cache-warming'
import { cacheCompression } from '@/lib/cache/cache-compression'
import { cacheHealthMonitor } from '@/lib/cache/cache-health'
import { distributedCache } from '@/lib/cache/cache-distributed'
import { cacheBenchmark } from '@/lib/cache/cache-benchmarking'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'health':
        return NextResponse.json(await getHealthDashboard())
      
      case 'analytics':
        return NextResponse.json(await getAnalyticsDashboard())
      
      case 'warming':
        return NextResponse.json(await getWarmingDashboard())
      
      case 'compression':
        return NextResponse.json(await getCompressionDashboard())
      
      case 'distributed':
        return NextResponse.json(await getDistributedDashboard())
      
      case 'benchmark':
        return NextResponse.json(await getBenchmarkDashboard())
      
      default:
        return NextResponse.json(await getComprehensiveDashboard())
    }

  } catch (error) {
    console.error('Cache dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load cache dashboard' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'invalidate':
        const invalidated = await cacheInvalidator.invalidateByEvent(
          params.event || 'system_maintenance',
          params.context || {}
        )
        return NextResponse.json({ success: true, invalidated })

      case 'warm':
        if (params.type === 'predictive') {
          await cacheWarmingSystem.warmPredictively(params.hours || 2)
        } else if (params.type === 'translations') {
          await cacheWarmingSystem.warmTranslationPatterns()
        }
        return NextResponse.json({ success: true })

      case 'benchmark':
        const benchmarkResult = await cacheBenchmark.runBenchmark(params.config)
        return NextResponse.json({ success: true, result: benchmarkResult })

      case 'failover':
        await cacheHealthMonitor.triggerFailover(params.strategy, params.duration)
        return NextResponse.json({ success: true })

      case 'rebalance':
        await distributedCache.rebalanceCluster()
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Cache dashboard action error:', error)
    return NextResponse.json(
      { error: 'Failed to execute cache action' },
      { status: 500 }
    )
  }
}

// Dashboard data functions
async function getHealthDashboard() {
  const healthChecks = await cacheHealthMonitor.performHealthCheck()
  const currentHealth = cacheHealthMonitor.getCurrentHealth()
  const trends = cacheHealthMonitor.getHealthTrends()
  const recommendations = cacheHealthMonitor.getFailoverRecommendations()

  return {
    title: 'Cache Health Dashboard',
    timestamp: Date.now(),
    overall: currentHealth,
    checks: Object.fromEntries(healthChecks),
    trends: Object.fromEntries(trends.trends),
    incidents: trends.incidents,
    recommendations,
    actions: [
      { name: 'Trigger Failover', action: 'failover', dangerous: true },
      { name: 'Force Recovery', action: 'recovery' },
      { name: 'Run Health Check', action: 'health_check' }
    ]
  }
}

async function getAnalyticsDashboard() {
  const realtimeMetrics = cacheAnalytics.getRealtimeMetrics()
  const report = cacheAnalytics.generateReport()
  const healthScore = cacheAnalytics.getHealthScore()
  const patterns = cacheAnalytics.analyzePatterns(7)
  const optimizations = cacheAnalytics.getOptimizationSuggestions()

  return {
    title: 'Cache Analytics Dashboard',
    timestamp: Date.now(),
    realtime: realtimeMetrics,
    summary: report.summary,
    trends: report.trends,
    hotspots: report.hotspots,
    inefficiencies: report.inefficiencies,
    healthScore,
    patterns: patterns.patterns.slice(0, 10),
    insights: patterns.insights,
    optimizations,
    recommendations: report.recommendations
  }
}

async function getWarmingDashboard() {
  const warmingStats = cacheWarmingSystem.getWarmingStats()
  const recommendations = cacheWarmingSystem.getWarmingRecommendations()

  return {
    title: 'Cache Warming Dashboard',
    timestamp: Date.now(),
    stats: warmingStats,
    recommendations,
    actions: [
      { name: 'Warm Translations', action: 'warm', params: { type: 'translations' } },
      { name: 'Predictive Warming', action: 'warm', params: { type: 'predictive', hours: 2 } },
      { name: 'User Data Warming', action: 'warm_user', params: { selective: true } }
    ]
  }
}

async function getCompressionDashboard() {
  const analytics = cacheCompression.getCompressionAnalytics()
  const dedupStats = cacheCompression.getDeduplicationStats()

  return {
    title: 'Cache Compression Dashboard',
    timestamp: Date.now(),
    stats: analytics.stats,
    efficiency: analytics.efficiency,
    recommendations: analytics.recommendations,
    deduplication: dedupStats,
    actions: [
      { name: 'Run Compression Test', action: 'test_compression' },
      { name: 'Optimize Settings', action: 'optimize_compression' },
      { name: 'Clear Dedup Cache', action: 'clear_dedup' }
    ]
  }
}

async function getDistributedDashboard() {
  const clusterHealth = distributedCache.getClusterHealth()
  const topology = distributedCache.getClusterTopology()

  return {
    title: 'Distributed Cache Dashboard',
    timestamp: Date.now(),
    cluster: {
      health: clusterHealth,
      topology: {
        totalNodes: topology.nodes.length,
        regions: Object.fromEntries(topology.regions),
        replicationFactor: topology.replicationFactor
      },
      nodes: topology.nodes.map(node => ({
        id: node.id,
        type: node.type,
        region: node.region,
        health: node.health,
        stats: node.stats
      }))
    },
    actions: [
      { name: 'Rebalance Cluster', action: 'rebalance' },
      { name: 'Add Node', action: 'add_node' },
      { name: 'Remove Node', action: 'remove_node' },
      { name: 'Test Consistency', action: 'test_consistency' }
    ]
  }
}

async function getBenchmarkDashboard() {
  const history = cacheBenchmark.getBenchmarkHistory()

  return {
    title: 'Cache Benchmark Dashboard',
    timestamp: Date.now(),
    history: history.history.slice(-10), // Last 10 runs
    trends: Object.fromEntries(history.trends),
    quickBenchmarks: [
      {
        name: 'Latency Test',
        config: {
          type: 'latency',
          duration: 30000,
          concurrency: 1,
          dataSize: 'small',
          operations: ['get', 'set']
        }
      },
      {
        name: 'Throughput Test',
        config: {
          type: 'throughput',
          duration: 60000,
          concurrency: 25,
          dataSize: 'medium',
          operations: ['get', 'set', 'mget']
        }
      },
      {
        name: 'Memory Test',
        config: {
          type: 'memory',
          duration: 45000,
          concurrency: 10,
          dataSize: 'large',
          operations: ['set']
        }
      }
    ],
    actions: [
      { name: 'Run Quick Benchmark', action: 'benchmark' },
      { name: 'Run Stress Test', action: 'stress_test' },
      { name: 'Compare Configs', action: 'compare_configs' },
      { name: 'Test Warming', action: 'test_warming' }
    ]
  }
}

async function getComprehensiveDashboard() {
  // Get overview data from all systems
  const health = cacheHealthMonitor.getCurrentHealth()
  const analytics = cacheAnalytics.getRealtimeMetrics()
  const warming = cacheWarmingSystem.getWarmingStats()
  const invalidation = cacheInvalidator.getMetrics()
  const cluster = distributedCache.getClusterHealth()
  const compression = cacheCompression.getCompressionAnalytics()

  return {
    title: 'Comprehensive Cache Dashboard',
    subtitle: 'Extended Caching Infrastructure Overview',
    timestamp: Date.now(),
    version: '2.2.2',
    
    overview: {
      health: {
        status: health.overall,
        score: health.score,
        isInFailover: health.isInFailover
      },
      performance: {
        hitRate: analytics.currentHitRate,
        throughput: analytics.currentThroughput,
        avgResponseTime: analytics.avgResponseTime,
        memoryUsage: analytics.memoryUsage
      },
      cluster: {
        totalNodes: cluster.totalNodes,
        healthyNodes: cluster.healthyNodes,
        avgLatency: cluster.avgLatency,
        avgHitRate: cluster.avgHitRate
      }
    },

    systems: {
      coordinator: {
        name: 'Multi-Layer Cache Coordinator',
        status: 'active',
        description: 'Manages memory and Redis cache layers with intelligent fallback'
      },
      invalidation: {
        name: 'Smart Invalidation System',
        status: 'active',
        queueSize: invalidation.queueSize,
        successRate: (invalidation.successfulInvalidations / invalidation.totalInvalidations) * 100 || 0
      },
      analytics: {
        name: 'Real-time Analytics',
        status: 'active',
        description: 'Monitors performance, identifies patterns, and provides optimization insights'
      },
      warming: {
        name: 'Predictive Warming',
        status: warming.isWarming ? 'warming' : 'standby',
        queueSize: warming.queueSize,
        successRate: warming.successRate * 100
      },
      compression: {
        name: 'Intelligent Compression',
        status: 'active',
        avgRatio: compression.efficiency.avgCompressionRatio,
        deduplication: compression.efficiency.deduplicationEfficiency > 0
      },
      distributed: {
        name: 'Distributed Coordination',
        status: cluster.healthyNodes > 0 ? 'active' : 'degraded',
        nodes: cluster.healthyNodes,
        regions: cluster.dataDistribution.size
      },
      health: {
        name: 'Health Monitoring & Failover',
        status: health.isInFailover ? 'failover' : 'monitoring',
        checksRunning: Object.keys(health.checks).length
      }
    },

    quickActions: [
      {
        category: 'Performance',
        actions: [
          { name: 'Run Performance Benchmark', action: 'benchmark', type: 'primary' },
          { name: 'Warm Popular Content', action: 'warm', type: 'secondary' },
          { name: 'Clear Cache', action: 'invalidate', type: 'danger' }
        ]
      },
      {
        category: 'Health',
        actions: [
          { name: 'Run Health Check', action: 'health', type: 'primary' },
          { name: 'View Detailed Analytics', action: 'analytics', type: 'secondary' },
          { name: 'Export Metrics', action: 'export', type: 'secondary' }
        ]
      },
      {
        category: 'Cluster',
        actions: [
          { name: 'Rebalance Cluster', action: 'rebalance', type: 'primary' },
          { name: 'Test Failover', action: 'failover', type: 'danger' },
          { name: 'View Topology', action: 'topology', type: 'secondary' }
        ]
      }
    ],

    alerts: await generateAlerts(health, analytics, cluster),
    
    metrics: {
      lastUpdated: Date.now(),
      updateInterval: 30000, // 30 seconds
      retention: '7 days'
    }
  }
}

async function generateAlerts(health: any, analytics: any, cluster: any) {
  const alerts = []

  // Health alerts
  if (health.score < 50) {
    alerts.push({
      type: 'critical',
      title: 'Cache System Critical',
      message: `Overall health score is ${health.score}. Immediate action required.`,
      action: 'health'
    })
  } else if (health.score < 75) {
    alerts.push({
      type: 'warning',
      title: 'Cache Performance Degraded',
      message: `Health score is ${health.score}. Review recommended actions.`,
      action: 'health'
    })
  }

  // Performance alerts
  if (analytics.currentHitRate < 0.6) {
    alerts.push({
      type: 'warning',
      title: 'Low Cache Hit Rate',
      message: `Hit rate is ${(analytics.currentHitRate * 100).toFixed(1)}%. Consider cache warming.`,
      action: 'warm'
    })
  }

  if (analytics.avgResponseTime > 200) {
    alerts.push({
      type: 'warning',
      title: 'High Response Times',
      message: `Average response time is ${analytics.avgResponseTime.toFixed(0)}ms. Enable compression.`,
      action: 'compression'
    })
  }

  if (analytics.memoryUsage > 90) {
    alerts.push({
      type: 'critical',
      title: 'High Memory Usage',
      message: `Memory usage is ${analytics.memoryUsage.toFixed(1)}%. Risk of evictions.`,
      action: 'invalidate'
    })
  }

  // Cluster alerts
  if (cluster.healthyNodes < cluster.totalNodes) {
    alerts.push({
      type: 'warning',
      title: 'Cluster Nodes Offline',
      message: `${cluster.totalNodes - cluster.healthyNodes} nodes are offline. Cluster may be degraded.`,
      action: 'rebalance'
    })
  }

  return alerts
}