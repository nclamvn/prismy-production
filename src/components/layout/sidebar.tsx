'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Upload, 
  History, 
  Settings, 
  X,
  Home,
  Search,
  BarChart3,
  Users,
  Gauge
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/app', icon: Home },
  { name: 'Upload', href: '/app/upload', icon: Upload },
  { name: 'Documents', href: '/app/documents', icon: FileText },
  { name: 'Search', href: '/app/search', icon: Search },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Collaboration', href: '/app/collaboration', icon: Users },
  { name: 'Performance', href: '/app/performance', icon: Gauge },
  { name: 'History', href: '/app/history', icon: History },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background border-r
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h2 className="text-lg font-semibold">Prismy v2</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </a>
                  </Button>
                )
              })}
            </nav>
          </ScrollArea>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            <div className="text-xs text-muted-foreground text-center">
              Day 10 - Performance
            </div>
          </div>
        </div>
      </div>
    </>
  )
}