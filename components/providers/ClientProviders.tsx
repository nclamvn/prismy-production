'use client'

import { I18nProvider } from '@/hooks/useI18n'
import { AuthProvider } from '@/contexts/AuthContext'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nProvider>{children}</I18nProvider>
    </AuthProvider>
  )
}
