import { getTranslations } from 'next-intl/server';

export async function Forbidden() {
  const t = await getTranslations('Errors');
  return (
    <section className="card" role="alert">
      <h1>{t('forbiddenTitle')}</h1>
      <p className="muted">{t('forbiddenDescription')}</p>
    </section>
  );
}
