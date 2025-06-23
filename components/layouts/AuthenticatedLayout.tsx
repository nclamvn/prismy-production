'use client'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return <div className="min-h-screen bg-bg-main">{children}</div>
}
