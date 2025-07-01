import Link from 'next/link'

interface SimpleMarketingLayoutProps {
  children: React.ReactNode
}

export function SimpleMarketingLayout({ children }: SimpleMarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl">
            Prismy
          </Link>
          <nav className="flex gap-6">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/workspace" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">© 2024 Prismy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}