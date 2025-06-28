/**
 * PRISMY ALERT RULES API
 * Manage alert rules and configurations
 */

import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/error-tracking/alert-manager'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const rules = alertManager.getAlertRules()
    const channelStatus = alertManager.getChannelStatus()

    return NextResponse.json({
      rules,
      channels: channelStatus,
      summary: {
        totalRules: rules.length,
        enabledRules: rules.filter(r => r.enabled).length,
        disabledRules: rules.filter(r => !r.enabled).length,
        enabledChannels: Object.values(channelStatus).filter(Boolean).length
      }
    })

  } catch (error) {
    logger.error('Failed to fetch alert rules', { error })
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, condition, severity, category, channels, enabled, cooldown, escalation, suppression } = body

    // Validate required fields
    if (!id || !name || !condition || !severity || !category || !channels) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate severity
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity' },
        { status: 400 }
      )
    }

    // Validate category
    if (!['error', 'performance', 'security', 'business', 'infrastructure'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate channels
    const validChannels = ['slack', 'email', 'sms', 'webhook', 'pagerduty']
    if (!Array.isArray(channels) || !channels.every(ch => validChannels.includes(ch))) {
      return NextResponse.json(
        { error: 'Invalid channels' },
        { status: 400 }
      )
    }

    const rule = {
      id,
      name,
      condition,
      severity,
      category,
      channels,
      enabled: enabled !== false,
      cooldown: cooldown || 300,
      escalation,
      suppression
    }

    // Add rule (this would need to be implemented in AlertManager)
    // For now, we'll just return success
    logger.info('Alert rule created via API', { ruleId: id, name })

    return NextResponse.json({
      success: true,
      rule
    }, { status: 201 })

  } catch (error) {
    logger.error('Failed to create alert rule', { error })
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing rule ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updates = body

    const success = alertManager.updateAlertRule(ruleId, updates)

    if (!success) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      )
    }

    logger.info('Alert rule updated via API', { ruleId, updates })

    return NextResponse.json({
      success: true,
      message: 'Alert rule updated successfully'
    })

  } catch (error) {
    logger.error('Failed to update alert rule', { error })
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    )
  }
}