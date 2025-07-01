'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase-browser'
import { Phone, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

// Vietnamese phone number validation
const phoneSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Please enter a valid Vietnamese phone number'),
})

const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
})

type PhoneFormData = z.infer<typeof phoneSchema>
type OTPFormData = z.infer<typeof otpSchema>

export function PhoneForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showOTPModal, setShowOTPModal] = useState(false)
  const supabase = createClient()

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')
    
    // Format as Vietnamese phone number: 0xxx xxx xxxx
    if (numbers.length <= 4) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`
  }

  const formatPhoneForAPI = (phone: string) => {
    // Convert Vietnamese format to international format
    const numbers = phone.replace(/\D/g, '')
    if (numbers.startsWith('0')) {
      return `+84${numbers.slice(1)}`
    }
    return `+84${numbers}`
  }

  const onPhoneSubmit = async (data: PhoneFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const formattedPhone = formatPhoneForAPI(data.phone)
      setPhoneNumber(formattedPhone)

      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      })

      if (authError) {
        throw authError
      }

      setStep('otp')
      setShowOTPModal(true)
      toast.success('OTP sent to your phone!', {
        description: 'Enter the 6-digit code to complete sign-in.',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(errorMessage)
      toast.error('Failed to send OTP', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onOTPSubmit = async (data: OTPFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: data.otp,
        type: 'sms',
      })

      if (verifyError) {
        throw verifyError
      }

      toast.success('Phone verified successfully!', {
        description: 'Welcome to Prismy! Redirecting to your workspace...',
      })
      
      setShowOTPModal(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code'
      setError(errorMessage)
      toast.error('Verification failed', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          shouldCreateUser: true,
        },
      })

      if (authError) throw authError

      toast.success('New OTP sent!', {
        description: 'Check your phone for the new verification code.',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP'
      toast.error('Failed to resend OTP', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Vietnamese phone number
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">+84</span>
            </div>
            <Input
              {...phoneForm.register('phone')}
              id="phone"
              type="tel"
              placeholder="0xxx xxx xxxx"
              className="w-full pl-12"
              disabled={isLoading}
              autoComplete="tel"
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                e.target.value = formatted
                phoneForm.setValue('phone', formatted.replace(/\s/g, ''))
              }}
              aria-describedby={phoneForm.formState.errors.phone ? 'phone-error' : undefined}
            />
          </div>
          {phoneForm.formState.errors.phone && (
            <p id="phone-error" className="text-sm text-red-600" role="alert">
              {phoneForm.formState.errors.phone.message}
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          Send verification code
        </Button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            We'll send you a 6-digit verification code via SMS
          </p>
        </div>
      </form>

      {/* OTP Modal */}
      <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Enter verification code
            </DialogTitle>
            <DialogDescription>
              We sent a 6-digit code to{' '}
              <span className="font-medium">{phoneNumber}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Verification code
              </Label>
              <Input
                {...otpForm.register('otp')}
                id="otp"
                type="text"
                placeholder="000000"
                className="w-full text-center text-lg tracking-widest"
                disabled={isLoading}
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                aria-describedby={otpForm.formState.errors.otp ? 'otp-error' : undefined}
              />
              {otpForm.formState.errors.otp && (
                <p id="otp-error" className="text-sm text-red-600" role="alert">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verify and sign in
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resendOTP}
                disabled={isLoading}
                className="w-full"
              >
                Resend code
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}