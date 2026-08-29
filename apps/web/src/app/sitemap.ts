import type { MetadataRoute } from 'next';
import { getServerEnv } from '@/lib/config/env';
import { routing } from '@/lib/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const { PUBLIC_APP_URL } = getServerEnv();
  return routing.locales.map((locale) => ({
    url: new URL(`/${locale}`, PUBLIC_APP_URL).toString(),
    changeFrequency: 'daily',
    priority: locale === routing.defaultLocale ? 1 : 0.8,
  }));
}
