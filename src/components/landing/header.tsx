"use client"

import * as React from "react"
import { Menu, X } from "lucide-react"
import { useTranslations } from 'next-intl'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LocaleSwitch } from "@/components/ui/locale-switch"

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  transparent?: boolean
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, transparent = false, ...props }, ref) => {
    const t = useTranslations('navigation')
    const [isOpen, setIsOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10)
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const shouldBeTransparent = transparent && !isScrolled

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-all duration-300",
          shouldBeTransparent
            ? "bg-background/80 backdrop-blur-md border-border/50"
            : "bg-background/95 backdrop-blur-md border-border",
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              P
            </div>
            <span className="text-xl font-bold text-foreground">Prismy</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('docs')}
            </a>
            <a
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('pricing')}
            </a>
            <a
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('about')}
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-2">
            <LocaleSwitch />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
              {t('signIn')}
            </Button>
            <Button size="sm" onClick={() => window.location.href = '/upload'}>
              {t('getStarted')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <nav className="flex flex-col space-y-4">
                <a
                  href="/docs"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('docs')}
                </a>
                <a
                  href="/pricing"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('pricing')}
                </a>
                <a
                  href="/about"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('about')}
                </a>
              </nav>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <LocaleSwitch />
                  <ThemeToggle />
                </div>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/login'
                  }}
                >
                  {t('signIn')}
                </Button>
                <Button 
                  className="justify-start" 
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/upload'
                  }}
                >
                  {t('getStarted')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }