import { NextRequest, NextResponse } from 'next/server'
import { TwoFactorAuthManager } from '@/lib/security/two-factor-auth'
import { auditLogger } from '@/lib/security/audit-logger'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const token = authorization.replace('Bearer ', '')
    const supabase = createRouteHandlerClient({ cookies })
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
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const twoFactorManager = TwoFactorAuthManager.getInstance()

    switch (action) {
      case 'status':
        // Get 2FA status for user
        const status = await twoFactorManager.getTwoFactorStatus(userId)
        
        return NextResponse.json({
          success: true,
          ...status
        })

      case 'is-enabled':
        // Check if 2FA is enabled
        const isEnabled = await twoFactorManager.isTwoFactorEnabled(userId)
        
        return NextResponse.json({
          success: true,
          enabled: isEnabled
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('2FA GET API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
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

    // Get client IP and user agent for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    // Get user email for logging
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email

    const twoFactorManager = TwoFactorAuthManager.getInstance()

    switch (action) {
      case 'setup':
        // Initiate 2FA setup
        if (!userEmail) {
          return NextResponse.json(
            { error: 'User email required for setup' },
            { status: 400 }
          )
        }

        const setupData = await twoFactorManager.setupTwoFactor(userId, userEmail)

        // Log security event
        await auditLogger.logSecurityConfigChange(
          userId,
          'two_factor_setup_initiated',
          'two_factor_auth',
          undefined,
          { userEmail }
        )

        return NextResponse.json({
          success: true,
          secret: setupData.secret,
          qrCodeUrl: setupData.qrCodeUrl,
          backupCodes: setupData.backupCodes
        })

      case 'enable':
        // Enable 2FA after verification
        const { token } = data

        if (!token) {
          return NextResponse.json(
            { error: 'Verification token required' },
            { status: 400 }
          )
        }

        const enableResult = await twoFactorManager.enableTwoFactor(userId, token)

        if (enableResult) {
          // Log successful enable
          await auditLogger.logSecurityConfigChange(
            userId,
            'two_factor_enabled',
            'two_factor_auth',
            undefined,
            { 
              ipAddress: clientIP,
              userAgent 
            }
          )

          return NextResponse.json({
            success: true,
            message: '2FA enabled successfully'
          })
        } else {
          // Log failed verification
          await auditLogger.logAuthentication(
            userId,
            'login_failed',
            clientIP,
            userAgent,
            {
              reason: 'invalid_2fa_token_during_enable',
              action: 'enable_2fa'
            }
          )

          return NextResponse.json(
            { error: 'Invalid verification token' },
            { status: 400 }
          )
        }

      case 'verify':
        // Verify 2FA token
        const { token: verifyToken, isBackupCode } = data

        if (!verifyToken) {
          return NextResponse.json(
            { error: 'Token required' },
            { status: 400 }
          )
        }

        const verifyResult = await twoFactorManager.verifyTwoFactor({
          userId,
          token: verifyToken,
          isBackupCode
        })

        if (verifyResult) {
          return NextResponse.json({
            success: true,
            message: '2FA verification successful'
          })
        } else {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 400 }
          )
        }

      case 'disable':
        // Disable 2FA
        const { token: disableToken } = data

        if (!disableToken) {
          return NextResponse.json(
            { error: 'Current token required to disable 2FA' },
            { status: 400 }
          )
        }

        const disableResult = await twoFactorManager.disableTwoFactor(userId, disableToken)

        if (disableResult) {
          // Log disable event
          await auditLogger.logSecurityConfigChange(
            userId,
            'two_factor_disabled',
            'two_factor_auth',
            undefined,
            { 
              ipAddress: clientIP,
              userAgent 
            }
          )

          return NextResponse.json({
            success: true,
            message: '2FA disabled successfully'
          })
        } else {
          return NextResponse.json(
            { error: 'Invalid token or 2FA not enabled' },
            { status: 400 }
          )
        }

      case 'regenerate-backup-codes':
        // Regenerate backup codes
        const { token: regenToken } = data

        if (!regenToken) {
          return NextResponse.json(
            { error: 'Current token required to regenerate backup codes' },
            { status: 400 }
          )
        }

        const newBackupCodes = await twoFactorManager.regenerateBackupCodes(userId, regenToken)

        // Log backup code regeneration
        await auditLogger.logSecurityConfigChange(
          userId,
          'backup_codes_regenerated',
          'two_factor_auth',
          undefined,
          { 
            ipAddress: clientIP,
            userAgent,
            codesCount: newBackupCodes.length
          }
        )

        return NextResponse.json({
          success: true,
          backupCodes: newBackupCodes
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('2FA POST API error', { error })
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}