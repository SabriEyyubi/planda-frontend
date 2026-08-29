import { ProtectedPage } from './protected-page';
import { RoutePlaceholder, type PageTitleKey } from './route-placeholder';
import type { ProtectedArea } from '@/lib/permissions/permissions';

export async function ProtectedPlaceholder({
  area,
  locale,
  returnTo,
  titleKey,
}: {
  area: ProtectedArea;
  locale: string;
  returnTo: string;
  titleKey: PageTitleKey;
}) {
  return (
    <ProtectedPage area={area} locale={locale} returnTo={returnTo}>
      <RoutePlaceholder titleKey={titleKey} />
    </ProtectedPage>
  );
}
