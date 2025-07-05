import * as React from "react"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"
import { useTranslations } from 'next-intl'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    const t = useTranslations('footer')
    const currentYear = new Date().getFullYear()

    return (
      <footer
        ref={ref}
        className={cn(
          "border-t border-border bg-muted/30",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  P
                </div>
                <span className="text-xl font-bold text-foreground">Prismy</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('description')}
              </p>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{t('product')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/features" className="hover:text-foreground transition-colors">
                    {t('features')}
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-foreground transition-colors">
                    {t('pricing')}
                  </a>
                </li>
                <li>
                  <a href="/api" className="hover:text-foreground transition-colors">
                    {t('api')}
                  </a>
                </li>
                <li>
                  <a href="/integrations" className="hover:text-foreground transition-colors">
                    {t('integrations')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Company links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{t('company')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/about" className="hover:text-foreground transition-colors">
                    {t('about')}
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-foreground transition-colors">
                    {t('blog')}
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-foreground transition-colors">
                    {t('careers')}
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-foreground transition-colors">
                    {t('contact')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{t('legal')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/privacy" className="hover:text-foreground transition-colors">
                    {t('privacy')}
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-foreground transition-colors">
                    {t('terms')}
                  </a>
                </li>
                <li>
                  <a href="/security" className="hover:text-foreground transition-colors">
                    {t('security')}
                  </a>
                </li>
                <li>
                  <a href="/gdpr" className="hover:text-foreground transition-colors">
                    {t('gdpr')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {t('copyright', { year: currentYear })}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t('made')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    )
  }
)
Footer.displayName = "Footer"

export { Footer }