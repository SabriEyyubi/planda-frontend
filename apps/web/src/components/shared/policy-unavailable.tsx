import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';

type PolicySurface =
  'buyerAlerts' | 'developerAnalytics' | 'developerMedia' | 'developerSettings';

export async function PolicyUnavailable({
  surface,
  href,
}: {
  surface: PolicySurface;
  href?: string;
}) {
  const t = await getTranslations('Policy');
  return (
    <section
      className="policy-unavailable"
      aria-labelledby={`${surface}-title`}
    >
      <span className="eyebrow">{t('mvpBoundary')}</span>
      <h1 id={`${surface}-title`}>{t(`${surface}Title`)}</h1>
      <p>{t(`${surface}Description`)}</p>
      <div className="privacy-callout" role="status">
        {t(`${surface}Reason`)}
      </div>
      {href && (
        <Link className="button button--secondary" href={href}>
          {t(`${surface}Action`)}
        </Link>
      )}
    </section>
  );
}
