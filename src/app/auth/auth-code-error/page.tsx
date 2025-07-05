'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem processing your authentication request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-sm">Common causes:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Email confirmation link expired</li>
              <li>• Invalid or malformed authentication code</li>
              <li>• Email already confirmed</li>
              <li>• Network connection issues</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please try signing up or logging in again. If the problem persists, contact support.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/signup">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/login">
                Sign In Instead
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}