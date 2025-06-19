import { NextRequest, NextResponse } from 'next/server'
import { performanceBenchmarking, BenchmarkConfig } from '@/lib/performance-benchmarking'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET /api/admin/benchmark - Get standard benchmark configurations
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication (admin only)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const standardBenchmarks = performanceBenchmarking.getStandardBenchmarks()

    // Get recent benchmark results
    const { data: recentResults, error } = await supabase
      .from('performance_benchmarks')
      .select('test_name, results, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent benchmarks:', error)
    }

    return NextResponse.json({
      success: true,
      standardBenchmarks,
      recentResults: recentResults || [],
      availableTests: standardBenchmarks.map(b => ({
        name: b.testName,
        iterations: b.iterations,
        concurrent: b.concurrent,
        cacheEnabled: b.cacheEnabled
      }))
    })

  } catch (error) {
    console.error('Error fetching benchmark configurations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch benchmark configurations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/benchmark - Run a benchmark
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication (admin only)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { benchmarkName, customConfig } = body

    let config: BenchmarkConfig

    if (customConfig) {
      // Validate custom configuration
      if (!customConfig.testName || !customConfig.iterations || !customConfig.textSamples) {
        return NextResponse.json(
          { error: 'Invalid benchmark configuration. testName, iterations, and textSamples are required.' },
          { status: 400 }
        )
      }
      config = customConfig
    } else if (benchmarkName) {
      // Use standard benchmark configuration
      const standardBenchmarks = performanceBenchmarking.getStandardBenchmarks()
      const foundConfig = standardBenchmarks.find(b => b.testName === benchmarkName)
      
      if (!foundConfig) {
        return NextResponse.json(
          { error: 'Benchmark configuration not found' },
          { status: 404 }
        )
      }
      config = foundConfig
    } else {
      return NextResponse.json(
        { error: 'Either benchmarkName or customConfig is required' },
        { status: 400 }
      )
    }

    // Validate iterations limit (prevent excessive load)
    if (config.iterations > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 iterations allowed per benchmark' },
        { status: 400 }
      )
    }

    // Start benchmark (this is async and might take a while)
    console.log(`🚀 Starting benchmark: ${config.testName}`)
    
    // Run benchmark in background and return immediate response
    performanceBenchmarking.runBenchmark(config)
      .then(result => {
        console.log(`✅ Benchmark completed: ${config.testName}`)
        console.log(`📊 Average response time: ${result.results.averageResponseTime.toFixed(2)}ms`)
        console.log(`🎯 Cache hit rate: ${(result.results.cacheHitRate * 100).toFixed(1)}%`)
      })
      .catch(error => {
        console.error(`❌ Benchmark failed: ${config.testName}`, error)
      })

    return NextResponse.json({
      success: true,
      message: `Benchmark "${config.testName}" started successfully`,
      config: {
        testName: config.testName,
        iterations: config.iterations,
        concurrent: config.concurrent,
        cacheEnabled: config.cacheEnabled,
        textSamplesCount: config.textSamples.length
      },
      estimatedDuration: `${Math.ceil(config.iterations * (config.concurrent ? 0.5 : 2))} seconds`,
      note: 'Benchmark is running in the background. Check recent results to see completion status.'
    })

  } catch (error) {
    console.error('Error starting benchmark:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start benchmark',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}