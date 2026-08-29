import type { MetadataRoute } from 'next';
import { routing } from '@/lib/i18n/routing';

export default function robots(): MetadataRoute.Robots {
  const protectedPaths = routing.locales.flatMap((locale) =>
    ['profile', 'saved', 'alerts', 'developer', 'broker', 'admin'].map(
      (path) => `/${locale}/${path}`,
    ),
  );
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: protectedPaths }],
  };
}
