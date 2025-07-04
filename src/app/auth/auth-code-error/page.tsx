import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Prismy v2</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Sorry, we couldn&apos;t log you in. This could be due to an expired or invalid link.
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 text-center">
          <Link href="/login">
            <Button>Try Again</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}