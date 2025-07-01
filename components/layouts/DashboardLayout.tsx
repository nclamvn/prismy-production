'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { VietnameseThemeProvider, useVietnameseTheme } from "@/components/ui/vietnamese-theme-provider"
import { BilingualText } from "@/components/ui/bilingual-text"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/enhanced-card"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    plan: 'free' | 'standard' | 'premium' | 'enterprise'
    credits: number
    usage: {
      translations: number
      documents: number
      limit: number
    }
  }
  vietnamese?: boolean
  className?: string
}

// Sidebar Navigation Component
const DashboardSidebar = ({ vietnamese = true }: { vietnamese?: boolean }) => {
  const navItems = [
    { icon: '🏠', en: 'Dashboard', vi: 'Bảng điều khiển', href: '/dashboard' },
    { icon: '📄', en: 'Documents', vi: 'Tài liệu', href: '/dashboard/documents' },
    { icon: '📊', en: 'Analytics', vi: 'Phân tích', href: '/dashboard/analytics' },
    { icon: '🤖', en: 'Agents', vi: 'Tác nhân AI', href: '/dashboard/agents' },
    { icon: '⚙️', en: 'Settings', vi: 'Cài đặt', href: '/dashboard/settings' },
    { icon: '💳', en: 'Billing', vi: 'Thanh toán', href: '/dashboard/billing' },
  ]

  return (
    <aside className="w-64 bg-background border-r border-border min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-vietnamese-red rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-lg font-vietnamese">Prismy</span>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <BilingualText 
                en={item.en} 
                vi={item.vi}
                showOnlyVietnamese={vietnamese}
                className="text-sm font-medium"
              />
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

// Dashboard Header Component
const DashboardHeader = ({ 
  user, 
  vietnamese = true 
}: { 
  user?: DashboardLayoutProps['user']
  vietnamese?: boolean 
}) => {
  const { culturalTheme, setCulturalTheme } = useVietnameseTheme()

  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold font-vietnamese">
            <BilingualText 
              en="Dashboard" 
              vi="Bảng điều khiển"
              showOnlyVietnamese={vietnamese}
            />
          </h1>
          
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-vietnamese">
                {vietnamese ? 'Gói' : 'Plan'}:
              </span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                {user.plan}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-medium font-vietnamese">
                  {vietnamese ? 'Số dư tín dụng' : 'Credits'}
                </div>
                <CurrencyDisplay 
                  amount={user.credits} 
                  currency="VND" 
                  variant="primary"
                  size="sm"
                />
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium font-vietnamese">
                  {vietnamese ? 'Sử dụng tháng này' : 'Usage this month'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {user.usage.translations}/{user.usage.limit} translations
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <EnhancedButton
              size="sm"
              variant={culturalTheme === 'tet' ? 'tet' : 'vietnamese'}
              onClick={() => setCulturalTheme(culturalTheme === 'tet' ? 'default' : 'tet')}
            >
              {culturalTheme === 'tet' ? '🎋' : '🇻🇳'}
            </EnhancedButton>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-vietnamese-red rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.name || 'User'}</div>
              <div className="text-muted-foreground text-xs">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// Quick Stats Component
const QuickStats = ({ 
  user, 
  vietnamese = true 
}: { 
  user?: DashboardLayoutProps['user']
  vietnamese?: boolean 
}) => {
  if (!user) return null

  const stats = [
    {
      label: vietnamese ? 'Bản dịch' : 'Translations',
      value: user.usage.translations,
      total: user.usage.limit,
      icon: '📝'
    },
    {
      label: vietnamese ? 'Tài liệu' : 'Documents', 
      value: user.usage.documents,
      icon: '📄'
    },
    {
      label: vietnamese ? 'Tín dụng' : 'Credits',
      value: user.credits,
      format: 'currency',
      icon: '💰'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground font-vietnamese">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stat.format === 'currency' ? (
                    <CurrencyDisplay 
                      amount={stat.value} 
                      currency="VND" 
                      variant="primary"
                    />
                  ) : (
                    <span>
                      {stat.value}
                      {stat.total && (
                        <span className="text-sm text-muted-foreground ml-1">
                          /{stat.total}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Main Dashboard Layout Component
const DashboardLayoutContent = ({ 
  children, 
  user, 
  vietnamese = true, 
  className 
}: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar vietnamese={vietnamese} />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} vietnamese={vietnamese} />
        
        <main className="flex-1 p-6">
          <QuickStats user={user} vietnamese={vietnamese} />
          
          <div className={cn("", className)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Exported Dashboard Layout with Vietnamese Theme Provider
export const DashboardLayout = (props: DashboardLayoutProps) => {
  return (
    <VietnameseThemeProvider culturalTheme="default" enableVietnameseFeatures>
      <DashboardLayoutContent {...props} />
    </VietnameseThemeProvider>
  )
}

// Vietnamese-specific Dashboard Layout
export const VietnameseDashboardLayout = (props: Omit<DashboardLayoutProps, 'vietnamese'>) => {
  return (
    <VietnameseThemeProvider culturalTheme="traditional" enableVietnameseFeatures>
      <DashboardLayoutContent vietnamese={true} {...props} />
    </VietnameseThemeProvider>
  )
}

// Tết-themed Dashboard Layout
export const TetDashboardLayout = (props: DashboardLayoutProps) => {
  return (
    <VietnameseThemeProvider culturalTheme="tet" enableVietnameseFeatures>
      <DashboardLayoutContent vietnamese={true} {...props} />
    </VietnameseThemeProvider>
  )
}

export default DashboardLayout