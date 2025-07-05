"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
];

export function LocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'vi' : 'en';
    // Remove current locale from pathname and add new one
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const currentLocale = locales.find(l => l.code === locale);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="gap-2 text-sm"
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">
        {currentLocale?.flag} {currentLocale?.name}
      </span>
      <span className="sm:hidden">
        {currentLocale?.flag}
      </span>
    </Button>
  );
}