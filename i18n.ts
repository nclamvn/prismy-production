import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Export for shared use in static generation
export const locales = ['vi', 'en'] as const;
export const defaultLocale = 'vi' as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
  
  // Ensure that a locale is provided
  if (!locale) locale = defaultLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});