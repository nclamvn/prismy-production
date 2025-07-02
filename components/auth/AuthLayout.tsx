'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmailForm } from './EmailForm'
import { PhoneForm } from './PhoneForm'
import { GoogleButton } from './GoogleButton'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

export function AuthLayout() {
  const [activeTab, setActiveTab] = useState('email')
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || '/app'
  const supabase = createClient()

  useEffect(() => {
    // 🎯 CRITICAL: Handle auth code FIRST, before checking session
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (code) {
      console.log('🚨 [AUTH CODE DETECTED] Auth code found in AuthLayout:', {
        code: code.substring(0, 20) + '...',
        hasState: !!state,
        currentUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
      })

      // Set loading and redirecting state
      setIsLoading(true)
      setIsRedirecting(true)

      // Manually redirect to callback route to process the auth code
      const callbackUrl = new URL('/auth/callback', window.location.origin)

      // Preserve all current search params for callback processing
      searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value)
      })

      console.log(
        '🚨 [AUTH CODE DETECTED] Redirecting to callback from AuthLayout:',
        callbackUrl.toString()
      )

      // Use window.location for immediate redirect
      window.location.href = callbackUrl.toString()
      return // Exit early to prevent other auth checks
    }

    // Check if user is already authenticated (only if no auth code)
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session && !isRedirecting) {
        setIsRedirecting(true)
        router.push(nextUrl)
        return
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [searchParams]) // Add searchParams dependency to detect auth code

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !isRedirecting) {
        // Only redirect if we're still on the login page
        if (window.location.pathname === '/login') {
          setIsRedirecting(true)
          console.log('User signed in:', session.user.email)
          // Use replace instead of push to avoid history issues
          router.replace(`${nextUrl}?welcome=1`)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, nextUrl, supabase.auth, isRedirecting])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Column - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-8"
              aria-label="Back to homepage"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prismy
            </Link>
            <h1 className="text-4xl font-bold mb-4">
              Welcome to your AI workspace
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Transform documents with intelligent translation and AI-powered
              insights
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-blue-300" />
              <span className="text-blue-100">
                20 free AI credits to get started
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-blue-300" />
              <span className="text-blue-100">Support for 100+ languages</span>
            </div>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-blue-300" />
              <span className="text-blue-100">AI-powered document chat</span>
            </div>
          </div>
        </div>

        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full blur-2xl" />
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to Prismy
            </h1>
            <p className="text-gray-600">Access your AI-powered workspace</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-xl font-semibold">
                Sign in to continue
              </CardTitle>
              <CardDescription>
                Choose your preferred sign-in method below
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger
                    value="email"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Email
                  </TabsTrigger>
                  <TabsTrigger
                    value="phone"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Phone (+84)
                  </TabsTrigger>
                  <TabsTrigger
                    value="google"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Google
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <EmailForm />
                </TabsContent>

                <TabsContent value="phone" className="space-y-4">
                  <PhoneForm />
                </TabsContent>

                <TabsContent value="google" className="space-y-4">
                  <GoogleButton />
                </TabsContent>
              </Tabs>

              {/* Terms and Privacy */}
              <div className="mt-6 text-center text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Help text */}
          <div className="text-center text-sm text-gray-500">
            Need help?{' '}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
