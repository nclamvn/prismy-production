'use client'

import { I18nProvider } from '@/contexts/I18nContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { SearchProvider } from '@/components/search/SearchProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SearchProvider>
          <I18nProvider>{children}</I18nProvider>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
