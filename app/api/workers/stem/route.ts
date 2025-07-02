/**
 * Phase 3.7-A: STEM Processing API Worker
 * 
 * API endpoint for triggering STEM document processing
 * Handles mathematical formula detection, table analysis, and diagram recognition
 */

import { NextRequest, NextResponse } from 'next/server'
import { processSTEMJob, STEMJobData } from '../../../../workers/stem-worker'
import { supabase } from '../../../../lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('🔬 STEM Worker API called')
  
  try {
    // Parse request body
    const body = await request.json()
    const { jobId, fileId, filePath, fileName, fileType, options } = body
    
    if (!jobId || !fileId || !filePath) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: jobId, fileId, filePath'
      }, { status: 400 })
    }
    
    // Get authentication
    const cookieStore = await cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Default STEM processing options
    const stemOptions = {
      preserveFormulas: true,
      generateLatex: true,
      detectTables: true,
      analyzeDiagrams: true,
      outputFormat: 'pdf',
      ...options
    }
    
    // Create STEM job data
    const stemJobData: STEMJobData = {
      jobId,
      fileId,
      filePath,
      fileName,
      fileType,
      userId: user.id,
      options: stemOptions
    }
    
    console.log(`🔬 Starting STEM processing for file: ${fileName}`)
    console.log(`📊 Options:`, stemOptions)
    
    // Process STEM document
    const result = await processSTEMJob({
      id: jobId,
      name: 'stem-processing',
      data: stemJobData
    } as any)
    
    if (result.success) {
      console.log(`✅ STEM processing completed successfully`)
      console.log(`📊 Metrics:`, result.metrics)
      
      return NextResponse.json({
        success: true,
        result: {
          formulasDetected: result.metrics.formulasDetected,
          tablesDetected: result.metrics.tablesDetected,
          diagramsDetected: result.metrics.diagramsDetected,
          confidence: result.metrics.confidence,
          processingTime: result.metrics.processingTime,
          outputFiles: result.outputFiles
        },
        message: 'STEM processing completed successfully'
      })
    } else {
      console.error(`❌ STEM processing failed: ${result.error}`)
      
      return NextResponse.json({
        success: false,
        error: result.error || 'STEM processing failed'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ STEM Worker API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Get STEM processing status and capabilities
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (jobId) {
      // Get specific job STEM results
      const { data, error } = await supabase
        .from('stem_analysis')
        .select('*')
        .eq('job_id', jobId)
        .single()
        
      if (error) {
        return NextResponse.json({
          success: false,
          error: 'STEM analysis not found'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data
      })
    } else {
      // Return STEM processing capabilities
      return NextResponse.json({
        success: true,
        capabilities: {
          supportedFormats: ['application/pdf', 'image/png', 'image/jpeg'],
          features: {
            mathematicalFormulas: {
              description: 'Detect and convert mathematical formulas to LaTeX/MathML',
              supported: true,
              accuracy: '85-95%'
            },
            tableDetection: {
              description: 'Detect and preserve table structures',
              supported: true,
              accuracy: '80-90%'
            },
            diagramAnalysis: {
              description: 'Analyze scientific diagrams and charts',
              supported: true,
              accuracy: '70-85%'
            },
            layoutPreservation: {
              description: 'Maintain document layout and formatting',
              supported: true,
              accuracy: '90-95%'
            }
          },
          outputFormats: ['pdf', 'docx', 'latex', 'mathml'],
          processingTime: {
            typical: '30-120 seconds per page',
            factors: ['document complexity', 'formula density', 'image quality']
          },
          limitations: [
            'Handwritten formulas may have lower accuracy',
            'Complex diagrams require manual review',
            'Non-standard notation may not be recognized'
          ]
        }
      })
    }
    
  } catch (error) {
    console.error('❌ STEM Worker GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get STEM information'
    }, { status: 500 })
  }
}