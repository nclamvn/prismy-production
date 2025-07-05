'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye, EyeOff } from 'lucide-react'

export function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false)

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show debug info in production
  }

  const debugData = {
    'Origin': typeof window !== 'undefined' ? window.location.origin : 'SSR',
    'Environment': process.env.NODE_ENV,
    'Supabase URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 
      'Not set',
    'Supabase Anon Key': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
      'Not set',
    'Expected Callback URL': typeof window !== 'undefined' ? 
      `${window.location.origin}/auth/callback` : 
      'SSR - check client side'
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="opacity-50 hover:opacity-100"
        >
          <Eye className="h-4 w-4 mr-2" />
          Debug Info
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Debug Information</CardTitle>
              <CardDescription className="text-xs">
                Development environment only
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            {Object.entries(debugData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground text-right ml-2 break-all">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-muted rounded text-xs">
            <p className="font-medium mb-1">🔧 Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open browser DevTools → Console</li>
              <li>Try signup and check console logs</li>
              <li>Look for "🚨 Supabase signup error" messages</li>
              <li>Check Network tab for 422 response details</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}