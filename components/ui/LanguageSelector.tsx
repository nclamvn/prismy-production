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
import type { Locale } from '@/contexts/I18nContext'

const languages = [
  { code: 'en' as Locale, name: 'English', flag: '🇺🇸' },
  { code: 'vi' as Locale, name: 'Tiếng Việt', flag: '🇻🇳' },
] as const

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n()

  const currentLanguage = languages.find(lang => lang.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="text-base">
            {currentLanguage?.flag || <Globe size={16} />}
          </span>
          <span className="sr-only">{t('language_selector.change_language')}</span>
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
            <span>{t(`language_selector.${language.code === 'en' ? 'english' : 'vietnamese'}`)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
