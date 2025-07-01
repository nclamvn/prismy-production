'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { vietnamese } from "@/tokens"

export interface VietnameseThemeProviderProps extends ThemeProviderProps {
  culturalTheme?: 'default' | 'tet' | 'traditional'
  enableVietnameseFeatures?: boolean
}

// Vietnamese cultural theme context
interface VietnameseThemeContextProps {
  culturalTheme: 'default' | 'tet' | 'traditional'
  setCulturalTheme: (theme: 'default' | 'tet' | 'traditional') => void
  enableVietnameseFeatures: boolean
  setEnableVietnameseFeatures: (enabled: boolean) => void
  vietnameseColors: typeof vietnamese.culturalColors
  formatVND: (amount: number) => string
  getBilingualText: (en: string, vi: string) => string
}

const VietnameseThemeContext = React.createContext<VietnameseThemeContextProps | undefined>(undefined)

export function VietnameseThemeProvider({ 
  children, 
  culturalTheme = 'default',
  enableVietnameseFeatures = true,
  ...props 
}: VietnameseThemeProviderProps) {
  const [currentCulturalTheme, setCulturalTheme] = React.useState<'default' | 'tet' | 'traditional'>(culturalTheme)
  const [vietnameseFeaturesEnabled, setEnableVietnameseFeatures] = React.useState(enableVietnameseFeatures)

  // Apply cultural theme CSS variables via CSS classes instead of inline styles
  React.useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('theme-default', 'theme-tet', 'theme-traditional')
    
    // Add current theme class (CSS defined in globals.css)
    root.classList.add(`theme-${currentCulturalTheme}`)
  }, [currentCulturalTheme])

  // Vietnamese utility functions
  const formatVND = React.useCallback((amount: number): string => {
    return vietnamese.currency.format.pattern.replace('{amount}', 
      amount.toLocaleString('vi-VN', {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).replace(/,/g, vietnamese.currency.format.thousandSeparator)
    )
  }, [])

  const getBilingualText = React.useCallback((en: string, vi: string): string => {
    return vietnamese.patterns.bilingual.structure
      .replace('{en}', en)
      .replace('{vi}', vi)
  }, [])

  const contextValue: VietnameseThemeContextProps = {
    culturalTheme: currentCulturalTheme,
    setCulturalTheme,
    enableVietnameseFeatures: vietnameseFeaturesEnabled,
    setEnableVietnameseFeatures,
    vietnameseColors: vietnamese.culturalColors,
    formatVND,
    getBilingualText,
  }

  return (
    <NextThemesProvider {...props}>
      <VietnameseThemeContext.Provider value={contextValue}>
        <div 
          className={`vietnamese-theme-${currentCulturalTheme} ${vietnameseFeaturesEnabled ? 'vietnamese-features-enabled' : ''}`}
          style={{
            '--vietnamese-red': vietnamese.culturalColors.vietnamese.red,
            '--vietnamese-gold': vietnamese.culturalColors.vietnamese.gold,
            '--tet-red': vietnamese.culturalColors.festive.tetRed,
            '--tet-gold': vietnamese.culturalColors.festive.tetGold,
            '--vnd-symbol': vietnamese.currency.symbol,
          } as React.CSSProperties}
        >
          {children}
        </div>
      </VietnameseThemeContext.Provider>
    </NextThemesProvider>
  )
}

export const useVietnameseTheme = () => {
  const context = React.useContext(VietnameseThemeContext)
  if (context === undefined) {
    throw new Error("useVietnameseTheme must be used within a VietnameseThemeProvider")
  }
  return context
}

// Cultural theme components
export const TetThemeButton = ({ 
  children, 
  onClick,
  className = "",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setCulturalTheme } = useVietnameseTheme()
  
  return (
    <button
      className={`bg-tet-gold text-black hover:bg-tet-gold/90 px-4 py-2 rounded-md font-vietnamese transition-colors ${className}`}
      onClick={(e) => {
        setCulturalTheme('tet')
        onClick?.(e)
      }}
      {...props}
    >
      {children || "Chủ đề Tết"}
    </button>
  )
}

export const TraditionalThemeButton = ({ 
  children, 
  onClick,
  className = "",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setCulturalTheme } = useVietnameseTheme()
  
  return (
    <button
      className={`bg-vietnamese-red text-white hover:bg-vietnamese-red/90 px-4 py-2 rounded-md font-vietnamese transition-colors ${className}`}
      onClick={(e) => {
        setCulturalTheme('traditional')
        onClick?.(e)
      }}
      {...props}
    >
      {children || "Chủ đề truyền thống"}
    </button>
  )
}

export const CulturalThemeToggle = () => {
  const { culturalTheme, setCulturalTheme } = useVietnameseTheme()
  
  const themes = [
    { key: 'default', name: 'Mặc định', color: 'bg-primary' },
    { key: 'tet', name: 'Tết', color: 'bg-tet-gold' },
    { key: 'traditional', name: 'Truyền thống', color: 'bg-vietnamese-red' },
  ] as const
  
  return (
    <div className="flex gap-2">
      {themes.map(theme => (
        <button
          key={theme.key}
          className={`px-3 py-1 rounded-md text-sm font-vietnamese transition-all ${
            culturalTheme === theme.key 
              ? `${theme.color} text-white shadow-md` 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setCulturalTheme(theme.key)}
        >
          {theme.name}
        </button>
      ))}
    </div>
  )
}