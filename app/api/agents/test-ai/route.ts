import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { aiProviderManager } from '@/lib/ai/providers/ai-provider-manager'

/**
 * POST /api/agents/test-ai
 * Test AI provider integration and agent intelligence
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { testType, documentContent, agentPersonality } = body

    switch (testType) {
      case 'document_analysis':
        return await testDocumentAnalysis(documentContent, agentPersonality)
      
      case 'contract_review':
        return await testContractReview(documentContent)
      
      case 'agent_compatibility':
        return await testAgentCompatibility()
      
      case 'provider_status':
        return await testProviderStatus()
      
      default:
        return NextResponse.json(
          { error: 'Unknown test type. Available: document_analysis, contract_review, agent_compatibility, provider_status' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('[AI Test API] Error:', error)
    
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function testDocumentAnalysis(documentContent: string, agentPersonality: string) {
  const testContent = documentContent || `
# Sample Project Document
## Q4 Marketing Campaign Analysis

### Overview
This document outlines our Q4 marketing campaign performance and key findings for next year's planning.

### Key Metrics
- Total Budget: $150,000
- ROI: 240%
- Conversion Rate: 12.5%
- Customer Acquisition Cost: $45

### Action Items
1. Increase social media spending by 25%
2. Review and optimize email campaigns
3. Plan for Q1 2024 product launch
4. Schedule quarterly review meeting for December 15th

### Risks
- Competition launching similar product in Q1
- Budget constraints for additional campaigns
- Team capacity limitations
  `

  const startTime = Date.now()
  
  try {
    const analysis = await aiProviderManager.analyzeDocument({
      documentContent: testContent,
      documentType: 'project',
      focus: agentPersonality === 'legal' ? 'contract_review' : 
             agentPersonality === 'financial' ? 'financial_analysis' :
             agentPersonality === 'project' ? 'project_status' :
             agentPersonality === 'research' ? 'research_synthesis' :
             'daily_insights',
      personality: agentPersonality || 'general',
      language: 'en',
      culturalContext: 'Vietnam'
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      testType: 'document_analysis',
      result: {
        analysis,
        processingTime,
        testParameters: {
          documentLength: testContent.length,
          agentPersonality: agentPersonality || 'general',
          focus: analysis.metadata ? 'AI-powered' : 'fallback'
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      testType: 'document_analysis',
      error: error instanceof Error ? error.message : 'Analysis failed',
      processingTime: Date.now() - startTime
    })
  }
}

async function testContractReview(documentContent: string) {
  const testContract = documentContent || `
PROFESSIONAL SERVICES AGREEMENT

This Agreement is entered into on January 15, 2024, between Company A Ltd. and Consultant B.

TERMS:
1. Service Period: January 15, 2024 to December 31, 2024
2. Payment: $5,000 monthly, due on the 15th of each month
3. Deliverables: Monthly progress reports and quarterly strategy reviews
4. Termination: Either party may terminate with 30 days written notice
5. Renewal: Automatic renewal unless terminated before November 30, 2024
6. Confidentiality: All information shall remain confidential for 2 years post-termination
7. Liability: Limited to the total contract value
8. Governing Law: Vietnam law applies

CRITICAL DATES:
- Contract Start: January 15, 2024
- First Payment Due: February 15, 2024  
- Q1 Review: March 31, 2024
- Renewal Decision: November 30, 2024
- Contract End: December 31, 2024
  `

  const startTime = Date.now()
  
  try {
    const contractAnalysis = await aiProviderManager.analyzeContract({
      documentContent: testContract,
      focus: ['compliance', 'risks', 'key_dates', 'obligations'],
      jurisdiction: 'Vietnam',
      language: 'en'
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      testType: 'contract_review',
      result: {
        contractAnalysis,
        processingTime,
        testParameters: {
          contractLength: testContract.length,
          jurisdiction: 'Vietnam',
          focusAreas: ['compliance', 'risks', 'key_dates', 'obligations']
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      testType: 'contract_review',
      error: error instanceof Error ? error.message : 'Contract review failed',
      processingTime: Date.now() - startTime
    })
  }
}

async function testAgentCompatibility() {
  const startTime = Date.now()
  
  try {
    const compatibilityResult = await aiProviderManager.assessAgentCompatibility({
      agent1: {
        specialty: 'Legal document analysis and compliance',
        capabilities: ['compliance_checking', 'contract_review', 'risk_assessment']
      },
      agent2: {
        specialty: 'Financial analysis and budget optimization',
        capabilities: ['budget_analysis', 'cost_optimization', 'financial_reporting']
      },
      context: {
        currentProjects: ['Q4 Budget Review', 'Contract Negotiations'],
        documentTypes: ['contract', 'financial_report'],
        userGoals: ['compliance', 'cost_reduction', 'efficiency'],
        timeframe: '30days'
      }
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      testType: 'agent_compatibility',
      result: {
        compatibilityResult,
        processingTime,
        testParameters: {
          agent1_specialty: 'legal',
          agent2_specialty: 'financial',
          expected_synergy: 'high (complementary specialties)'
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      testType: 'agent_compatibility', 
      error: error instanceof Error ? error.message : 'Compatibility assessment failed',
      processingTime: Date.now() - startTime
    })
  }
}

async function testProviderStatus() {
  try {
    const providerStatus = aiProviderManager.getProviderStatus()
    const availableProviders = aiProviderManager.getAvailableProviders()

    // Test a simple request to see if providers are actually working
    const testResults: any = {}

    for (const provider of availableProviders) {
      try {
        const startTime = Date.now()
        await aiProviderManager.analyzeDocument({
          documentContent: 'Simple test: This is a brief test document.',
          documentType: 'test',
          focus: 'daily_insights', 
          personality: 'general',
          language: 'en'
        })
        testResults[provider] = {
          status: 'working',
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        testResults[provider] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      testType: 'provider_status',
      result: {
        configuredProviders: providerStatus,
        availableProviders,
        providerTests: testResults,
        recommendation: availableProviders.length > 0 ? 
          'AI providers are configured and ready' : 
          'No AI providers available - check API keys'
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      testType: 'provider_status',
      error: error instanceof Error ? error.message : 'Provider status check failed'
    })
  }
}

/**
 * GET /api/agents/test-ai
 * Get available test types and examples
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Agent Intelligence Test API',
    availableTests: {
      document_analysis: {
        description: 'Test AI-powered document analysis with different agent personalities',
        parameters: {
          testType: 'document_analysis',
          documentContent: 'Optional: custom document content (will use sample if not provided)',
          agentPersonality: 'Optional: legal | financial | project | research | general'
        }
      },
      contract_review: {
        description: 'Test specialized contract analysis with legal focus',
        parameters: {
          testType: 'contract_review',
          documentContent: 'Optional: custom contract content (will use sample if not provided)'
        }
      },
      agent_compatibility: {
        description: 'Test AI-powered agent compatibility assessment',
        parameters: {
          testType: 'agent_compatibility'
        }
      },
      provider_status: {
        description: 'Check AI provider configuration and health',
        parameters: {
          testType: 'provider_status'
        }
      }
    },
    examples: {
      document_analysis: {
        method: 'POST',
        body: {
          testType: 'document_analysis',
          agentPersonality: 'legal'
        }
      },
      contract_review: {
        method: 'POST', 
        body: {
          testType: 'contract_review'
        }
      }
    }
  })
}