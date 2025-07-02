'use client'

import Image from 'next/image'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg'
}

export function Logo({
  size = 32,
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
        width={size}
        height={size}
        className="w-auto h-auto"
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
