'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { redirectAfterUnauthorized } from '@/lib/auth/login-redirect';

export function FavoriteButton({
  projectId,
  initialSaved = false,
  onRemoved,
}: {
  projectId: string;
  initialSaved?: boolean;
  onRemoved?: () => void;
}) {
  const t = useTranslations('ProjectDetail');
  const locale = useLocale();
  const [saved, setSaved] = useState(initialSaved);
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');

  async function toggle() {
    const next = !saved;
    setSaved(next);
    setStatus('busy');
    try {
      const response = await fetch(`/api/me/saved-projects/${projectId}`, {
        method: next ? 'PUT' : 'DELETE',
      });
      if (redirectAfterUnauthorized(response)) return;
      if (response.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(
          `/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`,
        );
        return;
      }
      if (!response.ok) {
        setSaved(!next);
        setStatus('error');
        return;
      }
      setStatus('idle');
      if (!next) onRemoved?.();
    } catch {
      setSaved(!next);
      setStatus('error');
    }
  }

  return (
    <span className="favorite-control">
      <button
        type="button"
        onClick={toggle}
        disabled={status === 'busy'}
        aria-pressed={saved}
      >
        {saved ? `♥ ${t('favoriteSaved')}` : `♡ ${t('favoriteAdd')}`}
      </button>
      <span className="sr-only" role="status">
        {status === 'error'
          ? t('favoriteStatusError')
          : saved
            ? t('favoriteStatusSaved')
            : t('favoriteStatusNotSaved')}
      </span>
    </span>
  );
}
