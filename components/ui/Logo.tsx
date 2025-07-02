'use client'

import Image from 'next/image'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg'
}

export function Logo({
  className,
  showText = true,
  textSize = 'md',
}: LogoProps) {
  const { t } = useI18n()

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Image
        src="/logo.svg"
        alt="Prismy Logo"
        width={128}
        height={40}
        className="h-7 w-auto md:h-10"
        priority
      />
      {showText && (
        <span
          className={cn(
            'font-semibold text-primary',
            textSizeClasses[textSize]
          )}
        >
          Prismy
        </span>
      )}
    </div>
  )
}
