'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

export function LogoutButton() {
  const locale = useLocale();
  const t = useTranslations('Common');
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="logout-button"
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          window.location.assign(`/${locale}`);
        }
      }}
    >
      {busy ? t('signingOut') : t('signOut')}
    </button>
  );
}
