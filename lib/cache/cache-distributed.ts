import { createHash } from 'crypto'
import { cacheCoordinator } from './cache-coordinator'
import { cacheAnalytics } from './cache-analytics'

// Node Types in Distributed Cache
export type NodeType = 'primary' | 'replica' | 'edge' | 'coordinator'

// Consistency Levels
export type ConsistencyLevel = 'strong' | 'eventual' | 'weak'

// Replication Strategy
export type ReplicationStrategy = 'master-slave' | 'master-master' | 'ring' | 'gossip'

// Node Configuration
interface CacheNode {
  id: string
  type: NodeType
  endpoint: string
  region: string
  weight: number
  health: 'healthy' | 'degraded' | 'offline'
  lastHeartbeat: number
  capacity: {
    memory: number
    cpu: number
    network: number
  }
  stats: {
    hitRate: number
    latency: number
    throughput: number
    errorRate: number
  }
}

// Distributed Operation
interface DistributedOperation {
  id: string
  type: 'get' | 'set' | 'delete' | 'invalidate'
  key: string
  data?: any
  ttl?: number
  consistency: ConsistencyLevel
  nodes: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  retryCount: number
  maxRetries: number
  startTime: number
  completedNodes: string[]
  failedNodes: string[]
}

// Conflict Resolution
interface ConflictResolution {
  strategy: 'last_write_wins' | 'version_vector' | 'custom'
  resolver?: (values: any[]) => any
}

// Distributed Cache Coordinator
export class DistributedCacheCoordinator {
  private nodes = new Map<string, CacheNode>()
  private nodeRing: string[] = [] // For consistent hashing
  private operations = new Map<string, DistributedOperation>()
  private replicationFactor = 2
  private consistencyLevel: ConsistencyLevel = 'eventual'
  private conflictResolution: ConflictResolution = { strategy: 'last_write_wins' }
  
  constructor() {
    this.initializeCluster()
    this.startHeartbeat()
    this.startOperationProcessor()
  }

  // Add node to cluster
  addNode(node: Omit<CacheNode, 'lastHeartbeat'>): void {
    const fullNode: CacheNode = {
      ...node,
      lastHeartbeat: Date.now()
    }
    
    this.nodes.set(node.id, fullNode)
    this.rebuildNodeRing()
    
    console.log(`📡 Node ${node.id} added to cluster (${node.type} in ${node.region})`)
  }

  // Remove node from cluster
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId)
    this.rebuildNodeRing()
    
    console.log(`📡 Node ${nodeId} removed from cluster`)
  }

  // Distributed get operation
  async distributedGet<T>(key: string, consistency: ConsistencyLevel = this.consistencyLevel): Promise<T | null> {
    const targetNodes = this.selectNodes(key, consistency === 'strong' ? this.replicationFactor : 1)
    
    if (targetNodes.length === 0) {
      throw new Error('No healthy nodes available')
    }

    const operation: DistributedOperation = {
      id: this.generateOperationId(),
      type: 'get',
      key,
      consistency,
      nodes: targetNodes,
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      startTime: Date.now(),
      completedNodes: [],
      failedNodes: []
    }

    return this.executeDistributedOperation<T>(operation)
  }

  // Distributed set operation
  async distributedSet<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    consistency: ConsistencyLevel = this.consistencyLevel
  ): Promise<void> {
    const targetNodes = this.selectNodes(key, this.replicationFactor)
    
    if (targetNodes.length === 0) {
      throw new Error('No healthy nodes available')
    }

    const operation: DistributedOperation = {
      id: this.generateOperationId(),
      type: 'set',
      key,
      data,
      ttl,
      consistency,
      nodes: targetNodes,
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      startTime: Date.now(),
      completedNodes: [],
      failedNodes: []
    }

    await this.executeDistributedOperation(operation)
  }

  // Distributed invalidation
  async distributedInvalidate(pattern: string | string[]): Promise<number> {
    const allNodes = Array.from(this.nodes.keys()).filter(nodeId => 
      this.nodes.get(nodeId)!.health === 'healthy'
    )

    if (allNodes.length === 0) {
      throw new Error('No healthy nodes available for invalidation')
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern]
    let totalInvalidated = 0

    for (const pat of patterns) {
      const operation: DistributedOperation = {
        id: this.generateOperationId(),
        type: 'invalidate',
        key: pat,
        consistency: 'eventual', // Invalidation can be eventually consistent
        nodes: allNodes,
        status: 'pending',
        retryCount: 0,
        maxRetries: 1,
        startTime: Date.now(),
        completedNodes: [],
        failedNodes: []
      }

      const result = await this.executeDistributedOperation<number>(operation)
      totalInvalidated += result || 0
    }

    return totalInvalidated
  }

  // Bulk operations for better performance
  async distributedMGet<T>(keys: string[]): Promise<Map<string, T | null>> {
    const nodeOperations = new Map<string, string[]>()
    
    // Group keys by target nodes
    keys.forEach(key => {
      const targetNodes = this.selectNodes(key, 1) // Single node for eventual consistency
      const primaryNode = targetNodes[0]
      
      if (primaryNode) {
        if (!nodeOperations.has(primaryNode)) {
          nodeOperations.set(primaryNode, [])
        }
        nodeOperations.get(primaryNode)!.push(key)
      }
    })

    // Execute operations in parallel
    const results = new Map<string, T | null>()
    const promises = Array.from(nodeOperations.entries()).map(async ([nodeId, nodeKeys]) => {
      try {
        const nodeResults = await this.executeBatchGet<T>(nodeId, nodeKeys)
        nodeResults.forEach((value, key) => {
          results.set(key, value)
        })
      } catch (error) {
        console.error(`Batch get failed for node ${nodeId}:`, error)
        // Set failed keys to null
        nodeKeys.forEach(key => results.set(key, null))
      }
    })

    await Promise.allSettled(promises)
    return results
  }

  async distributedMSet<T>(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    const nodeOperations = new Map<string, typeof entries>()
    
    // Group entries by target nodes
    entries.forEach(entry => {
      const targetNodes = this.selectNodes(entry.key, this.replicationFactor)
      
      targetNodes.forEach(nodeId => {
        if (!nodeOperations.has(nodeId)) {
          nodeOperations.set(nodeId, [])
        }
        nodeOperations.get(nodeId)!.push(entry)
      })
    })

    // Execute operations in parallel
    const promises = Array.from(nodeOperations.entries()).map(async ([nodeId, nodeEntries]) => {
      try {
        await this.executeBatchSet(nodeId, nodeEntries)
      } catch (error) {
        console.error(`Batch set failed for node ${nodeId}:`, error)
        throw error
      }
    })

    await Promise.all(promises)
  }

  // Cluster rebalancing
  async rebalanceCluster(): Promise<void> {
    console.log('🔄 Starting cluster rebalancing')
    
    const unhealthyNodes = Array.from(this.nodes.values())
      .filter(node => node.health !== 'healthy')
      .map(node => node.id)

    if (unhealthyNodes.length === 0) {
      console.log('✅ Cluster is already balanced')
      return
    }

    // Redistribute data from unhealthy nodes
    for (const nodeId of unhealthyNodes) {
      await this.redistributeNodeData(nodeId)
    }

    // Update node ring
    this.rebuildNodeRing()
    
    console.log(`✅ Cluster rebalancing completed - redistributed data from ${unhealthyNodes.length} nodes`)
  }

  // Conflict resolution for concurrent updates
  async resolveConflicts(key: string, conflictingValues: Array<{ value: any; timestamp: number; nodeId: string }>): Promise<any> {
    switch (this.conflictResolution.strategy) {
      case 'last_write_wins':
        return conflictingValues.sort((a, b) => b.timestamp - a.timestamp)[0].value

      case 'version_vector':
        // Simplified version vector resolution
        return this.resolveWithVersionVector(conflictingValues)

      case 'custom':
        if (this.conflictResolution.resolver) {
          return this.conflictResolution.resolver(conflictingValues.map(cv => cv.value))
        }
        // Fallback to last write wins
        return conflictingValues.sort((a, b) => b.timestamp - a.timestamp)[0].value

      default:
        return conflictingValues[0].value
    }
  }

  // Cluster health monitoring
  getClusterHealth(): {
    totalNodes: number
    healthyNodes: number
    degradedNodes: number
    offlineNodes: number
    dataDistribution: Map<string, number>
    avgLatency: number
    avgHitRate: number
  } {
    const nodes = Array.from(this.nodes.values())
    
    const healthCounts = {
      healthy: nodes.filter(n => n.health === 'healthy').length,
      degraded: nodes.filter(n => n.health === 'degraded').length,
      offline: nodes.filter(n => n.health === 'offline').length
    }

    const dataDistribution = new Map<string, number>()
    const avgLatency = nodes.reduce((sum, node) => sum + node.stats.latency, 0) / nodes.length
    const avgHitRate = nodes.reduce((sum, node) => sum + node.stats.hitRate, 0) / nodes.length

    // Simulate data distribution calculation
    nodes.forEach(node => {
      dataDistribution.set(node.id, Math.floor(Math.random() * 1000) + 500)
    })

    return {
      totalNodes: nodes.length,
      healthyNodes: healthCounts.healthy,
      degradedNodes: healthCounts.degraded,
      offlineNodes: healthCounts.offline,
      dataDistribution,
      avgLatency,
      avgHitRate
    }
  }

  // Network partition handling
  async handleNetworkPartition(partitionedNodes: string[]): Promise<void> {
    console.warn(`🚨 Network partition detected affecting ${partitionedNodes.length} nodes`)
    
    // Mark partitioned nodes as degraded
    partitionedNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId)
      if (node) {
        node.health = 'degraded'
      }
    })

    // Redistribute critical data
    await this.redistributeCriticalData(partitionedNodes)
    
    // Update routing to avoid partitioned nodes
    this.rebuildNodeRing()
    
    console.log('🔧 Network partition handling completed')
  }

  // Get cluster topology
  getClusterTopology(): {
    nodes: CacheNode[]
    regions: Map<string, string[]>
    nodeRing: string[]
    replicationFactor: number
  } {
    const nodes = Array.from(this.nodes.values())
    const regions = new Map<string, string[]>()
    
    nodes.forEach(node => {
      if (!regions.has(node.region)) {
        regions.set(node.region, [])
      }
      regions.get(node.region)!.push(node.id)
    })

    return {
      nodes,
      regions,
      nodeRing: [...this.nodeRing],
      replicationFactor: this.replicationFactor
    }
  }

  // Private helper methods
  private initializeCluster(): void {
    // Initialize with local node
    this.addNode({
      id: 'local-primary',
      type: 'primary',
      endpoint: 'localhost:6379',
      region: 'local',
      weight: 100,
      health: 'healthy',
      capacity: {
        memory: 1024,
        cpu: 100,
        network: 1000
      },
      stats: {
        hitRate: 0.8,
        latency: 50,
        throughput: 1000,
        errorRate: 0.01
      }
    })

    // Add edge nodes for simulation
    this.addNode({
      id: 'edge-us-west',
      type: 'edge',
      endpoint: 'us-west.cache.prismy.ai:6379',
      region: 'us-west',
      weight: 80,
      health: 'healthy',
      capacity: {
        memory: 512,
        cpu: 80,
        network: 800
      },
      stats: {
        hitRate: 0.75,
        latency: 30,
        throughput: 800,
        errorRate: 0.02
      }
    })

    this.addNode({
      id: 'edge-asia',
      type: 'edge',
      endpoint: 'asia.cache.prismy.ai:6379',
      region: 'asia',
      weight: 70,
      health: 'healthy',
      capacity: {
        memory: 512,
        cpu: 70,
        network: 600
      },
      stats: {
        hitRate: 0.70,
        latency: 80,
        throughput: 600,
        errorRate: 0.03
      }
    })
  }

  private rebuildNodeRing(): void {
    const healthyNodes = Array.from(this.nodes.entries())
      .filter(([_, node]) => node.health === 'healthy')
      .map(([id, node]) => ({ id, weight: node.weight }))

    // Create consistent hash ring with virtual nodes
    this.nodeRing = []
    const virtualNodeCount = 100

    healthyNodes.forEach(({ id, weight }) => {
      const nodeCount = Math.floor((weight / 100) * virtualNodeCount)
      
      for (let i = 0; i < nodeCount; i++) {
        const virtualNodeId = `${id}:${i}`
        this.nodeRing.push(virtualNodeId)
      }
    })

    // Sort by hash for consistent ordering
    this.nodeRing.sort((a, b) => {
      const hashA = this.hashString(a)
      const hashB = this.hashString(b)
      return hashA.localeCompare(hashB)
    })

    console.log(`🔄 Node ring rebuilt with ${this.nodeRing.length} virtual nodes`)
  }

  private selectNodes(key: string, count: number): string[] {
    if (this.nodeRing.length === 0) {
      return []
    }

    const hash = this.hashString(key)
    const selectedNodes = new Set<string>()
    
    // Find starting position in ring
    let startIndex = 0
    for (let i = 0; i < this.nodeRing.length; i++) {
      if (this.hashString(this.nodeRing[i]) >= hash) {
        startIndex = i
        break
      }
    }

    // Select nodes walking clockwise around the ring
    let index = startIndex
    while (selectedNodes.size < count && selectedNodes.size < this.nodes.size) {
      const virtualNodeId = this.nodeRing[index]
      const realNodeId = virtualNodeId.split(':')[0]
      
      const node = this.nodes.get(realNodeId)
      if (node && node.health === 'healthy') {
        selectedNodes.add(realNodeId)
      }
      
      index = (index + 1) % this.nodeRing.length
      
      // Prevent infinite loop
      if (index === startIndex && selectedNodes.size === 0) {
        break
      }
    }

    return Array.from(selectedNodes)
  }

  private async executeDistributedOperation<T>(operation: DistributedOperation): Promise<T | null> {
    operation.status = 'in_progress'
    this.operations.set(operation.id, operation)

    try {
      const promises = operation.nodes.map(async nodeId => {
        try {
          const result = await this.executeNodeOperation<T>(nodeId, operation)
          operation.completedNodes.push(nodeId)
          return result
        } catch (error) {
          operation.failedNodes.push(nodeId)
          console.error(`Operation failed on node ${nodeId}:`, error)
          return null
        }
      })

      const results = await Promise.allSettled(promises)
      const successfulResults = results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<T>).value)

      // Handle consistency requirements
      if (operation.consistency === 'strong') {
        if (operation.completedNodes.length < Math.ceil(operation.nodes.length / 2) + 1) {
          throw new Error('Failed to achieve strong consistency - insufficient successful operations')
        }
      }

      operation.status = 'completed'
      
      // Return result based on operation type
      if (operation.type === 'get') {
        return successfulResults.length > 0 ? successfulResults[0] : null
      } else if (operation.type === 'invalidate') {
        return successfulResults.reduce((sum: number, count: any) => sum + (count || 0), 0) as T
      }
      
      return null

    } catch (error) {
      operation.status = 'failed'
      throw error
    } finally {
      // Clean up operation after 5 minutes
      setTimeout(() => {
        this.operations.delete(operation.id)
      }, 5 * 60 * 1000)
    }
  }

  private async executeNodeOperation<T>(nodeId: string, operation: DistributedOperation): Promise<T | null> {
    const node = this.nodes.get(nodeId)
    if (!node || node.health !== 'healthy') {
      throw new Error(`Node ${nodeId} is not healthy`)
    }

    // For local node, use cache coordinator
    if (nodeId === 'local-primary') {
      switch (operation.type) {
        case 'get':
          return await cacheCoordinator.get<T>(operation.key)
        
        case 'set':
          await cacheCoordinator.set(operation.key, operation.data, operation.ttl)
          return null
        
        case 'invalidate':
          const count = await cacheCoordinator.invalidate(operation.key)
          return count as T
        
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`)
      }
    }

    // For remote nodes, simulate network operation
    await this.simulateNetworkDelay(node.stats.latency)
    
    // Simulate operation success/failure based on error rate
    if (Math.random() < node.stats.errorRate) {
      throw new Error(`Simulated network error for node ${nodeId}`)
    }

    // Return simulated result
    switch (operation.type) {
      case 'get':
        return Math.random() < node.stats.hitRate ? { data: 'simulated' } as T : null
      
      case 'set':
        return null
      
      case 'invalidate':
        return Math.floor(Math.random() * 10) as T
      
      default:
        return null
    }
  }

  private async executeBatchGet<T>(nodeId: string, keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    
    // For local node
    if (nodeId === 'local-primary') {
      const batchResults = await cacheCoordinator.mget<T>(keys)
      return batchResults
    }

    // For remote nodes, simulate batch operation
    const node = this.nodes.get(nodeId)
    if (node) {
      await this.simulateNetworkDelay(node.stats.latency)
      
      keys.forEach(key => {
        const hit = Math.random() < node.stats.hitRate
        results.set(key, hit ? { data: 'simulated' } as T : null)
      })
    }

    return results
  }

  private async executeBatchSet<T>(nodeId: string, entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    // For local node
    if (nodeId === 'local-primary') {
      await cacheCoordinator.mset(entries)
      return
    }

    // For remote nodes, simulate batch operation
    const node = this.nodes.get(nodeId)
    if (node) {
      await this.simulateNetworkDelay(node.stats.latency)
      
      if (Math.random() < node.stats.errorRate) {
        throw new Error(`Batch set failed on node ${nodeId}`)
      }
    }
  }

  private async redistributeNodeData(nodeId: string): Promise<void> {
    console.log(`🔄 Redistributing data from node ${nodeId}`)
    
    // In a real implementation, this would:
    // 1. Get all keys from the failing node
    // 2. Find new target nodes for each key
    // 3. Copy data to new nodes
    // 4. Verify successful replication
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate work
    console.log(`✅ Data redistribution completed for node ${nodeId}`)
  }

  private async redistributeCriticalData(partitionedNodes: string[]): Promise<void> {
    console.log(`🔄 Redistributing critical data from ${partitionedNodes.length} partitioned nodes`)
    
    // Simulate critical data redistribution
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('✅ Critical data redistribution completed')
  }

  private resolveWithVersionVector(conflictingValues: Array<{ value: any; timestamp: number; nodeId: string }>): any {
    // Simplified version vector resolution
    // In practice, this would use actual version vectors
    return conflictingValues.sort((a, b) => b.timestamp - a.timestamp)[0].value
  }

  private hashString(str: string): string {
    return createHash('md5').update(str).digest('hex')
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async simulateNetworkDelay(latencyMs: number): Promise<void> {
    const delay = latencyMs + Math.random() * latencyMs * 0.2 // Add 20% jitter
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private startHeartbeat(): void {
    // Send heartbeat every 5 seconds
    setInterval(() => {
      this.sendHeartbeat()
    }, 5000)
  }

  private sendHeartbeat(): void {
    const now = Date.now()
    
    // Update heartbeat for all nodes and check health
    this.nodes.forEach((node, nodeId) => {
      if (nodeId === 'local-primary') {
        node.lastHeartbeat = now
        node.health = 'healthy'
      } else {
        // Simulate heartbeat response for remote nodes
        const timeSinceLastHeartbeat = now - node.lastHeartbeat
        
        if (timeSinceLastHeartbeat > 30000) { // 30 seconds
          node.health = 'offline'
        } else if (timeSinceLastHeartbeat > 15000) { // 15 seconds
          node.health = 'degraded'
        } else {
          node.health = 'healthy'
          node.lastHeartbeat = now - Math.random() * 5000 // Simulate jitter
        }
      }
    })
  }

  private startOperationProcessor(): void {
    // Process failed operations every 10 seconds
    setInterval(() => {
      this.processFailedOperations()
    }, 10000)
  }

  private processFailedOperations(): void {
    const now = Date.now()
    const failedOperations = Array.from(this.operations.values())
      .filter(op => op.status === 'failed' && op.retryCount < op.maxRetries)

    failedOperations.forEach(async operation => {
      if (now - operation.startTime > 30000) { // Retry after 30 seconds
        operation.retryCount++
        operation.status = 'pending'
        operation.completedNodes = []
        operation.failedNodes = []
        
        try {
          await this.executeDistributedOperation(operation)
        } catch (error) {
          console.error(`Retry failed for operation ${operation.id}:`, error)
        }
      }
    })
  }
}

// Global distributed cache coordinator
export const distributedCache = new DistributedCacheCoordinator()