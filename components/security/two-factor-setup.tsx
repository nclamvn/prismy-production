'use client'

/**
 * Two-Factor Authentication Setup Component
 * Complete 2FA setup flow with QR code and backup codes
 */

import React, { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/lib/i18n/provider'
import { logger } from '@/lib/logger'

interface TwoFactorSetupProps {
  onSetupComplete?: () => void
  onCancel?: () => void
}

interface SetupData {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export function TwoFactorSetup({ onSetupComplete, onCancel }: TwoFactorSetupProps) {
  const { t } = useTranslation('common')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationToken, setVerificationToken] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeSetup()
  }, [])

  const initializeSetup = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/security/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ action: 'setup' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initialize 2FA setup')
      }

      const data = await response.json()
      setSetupData(data)

    } catch (error) {
      logger.error('Failed to initialize 2FA setup', { error })
      setError(error instanceof Error ? error.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationToken.trim()) {
      setError('Please enter the verification code')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/security/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'enable',
          token: verificationToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify token')
      }

      setStep(3) // Move to backup codes step

    } catch (error) {
      logger.error('Failed to verify 2FA token', { error })
      setError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = async () => {
    if (!setupData?.backupCodes) return

    try {
      await navigator.clipboard.writeText(setupData.backupCodes.join('\n'))
      setBackupCodesCopied(true)
      setTimeout(() => setBackupCodesCopied(false), 2000)
    } catch (error) {
      logger.error('Failed to copy backup codes', { error })
    }
  }

  const completeSetup = () => {
    onSetupComplete?.()
  }

  if (loading && !setupData) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error && !setupData) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Failed</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeSetup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Enable Two-Factor Authentication</h2>
        <p className="text-sm text-gray-600 mt-2">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= stepNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`h-0.5 w-16 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Scan QR</span>
          <span>Verify</span>
          <span>Backup</span>
        </div>
      </div>

      {/* Step 1: QR Code */}
      {step === 1 && setupData && (
        <div className="space-y-4">
          <div className="text-center">
            <QrCodeIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h3 className="font-medium text-gray-900 mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use your authenticator app to scan this QR code
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <img
              src={setupData.qrCodeUrl}
              alt="2FA QR Code"
              className="mx-auto max-w-full h-auto"
            />
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Download an authenticator app like Google Authenticator, Authy, or 1Password</p>
            <p>• Scan the QR code with your app</p>
            <p>• Enter the 6-digit code from your app</p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            I've Scanned the Code
          </button>
        </div>
      )}

      {/* Step 2: Verification */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <KeyIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h3 className="font-medium text-gray-900 mb-2">Enter Verification Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div>
            <input
              type="text"
              value={verificationToken}
              onChange={(e) => {
                setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError(null)
              }}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={verifyAndEnable}
              disabled={loading || verificationToken.length !== 6}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && setupData && (
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <h3 className="font-medium text-gray-900 mb-2">2FA Enabled Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save these backup codes in a secure location
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Backup Codes</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showBackupCodes ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={copyBackupCodes}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {setupData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-center"
                >
                  {showBackupCodes ? code : '••••-••••'}
                </div>
              ))}
            </div>

            {backupCodesCopied && (
              <div className="text-xs text-green-600 text-center mt-2">
                Backup codes copied to clipboard!
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-medium">Important:</p>
              <p>• Each backup code can only be used once</p>
              <p>• Store these codes in a secure password manager</p>
              <p>• You can regenerate new codes anytime in your security settings</p>
            </div>
          </div>

          <button
            onClick={completeSetup}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Complete Setup
          </button>
        </div>
      )}

      {/* Cancel Option */}
      {step < 3 && (
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel Setup
          </button>
        </div>
      )}
    </div>
  )
}