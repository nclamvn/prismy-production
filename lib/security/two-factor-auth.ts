/**
 * Two-Factor Authentication (2FA) Security System
 * TOTP-based authentication with backup codes
 */

import { createHash, randomBytes } from 'crypto'
import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  userId: string
}

export interface TwoFactorVerification {
  token: string
  userId: string
  isBackupCode?: boolean
}

export class TwoFactorAuthManager {
  private static instance: TwoFactorAuthManager

  private constructor() {}

  static getInstance(): TwoFactorAuthManager {
    if (!TwoFactorAuthManager.instance) {
      TwoFactorAuthManager.instance = new TwoFactorAuthManager()
    }
    return TwoFactorAuthManager.instance
  }

  /**
   * Generate 2FA setup data for a user
   */
  async setupTwoFactor(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Prismy (${userEmail})`,
        issuer: 'Prismy Translation Platform',
        length: 32
      })

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '')

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()

      // Store in database
      const { error } = await supabase
        .from('user_two_factor')
        .upsert({
          user_id: userId,
          secret: secret.base32,
          backup_codes: backupCodes.map(code => this.hashBackupCode(code)),
          is_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      logger.info('2FA setup initiated', { userId, email: userEmail })

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes,
        userId
      }

    } catch (error) {
      logger.error('Failed to setup 2FA', { error, userId })
      throw new Error('Failed to setup two-factor authentication')
    }
  }

  /**
   * Verify and enable 2FA for a user
   */
  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA data
      const { data: twoFactorData, error } = await supabase
        .from('user_two_factor')
        .select('secret, is_enabled')
        .eq('user_id', userId)
        .single()

      if (error || !twoFactorData) {
        throw new Error('2FA not set up for this user')
      }

      if (twoFactorData.is_enabled) {
        throw new Error('2FA is already enabled')
      }

      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: twoFactorData.secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 60 seconds before/after for clock drift
      })

      if (!isValid) {
        logger.warn('Invalid 2FA token during enable', { userId })
        return false
      }

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('user_two_factor')
        .update({
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Log security event
      await this.logSecurityEvent(userId, 'two_factor_enabled', {
        success: true,
        timestamp: new Date().toISOString()
      })

      logger.info('2FA enabled successfully', { userId })
      return true

    } catch (error) {
      logger.error('Failed to enable 2FA', { error, userId })
      throw error
    }
  }

  /**
   * Verify 2FA token or backup code
   */
  async verifyTwoFactor(verification: TwoFactorVerification): Promise<boolean> {
    try {
      const { data: twoFactorData, error } = await supabase
        .from('user_two_factor')
        .select('secret, backup_codes, is_enabled, last_used_at')
        .eq('user_id', verification.userId)
        .single()

      if (error || !twoFactorData || !twoFactorData.is_enabled) {
        logger.warn('2FA verification attempted but not enabled', { userId: verification.userId })
        return false
      }

      let isValid = false
      let usedBackupCode: string | null = null

      if (verification.isBackupCode) {
        // Verify backup code
        const hashedToken = this.hashBackupCode(verification.token)
        const backupCodes = twoFactorData.backup_codes || []
        
        if (backupCodes.includes(hashedToken)) {
          isValid = true
          usedBackupCode = hashedToken
        }
      } else {
        // Verify TOTP token
        isValid = speakeasy.totp.verify({
          secret: twoFactorData.secret,
          encoding: 'base32',
          token: verification.token,
          window: 2
        })
      }

      if (isValid) {
        // Update last used timestamp
        const updates: any = {
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Remove used backup code
        if (usedBackupCode) {
          const remainingCodes = (twoFactorData.backup_codes || []).filter(
            code => code !== usedBackupCode
          )
          updates.backup_codes = remainingCodes

          logger.info('Backup code used for 2FA', { 
            userId: verification.userId,
            remainingCodes: remainingCodes.length 
          })
        }

        await supabase
          .from('user_two_factor')
          .update(updates)
          .eq('user_id', verification.userId)

        // Log successful verification
        await this.logSecurityEvent(verification.userId, 'two_factor_verified', {
          method: verification.isBackupCode ? 'backup_code' : 'totp',
          success: true,
          timestamp: new Date().toISOString()
        })

        return true
      }

      // Log failed verification
      await this.logSecurityEvent(verification.userId, 'two_factor_failed', {
        method: verification.isBackupCode ? 'backup_code' : 'totp',
        success: false,
        timestamp: new Date().toISOString()
      })

      logger.warn('2FA verification failed', { userId: verification.userId })
      return false

    } catch (error) {
      logger.error('Failed to verify 2FA', { error, userId: verification.userId })
      return false
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Verify current token before disabling
      const isValid = await this.verifyTwoFactor({ userId, token })
      
      if (!isValid) {
        return false
      }

      // Disable 2FA
      const { error } = await supabase
        .from('user_two_factor')
        .update({
          is_enabled: false,
          disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      // Log security event
      await this.logSecurityEvent(userId, 'two_factor_disabled', {
        success: true,
        timestamp: new Date().toISOString()
      })

      logger.info('2FA disabled', { userId })
      return true

    } catch (error) {
      logger.error('Failed to disable 2FA', { error, userId })
      throw error
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    try {
      // Verify current token
      const isValid = await this.verifyTwoFactor({ userId, token })
      
      if (!isValid) {
        throw new Error('Invalid 2FA token')
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes()

      // Update in database
      const { error } = await supabase
        .from('user_two_factor')
        .update({
          backup_codes: backupCodes.map(code => this.hashBackupCode(code)),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      // Log security event
      await this.logSecurityEvent(userId, 'backup_codes_regenerated', {
        success: true,
        timestamp: new Date().toISOString()
      })

      logger.info('Backup codes regenerated', { userId })
      return backupCodes

    } catch (error) {
      logger.error('Failed to regenerate backup codes', { error, userId })
      throw error
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_two_factor')
        .select('is_enabled')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is okay
        throw error
      }

      return data?.is_enabled || false

    } catch (error) {
      logger.error('Failed to check 2FA status', { error, userId })
      return false
    }
  }

  /**
   * Get 2FA status and info for user
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean
    hasBackupCodes: boolean
    backupCodesRemaining?: number
    lastUsed?: Date
  }> {
    try {
      const { data, error } = await supabase
        .from('user_two_factor')
        .select('is_enabled, backup_codes, last_used_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return {
          enabled: false,
          hasBackupCodes: false
        }
      }

      return {
        enabled: data.is_enabled || false,
        hasBackupCodes: (data.backup_codes?.length || 0) > 0,
        backupCodesRemaining: data.backup_codes?.length || 0,
        lastUsed: data.last_used_at ? new Date(data.last_used_at) : undefined
      }

    } catch (error) {
      logger.error('Failed to get 2FA status', { error, userId })
      return {
        enabled: false,
        hasBackupCodes: false
      }
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = []
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4).toString('hex').toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
    }

    return codes
  }

  /**
   * Hash backup code for secure storage
   */
  private hashBackupCode(code: string): string {
    return createHash('sha256').update(code).digest('hex')
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(
    userId: string,
    operation: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.rpc('log_security_audit', {
        p_user_id: userId,
        p_operation: operation,
        p_resource_type: 'two_factor_auth',
        p_resource_id: null,
        p_metadata: metadata,
        p_ip_address: null,
        p_user_agent: null
      })
    } catch (error) {
      logger.error('Failed to log security event', { error, operation, userId })
    }
  }
}