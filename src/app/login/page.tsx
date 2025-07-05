import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Prismy v2</CardTitle>
          <CardDescription>
            Sign in to your account to start translating documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <Button className="w-full" size="lg">
            Sign In with Email
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            We'll send you a magic link to sign in
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">🚧 Authentication Coming Soon</h4>
            <p className="text-blue-800 text-sm">
              Full Supabase authentication will be enabled in the next phase. 
              For now, this is a preview of the login interface.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}