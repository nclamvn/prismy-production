'use client'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace flex h-full">
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
