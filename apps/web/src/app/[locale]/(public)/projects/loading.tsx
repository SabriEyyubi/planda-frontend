import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('Common');
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="open-catalog"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <aside className="open-catalog__sidebar" aria-hidden="true" />
      <div className="open-catalog__results" role="status">
        <span>{t('loading')}</span>
        <div className="catalog-loading__block" aria-hidden="true" />
        <div className="catalog-loading__block" aria-hidden="true" />
      </div>
    </main>
  );
}
