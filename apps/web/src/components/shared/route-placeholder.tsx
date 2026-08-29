import { getTranslations } from 'next-intl/server';

export type PageTitleKey =
  | 'projects'
  | 'projectDetail'
  | 'map'
  | 'cities'
  | 'city'
  | 'developers'
  | 'developerProfile'
  | 'compare'
  | 'saved'
  | 'alerts'
  | 'developer'
  | 'developerOverview'
  | 'developerProjects'
  | 'inventory'
  | 'leads'
  | 'paymentPlans'
  | 'media'
  | 'analytics'
  | 'developerSettings'
  | 'broker'
  | 'brokerMaterials'
  | 'brokerClients'
  | 'developerContacts'
  | 'admin';

export async function RoutePlaceholder({
  titleKey,
  description,
}: {
  titleKey: PageTitleKey;
  description?: string;
}) {
  const t = await getTranslations('Placeholder');
  return (
    <section className="card">
      <h1>{t(titleKey)}</h1>
      <p className="muted">{description ?? t('description')}</p>
    </section>
  );
}
