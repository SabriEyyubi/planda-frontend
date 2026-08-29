import { Link } from '@/lib/i18n/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

export async function CatalogCard({
  href,
  name,
  count,
  startingPrice,
  currency,
  verified,
}: {
  href: string;
  name: string;
  count: number;
  startingPrice: string | null;
  currency: string | null;
  verified?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations('Catalog');
  const price =
    startingPrice && currency
      ? new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(Number(startingPrice))
      : null;
  return (
    <article className="catalog-card">
      <div className="catalog-card__visual" aria-hidden="true">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <h2>
          <Link href={href}>{name}</Link>
        </h2>
        {verified && <span className="verified">✓ {t('verified')}</span>}
        <p>{t('projectCount', { count })}</p>
        <strong>
          {price ? t('startingFrom', { price }) : t('pricePending')}
        </strong>
      </div>
      <Link
        className="catalog-card__link"
        href={href}
        aria-label={t('view', { name })}
      >
        →
      </Link>
    </article>
  );
}
