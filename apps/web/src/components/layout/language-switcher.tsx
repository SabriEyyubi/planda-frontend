'use client';

import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { routing, type AppLocale } from '@/lib/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Common');

  return (
    <select
      className="language-button"
      aria-label={t('languageSelection')}
      value={locale}
      onChange={(event) => {
        const suffix = `${window.location.search}${window.location.hash}`;
        router.replace(`${pathname}${suffix}`, {
          locale: event.target.value as AppLocale,
        });
      }}
    >
      {routing.locales.map((value) => (
        <option value={value} key={value}>
          {value.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
