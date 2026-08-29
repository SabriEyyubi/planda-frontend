import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['tr', 'en', 'ar', 'ru'],
  defaultLocale: 'tr',
  localePrefix: 'always',
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

export function getTextDirection(locale: string) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
