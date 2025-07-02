'use client'

import { Globe } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
] as const

export function LanguageSelector() {
  const { locale, setLocale } = useI18n()

  const currentLanguage = languages.find(lang => lang.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="text-base">
            {currentLanguage?.flag || <Globe size={16} />}
          </span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={locale === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-base">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
