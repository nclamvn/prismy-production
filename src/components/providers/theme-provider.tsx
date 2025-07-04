"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="prismy-theme"
      disableTransitionOnChange
      // Prevent hydration mismatch by using cookie storage
      nonce={undefined}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}