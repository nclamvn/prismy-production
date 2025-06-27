'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, Sparkles, Gift } from 'lucide-react'
import Link from 'next/link'

export default function BetaLandingPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [validated, setValidated] = useState(false)
  const [credits, setCredits] = useState(0)

  const validateCode = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }

    setValidating(true)
    setError('')

    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() })
      })

      const data = await res.json()

      if (data.success) {
        setValidated(true)
        setCredits(data.credits)
        // Store invite code in session storage for redemption after auth
        sessionStorage.setItem('pendingInviteCode', inviteCode.trim())
        
        // Redirect to auth after 2 seconds
        setTimeout(() => {
          router.push('/auth/signup?invite=true')
        }, 2000)
      } else {
        setError(data.error || 'Invalid invite code')
      }
    } catch (err) {
      setError('Failed to validate invite code')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Prismy Beta</h1>
          <p className="text-gray-600">Exclusive early access</p>
        </div>

        {/* Main Card */}
        <div className="card-base p-8">
          {!validated ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
                     style={{ backgroundColor: 'var(--notebooklm-primary-light)' }}>
                  <Gift className="w-8 h-8" style={{ color: 'var(--notebooklm-primary)' }} />
                </div>
                <h2 className="heading-2 mb-2">Welcome to Prismy Beta</h2>
                <p className="text-gray-600">Enter your invite code to get started</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-md3">Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="PRISMY-XXXXXXXX"
                    className="input-base text-center font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && validateCode()}
                    disabled={validating}
                  />
                  {error && (
                    <p className="field-error">{error}</p>
                  )}
                </div>

                <button
                  onClick={validateCode}
                  disabled={validating}
                  className="btn-md3-filled w-full"
                >
                  {validating ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                      Validating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Validate Code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--surface-outline)' }}>
                <p className="text-center text-sm text-gray-600">
                  Don't have an invite code?{' '}
                  <Link href="/waitlist" className="text-blue-600 hover:underline">
                    Join the waitlist
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
                   style={{ backgroundColor: 'var(--success-100)' }}>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="heading-2 mb-2">Code Validated!</h2>
              <p className="text-gray-600 mb-4">
                Your invite code includes <strong>{credits} credits</strong>
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to sign up...
              </p>
            </div>
          )}
        </div>

        {/* Beta Features */}
        <div className="mt-8 space-y-3">
          <h3 className="text-center text-sm font-semibold text-gray-700 mb-4">
            Beta Access Includes:
          </h3>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span>Early access to all features</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span>Direct feedback channel with founders</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span>Special beta pricing when we launch</span>
          </div>
        </div>
      </div>
    </div>
  )
}