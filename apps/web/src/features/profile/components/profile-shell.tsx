import type { PropsWithChildren } from 'react';
import { getTranslations } from 'next-intl/server';

export async function ProfileShell({ children }: PropsWithChildren) {
  const t = await getTranslations('Profile');
  return (
    <section className="stack">
      <header>
        <h1>{t('title')}</h1>
        <p className="muted">{t('settings')}</p>
      </header>
      {children}
    </section>
  );
}
