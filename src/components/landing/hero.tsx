import * as React from "react"
import { ArrowRight, Play } from "lucide-react"
import { useTranslations } from 'next-intl'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface HeroProps extends React.HTMLAttributes<HTMLElement> {}

const Hero = React.forwardRef<HTMLElement, HeroProps>(
  ({ className, ...props }, ref) => {
    const t = useTranslations('hero')
    return (
      <section
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-gradient-to-b from-background to-muted/30 px-4 py-20 lg:py-32",
          className
        )}
        {...props}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-3xl opacity-30" />
        </div>

        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {t('badge')}
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
                  {t('title')}
                </h1>
                
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  {t('subtitle')}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="gap-2 text-base px-8 py-6 h-auto"
                  onClick={() => window.location.href = '/upload'}
                >
                  {t('ctaTry')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 text-base px-8 py-6 h-auto"
                  onClick={() => {
                    // Scroll to demo video or features section
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <Play className="h-4 w-4" />
                  {t('ctaLearn')}
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-background flex items-center justify-center text-xs font-semibold"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span>{t('trustIndicator')}</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <span>✨ {t('noCreditCard')}</span>
              </div>
            </div>

            {/* Right column - Screenshot/Demo */}
            <div className="relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main screenshot container */}
                <div className="relative rounded-xl border border-border bg-card p-1 shadow-2xl">
                  <div className="rounded-lg bg-muted/50 aspect-[4/3] flex items-center justify-center">
                    {/* Placeholder for screenshot - replace with actual screenshot */}
                    <div className="text-center space-y-4 p-8">
                      <div className="w-16 h-16 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded bg-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                        <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Screenshot coming soon
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-card border border-border rounded-lg p-3 shadow-lg animate-bounce-subtle">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">Fast</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg p-3 shadow-lg animate-bounce-subtle delay-1000">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-medium">Accurate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
)
Hero.displayName = "Hero"

export { Hero }