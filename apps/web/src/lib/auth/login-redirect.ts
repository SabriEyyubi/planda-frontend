import { safeReturnTo } from './return-to';

export function loginUrlForPath(pathname: string, search = '') {
  const match = pathname.match(/^\/(tr|en|ar|ru)(\/.*)?$/);
  const locale = match?.[1] ?? 'tr';
  const returnTo = safeReturnTo(match ? `${pathname}${search}` : '/');
  return `/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function redirectAfterUnauthorized(response: Response) {
  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.assign(
      loginUrlForPath(window.location.pathname, window.location.search),
    );
    return true;
  }
  return false;
}
