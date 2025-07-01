'use client'

import { usePathname } from 'next/navigation'
import ModernNavbar from './ModernNavbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()

  // Define routes where navbar should NOT be shown
  const hiddenRoutes = ['/workspace', '/dashboard', '/admin']

  // Check if current route should hide navbar
  const shouldHideNavbar = hiddenRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Don't render navbar on workspace/dashboard/admin pages
  if (shouldHideNavbar) {
    return null
  }

  // Render navbar on all other pages (homepage, pricing, etc.)
  return <ModernNavbar />
}
