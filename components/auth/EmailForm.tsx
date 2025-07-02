'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase-browser'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/useI18n'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailFormData = z.infer<typeof emailSchema>

export function EmailForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useI18n()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      })

      if (authError) {
        throw authError
      }

      setIsSuccess(true)
      toast.success('Magic link sent! Check your inbox.', {
        description: 'We sent a secure sign-in link to your email address.',
        duration: 5000,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send magic link'
      setError(errorMessage)
      toast.error('Failed to send magic link', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resendMagicLink = async () => {
    const email = getValues('email')
    if (!email) return

    setIsLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      })

      if (authError) throw authError

      toast.success('Magic link resent!', {
        description: 'Check your inbox for the new sign-in link.',
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to resend magic link'
      toast.error('Failed to resend magic link', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Check your inbox!</strong> We sent a secure sign-in link to{' '}
            <span className="font-medium">{getValues('email')}</span>
          </AlertDescription>
        </Alert>

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or
          </p>
          <Button
            variant="outline"
            onClick={resendMagicLink}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Send again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email address
        </Label>
        <Input
          {...register('email')}
          id="email"
          type="email"
          placeholder="Enter your email address"
          className="w-full"
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {errors.email.message}
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
          <Mail className="h-4 w-4 mr-2" />
        )}
        Send magic link
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          We'll send you a secure link to sign in instantly
        </p>
      </div>
    </form>
  )
}
