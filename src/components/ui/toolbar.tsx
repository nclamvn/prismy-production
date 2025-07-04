"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Toolbar() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === 'vi' ? 'en' : 'vi';
    // Remove any existing locale prefix from pathname
    const cleanPath = pathname.replace(/^\/(vi|en)/, '') || '/';
    // Build new path with target locale
    const newPath = newLocale === 'vi' ? cleanPath : `/en${cleanPath}`;
    // Use replace to avoid history entries
    router.replace(newPath);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Language Switch */}
      <Button
        variant="ghost"
        size="sm"
        onClick={switchLocale}
        aria-label="Switch language"
        className="h-9 px-3 font-medium text-sm"
      >
        {locale === 'vi' ? 'VI' : 'EN'}
      </Button>
      
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="h-9 w-9"
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4" stroke="currentColor" fill="none" />
        ) : (
          <Sun className="h-4 w-4" stroke="currentColor" fill="none" />
        )}
      </Button>
    </div>
  );
}