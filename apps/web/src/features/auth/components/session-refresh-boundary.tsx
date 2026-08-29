'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeReturnTo } from '@/lib/auth/return-to';

const copy = {
  tr: {
    loading: 'Oturumunuz güvenli şekilde yenileniyor…',
    failed: 'Oturum yenilenemedi. Giriş sayfasına yönlendiriliyorsunuz…',
    retryable: 'Oturum servisi geçici olarak kullanılamıyor. Tekrar deneyin.',
    retry: 'Tekrar dene',
  },
  en: {
    loading: 'Your session is being refreshed securely…',
    failed: 'Your session could not be refreshed. Redirecting to sign in…',
    retryable: 'The session service is temporarily unavailable. Please retry.',
    retry: 'Retry',
  },
} as const;

export function SessionRefreshBoundary({
  locale,
  returnTo,
}: {
  locale: string;
  returnTo: string;
}) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<'loading' | 'retryable' | 'failed'>(
    'loading',
  );
  const messages = locale === 'tr' ? copy.tr : copy.en;
  const safeTarget = safeReturnTo(returnTo, `/${locale}`);

  function refreshSession() {
    if (started.current) return;
    started.current = true;
    setState('loading');
    void fetch('/api/auth/refresh', { method: 'POST' })
      .then((response) => {
        if (response.status >= 500) {
          started.current = false;
          setState('retryable');
          return;
        }
        if (!response.ok) throw new Error('refresh failed');
        router.replace(safeTarget);
        router.refresh();
      })
      .catch(() => {
        setState('failed');
        router.replace(
          `/${locale}/login?returnTo=${encodeURIComponent(safeTarget)}`,
        );
      });
  }

  useEffect(() => {
    refreshSession();
    // The ref prevents React Strict Mode from issuing a second rotating request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router, safeTarget]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="shell section"
      aria-busy={state === 'loading'}
    >
      <p role="status" aria-live="polite" aria-atomic="true">
        {state === 'failed'
          ? messages.failed
          : state === 'retryable'
            ? messages.retryable
            : messages.loading}
      </p>
      {state === 'retryable' && (
        <button type="button" className="button" onClick={refreshSession}>
          {messages.retry}
        </button>
      )}
    </main>
  );
}
