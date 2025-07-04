import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Prismy v2</h1>
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Document Translation
            <span className="block text-muted-foreground">Simplified</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload any document and get professional translations in seconds. 
            Built with modern architecture for reliability and speed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Fast</CardTitle>
              <CardDescription>
                Modern architecture with Turbopack for lightning-fast development
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>🔒 Secure</CardTitle>
              <CardDescription>
                Built-in RLS policies and secure file handling
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>🎯 Simple</CardTitle>
              <CardDescription>
                Email-first authentication, no complex OAuth flows
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Greenfield v2 - Day 7 Complete</span>
          </div>
        </div>
      </main>
    </div>
  );
}
