import { NextRequest, NextResponse } from 'next/server'
import { WorkflowAutomationEngine } from '@/lib/workflow/automation-engine'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const supabase = createRouteHandlerClient({ cookies })
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    return user.id
  } catch (error) {
    logger.error('Failed to get user from request', { error })
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'list':
        // Get user's workflows
        const organizationId = searchParams.get('organizationId')
        let query = supabase
          .from('workflow_rules')
          .select(`
            *,
            workflow_executions(count)
          `)
          .eq('user_id', userId)

        if (organizationId) {
          query = query.eq('organization_id', organizationId)
        }

        const { data: workflows, error } = await query.order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          workflows
        })

      case 'executions':
        // Get workflow executions
        const workflowId = searchParams.get('workflowId')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        let executionsQuery = supabase
          .from('workflow_executions')
          .select(`
            *,
            workflow_rules(name)
          `)
          .order('started_at', { ascending: false })
          .limit(limit)

        if (workflowId) {
          executionsQuery = executionsQuery.eq('workflow_id', workflowId)
        } else {
          // Filter by user's workflows
          executionsQuery = executionsQuery.in('workflow_id', 
            supabase
              .from('workflow_rules')
              .select('id')
              .eq('user_id', userId)
          )
        }

        const { data: executions, error: executionsError } = await executionsQuery

        if (executionsError) throw executionsError

        return NextResponse.json({
          success: true,
          executions
        })

      case 'templates':
        // Get workflow templates
        const category = searchParams.get('category')
        let templatesQuery = supabase
          .from('workflow_templates')
          .select('*')
          .eq('is_public', true)

        if (category) {
          templatesQuery = templatesQuery.eq('category', category)
        }

        const { data: templates, error: templatesError } = await templatesQuery
          .order('usage_count', { ascending: false })

        if (templatesError) throw templatesError

        return NextResponse.json({
          success: true,
          templates
        })

      case 'metrics':
        // Get workflow metrics
        const metricsWorkflowId = searchParams.get('workflowId')
        const days = parseInt(searchParams.get('days') || '30')
        
        if (!metricsWorkflowId) {
          return NextResponse.json(
            { error: 'Workflow ID required for metrics' },
            { status: 400 }
          )
        }

        // Verify user owns the workflow
        const { data: workflow } = await supabase
          .from('workflow_rules')
          .select('id')
          .eq('id', metricsWorkflowId)
          .eq('user_id', userId)
          .single()

        if (!workflow) {
          return NextResponse.json(
            { error: 'Workflow not found' },
            { status: 404 }
          )
        }

        const { data: metrics, error: metricsError } = await supabase
          .from('workflow_metrics')
          .select('*')
          .eq('workflow_id', metricsWorkflowId)
          .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('metric_date', { ascending: true })

        if (metricsError) throw metricsError

        return NextResponse.json({
          success: true,
          metrics
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Workflows GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process workflows request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const workflowEngine = WorkflowAutomationEngine.getInstance()

    switch (action) {
      case 'create':
        // Create new workflow
        const { name, description, organizationId, triggers, actions, enabled, priority } = data

        if (!name || !triggers || !actions) {
          return NextResponse.json(
            { error: 'Missing required fields: name, triggers, actions' },
            { status: 400 }
          )
        }

        // Validate organization access if provided
        if (organizationId) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (!membership) {
            return NextResponse.json(
              { error: 'No access to specified organization' },
              { status: 403 }
            )
          }
        }

        const workflowId = await workflowEngine.createWorkflow({
          name,
          description,
          organizationId,
          userId,
          triggers,
          actions,
          enabled: enabled ?? true,
          priority: priority ?? 0
        })

        return NextResponse.json({
          success: true,
          workflowId
        })

      case 'execute':
        // Execute workflow
        const { workflowId: executeWorkflowId, context, triggeredBy } = data

        if (!executeWorkflowId) {
          return NextResponse.json(
            { error: 'Workflow ID required' },
            { status: 400 }
          )
        }

        const supabase = createRouteHandlerClient({ cookies })
        
        // Verify user owns the workflow
        const { data: workflow } = await supabase
          .from('workflow_rules')
          .select('id, organization_id')
          .eq('id', executeWorkflowId)
          .single()

        if (!workflow) {
          return NextResponse.json(
            { error: 'Workflow not found' },
            { status: 404 }
          )
        }

        // Check access permissions
        const { data: workflowAccess } = await supabase
          .from('workflow_rules')
          .select('id')
          .eq('id', executeWorkflowId)
          .or(`user_id.eq.${userId},organization_id.in.(${
            supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', userId)
              .eq('status', 'active')
          })`)
          .single()

        if (!workflowAccess) {
          return NextResponse.json(
            { error: 'No access to this workflow' },
            { status: 403 }
          )
        }

        const executionId = await workflowEngine.executeWorkflow(
          executeWorkflowId,
          context || {},
          triggeredBy || 'manual'
        )

        return NextResponse.json({
          success: true,
          executionId
        })

      case 'from_template':
        // Create workflow from template
        const { templateId, customizations } = data

        if (!templateId) {
          return NextResponse.json(
            { error: 'Template ID required' },
            { status: 400 }
          )
        }

        const { data: template, error: templateError } = await supabase
          .from('workflow_templates')
          .select('*')
          .eq('id', templateId)
          .single()

        if (templateError || !template) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          )
        }

        // Merge template data with customizations
        const templateData = template.template_data
        const workflowData = {
          name: customizations?.name || template.name,
          description: customizations?.description || template.description,
          organizationId: customizations?.organizationId,
          userId,
          triggers: customizations?.triggers || templateData.triggers,
          actions: customizations?.actions || templateData.actions,
          enabled: customizations?.enabled ?? true,
          priority: customizations?.priority ?? 0
        }

        const newWorkflowId = await workflowEngine.createWorkflow(workflowData)

        // Update template usage count
        await supabase
          .from('workflow_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', templateId)

        return NextResponse.json({
          success: true,
          workflowId: newWorkflowId
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Workflows POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process workflows request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { workflowId, ...updates } = body

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the workflow or has organization access
    const { data: workflow } = await supabase
      .from('workflow_rules')
      .select('user_id, organization_id')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    let hasPermission = workflow.user_id === userId

    if (workflow.organization_id && !hasPermission) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', workflow.organization_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      hasPermission = membership && ['owner', 'admin'].includes(membership.role)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to modify this workflow' },
        { status: 403 }
      )
    }

    // Update workflow
    const { error } = await supabase
      .from('workflow_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Workflow updated successfully'
    })

  } catch (error) {
    logger.error('Workflows PUT API error', { error })
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the workflow or has organization access
    const { data: workflow } = await supabase
      .from('workflow_rules')
      .select('user_id, organization_id')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    let hasPermission = workflow.user_id === userId

    if (workflow.organization_id && !hasPermission) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', workflow.organization_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      hasPermission = membership && ['owner', 'admin'].includes(membership.role)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to delete this workflow' },
        { status: 403 }
      )
    }

    // Delete workflow (cascading deletes will handle related records)
    const { error } = await supabase
      .from('workflow_rules')
      .delete()
      .eq('id', workflowId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    })

  } catch (error) {
    logger.error('Workflows DELETE API error', { error })
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}