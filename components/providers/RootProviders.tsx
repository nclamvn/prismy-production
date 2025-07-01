'use client'

import React from 'react'

interface RootProvidersProps {
  children: React.ReactNode
}

/**
 * Minimal root providers for Prismy vNEXT
 * Follows NotebookML pattern: simple, clean, focused
 */
export function RootProviders({ children }: RootProvidersProps) {
  return <>{children}</>
}
