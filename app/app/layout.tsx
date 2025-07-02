// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children
}
