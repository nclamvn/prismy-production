'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: number
  showText?: boolean
  linkHref?: string
  className?: string
}

export default function BrandLogo({ 
  size = 120, 
  showText = true,
  linkHref = "/",
  className 
}: BrandLogoProps) {
  const { t } = useI18n()
  
  const LogoContent = () => (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Use a simpler approach with explicit dimensions */}
      <div 
        className="relative flex-shrink-0" 
        style={{ width: size, height: Math.floor(size * 0.28) }}
      >
        <Image
          src="/logo.svg"
          alt="Prismy"
          width={size}
          height={Math.floor(size * 0.28)}
          className="object-contain"
          priority
          onError={(e) => {
            // Fallback to a simple text logo if image fails
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement!.innerHTML = `
              <div class="w-8 h-8 bg-accent-brand rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">P</span>
              </div>
            `
          }}
        />
      </div>
      {showText && (
        <span className="font-semibold text-primary text-lg">
          Prismy
        </span>
      )}
      <span className="sr-only">Prismy</span>
    </div>
  )

  if (linkHref) {
    return (
      <Link href={linkHref} className="flex items-center">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}