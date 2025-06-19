import { deflate, inflate } from 'pako'
import { createHash } from 'crypto'

// Compression Algorithm Types
export type CompressionAlgorithm = 'gzip' | 'brotli' | 'lz4' | 'zstd' | 'snappy'

// Compression Configuration
interface CompressionConfig {
  algorithm: CompressionAlgorithm
  threshold: number // Minimum size in bytes to compress
  level: number // Compression level (1-9)
  enableDeduplication: boolean
  maxCompressionTime: number // Max time in ms to spend compressing
}

// Compression Result
interface CompressionResult {
  data: Buffer | string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: CompressionAlgorithm
  compressionTime: number
  checksum: string
  metadata: {
    compressed: boolean
    deduplication: boolean
    version: string
  }
}

// Deduplication Entry
interface DeduplicationEntry {
  hash: string
  data: Buffer
  refCount: number
  lastAccessed: number
  size: number
}

// Advanced Cache Compression System
export class CacheCompressionManager {
  private config: CompressionConfig
  private deduplicationMap = new Map<string, DeduplicationEntry>()
  private compressionStats = {
    totalCompressions: 0,
    totalDecompressions: 0,
    totalBytesCompressed: 0,
    totalBytesDecompressed: 0,
    avgCompressionRatio: 0,
    avgCompressionTime: 0,
    deduplicationHits: 0,
    deduplicationSavings: 0
  }

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      algorithm: 'gzip',
      threshold: 1024, // 1KB
      level: 6, // Balanced compression
      enableDeduplication: true,
      maxCompressionTime: 100, // 100ms max
      ...config
    }

    this.setupCleanupSchedule()
  }

  // Intelligent compression with algorithm selection
  async compress(data: any, hint?: 'text' | 'json' | 'binary'): Promise<CompressionResult> {
    const startTime = Date.now()
    
    // Serialize data
    const serialized = this.serialize(data)
    const originalSize = Buffer.byteLength(serialized, 'utf8')

    // Skip compression for small data
    if (originalSize < this.config.threshold) {
      return {
        data: serialized,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1.0,
        algorithm: this.config.algorithm,
        compressionTime: 0,
        checksum: this.calculateChecksum(serialized),
        metadata: {
          compressed: false,
          deduplication: false,
          version: '1.0'
        }
      }
    }

    // Check for deduplication opportunity
    if (this.config.enableDeduplication) {
      const dedupResult = await this.tryDeduplication(serialized)
      if (dedupResult) {
        return dedupResult
      }
    }

    // Select optimal algorithm based on data type and size
    const algorithm = this.selectOptimalAlgorithm(serialized, hint, originalSize)
    
    try {
      const compressed = await this.performCompression(serialized, algorithm)
      const compressionTime = Date.now() - startTime

      // Abort if compression takes too long
      if (compressionTime > this.config.maxCompressionTime) {
        console.warn(`Compression timeout for ${algorithm}, returning uncompressed data`)
        return this.createUncompressedResult(serialized, originalSize)
      }

      const compressedSize = compressed.length
      const compressionRatio = compressedSize / originalSize

      // If compression doesn't save significant space, return uncompressed
      if (compressionRatio > 0.9) {
        return this.createUncompressedResult(serialized, originalSize)
      }

      // Store for deduplication
      if (this.config.enableDeduplication && originalSize > 5000) { // Only dedupe larger objects
        this.storeForDeduplication(serialized, compressed)
      }

      // Update statistics
      this.updateCompressionStats(originalSize, compressedSize, compressionTime)

      return {
        data: compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        algorithm,
        compressionTime,
        checksum: this.calculateChecksum(serialized),
        metadata: {
          compressed: true,
          deduplication: false,
          version: '1.0'
        }
      }

    } catch (error) {
      console.error(`Compression failed with ${algorithm}:`, error)
      return this.createUncompressedResult(serialized, originalSize)
    }
  }

  // Decompress data with integrity checking
  async decompress(result: CompressionResult): Promise<any> {
    const startTime = Date.now()

    try {
      let decompressed: string

      if (!result.metadata.compressed) {
        decompressed = result.data as string
      } else if (result.metadata.deduplication) {
        // Handle deduplicated data
        const hash = result.data as string
        const dedupEntry = this.deduplicationMap.get(hash)
        if (!dedupEntry) {
          throw new Error('Deduplication entry not found')
        }
        decompressed = await this.performDecompression(dedupEntry.data, result.algorithm)
        dedupEntry.lastAccessed = Date.now()
        this.compressionStats.deduplicationHits++
      } else {
        decompressed = await this.performDecompression(result.data as Buffer, result.algorithm)
      }

      // Verify integrity
      const checksum = this.calculateChecksum(decompressed)
      if (checksum !== result.checksum) {
        throw new Error('Checksum mismatch - data may be corrupted')
      }

      // Update statistics
      const decompressionTime = Date.now() - startTime
      this.compressionStats.totalDecompressions++
      this.compressionStats.totalBytesDecompressed += result.originalSize

      return this.deserialize(decompressed)

    } catch (error) {
      console.error('Decompression failed:', error)
      throw new Error(`Failed to decompress data: ${error.message}`)
    }
  }

  // Batch compression for multiple items
  async compressBatch(items: Array<{ key: string; data: any; hint?: 'text' | 'json' | 'binary' }>): Promise<Map<string, CompressionResult>> {
    const results = new Map<string, CompressionResult>()
    
    // Process in parallel with concurrency limit
    const concurrency = 5
    const chunks = this.chunkArray(items, concurrency)

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async item => {
        const result = await this.compress(item.data, item.hint)
        results.set(item.key, result)
      })

      await Promise.all(chunkPromises)
    }

    return results
  }

  // Adaptive compression based on performance feedback
  async adaptiveCompress(data: any, performanceTarget: { maxTime: number; minRatio: number }): Promise<CompressionResult> {
    const algorithms: CompressionAlgorithm[] = ['gzip', 'brotli']
    let bestResult: CompressionResult | null = null
    let bestScore = 0

    for (const algorithm of algorithms) {
      const tempConfig = { ...this.config, algorithm }
      const manager = new CacheCompressionManager(tempConfig)
      
      try {
        const result = await manager.compress(data)
        
        // Score based on compression ratio and time
        const timeScore = Math.max(0, (performanceTarget.maxTime - result.compressionTime) / performanceTarget.maxTime)
        const ratioScore = Math.max(0, (1 - result.compressionRatio - performanceTarget.minRatio) / (1 - performanceTarget.minRatio))
        const score = (timeScore + ratioScore) / 2

        if (score > bestScore) {
          bestScore = score
          bestResult = result
        }

      } catch (error) {
        console.warn(`Adaptive compression failed for ${algorithm}:`, error)
        continue
      }
    }

    return bestResult || this.createUncompressedResult(this.serialize(data), Buffer.byteLength(this.serialize(data), 'utf8'))
  }

  // Compression analytics and optimization suggestions
  getCompressionAnalytics(): {
    stats: typeof this.compressionStats
    efficiency: {
      avgCompressionRatio: number
      avgTimePerByte: number
      deduplicationEfficiency: number
    }
    recommendations: Array<{
      type: 'algorithm' | 'threshold' | 'deduplication'
      suggestion: string
      expectedImprovement: string
    }>
  } {
    const efficiency = {
      avgCompressionRatio: this.compressionStats.avgCompressionRatio,
      avgTimePerByte: this.compressionStats.totalBytesCompressed > 0 
        ? this.compressionStats.avgCompressionTime / this.compressionStats.totalBytesCompressed 
        : 0,
      deduplicationEfficiency: this.compressionStats.totalBytesCompressed > 0
        ? this.compressionStats.deduplicationSavings / this.compressionStats.totalBytesCompressed
        : 0
    }

    const recommendations = []

    // Algorithm recommendations
    if (efficiency.avgCompressionRatio > 0.8) {
      recommendations.push({
        type: 'algorithm' as const,
        suggestion: 'Consider using higher compression levels or different algorithms',
        expectedImprovement: '10-20% better compression ratio'
      })
    }

    // Threshold recommendations
    if (efficiency.avgTimePerByte > 0.001) {
      recommendations.push({
        type: 'threshold' as const,
        suggestion: 'Increase compression threshold to reduce CPU overhead',
        expectedImprovement: '30-50% faster compression'
      })
    }

    // Deduplication recommendations
    if (efficiency.deduplicationEfficiency < 0.1 && this.config.enableDeduplication) {
      recommendations.push({
        type: 'deduplication' as const,
        suggestion: 'Disable deduplication for this workload or adjust thresholds',
        expectedImprovement: 'Reduce memory overhead by 20%'
      })
    }

    return {
      stats: this.compressionStats,
      efficiency,
      recommendations
    }
  }

  // Get deduplication statistics
  getDeduplicationStats(): {
    entryCount: number
    totalSize: number
    totalReferences: number
    hitRate: number
    spaceSaving: number
  } {
    const entries = Array.from(this.deduplicationMap.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    const totalReferences = entries.reduce((sum, entry) => sum + entry.refCount, 0)
    const spaceSaving = entries.reduce((sum, entry) => sum + (entry.size * (entry.refCount - 1)), 0)

    return {
      entryCount: entries.length,
      totalSize,
      totalReferences,
      hitRate: this.compressionStats.totalCompressions > 0 
        ? this.compressionStats.deduplicationHits / this.compressionStats.totalCompressions 
        : 0,
      spaceSaving
    }
  }

  // Private helper methods
  private serialize(data: any): string {
    return typeof data === 'string' ? data : JSON.stringify(data)
  }

  private deserialize(data: string): any {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }

  private selectOptimalAlgorithm(data: string, hint?: 'text' | 'json' | 'binary', size?: number): CompressionAlgorithm {
    // Simple algorithm selection logic
    if (hint === 'json' || (data.trim().startsWith('{') || data.trim().startsWith('['))) {
      return 'gzip' // Good for JSON
    }
    
    if (hint === 'text' || /^[a-zA-Z0-9\s.,!?;:'"()-]+$/.test(data.slice(0, 100))) {
      return 'brotli' // Excellent for text
    }

    if (size && size > 100000) {
      return 'gzip' // Faster for large data
    }

    return this.config.algorithm
  }

  private async performCompression(data: string, algorithm: CompressionAlgorithm): Promise<Buffer> {
    const buffer = Buffer.from(data, 'utf8')

    switch (algorithm) {
      case 'gzip':
        return Buffer.from(deflate(buffer, { level: this.config.level }))
      
      case 'brotli':
        // Simulate brotli compression (would use actual brotli in production)
        return Buffer.from(deflate(buffer, { level: Math.min(this.config.level, 6) }))
      
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`)
    }
  }

  private async performDecompression(data: Buffer, algorithm: CompressionAlgorithm): Promise<string> {
    switch (algorithm) {
      case 'gzip':
      case 'brotli':
        const decompressed = inflate(data)
        return Buffer.from(decompressed).toString('utf8')
      
      default:
        throw new Error(`Unsupported decompression algorithm: ${algorithm}`)
    }
  }

  private calculateChecksum(data: string): string {
    return createHash('md5').update(data).digest('hex')
  }

  private createUncompressedResult(data: string, size: number): CompressionResult {
    return {
      data,
      originalSize: size,
      compressedSize: size,
      compressionRatio: 1.0,
      algorithm: this.config.algorithm,
      compressionTime: 0,
      checksum: this.calculateChecksum(data),
      metadata: {
        compressed: false,
        deduplication: false,
        version: '1.0'
      }
    }
  }

  private async tryDeduplication(data: string): Promise<CompressionResult | null> {
    const hash = this.calculateChecksum(data)
    const existing = this.deduplicationMap.get(hash)

    if (existing) {
      existing.refCount++
      existing.lastAccessed = Date.now()
      this.compressionStats.deduplicationHits++
      this.compressionStats.deduplicationSavings += existing.size

      return {
        data: hash, // Store hash instead of data
        originalSize: existing.size,
        compressedSize: hash.length,
        compressionRatio: hash.length / existing.size,
        algorithm: this.config.algorithm,
        compressionTime: 0,
        checksum: hash,
        metadata: {
          compressed: false,
          deduplication: true,
          version: '1.0'
        }
      }
    }

    return null
  }

  private storeForDeduplication(original: string, compressed: Buffer): void {
    const hash = this.calculateChecksum(original)
    
    if (!this.deduplicationMap.has(hash)) {
      this.deduplicationMap.set(hash, {
        hash,
        data: compressed,
        refCount: 1,
        lastAccessed: Date.now(),
        size: Buffer.byteLength(original, 'utf8')
      })

      // Limit deduplication map size
      if (this.deduplicationMap.size > 1000) {
        this.cleanupDeduplicationMap()
      }
    }
  }

  private cleanupDeduplicationMap(): void {
    const entries = Array.from(this.deduplicationMap.entries())
    
    // Sort by last accessed time and reference count
    entries.sort((a, b) => {
      const scoreA = a[1].lastAccessed + (a[1].refCount * 1000)
      const scoreB = b[1].lastAccessed + (b[1].refCount * 1000)
      return scoreA - scoreB
    })

    // Remove oldest 20%
    const toRemove = Math.floor(entries.length * 0.2)
    for (let i = 0; i < toRemove; i++) {
      this.deduplicationMap.delete(entries[i][0])
    }

    console.log(`🧹 Cleaned up ${toRemove} deduplication entries`)
  }

  private updateCompressionStats(originalSize: number, compressedSize: number, compressionTime: number): void {
    this.compressionStats.totalCompressions++
    this.compressionStats.totalBytesCompressed += originalSize
    
    const ratio = compressedSize / originalSize
    this.compressionStats.avgCompressionRatio = 
      (this.compressionStats.avgCompressionRatio + ratio) / 2
    
    this.compressionStats.avgCompressionTime = 
      (this.compressionStats.avgCompressionTime + compressionTime) / 2
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private setupCleanupSchedule(): void {
    // Clean up deduplication map every 10 minutes
    setInterval(() => {
      if (this.deduplicationMap.size > 500) {
        this.cleanupDeduplicationMap()
      }
    }, 10 * 60 * 1000)
  }
}

// Smart compression utility functions
export class CompressionUtils {
  // Estimate compression potential
  static estimateCompressionRatio(data: any): number {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data)
    
    // Simple entropy calculation
    const charFreq = new Map<string, number>()
    for (const char of serialized) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1)
    }

    let entropy = 0
    const length = serialized.length
    for (const freq of charFreq.values()) {
      const probability = freq / length
      entropy -= probability * Math.log2(probability)
    }

    // Estimate compression ratio based on entropy
    const maxEntropy = Math.log2(256) // 8 bits per byte
    const compressionPotential = 1 - (entropy / maxEntropy)
    
    return Math.max(0.1, Math.min(0.9, compressionPotential))
  }

  // Choose optimal compression settings
  static chooseOptimalSettings(dataSize: number, targetLatency: number): CompressionConfig {
    if (dataSize < 1024) {
      return {
        algorithm: 'gzip',
        threshold: 2048,
        level: 1,
        enableDeduplication: false,
        maxCompressionTime: targetLatency
      }
    }

    if (dataSize < 10240) {
      return {
        algorithm: 'gzip',
        threshold: 1024,
        level: 6,
        enableDeduplication: true,
        maxCompressionTime: targetLatency
      }
    }

    return {
      algorithm: 'gzip',
      threshold: 1024,
      level: 4, // Faster for large data
      enableDeduplication: true,
      maxCompressionTime: targetLatency
    }
  }

  // Benchmark compression algorithms
  static async benchmarkAlgorithms(testData: any[]): Promise<Map<CompressionAlgorithm, {
    avgRatio: number
    avgTime: number
    reliability: number
  }>> {
    const algorithms: CompressionAlgorithm[] = ['gzip', 'brotli']
    const results = new Map()

    for (const algorithm of algorithms) {
      const manager = new CacheCompressionManager({ algorithm, level: 6 })
      const ratios: number[] = []
      const times: number[] = []
      let successCount = 0

      for (const data of testData) {
        try {
          const result = await manager.compress(data)
          ratios.push(result.compressionRatio)
          times.push(result.compressionTime)
          successCount++
        } catch (error) {
          console.warn(`Benchmark failed for ${algorithm}:`, error)
        }
      }

      results.set(algorithm, {
        avgRatio: ratios.reduce((a, b) => a + b, 0) / ratios.length,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        reliability: successCount / testData.length
      })
    }

    return results
  }
}

// Global compression manager instance
export const cacheCompression = new CacheCompressionManager({
  algorithm: 'gzip',
  threshold: 1024,
  level: 6,
  enableDeduplication: true,
  maxCompressionTime: 100
})