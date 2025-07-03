'use client'

import { WorkspaceLayout } from '@/components/layouts/WorkspaceLayout'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  // Session checking is now handled in layout.tsx
  return <WorkspaceLayout />
}
