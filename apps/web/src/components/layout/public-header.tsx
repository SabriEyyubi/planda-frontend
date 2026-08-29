import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { getBrowserSession } from '@/lib/auth/session';
import { authApiAdapter } from '@/features/auth/api/auth-adapter';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { LanguageSwitcher } from './language-switcher';

export async function PublicHeader() {
  const t = await getTranslations('Common');
  const session = await getBrowserSession(authApiAdapter);
  const identity = session.status === 'authenticated' ? session.identity : null;
  const dashboardHref = identity?.platformRoles?.some(
    (role) => role === 'ADMIN' || role === 'SUPER_ADMIN',
  )
    ? '/admin'
    : identity?.platformRoles?.includes('DEVELOPER_MEMBER')
      ? '/developer/overview'
      : identity?.platformRoles?.includes('BROKER')
        ? '/broker'
        : '/profile';
  const initials = identity?.email?.slice(0, 2).toUpperCase() ?? 'ME';
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link className="brand" href="/">
          {t('brand')}
          <span>.</span>
        </Link>
        <nav className="primary-nav" aria-label={t('primaryNavigation')}>
          <Link href="/projects">{t('projects')}</Link>
          <Link href="/map">{t('map')}</Link>
          <Link href="/cities">{t('cities')}</Link>
          <Link href="/developers">{t('developers')}</Link>
          <Link href="/compare">{t('compare')}</Link>
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          {identity ? (
            <div className="account-actions">
              <Link
                className="account-avatar"
                href={dashboardHref}
                aria-label={t('myAccount')}
              >
                {initials}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link className="sign-in-link" href="/login">
              {t('signIn')}
            </Link>
          )}
        </div>
      </div>
      <nav className="mobile-public-nav" aria-label={t('mobileNavigation')}>
        <Link href="/projects">{t('projects')}</Link>
        <Link href="/map">{t('map')}</Link>
        <Link href="/cities">{t('cities')}</Link>
        <Link href="/developers">{t('developers')}</Link>
        <Link href="/compare">{t('compare')}</Link>
      </nav>
    </header>
  );
}
