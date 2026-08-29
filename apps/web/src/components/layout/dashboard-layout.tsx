import type { PropsWithChildren } from 'react';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from './public-header';
import { Link } from '@/lib/i18n/navigation';

type DashboardArea = 'Buyer' | 'Developer' | 'Broker' | 'Admin';

export async function DashboardLayout({
  area,
  children,
}: PropsWithChildren<{ area: DashboardArea }>) {
  const t = await getTranslations('Dashboard');
  const areaLabel = t(
    area.toLowerCase() as 'buyer' | 'developer' | 'broker' | 'admin',
  );
  const links = {
    Buyer: [
      ['/profile', t('account')],
      ['/saved', t('saved')],
      ['/alerts', t('requests')],
    ],
    Developer: [
      ['/developer/overview', t('overview')],
      ['/developer/projects', t('projects')],
      ['/developer/inventory', t('inventory')],
      ['/developer/payment-plans', t('paymentPlans')],
      ['/developer/leads', t('leads')],
      ['/developer/media', t('media')],
      ['/developer/analytics', t('analytics')],
      ['/developer/settings', t('settings')],
    ],
    Broker: [
      ['/broker', t('projects')],
      ['/broker/materials', t('materials')],
      ['/broker/clients', t('clients')],
      ['/broker/contacts', t('contacts')],
    ],
    Admin: [['/admin', t('reviewQueue')]],
  } as const;
  return (
    <div className="shell">
      <PublicHeader />
      <div className="dashboard">
        <aside>
          <span className="dashboard-label">{t('panel')}</span>
          <strong>{areaLabel}</strong>
          <nav
            className="dashboard-nav"
            aria-label={t('navigation', { area: areaLabel })}
          >
            {links[area].map(([href, label]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main-content" tabIndex={-1} className="page container">
          {children}
        </main>
      </div>
    </div>
  );
}
