'use client';
import { useTranslations } from 'next-intl';

export function MobileProjectCta({ projectId }: { projectId: string }) {
  const t = useTranslations('BuyerCore');
  return (
    <div className="mobile-project-cta">
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(new CustomEvent(`planda:open-lead:${projectId}`))
        }
      >
        {t('contactSales')}
      </button>
    </div>
  );
}
