import { NextRequest, NextResponse } from 'next/server'
import { WorkflowAutomationEngine } from '@/lib/workflow/automation-engine'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { triggerType, context, eventData } = body

    if (!triggerType) {
      return NextResponse.json(
        { error: 'Trigger type required' },
        { status: 400 }
      )
    }

    const workflowEngine = WorkflowAutomationEngine.getInstance()

    // Find workflows with matching triggers
    const { data: workflows, error } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('enabled', true)

    if (error) throw error

    const triggeredExecutions = []

    for (const workflow of workflows) {
      const matchingTriggers = workflow.triggers.filter((trigger: any) => 
        trigger.type === triggerType && trigger.enabled
      )

      for (const trigger of matchingTriggers) {
        if (await evaluateTriggerConditions(trigger, context, eventData)) {
          try {
            const executionId = await workflowEngine.executeWorkflow(
              workflow.id,
              { ...context, ...eventData },
              `trigger:${trigger.id || triggerType}`
            )

            triggeredExecutions.push({
              workflowId: workflow.id,
              workflowName: workflow.name,
              executionId,
              triggerId: trigger.id
            })

            logger.info('Workflow triggered', {
              workflowId: workflow.id,
              executionId,
              triggerType
            })

          } catch (error) {
            logger.error('Failed to trigger workflow', {
              workflowId: workflow.id,
              triggerType,
              error
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      triggeredExecutions,
      message: `Triggered ${triggeredExecutions.length} workflows`
    })

  } catch (error) {
    logger.error('Workflow trigger API error', { error })
    return NextResponse.json(
      { error: 'Failed to trigger workflows' },
      { status: 500 }
    )
  }
}

// Webhook endpoint for external triggers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    const token = searchParams.get('token')

    if (!workflowId || !token) {
      return NextResponse.json(
        { error: 'Workflow ID and token required' },
        { status: 400 }
      )
    }

    // Verify webhook token
    const { data: workflow, error } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('id', workflowId)
      .eq('enabled', true)
      .single()

    if (error || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check if workflow has webhook trigger with matching token
    const webhookTrigger = workflow.triggers.find((trigger: any) => 
      trigger.type === 'webhook' && 
      trigger.enabled && 
      trigger.conditions?.token === token
    )

    if (!webhookTrigger) {
      return NextResponse.json(
        { error: 'Invalid webhook token' },
        { status: 401 }
      )
    }

    const workflowEngine = WorkflowAutomationEngine.getInstance()

    // Extract context from query parameters
    const context: Record<string, any> = {}
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'workflowId' && key !== 'token') {
        context[key] = value
      }
    }

    // Execute workflow
    const executionId = await workflowEngine.executeWorkflow(
      workflowId,
      context,
      'webhook'
    )

    return NextResponse.json({
      success: true,
      executionId,
      message: 'Workflow triggered via webhook'
    })

  } catch (error) {
    logger.error('Webhook trigger error', { error })
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function evaluateTriggerConditions(
  trigger: any, 
  context: Record<string, any>, 
  eventData: Record<string, any>
): Promise<boolean> {
  const conditions = trigger.conditions || {}
  const allData = { ...context, ...eventData }

  // Evaluate each condition
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'file_types':
        if (Array.isArray(value) && allData.fileType) {
          if (!value.includes(allData.fileType)) {
            return false
          }
        }
        break

      case 'min_size':
        if (typeof value === 'number' && allData.fileSize) {
          if (allData.fileSize < value) {
            return false
          }
        }
        break

      case 'max_size':
        if (typeof value === 'number' && allData.fileSize) {
          if (allData.fileSize > value) {
            return false
          }
        }
        break

      case 'tags':
        if (Array.isArray(value) && allData.tags) {
          const hasMatchingTag = value.some(tag => 
            allData.tags.includes(tag)
          )
          if (!hasMatchingTag) {
            return false
          }
        }
        break

      case 'organization_id':
        if (value && allData.organizationId !== value) {
          return false
        }
        break

      case 'user_id':
        if (value && allData.userId !== value) {
          return false
        }
        break

      case 'document_type':
        if (value && allData.documentType !== value) {
          return false
        }
        break

      case 'translation_status':
        if (value && allData.translationStatus !== value) {
          return false
        }
        break

      case 'ai_confidence':
        if (typeof value === 'object' && allData.confidence !== undefined) {
          const { min, max } = value
          if (min !== undefined && allData.confidence < min) {
            return false
          }
          if (max !== undefined && allData.confidence > max) {
            return false
          }
        }
        break

      case 'time_range':
        if (typeof value === 'object' && allData.timestamp) {
          const { start, end } = value
          const timestamp = new Date(allData.timestamp)
          
          if (start && timestamp < new Date(start)) {
            return false
          }
          if (end && timestamp > new Date(end)) {
            return false
          }
        }
        break

      case 'custom_condition':
        // Evaluate custom JavaScript condition (be careful with security)
        if (typeof value === 'string') {
          try {
            // Simple expression evaluation (expand as needed)
            const result = evaluateExpression(value, allData)
            if (!result) {
              return false
            }
          } catch (error) {
            logger.error('Custom condition evaluation failed', { error, condition: value })
            return false
          }
        }
        break

      default:
        // Direct property comparison
        if (allData[key] !== value) {
          return false
        }
    }
  }

  return true
}

function evaluateExpression(expression: string, data: Record<string, any>): boolean {
  // Simple expression evaluator for basic conditions
  // In production, use a proper expression parser for security
  
  try {
    // Replace variables in expression
    let evaluatedExpression = expression
    
    Object.keys(data).forEach(key => {
      const value = data[key]
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      
      if (typeof value === 'string') {
        evaluatedExpression = evaluatedExpression.replace(regex, `"${value}"`)
      } else if (typeof value === 'number') {
        evaluatedExpression = evaluatedExpression.replace(regex, value.toString())
      } else if (typeof value === 'boolean') {
        evaluatedExpression = evaluatedExpression.replace(regex, value.toString())
      }
    })

    // Simple evaluation for basic comparisons
    // This is a simplified version - use a proper parser in production
    const operators = ['===', '!==', '>=', '<=', '>', '<', '&&', '||']
    const hasOperator = operators.some(op => evaluatedExpression.includes(op))
    
    if (hasOperator) {
      // Very basic evaluation - extend as needed
      return eval(evaluatedExpression)
    }

    return Boolean(data[expression])

  } catch (error) {
    logger.error('Expression evaluation failed', { error, expression })
    return false
  }
}